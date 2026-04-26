# 04 — Infrastructure migration plan (DigitalOcean)

> Replace Vercel + Supabase + Lovable with DigitalOcean as the primary infra provider, plus Cloudflare for DNS/SSL/CDN. Goal: cheap, reproducible, white-label-ready, easy to scale by clicking buttons.

---

## 1. Current state (Movê)

| Component | Provider | Notes |
|---|---|---|
| Frontend hosting | Vercel | Static React SPA build from Vite |
| Database | Supabase Postgres | RLS-managed, JS client direct queries |
| Auth | Supabase Auth | Email+password; JWT |
| Edge Functions | Supabase (Deno) | 8 functions; cron-driven |
| Object storage | Supabase Storage | mentor-photos, volunteer-content |
| Realtime | Supabase Realtime | Postgres replication channel |
| Email | Resend (`RESEND_API_KEY`) | direct from edge functions |
| Calendar API | Google Calendar | per-mentor OAuth tokens stored in Postgres |
| DNS | Vercel (assumed) | single domain |

**Estimated monthly cost:** ~$25 (Supabase Pro) + Vercel free / Pro depending on traffic.

---

## 2. Target state (Movê on DigitalOcean)

DigitalOcean is the chosen primary cloud. We use as much of its managed surface as makes sense for a small, fast-shipping team.

| Component | DigitalOcean product | Spec / notes |
|---|---|---|
| **Database** (separate, day 1) | **Managed PostgreSQL 16** | Basic plan, single node, 1 vCPU / 2 GB / 25 GB SSD. Daily backups included. `btree_gist` extension enabled (needed for session-overlap exclusion constraint). Connection pooling via PgBouncer (managed) |
| App + workers (day 1) | **Single Droplet** (Premium AMD or Regular Intel), 4 vCPU / 8 GB | Runs Puma + Sidekiq + Redis (self-hosted) + Nginx + the Vite static bundle. Simplest viable topology for v1 |
| App + workers (post-scale) | **Two Droplets** | Web droplet (Puma + Nginx + static SPA), Worker droplet (Sidekiq). Redis moves to a third droplet or DO Managed Redis |
| Object storage | **DigitalOcean Spaces** | S3-compatible. One bucket per environment (`move-prod`, `move-staging`). Built-in CDN. $5/mo for 250 GB + 1 TB egress |
| Cache + Job queue | **Redis** | Self-hosted on app droplet day 1. Migrate to **DO Managed Redis** (or self-managed dedicated droplet) when web/worker split lands |
| Container registry | **DigitalOcean Container Registry** | Free tier covers Kamal pulls; private |
| Deploy | **Kamal** | Zero-downtime, Dockerized. Targets droplet IPs |
| CI/CD | **GitHub Actions** | lint, rspec, vitest, playwright, brakeman |
| DNS / SSL / Proxy | **Cloudflare** | Wildcard `*.move-app.com` + tenant CNAMEs via Cloudflare for SaaS |
| Email | **Resend** | Per-tenant DKIM/SPF in v1.1 |
| Calendar API | **Google Calendar** | Unchanged |
| Monitoring | **Sentry + Better Uptime + Ahoy** | Events + uptime + product analytics |
| Backups | **Spaces + DO Managed PG snapshots** | Daily automated by DO; weekly logical dump to Spaces for restore drills |

### 2.1 Why this shape

- **Postgres separate from day 1** — biggest blast radius if it goes down; managed service handles backups, point-in-time recovery, and version upgrades for free. ~$15/mo for the Basic node is worth not running pg_dump myself.
- **Single app droplet at start** — Rails + Sidekiq + Redis on the same box. Cheap (~$24/mo for 4vCPU/8GB Premium), simple to operate, and totally fine for tens of tenants. We split later, when web latency and worker queues start fighting for CPU.
- **Spaces over R2** — DigitalOcean keeps the bill on one invoice. R2 is cheaper per GB but Spaces has built-in CDN and ties into the rest of the DO setup. Trivial to move later if egress explodes.
- **Cloudflare keeps DNS/SSL/proxy** — DO doesn't have an equivalent of Cloudflare for SaaS (custom CNAMEs at scale with auto-issued SSL), and Cloudflare's free tier is unbeatable.

### 2.2 Cost estimate

| Line item | Monthly |
|---|---|
| DO Managed PostgreSQL Basic (1 vCPU / 2 GB / 25 GB) | $15 |
| DO Droplet Premium AMD 4 vCPU / 8 GB / 160 GB | $48 (regular Intel: $24) |
| DO Spaces (250 GB + 1 TB egress) | $5 |
| DO Container Registry (Basic) | $0 (free tier) |
| Cloudflare | $0 (free tier; Cloudflare for SaaS adds $0 for first 100 hostnames on Business; consider when scaling) |
| Resend | $20 (3k emails/day cap) |
| Sentry Team | $26 |
| Better Uptime | $0 (free, 1 min checks) |
| **Total** | **~$90–115/mo** for v1 with up to ~50 tenants / ~5k users |

When approaching scale (split topology):

| Line item | Monthly |
|---|---|
| DO Managed PG (upgrade to 2 vCPU / 4 GB / 60 GB) | $60 |
| DO Web Droplet (4 vCPU / 8 GB) | $48 |
| DO Worker Droplet (2 vCPU / 4 GB) | $24 |
| DO Managed Redis (1 GB) | $15 |
| DO Spaces | $5 |
| Other (Sentry, Resend, Cloudflare) | ~$50 |
| **Total** | **~$200/mo** |

---

## 3. Topology diagrams

### 3.1 Day-1: single-droplet topology (recommended start)

```
  ┌──────────────────────────────────────────────────────────┐
  │                       CLOUDFLARE                         │
  │   • DNS (mentor.acme.com → CNAME → proxy.move-app.com)   │
  │   • Universal SSL                                        │
  │   • DDoS, WAF, caching of public landing assets          │
  └─────────────────────────────┬────────────────────────────┘
                                │
                  ┌─────────────▼──────────────┐
                  │ DO Droplet — App primary    │
                  │  4 vCPU / 8 GB              │
                  │  ─────────────────────────  │
                  │  Nginx (host header → app)  │
                  │      ↓                      │
                  │  Puma (Rails API, 4 procs)  │
                  │  Sidekiq (4 queues, 10 conc)│
                  │  Redis 7 (local)            │
                  │  Static SPA build (Nginx)   │
                  └────────────┬───────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                                 │
   ┌──────────▼──────────┐          ┌───────────▼──────────┐
   │ DO Managed Postgres │          │  DO Spaces (S3-API) │
   │  16 — Basic node    │          │  avatars, logos     │
   │  daily backups      │          │  built-in CDN       │
   └─────────────────────┘          └─────────────────────┘
```

### 3.2 Scale topology (when CPU contention shows up)

```
  ┌──────────────────────────────────────────────────────────┐
  │                       CLOUDFLARE                         │
  └─────────────────────────────┬────────────────────────────┘
                                │
                  ┌─────────────▼──────────────┐
                  │ DO Droplet — Web            │
                  │  4 vCPU / 8 GB              │
                  │  Nginx + Puma + static SPA  │
                  └────────────┬───────────────┘
                               │
                  ┌────────────▼───────────────┐
                  │ DO Managed Postgres        │
                  │ (upgraded plan)             │
                  └────────────────────────────┘
                               ▲
                  ┌────────────┴───────────────┐
                  │ DO Droplet — Worker         │
                  │  2 vCPU / 4 GB              │
                  │  Sidekiq (all queues)       │
                  └────────────┬───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ DO Managed Redis    │
                    │  shared by web+wkr  │
                    └─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  DO Spaces          │
                    └─────────────────────┘
```

**Trigger to split web/worker:**

- Sidekiq queue `latency` p95 sustained > 60s, OR
- Web Puma p95 latency > 500ms while Sidekiq is processing a backlog, OR
- Droplet 5-min load average > 3.5 sustained.

When any of those fires, provision Worker Droplet, point Sidekiq there, swap local Redis for DO Managed Redis, deploy via Kamal.

---

## 4. White-label custom domain flow

1. Customer adds CNAME `mentor.acme.com → proxy.move-app.com` in their DNS.
2. They submit `mentor.acme.com` in the admin UI.
3. Rails calls Cloudflare API (Cloudflare for SaaS) to add the hostname; SSL provisioned automatically.
4. Once Cloudflare reports SSL active (poll every 30s), Rails marks `team.domain_verified=true`.
5. Cloudflare proxies the request to the droplet. Nginx routes `Host: mentor.acme.com` → Rails. Rails resolves tenant via `teams.domain` (Redis cache, 60s TTL).

`proxy.move-app.com` is a Cloudflare-managed hostname pointing at the droplet's public IP (or a Floating IP, see §6).

---

## 5. Cutover plan

### Phase A — build in parallel (weeks 1–8)

Do nothing destructive to Movê production. Build the new Rails stack from scratch on `staging.move-app.com`. Leave Supabase + Vercel alone.

### Phase B — pilot tenant (week 9)

1. Spin up `acme.move-app.com` for first paying logo.
2. Run data migration Rake task to backfill any existing mentor/mentee data from Supabase if the buyer is an existing Movê user (most likely they're a fresh corporate buyer).
3. Onboard via admin UI.
4. Send welcome emails.

### Phase C — production cutover for legacy Movê (only if friend wants to keep the old volunteer site running)

Two options:

- **Option 1 (recommended):** keep the old Movê site on Supabase indefinitely as a community asset; run the corporate B2B product as a separate product on the new infra. No cutover needed.
- **Option 2:** retire old Movê. Migrate all 28 tables, communicate with users, redirect domains, sunset Supabase project. ~1 week of careful work — only do this if commercially required.

### Phase D — sunset Vercel (whenever appropriate)

After all Movê traffic is on the new infra, delete Vercel project, archive Supabase project.

---

## 6. DigitalOcean account setup

Order of operations the first time:

1. Create a Project named `move-app`.
2. Generate a personal API token (read+write); store in 1Password.
3. Add SSH key for Kamal-deploy user.
4. Provision **Spaces** bucket `move-staging` (FRA1 or NYC3 region). Generate Spaces access keys. Spaces region must be the same as the droplets' region.
5. Provision **Managed PostgreSQL 16** in same region. Basic plan. Enable trusted source: only the droplet IPs (and your dev IP for migrations). Enable `btree_gist` extension via the DO control panel. Connection limit ~22 per node on Basic plan; PgBouncer included.
6. Provision **App Droplet** (Ubuntu 24.04, 4 vCPU / 8 GB, Premium AMD). Add firewall: allow 22 (SSH from your IP), 80, 443, 6379 (Redis from itself only).
7. Reserve a **Floating IP** (DO calls it Reserved IP) for the droplet. This is the IP behind Cloudflare. Letting it move droplet-to-droplet during scale-out is the whole point.
8. Provision **DO Container Registry** named `move`.
9. Configure Kamal (`config/deploy.yml`) to push to the registry, pull on the droplet.

For the scale phase, repeat steps 6 and 7 for the worker droplet, and either:
- (a) self-host Redis on a small dedicated droplet ($6/mo, 1 vCPU / 1 GB); OR
- (b) provision **DO Managed Redis** ($15/mo, 1 GB).

Recommendation: (b) — Managed Redis is cheap insurance against accidental data loss when the queue is in flight.

---

## 7. Secrets & configuration

Centralize all secrets in `Rails.application.credentials`:

```yaml
production:
  jwt:
    secret: <generated>
  resend:
    api_key: <production key>
  google:
    client_id: <oauth client>
    client_secret: <oauth secret>
  stripe:
    secret_key: <live>
    webhook_secret: <whsec_...>
  cloudflare:
    api_token: <scoped to Zone:Edit + SaaS:Edit>
    account_id: <id>
    zone_id: <zone>
  digitalocean:
    spaces_access_key: <>
    spaces_secret_key: <>
    spaces_bucket: move-prod
    spaces_endpoint: https://nyc3.digitaloceanspaces.com
    spaces_region: nyc3
  database:
    url: <DO managed PG connection string with sslmode=require>
  redis:
    url: redis://default:<pw>@<host>:25061/0?ssl_verify=none  # for managed Redis
  sentry:
    dsn_rails: <dsn>
    dsn_frontend: <public dsn>
```

Frontend env vars (build-time):

```
VITE_API_BASE_URL=https://api.move-app.com
VITE_SENTRY_DSN=<public dsn>
VITE_GOOGLE_OAUTH_CLIENT_ID=<>  # only if frontend initiates
```

No sensitive values in client bundle.

---

## 8. Database migration strategy

The Movê migrations live at `/Users/leonardozappani/move-vercel/supabase/migrations/`. **Do not run them in Rails.** Treat them as a read-only spec. Port the schema as Rails migrations under `api/db/migrate/`.

Mapping order (matches Epic 2 sequence):

1. Bullet Train base (`teams`, `users`, `memberships`)
2. RLS bootstrap migration: enable RLS on every table with `team_id`; create `team_isolation` policy comparing `team_id` against `current_setting('app.current_team_id', true)::bigint`
3. `profiles` (B2B-flavored)
4. `tags` (with global seed)
5. `mentors` + `availabilities` + `availability_exceptions` + `mentor_tags`
6. `user_interests` (mentee interests)
7. `appointments` / `mentor_sessions` (with `EXCLUDE USING gist` no-overlap constraint — requires `btree_gist` extension)
8. `reviews`
9. `mentor_notes`
10. `attendance`
11. `notifications`
12. `google_calendar_tokens`
13. `program_settings`
14. (deferred) `paths`, `path_steps`, `development_plans`, `achievements`, `content_items`, …

Backups: DO Managed PG runs daily snapshots automatically (7-day retention on Basic). Plus a weekly `pg_dump` to Spaces from the worker droplet at 03:00 UTC. Test restores monthly into a throwaway droplet.

---

## 9. Sidekiq cron schedule

`api/config/sidekiq_cron.yml`:

```yaml
session_reminder_24h:
  cron: "*/5 * * * *"
  class: "Reminders::TwentyFourHourReminderJob"
  queue: email_worker

session_reminder_1h:
  cron: "*/5 * * * *"
  class: "Reminders::OneHourReminderJob"
  queue: email_worker

session_reconfirmation_6h:
  cron: "*/5 * * * *"
  class: "Reminders::ReconfirmationJob"
  queue: email_worker

session_auto_cancel:
  cron: "*/5 * * * *"
  class: "Reminders::AutoCancelUnconfirmedJob"
  queue: default

session_review_request:
  cron: "0 * * * *"
  class: "Reminders::ReviewReminderJob"
  queue: email_worker

onboarding_nudge:
  cron: "0 14 * * *"
  class: "Onboarding::NudgeJob"
  queue: email_worker

dashboard_view_refresh:
  cron: "*/5 * * * *"
  class: "Analytics::RefreshDashboardViewJob"
  queue: report_worker

backup_postgres:
  cron: "0 3 * * 0"  # Sunday 03:00 UTC
  class: "Backups::WeeklyPgDumpJob"
  queue: default
```

Queue names:

- `default` — generic
- `email_worker` — Resend sends (rate-limited)
- `calendar_worker` — Google API (rate-limited)
- `report_worker` — analytics

In day-1 single-droplet topology these all run on the same machine. After the split, all four queues move to the worker droplet.

---

## 10. Observability

- **Sentry** — Rails (`sentry-ruby` + `sentry-rails` + `sentry-sidekiq`); React frontend (`@sentry/react`). `before_send` hook injects `team_id` + `user_id` tags. `send_default_pii: false`.
- **Better Uptime / OpenStatus** — health checks on `/health`, `/api/v1/public/tenant?domain=staging.move-app.com`, Stripe webhook.
- **Ahoy** — events: `signup`, `session_booked`, `session_confirmed`, `session_completed`, `mentor_approved`, `tenant_created`. Roll up nightly.
- **DO Monitoring** — droplet CPU/disk/memory/network with built-in alerts. Free.
- **Logs** — JSON to stdout. Pipe via `journald` → optional forward to Better Stack (Logtail) or Cloudflare Logs.

---

## 11. Security checklist

- [ ] HTTPS enforced (HSTS preload, Cloudflare proxy)
- [ ] CORS: `https://*.move-app.com` + verified tenant custom domains only
- [ ] CSRF: cookie + header pair for SPA endpoints (`Origin` check)
- [ ] JWT short-lived access (15 min) + rotated refresh (7 d)
- [ ] RLS enabled on every business table
- [ ] Pundit policies on every endpoint
- [ ] Cross-tenant leak specs in CI
- [ ] Rate limiting via `rack-attack` (login: 10/min/IP; booking: 5/min/user)
- [ ] Webhook signatures verified (Stripe, Cloudflare callback)
- [ ] Encrypted columns for `google_calendar_tokens.access_token`, `refresh_token` (Active Record encryption)
- [ ] Spaces buckets private; signed URLs for avatars (1h TTL)
- [ ] DO PG `trusted sources` restricts inbound to droplet IPs and dev workstation
- [ ] DO droplet firewall: only 22 (your IP), 80/443 (anywhere), 6379 (self only)
- [ ] Brakeman + bundler-audit + pnpm audit zero high/critical
- [ ] Secrets only in `credentials.yml.enc`; never in repo
- [ ] No PII in logs; no PII to Sentry beyond `team_id` and `user_id`
- [ ] Per-team data export endpoint (LGPD/GDPR Article 20)
- [ ] Per-team admin-triggered deletion (LGPD/GDPR Article 17), with retention policy

---

## 12. Cost-control levers

| Lever | When |
|---|---|
| Upgrade DO Managed PG plan | DB CPU >70% sustained or >80% storage |
| Add DO Managed PG read replica | Dashboard queries dominate p95 |
| Move static SPA assets to Spaces + Cloudflare CDN | Bandwidth dominates |
| Split web/worker droplets | Sidekiq latency or Puma p95 alarm |
| Add second region (US East ↔ EU) | First Enterprise customer demands data residency |
| Switch from Resend to AWS SES | Volume >100k mails/month |
| Replace DO Container Registry with GHCR | If image pulls outgrow free tier |

---

## 13. Open questions

1. **Region.** NYC3 (best US peering, US-buyer-friendly), SFO3 (West coast), AMS3/FRA1 (EU). For a Brazilian-led company selling to US Enterprise, NYC3 is the safer first bet. For BR-only customers, AMS3 is also fine — pick one and don't agonize.
2. **DO Managed Redis from day 1, or self-hosted?** Self-hosted on the app droplet day 1 saves $15/mo. Move to managed when web/worker split. No data integrity risk while everything is on one box.
3. **Spaces vs Cloudflare R2.** Spaces is the simpler choice (one vendor invoice, integrated CDN, equivalent cost at low volumes). R2 wins on egress at scale (free egress vs Spaces' included 1 TB then $0.01/GB). Recommendation: stay on Spaces unless egress climbs above 5 TB/mo.
4. **Kamal vs DO App Platform.** Kamal is more flexible and cheaper at this scale; App Platform is fully managed but charges per process. Stick with Kamal — it's the same flow as deploying anywhere else.
