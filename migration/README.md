# Movê → Rails Migration

> Reverse-engineered spec + migration plan to port this Lovable.dev (Vite + React + Supabase) mentorship app onto a Ruby on Rails 7.2 + Bullet Train multi-tenant SaaS, white-label for B2B sales.
>
> **Target use case:** big companies buy a white-labeled mentorship platform; internal senior employees ("mentors") publish availability; junior employees ("mentees") browse and book sessions; admins (HR / People Ops) curate, audit, and report.

---

## Documents

| File | Purpose |
|---|---|
| [`01-DISCOVERY.md`](01-DISCOVERY.md) | Full reverse-engineered spec of the Lovable app: tables, triggers, RLS, edge functions, pages, components, business rules, integrations |
| [`02-ALIGNMENT.md`](02-ALIGNMENT.md) | Side-by-side mapping: Supabase entity → Rails/BT entity. Decisions on pivot (mentorship → corporate B2B) |
| [`03-EPICS-AND-TASKS.md`](03-EPICS-AND-TASKS.md) | Epic-level breakdown of the migration with task lists, dependencies, sequencing |
| [`04-INFRA-MIGRATION.md`](04-INFRA-MIGRATION.md) | Infra plan: DigitalOcean (Managed Postgres + Droplets + Spaces) + Kamal + Cloudflare. Domain/CNAME flow for tenant white-labeling |
| [`05-DATA-MIGRATION.md`](05-DATA-MIGRATION.md) | How to ETL Supabase data into Rails (one-shot dump → seed scripts) for early pilot tenants |
| [`06-FRONTEND-STRATEGY.md`](06-FRONTEND-STRATEGY.md) | Keep React+Vite, swap Supabase client for Rails REST + JWT. What to keep, what to rewrite, theming for white-label |
| [`07-TENANT-ONBOARDING.md`](07-TENANT-ONBOARDING.md) | How to add a new B2B customer: single deploy, hostname routing, Cloudflare for SaaS, runtime theming. No per-tenant build |

---

## TL;DR — How to migrate ASAP

1. **Keep the frontend.** It's clean React + shadcn + Tailwind. Strip the `supabase` client and route every call through a thin `api` SDK that talks to the Rails API with `Authorization: Bearer <jwt>` and `X-Tenant-Slug: <company>`. Theming via CSS variables driven by `Team.settings.theme` (Bullet Train pattern).
2. **Stand up Rails on Bullet Train.** Multi-tenancy via `Team`, RLS migration enforced at the database, JWT access+refresh tokens, Pundit authorization.
3. **Port the schema 1:1.** 28 tables. The mentor/session/availability/blocked-period/tag/review core maps cleanly onto Bullet Train models — add `Mentor` and `MentorSession` Rails models, plus the smaller satellite tables.
4. **Port edge functions to Sidekiq jobs.** 8 Deno edge functions become 8 Sidekiq workers (reminders, reconfirmation, auto-cancel, review nudge, onboarding nudge, etc.).
5. **Replace WhatsApp focus with email + ICS + Google/Outlook.** Corporate clients live on Outlook/Gmail/Slack/Teams, not WhatsApp.
6. **Add B2B billing.** Per-seat Stripe subscriptions on the `Team` (Bullet Train already wires this).
7. **White-label per tenant.** Custom domain via Cloudflare CNAME → Nginx → Vite SPA → Rails API. Logo, primary color, secondary color, brand name — all from `Team.settings.theme`.

Total estimate: **8 epics, ~12–14 weeks** with one full-time dev.

---

## Source app summary

- **Name (current):** Movê — a free, volunteer-driven mentorship platform for Brazilian career development.
- **Stack:** Vite 5 + React 18 + TypeScript + shadcn/ui + Tailwind + React Router 6 + TanStack Query + Supabase (Postgres + Auth + Edge Functions + Storage + Realtime).
- **Repo:** `/Users/leonardozappani/move-vercel`. Git history exists. README is the default Lovable.dev template.
- **Key counts:** 28 tables, 15+ enums, 10+ triggers, 20+ RPCs, 8 edge functions, ~25 pages, ~70 components.

## Target app

- **Name (proposed):** still TBD. Keep `Movê` if friend wants the codename.
- **Stack:** Rails 7.2 API + Bullet Train + PostgreSQL 16 (RLS) + Sidekiq + Redis + React/Vite frontend (kept) + DigitalOcean (Managed Postgres + Droplets + Spaces) + Kamal + Cloudflare + Resend + Sentry.
- **Sales motion:** B2B white-label SaaS. Per-seat or per-tenant flat fee.
- **Buyer:** HR / Learning & Development / People Ops at companies with 200+ employees.
- **End users:** Mentors (internal seniors), Mentees (internal juniors), Admins (HR), Super Admin (us).

---

## Scope split: in vs out for v1

**IN for v1 (must ship to sell to first paying logo):**

- Multi-tenant Rails (Team = customer company)
- Auth (Devise + JWT, magic-link signup, SSO Google for v1, SAML deferred)
- Mentor profile + availability + blocked periods + advance-notice rules
- Mentee browsing + booking calendar + session lifecycle (scheduled → confirmed → completed/cancelled)
- Email reminders (24h, 1h, 6h reconfirmation, auto-cancel)
- Google Calendar two-way sync with Meet link
- Tags / interests / matching
- Reviews (1–5 + comment)
- Admin panel: approve mentors, dashboards, alerts
- Stripe billing (per seat or per tenant)
- White-label theming (logo + primary color + brand name) via `Team.settings.theme`

**OUT / deferred for v1:**

- Volunteer applications + content submission flow (community-driven; not B2B-relevant)
- Achievements / gamification (nice-to-have, not a blocker)
- Trilhas + dev plans + plano_itens (corporate L&D module — sell as Pro add-on later)
- WhatsApp integration (not used by corporate buyers)
- LGPD self-serve account deletion UI (replace with admin-only delete + retention policy)
- NPS module (drop or move to admin-triggered surveys)
- Onboarding quiz (drop; corporate buyer wants a frictionless onboarding)
- Penalty system for no-shows (replace with admin-configurable warning thresholds; harsh bans inappropriate B2B)

---

## Critical risks

| Risk | Mitigation |
|---|---|
| RLS regressions during migration | Enable RLS via a single migration auto-detecting every `team_id` table; apply `team_isolation` policy; add `spec/security/cross_tenant_spec.rb` covering every controller |
| Email deliverability for corporate domains | Use Resend with custom DKIM/SPF per tenant subdomain; provide bounce alerts |
| Google Calendar token rotation at scale | Use `google-api-client` gem; refresh on 401; log refresh failures |
| Vercel → DigitalOcean DNS cutover | Keep Vercel running until Rails API + frontend are deployed and pointed at by `staging.app.<tenant>.com`; cutover one tenant at a time |
| Data migration of pilot users | Build a one-shot Rake task that reads from Supabase via REST API and inserts into Rails; idempotent; per-tenant |

