# 03 — Epics & Tasks

> 8 epics. ~12–14 weeks for one full-time dev (or 4–5 weeks with 2 devs in parallel after Epic 0 lands).
>
> Tasks within each epic are roughly issue-sized (1–3 days each).
>
> **Dependencies are strict.** Do not start a downstream epic before its parent ships and merges to `main`. The dependency graph is at the bottom.

---

## Sequencing

```
EPIC 0 — Foundation (1.5 weeks)
  ├── EPIC 1 — Auth & Multi-Tenancy (1.5 weeks)
  │     └── EPIC 2 — Core Mentor & Session API (2 weeks)
  │           ├── EPIC 3 — Frontend swap (Supabase → Rails) (2 weeks, parallel after E2)
  │           ├── EPIC 4 — Reminders & Email Lifecycle (1.5 weeks, parallel after E2)
  │           └── EPIC 5 — Google Calendar Integration (1 week, parallel after E2)
  │                 └── EPIC 6 — Admin & Analytics (1.5 weeks)
  │                       └── EPIC 7 — White-label & Billing (1.5 weeks)
  │                             └── EPIC 8 — Hardening, Migration, Pilot (1 week)
```

Critical path: 0 → 1 → 2 → 3 → 6 → 7 → 8 ≈ 11 weeks. Epics 4 and 5 run in parallel.

---

## EPIC 0 — Foundation

**Goal:** monorepo bootstrapped with Rails API skeleton, Bullet Train installed, Postgres+Redis up locally, CI green, deploy to staging via Kamal.

**Definition of done:** `bundle exec rails s` works, `pnpm dev` works, GitHub Actions runs lint+rspec+vitest+playwright, and `kamal deploy` ships to a DigitalOcean staging Droplet with `staging.move-app.com` reachable.

| # | Task |
|---|---|
| 0.1 | Init monorepo structure (`api/`, `frontend/`, `infra/`, `docs/`, `.github/`) |
| 0.2 | `rails new api --api --database=postgresql` + `bt install` (Bullet Train scaffold) |
| 0.3 | Pin essential gems: devise, devise-jwt, sidekiq, sidekiq-cron, pundit, dry-schema, paper_trail, sentry-ruby, brakeman, bundler-audit |
| 0.4 | Postgres 16 + Redis docker-compose for dev |
| 0.5 | Copy frontend skeleton from `move-vercel/src/` → `frontend/src/`, rip out `.lovable/`, `vercel.json`, `bun.lockb`, JetBrains config; pin pnpm |
| 0.6 | Replace lockfiles with single `pnpm-lock.yaml`; `pnpm install` clean |
| 0.7 | GitHub Actions CI: `lint` (rubocop, eslint, prettier), `test:rails` (rspec), `test:frontend` (vitest), `test:e2e` (playwright optional in PR), `security` (brakeman + bundler-audit + pnpm audit) |
| 0.8 | Provision DigitalOcean: Managed PostgreSQL 16 (Basic, with `btree_gist` extension), one App Droplet (4 vCPU / 8 GB), Spaces bucket, Container Registry, Reserved IP, firewall |
| 0.9 | Kamal config for `staging` deploy targeting the Droplet's Reserved IP |
| 0.10 | Cloudflare DNS for `staging.move-app.com` → DO Reserved IP; SSL via Cloudflare proxy |
| 0.11 | Sentry projects for Rails + frontend; DSNs in Rails credentials |
| 0.12 | README with onboarding steps, `.env.example` for both apps |
| 0.13 | Initial commit + first PR + first merged green build |

**Risk:** Bullet Train install can pull breaking gem versions; pin all gems explicitly in `Gemfile` and lock the result.

---

## EPIC 1 — Auth & Multi-Tenancy

**Goal:** users can sign up, sign in, get a JWT, refresh it, log out. Teams are scoped via `X-Tenant-Slug` header (or hostname resolution) and JWT `tid` claim. RLS is enforced at DB level. Cross-tenant leak tests pass in CI.

**Definition of done:** all `Api::V1::*` controllers automatically scope by `current_team`; cross-tenant leak spec at `api/spec/security/cross_tenant_spec.rb` is green; trying to read another team's row returns 404.

| # | Task |
|---|---|
| 1.1 | Migration: enable RLS on every table with `team_id`; create `team_isolation` policy comparing `team_id` against `current_setting('app.current_team_id', true)::bigint` |
| 1.2 | `ApplicationController` middleware: parse `X-Tenant-Slug` header (fallback to `Host` resolution), look up `Team`, call `ActsAsTenant.with_tenant(team)`, `SET LOCAL app.current_team_id` for RLS |
| 1.3 | `User` model: add `super_admin` boolean, `refresh_jti` text |
| 1.4 | `Membership` model with roles enum: `owner`, `manager`, `mentor`, `mentee` |
| 1.5 | Devise + devise-jwt setup; `Api::V1::AuthController` with `login`, `refresh`, `logout`; refresh-token rotation with `jwt_denylist` for revoked access tokens |
| 1.6 | `omniauth-google-oauth2` for Google SSO; `/api/v1/auth/google/callback` |
| 1.7 | `Profile` model + migration; `team_id`, `user_id` UNIQUE, fields per `02-ALIGNMENT.md §2.5` |
| 1.8 | Pundit base policies: `ApplicationPolicy` checks team membership; per-model policies stub |
| 1.9 | `Api::V1::Public::TenantController` — `GET /api/v1/public/tenant?domain=` returns brand metadata. No auth |
| 1.10 | RSpec setup with FactoryBot; `spec/support/auth_helpers.rb`, `spec/security/cross_tenant_spec.rb` |
| 1.11 | Frontend: rewrite `AuthContext` to use Rails JWT (access in memory, refresh in httpOnly cookie); add `api/client.ts` fetch wrapper |
| 1.12 | Magic link login (Devise passwordless or hand-rolled token email) |
| 1.13 | `ApplicationJob` middleware: `SET LOCAL app.current_team_id` from job args so RLS still applies inside Sidekiq |

**Risk:** RLS bypassed if Sidekiq jobs run without setting `app.current_team_id`. Mitigation: 1.13 above.

---

## EPIC 2 — Core Mentor & Session API

**Goal:** mentors can be created/approved/edited; availability + blocked periods + tags managed; mentees can browse, see available slots, and book — with overlap protection and advance-notice rules. Reviews can be submitted.

**Definition of done:** `Api::V1::Mentors`, `Api::V1::MentorSessions`, `Api::V1::Reviews`, `Api::V1::Tags` controllers green; `Mentors::AvailabilityCalculator` service tested; DB-level overlap exclusion constraint live; cross-tenant leak tests still pass.

| # | Task |
|---|---|
| 2.1 | `Tag` model + global seed of 45 tags (port `20260205200234` data) — global, no `team_id` |
| 2.2 | `Mentor` model: `belongs_to :team`, `belongs_to :user`, fields per discovery; `status` enum; `temporarily_unavailable` boolean |
| 2.3 | `MentorTag` join model (M:M `Mentor` ↔ `Tag`) |
| 2.4 | `UserInterest` join model (M:M `User` ↔ `Tag`, scoped by `team_id` if interests are team-specific) |
| 2.5 | `Availability` model (relational, replaces Movê JSONB): `mentor_id`, `day_of_week`, `start_time`, `end_time` |
| 2.6 | `AvailabilityException` model: `mentor_id`, `kind` (`time_off`, `extra_hours`), `start_date`, `end_date`, `reason` — replaces `mentor_blocked_periods` |
| 2.7 | `MentorSession` model: per discovery; status enum (`scheduled`, `confirmed`, `completed`, `cancelled`); validations for `min_advance_hours`, future-only |
| 2.8 | DB exclusion constraint via `btree_gist` extension to prevent overlaps — replaces Movê's overlap trigger |
| 2.9 | `Mentors::AvailabilityCalculator` service: input `mentor_id`, date range, duration; output array of free slots (replaces front-end logic) |
| 2.10 | `MentorSessions::BookingService`: validates advance notice, exclusion, mentor `temporarily_unavailable=false`, mentor `status=approved`, creates session, fires `MentorSessionCreated` event |
| 2.11 | `MentorSessions::ConfirmService` (mentor confirms), `CancelService`, `CompleteService`, `RescheduleService` |
| 2.12 | `Review` model: 1:1 with session; rating 1–5; `comment`; `public` boolean |
| 2.13 | `MentorNote` model: private mentor notes per (mentor, mentee) |
| 2.14 | `Attendance` model: `session_id` UNIQUE; `status` enum; soft warnings on no-show (replace harsh penalty system) |
| 2.15 | API endpoints: `GET /api/v1/mentors`, `GET /api/v1/mentors/:id`, `PATCH /api/v1/mentors/:id`, `POST /api/v1/mentors/:id/approve` (admin), `GET /api/v1/mentors/:id/availability?date_range=`, `POST /api/v1/mentor_sessions`, `PATCH /api/v1/mentor_sessions/:id`, `DELETE /api/v1/mentor_sessions/:id`, `POST /api/v1/mentor_sessions/:id/reviews`, `GET /api/v1/tags` |
| 2.16 | Pundit policies for everything in 2.15 |
| 2.17 | RSpec request specs for every endpoint + cross-tenant leak specs |
| 2.18 | `mentee_attendance` reporting endpoint (admin-only): `GET /api/v1/admin/attendance` |

**Risk:** booking race conditions. Mitigation: Postgres exclusion constraint catches double-bookings even under concurrent inserts; advisory lock on `mentor_id` during `BookingService` call as belt-and-suspenders.

---

## EPIC 3 — Frontend swap (Supabase → Rails)

**Goal:** every page in `frontend/src/pages/` renders against Rails endpoints. Supabase client and `@lovable.dev/cloud-auth-js` removed from `package.json`. `pnpm test` and Playwright e2e green.

**Definition of done:** running `grep -r "supabase" frontend/src/` returns zero matches. The app boots, auth works, mentor browse works, booking works, mentor agenda works.

| # | Task |
|---|---|
| 3.1 | Build `frontend/src/integrations/api/client.ts` — fetch wrapper, auto-injects JWT + tenant slug, handles 401 refresh |
| 3.2 | TanStack Query hooks: `useMentorsQuery`, `useMentorQuery`, `useBookMentorSession`, `useMyMentorSessions`, `useTags`, `useMyInterests`, `useReviewSession`, `useMentorAvailability`, etc. |
| 3.3 | Rewrite `AuthContext` (per Epic 1.11) |
| 3.4 | Rewrite each page to use new hooks. Order: `/auth`, `/cadastro`, `/dashboard`, `/mentores`, `/minhas-mentorias`, `/mentor/agenda`, `/mentor/perfil`, `/interesses`, `/reconfirmar`, `/admin`, then deferred ones (`/conteudos`, `/trilhas`, `/plano`, `/conquistas`) get stub or are commented out |
| 3.5 | Replace `BookingCalendar` slot computation with API call to `/api/v1/mentors/:id/availability` |
| 3.6 | Replace `NotificationBell` real-time with `refetchInterval: 30s` polling (Action Cable in v1.1) |
| 3.7 | Strip volunteer flow pages (`/voluntario`, `/onboarding-voluntario`) and components |
| 3.8 | Strip onboarding quiz and NPS pages |
| 3.9 | Wire white-label theming: bootstrap calls `/api/v1/public/tenant?domain=`, injects CSS vars and brand metadata |
| 3.10 | Update Playwright fixtures to seed Rails state via test endpoint (`/api/v1/test/setup`) |
| 3.11 | Remove `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `lovable-tagger` from `package.json` |
| 3.12 | Remove `supabase/` directory from frontend root (keep historical migrations under `migration/legacy-supabase/` for reference if desired) |

**Risk:** TanStack Query cache invalidation around session creation/cancellation. Mitigation: explicit `queryClient.invalidateQueries` after every mutation; integration tests covering the flow.

---

## EPIC 4 — Reminders & Email Lifecycle

**Goal:** all 8 Movê edge functions reimplemented as Sidekiq jobs. Resend integration. Cron schedule keeps reminders firing.

**Definition of done:** session 24h+1h+6h reminders fire in test; auto-cancel job marks unconfirmed sessions cancelled; review-request emails go out post-completion; bounce/error handling with Sentry alerts.

| # | Task |
|---|---|
| 4.1 | Resend integration via `resend` gem (or hand-rolled HTTPS calls); credentials in `Rails.application.credentials.resend.api_key` |
| 4.2 | `ApplicationMailer` with brand-aware templates (renders with tenant theme) |
| 4.3 | Mailer classes: `SessionReminderMailer`, `ReconfirmationMailer`, `ReviewRequestMailer`, `OnboardingNudgeMailer`, `WelcomeMailer`, `MentorApprovalMailer` |
| 4.4 | `Reminders::SessionReminderJob` (cron `*/5 * * * *`): finds sessions with `starts_at` between now+23h and now+25h, `reminder_24h_sent=false`, status confirmed → sends + flags |
| 4.5 | Same pattern: `Reminders::OneHourReminderJob`, `Reminders::ReconfirmationJob` (6h before), `Reminders::AutoCancelUnconfirmedJob` (3h before, cancels if unconfirmed) |
| 4.6 | `Reminders::ReviewReminderJob` (cron hourly): sessions completed in last 6h with no review |
| 4.7 | `Onboarding::NudgeJob` (cron daily): users registered >24h ago with `first_session_booked=false` |
| 4.8 | Public reconfirm endpoints: `POST /api/v1/public/sessions/:token/confirm`, `POST /api/v1/public/sessions/:token/cancel`. Token = signed JWT scoped to session |
| 4.9 | sidekiq-cron config in `api/config/sidekiq_cron.yml` |
| 4.10 | RSpec coverage: time-travel with `Timecop` to validate each job |
| 4.11 | Sentry breadcrumbs for every job; alert if job error rate >1% |
| 4.12 | Per-team Resend domain support (custom DKIM/SPF) — defer to v1.1 if too much |

**Risk:** Resend rate limits. Mitigation: dedicated `email_worker` Sidekiq queue with concurrency 5.

---

## EPIC 5 — Google Calendar Integration

**Goal:** mentors can connect Google Calendar; sessions auto-create Calendar events with Meet links; tokens refresh seamlessly.

**Definition of done:** the connect flow works in staging, a created session appears on the mentor's Google Calendar with a Meet link, and the mentee receives the link in reminder emails.

| # | Task |
|---|---|
| 5.1 | `GoogleCalendarToken` model: `user_id`, `access_token` (encrypted), `refresh_token` (encrypted), `expires_at`, `google_email`, `connected_at` |
| 5.2 | `Api::V1::GoogleCalendarController#authorize_url` returns Google OAuth URL with scopes `calendar.events`, `userinfo.email` |
| 5.3 | `Api::V1::GoogleCalendarController#callback` exchanges code for tokens; stores; redirects to mentor agenda |
| 5.4 | `Calendar::TokenRefresher` service: refreshes when `expires_at < now() + 5min`; called by every job/controller that uses Google |
| 5.5 | `Calendar::SyncJob`: on `MentorSession#after_create_commit` → enqueue → call Google Calendar API `events.insert` with `conferenceData.createRequest` → store `meeting_link` in session |
| 5.6 | On `MentorSession#after_update_commit` (status, starts_at, duration) → enqueue update; on `cancelled` → delete event |
| 5.7 | Frontend: `GoogleCalendarSettings` already exists; rewire to Rails endpoints |
| 5.8 | Banner `MentorGoogleCalendarRequiredBanner` flag in admin: optionally enforce Calendar connection per tenant |
| 5.9 | Test coverage: VCR recordings for Google API |

**Risk:** Google API quota per project. Mitigation: per-tenant Google OAuth client (or shared with high quota); monitor `429`s in Sentry.

---

## EPIC 6 — Admin & Analytics

**Goal:** HR admin can manage mentors/mentees, view dashboards (utilization, NPS, attendance), configure program settings, run audit log.

**Definition of done:** `/admin` page shows pending mentors, alerts, KPIs; admin can toggle `temporarily_unavailable` for any mentor; per-team `program_settings` editable; CSV export of sessions.

| # | Task |
|---|---|
| 6.1 | `ProgramSetting` model (one per team): `default_session_duration`, `allowed_durations`, `default_min_advance_hours`, `mentor_approval_required`, `no_show_warning_threshold`, `auto_cancel_grace_minutes` |
| 6.2 | `Api::V1::Admin::ProgramSettingsController` (#show, #update) with Pundit `ManagerPolicy` |
| 6.3 | `Api::V1::Admin::DashboardController#summary`: counts, utilization rate, completion rate, top mentors, no-show rate |
| 6.4 | `Api::V1::Admin::AlertsController#index`: pending mentor approvals, sessions without confirmation, mentors with low rating |
| 6.5 | `Api::V1::Admin::SessionsController` for full session list with filters; CSV export |
| 6.6 | `Api::V1::Admin::MentorsController#index` with filters (status, area, tags) |
| 6.7 | `paper_trail` enabled on critical models (`Mentor`, `MentorSession`, `Review`, `ProgramSetting`) for SOC2-friendly audit log |
| 6.8 | `Api::V1::Admin::AuditLogsController#index` (read-only) |
| 6.9 | Rewrite `Admin.tsx` page to call new Rails endpoints |

**Risk:** dashboard query performance. Mitigation: materialized view `mv_team_dashboard_summary` refreshed every 5 min via cron job.

---

## EPIC 7 — White-label & Billing

**Goal:** new tenant onboarded in <1 hour. Brand applied (logo, colors, brand name, domain). Stripe subscription active. Custom domain works via Cloudflare CNAME.

**Definition of done:** a fresh team created via `Api::V1::SuperAdmin::Teams#create` gets a working subdomain `acme.move-app.com`, can upload a logo and pick colors, and can add `mentor.acme.com` as custom domain via DNS verification. See [`07-TENANT-ONBOARDING.md`](07-TENANT-ONBOARDING.md) for the full flow.

| # | Task |
|---|---|
| 7.1 | `Team#settings` JSONB schema (`dry-schema`): `theme.logo_url`, `theme.primary_color`, `theme.secondary_color`, `theme.brand_name`, `theme.hero_video_url`, `lifecycle.trial_ends_at`, `feature_flags.*` |
| 7.2 | `Api::V1::SuperAdmin::TeamsController` for tenant creation/listing |
| 7.3 | `Api::V1::Admin::TeamSettingsController#update` for tenant self-service branding |
| 7.4 | `Active Storage` + DigitalOcean Spaces wired for logo uploads; signed URLs |
| 7.5 | Cloudflare for SaaS API integration: tenant adds custom domain → Rails posts to `/zones/<id>/custom_hostnames` → Cloudflare auto-issues SSL → poll until active → flip `team.domain_verified=true` |
| 7.6 | Nginx routing: single `server_name _;` catch-all → upstream Puma. Tenant resolution happens in Rails via Host header lookup against `teams.domain` (Redis cache, 60s TTL) |
| 7.7 | Stripe integration via Bullet Train: per-team subscription, plans `Starter`, `Pro`, `Enterprise` |
| 7.8 | `Api::V1::Admin::BillingController#portal` returns Stripe Customer Portal URL |
| 7.9 | Webhook `Api::V1::Webhooks::StripeController`: `subscription.updated`, `subscription.canceled`, `invoice.payment_failed` |
| 7.10 | Trial enforcement middleware: if `trial_ends_at < now()` and no active subscription, return 402 to all non-billing endpoints |
| 7.11 | Frontend: tenant detection on boot (per Epic 3.9); brand applied via CSS vars; custom favicon |
| 7.12 | Super-admin frontend at `/super-admin` (only for users with `super_admin=true`): list/create teams, impersonate (read-only), view MRR |

**Risk:** custom domain SSL provisioning latency. Mitigation: Cloudflare for SaaS issues SSL in ~30 seconds; document 5–15 min DNS propagation in admin UI.

---

## EPIC 8 — Hardening, Migration, Pilot

**Goal:** ship to first paying logo. Backups, monitoring, runbooks, data migration of any pilot users from Supabase, security audit clean.

**Definition of done:** uptime SLO defined and instrumented; backups tested; first customer onboarded and happy.

| # | Task |
|---|---|
| 8.1 | DO Managed PG daily snapshot retention verified; weekly logical `pg_dump` to Spaces; restore drill |
| 8.2 | Sentry alerts: rails error rate, sidekiq queue latency, calendar sync failure rate |
| 8.3 | Better Uptime / OpenStatus health checks for `/health`, `/api/v1/public/tenant`, Stripe webhook |
| 8.4 | Brakeman + bundler-audit + pnpm audit clean in CI; threshold: zero high/critical |
| 8.5 | Runbook docs in `/docs/RUNBOOK.md`: incident response, rollback, data export |
| 8.6 | Data migration Rake task: `bundle exec rails move:migrate_supabase_tenant TENANT_ID=... SUPABASE_SERVICE_KEY=...` reads from Supabase via REST and inserts into Rails. Idempotent. See [`05-DATA-MIGRATION.md`](05-DATA-MIGRATION.md) |
| 8.7 | Pilot tenant setup: provision team, create initial mentors/mentees from CSV, validate end-to-end booking flow (full process in [`07-TENANT-ONBOARDING.md`](07-TENANT-ONBOARDING.md)) |
| 8.8 | Performance smoke test: 100 concurrent users on `/api/v1/mentors`, p95 < 300ms |
| 8.9 | LGPD addendum: per-team data export endpoint (`/api/v1/admin/data_export`) returns ZIP with all team data |
| 8.10 | Pilot launch + feedback loop |

**Risk:** customer-specific edge cases pop up post-launch. Mitigation: dedicated support Slack/email channel, daily check-in for the first month.

---

## Issue labels (GitHub Projects)

- `status:` — backlog, in-progress, blocked, done
- `epic:` — 0 through 8 + names (`epic-foundation`, `epic-auth`, `epic-mentor`, `epic-frontend`, `epic-reminders`, `epic-calendar`, `epic-admin`, `epic-whitelabel`, `epic-pilot`)
- `module:` — auth, mentors, sessions, reminders, calendar, admin, billing, infra, frontend
- `type:` — feature, bug, refactor, test, docs, infra
- `priority:` — high, medium, low

## Definition of "ready" (before any task starts)

- Linked to its epic via label
- Acceptance criteria in description (3–5 bullets)
- Dependencies listed and merged (or explicitly marked unblocked)
- Out-of-scope notes ("we will not handle X here") explicit

## Definition of "done"

- All acceptance criteria checked
- RSpec passes locally and in CI
- For controller/model changes: `spec/security/` cross-tenant leak test added
- For migrations: down migration tested on staging
- PR linked to issue with `Closes #N`
- Reviewed (self-review fine for solo work; tagged for friend if frontend)
- Merged to main via squash
- Issue moved to `status:done`

## Estimating

Each issue is sized to fit in 1–3 days of focused work. If an issue is bigger, split it.

Total issue count estimate: **~110–130 issues** across 8 epics.

## Parallelization

After Epic 2 lands, three parallel streams open:

- Stream A: Epic 3 (frontend swap) — long, methodical
- Stream B: Epic 4 (reminders) — backend-heavy
- Stream C: Epic 5 (Google Calendar) — backend + 1 day of frontend rewire

A two-dev team should target ~6 weeks to v1 instead of 12.
