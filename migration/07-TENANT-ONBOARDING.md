# 07 — Tenant onboarding: how a new B2B customer is added

> **Short answer:** no per-tenant build, no per-tenant Nginx config, no per-tenant deploy. Single Rails app + single Vite SPA bundle + single Nginx serve every tenant. A new tenant is a database row plus a Cloudflare hostname registration. Onboarding takes minutes, not hours, and zero downtime.
>
> This doc walks through the full lifecycle: sales → provisioning → branding → custom domain → seat invitations → live.

---

## 1. Why a single deploy serves every tenant

Multi-tenant SaaS pattern. Three layers do all the work:

1. **Hostname lookup at the edge.** Cloudflare proxies `mentor.acme.com` and `acme.move-app.com` to the same Reserved IP (DigitalOcean Droplet). No per-tenant DNS, no per-tenant Cloudflare zone — a single `move-app.com` zone and Cloudflare for SaaS for tenant custom domains.
2. **Tenant resolution in Rails.** `ApplicationController` reads the `Host` header and resolves to a `Team` via Redis cache (60s TTL). One database query on cache miss.
3. **Theme injection at runtime.** The Vite SPA boots, calls `/api/v1/public/tenant?domain=<host>`, gets the JSON brand metadata, and sets CSS variables on `:root`. shadcn components already read those variables, so no recompile is needed.

Adding a tenant = `INSERT INTO teams (...) VALUES (...)` + a Cloudflare API call. That's it.

What does **not** happen on tenant add:

- No new Vite build.
- No `kamal deploy`.
- No Nginx reload.
- No new SSL certificate provisioning by us (Cloudflare for SaaS auto-issues).
- No new Droplet, Postgres database, or Redis instance.

---

## 2. The eight onboarding steps

### Step 1 — Sales close the deal

Salesperson collects from the buyer:

- Company name → derived `slug` (e.g. "Acme Corp" → `acme`).
- Brand assets: logo (PNG/SVG, transparent), primary hex color, secondary hex color, brand name string.
- Admin contact email (will become first `Owner`).
- Plan: Starter / Pro / Enterprise.
- Custom domain wanted? (`mentor.acme.com`) — optional; defaults to `acme.move-app.com`.

### Step 2 — Super-admin provisions the tenant

Super-admin (us) opens `/super-admin/teams/new` in the production app, fills the form, hits Create. Behind the scenes:

```http
POST /api/v1/super_admin/teams
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "slug": "acme",
  "brand_name": "Acme Mentor",
  "primary_color": "#0040A0",
  "secondary_color": "#FF8800",
  "logo_url": null,
  "plan": "pro",
  "trial_days": 14,
}
```

Rails does:

1. `Team.create!(slug:, settings: { theme: {...}, lifecycle: { trial_ends_at: 14.days.from_now } })`
2. `User.find_or_create_by!(email: "hr@acme.com")`
3. `Membership.create!(team:, user:, role: :owner)`
4. `Invitation.create!(team:, email: "hr@acme.com", role: :owner)` → enqueues `WelcomeMailer.invitation_email(...)`
5. Stripe customer creation (`Stripe::Customer.create`) + 14-day trial subscription on the chosen plan
6. `Subscription.create!(team:, stripe_id:, status: :trialing)`

Total wall-clock time: ~2 seconds.

`acme.move-app.com` works **immediately** because the wildcard `*.move-app.com` is already provisioned in Cloudflare. No SSL wait.

### Step 3 — HR admin clicks the magic link

Email lands at `hr@acme.com`. Subject: "Welcome to Acme Mentor — set up your account". Click → lands at `https://acme.move-app.com/auth/setup?token=...`.

Frontend boot:
- Vite SPA loads (cached by Cloudflare).
- `bootTenant()` calls `GET /api/v1/public/tenant?domain=acme.move-app.com` → `{ slug: "acme", brand_name: "Acme Mentor", primary_color: "#0040A0", ... }`.
- CSS vars injected on `<html>`. Logo + brand applied. Title becomes "Acme Mentor".

HR sets a password (or Google SSO), lands on the empty admin dashboard.

### Step 4 — HR uploads logo and tweaks brand (optional)

Admin → Settings → Branding. Form posts:

```http
PATCH /api/v1/admin/team_settings
Authorization: Bearer <jwt>
X-Tenant-Slug: acme

{
  "theme": {
    "logo_url": "<signed_upload_url>",
    "primary_color": "#0040A0",
    "secondary_color": "#FF8800",
    "brand_name": "Acme Mentor",
    "hero_video_url": null
  }
}
```

Logo upload uses Active Storage with the DigitalOcean Spaces service. Direct upload from the browser via signed URL → Spaces. Rails stores the public CDN URL in `Team.settings.theme.logo_url`.

Cache invalidation: writing to `team.settings` busts the Redis tenant cache key.

### Step 5 — HR adds a custom domain (optional)

If the buyer wants `mentor.acme.com` instead of `acme.move-app.com`:

1. **Acme's IT team** adds a DNS record at their registrar:
   ```
   Type: CNAME
   Host: mentor
   Value: proxy.move-app.com
   ```
2. **HR** opens Settings → Custom Domain in our admin UI, enters `mentor.acme.com`, hits Save.
3. **Rails** posts to Cloudflare for SaaS:
   ```http
   POST https://api.cloudflare.com/client/v4/zones/<zone_id>/custom_hostnames
   Authorization: Bearer <cloudflare_token>

   {
     "hostname": "mentor.acme.com",
     "ssl": {
       "method": "http",
       "type": "dv",
       "settings": {
         "min_tls_version": "1.2"
       }
     }
   }
   ```
4. Cloudflare validates ownership via the CNAME (which already proxies to us) and auto-issues a TLS cert. Usually <60 seconds.
5. **Rails background job** `Domains::PollVerificationJob` polls Cloudflare every 30s for up to 30 min. When `ssl.status == "active"`:
   - `team.update!(domain: "mentor.acme.com", domain_verified_at: Time.current)`
   - Bust Redis cache
   - Email HR: "Your custom domain is live."
6. Admin UI now shows `mentor.acme.com` works. `acme.move-app.com` keeps working as a fallback (both resolve to the same `Team`).

Important: `mentor.acme.com` lives in **our** Cloudflare zone via Cloudflare for SaaS, not in Acme's DNS provider. They only own the CNAME pointing at us. SSL, WAF, caching are ours to manage.

### Step 6 — HR uploads mentor + mentee CSVs

Admin → Members → Bulk Import. Two CSVs (per [`05-DATA-MIGRATION.md §2`](05-DATA-MIGRATION.md)):

- `mentors.csv` — internal seniors who will mentor
- `mentees.csv` — internal juniors who will book sessions

Server creates `User`, `Membership`, `Profile`, and `Mentor` rows; sends magic-link invitations. Idempotent on email — re-uploading the same CSV is safe.

### Step 7 — Mentors connect Google Calendar (each does it themselves)

Each mentor logs in, clicks "Connect Google Calendar" once, OAuth's, done. Their availability syncs both ways from then on. Per `Epic 5`.

### Step 8 — First booking

A mentee logs in, browses mentors, books a session. Email confirmations + reminders fire from the existing Sidekiq cron schedule. No tenant-specific cron jobs — same jobs run for every tenant.

**Tenant is live.**

---

## 3. What the runtime looks like

```
Browser request: https://mentor.acme.com/api/v1/mentors

  ↓
  Cloudflare (proxies *.move-app.com AND mentor.acme.com via Cloudflare for SaaS)
  · serves SSL
  · forwards to Reserved IP at DigitalOcean
  ↓
  DigitalOcean Droplet
  ↓
  Nginx
  · listen 443 ssl;
  · server_name _;          # catch-all, ONE server block, no per-tenant config
  · location / { proxy_pass http://puma; }
  ↓
  Puma → Rails ApplicationController
  · before_action :resolve_tenant
      host = request.host  # "mentor.acme.com"
      slug = Rails.cache.fetch("tenant_slug:#{host}", expires_in: 60.seconds) do
        Team.find_by(domain: host)&.slug || subdomain_lookup(host)
      end
      @current_team = Team.find_by!(slug: slug)
      ActsAsTenant.current_tenant = @current_team
      ActiveRecord::Base.connection.execute("SET LOCAL app.current_team_id = #{@current_team.id}")
  · action runs, scoped to @current_team
  ↓
  Response (JSON, scoped to Acme's data only — RLS enforces the boundary at the database)
```

Frontend SPA bootstrap on the same hostname is identical — same single bundle file `/assets/index-<hash>.js`, served by the same Nginx, theme injected at runtime from the public tenant endpoint.

---

## 4. Failure modes & how we handle them

| Failure | Detection | Recovery |
|---|---|---|
| Cloudflare for SaaS SSL stuck pending | `Domains::PollVerificationJob` exhausts 30-min polling | Surface error in admin UI ("DNS not yet propagated"). HR re-saves once their CNAME resolves |
| Acme's IT puts the CNAME on the wrong record | Cloudflare validation fails | Admin UI shows the validation error from the Cloudflare API verbatim |
| Buyer wants to change subdomain (`acme` → `acme-mentor`) | Manual super-admin operation | `team.update!(slug:)` busts cache; old subdomain returns 404 (or redirect, configurable) |
| Logo upload fails (Spaces 5xx) | Active Storage retry with exponential backoff | Log to Sentry; UI lets HR retry |
| Brand colors break contrast (white-on-white) | UX issue | Admin UI runs a contrast check (WCAG AA) on save and warns; force-save allowed |
| Trial expires without subscription | `Trial::ExpirationCheck` middleware returns 402 on non-billing endpoints | Admin can still access `/billing/portal` to upgrade |
| Tenant cancels | Stripe webhook → `Subscription#status='canceled'` → grace period 30 days → `team.deactivated_at` set → all endpoints 402 except admin/data-export | Per-tenant data exported to ZIP, deleted after 90 days |

---

## 5. What requires actual ops work (rare)

These are **not** part of normal onboarding. They happen for outliers.

- **Enterprise data isolation.** A regulated buyer demands a separate database. We provision a second DO Managed PG, deploy a second Droplet pair tagged `tenant=acme`, point them at the dedicated DB, and route `mentor.acme.com` to the dedicated instance via a separate Reserved IP. This is an Enterprise upsell ($X,000/month), not a v1 feature.
- **Region pinning.** Buyer demands EU residency. We provision an `eu` Droplet group + DO Managed PG in AMS3/FRA1 and route their hostname there. Roadmap: post v1 first sale.
- **SAML/SCIM SSO.** Per-tenant SAML config stored in `team.sso_config` JSONB. Defer to v1.5.

For the first ~50 tenants on the roadmap, none of the above applies. Standard onboarding is the eight steps above.

---

## 6. Onboarding playbook (for the ops runbook)

Drop this into `docs/RUNBOOK.md` once Epic 8 lands:

```
1. Confirm signed contract + plan tier in CRM
2. Open https://app.move-app.com/super-admin/teams/new
3. Fill: slug, brand_name, primary_color, secondary_color, plan, admin_email
4. Click Create. Verify acme.move-app.com loads.
5. Email Acme HR: "Your platform is provisioned. Check hr@acme.com inbox."
6. (Optional) Schedule a 30-min onboarding call; help HR upload logo, customize colors, add custom domain CNAME.
7. (Optional) Run CSV bulk-import together if HR has a list ready.
8. Set 7-day reminder to check usage; email if no booking happened in week 1.
```

End-to-end onboarding (sales close → first booking): typically **30–60 minutes** of actual work distributed across 1–3 days while DNS propagates.

---

## 7. Cost per tenant

Effectively **zero marginal infra cost** for tenant N+1 until we hit one of these capacity ceilings:

- DO Managed PG storage > 80% → upgrade plan (next size up: ~$30/mo more)
- DO Droplet load average > 3.0 sustained → split web/worker droplets (per [`04-INFRA-MIGRATION.md §3.2`](04-INFRA-MIGRATION.md))
- Resend daily volume > 3k emails → upgrade Resend plan (~$20/mo more)
- Spaces storage > 250 GB → next pricing tier (~$5/mo per 250 GB)

Until those fire, an additional tenant adds maybe a few cents of compute and a database row. That's the whole reason for picking this multi-tenant pattern over per-tenant deploys.
