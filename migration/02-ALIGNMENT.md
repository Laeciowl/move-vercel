# 02 — Alignment: Movê (Lovable) ↔ Rails + Bullet Train

> Side-by-side mapping of the Lovable schema/features to the target Rails + Bullet Train architecture. Covers what to keep, rename, drop, defer, and add for the B2B white-label pivot.

---

## 1. Strategic pivot

| Aspect | Movê (now) | Movê → B2B (target) |
|---|---|---|
| Buyer | Volunteers / community | Big-company HR / People Ops / L&D |
| End users | Public mentees + volunteer mentors | Employees of the buyer company |
| Tenant | None — global app | One tenant per company (Bullet Train `Team`) |
| Pricing | Free | Per-seat or per-tenant Stripe subscription |
| Brand | Movê (single brand) | White-label (logo + colors per company) |
| Domain | One `move.org.br` | Custom CNAME per company (`mentor.acme.com`) or `acme.move-app.com` |
| Comms | Email (Resend) only | Email primary; Slack/Teams hooks later |
| Compliance | LGPD | LGPD + GDPR + SOC2 readiness |
| Auth | Supabase email/password | Devise+JWT, Google SSO v1, SAML/OIDC v1.5 |

**Net effect on schema:** every business table needs `team_id`. Auth model stays largely the same. Mentor approval workflow becomes a per-tenant admin task (HR approves their own internal mentors).

---

## 2. Schema mapping (Movê → Rails)

Bullet Train ships `Team`, `User`, `Membership`, `Invitation`, `Subscription` out of the box. Everything else is a custom Rails model.

### 2.1 Direct equivalents (just adapt)

| Movê table | Rails model | Notes |
|---|---|---|
| `auth.users` | `User` | Bullet Train + Devise + JWT. Refresh-token rotation supported |
| `profiles` | `Profile` (new) | New table; B2B keeps fewer demographic fields. See §2.4 |
| `user_roles` | `Membership` | Bullet Train memberships carry roles. Map mentor↔`mentor`, mentee↔`mentee`, admin↔`manager`/`owner` |
| `mentors` | `Mentor` | Custom model; `belongs_to :team`, `belongs_to :user`. Fields: `specialty`, `description`, `education`, `linkedin_url`, `min_advance_hours`, `disclaimer_*`, `temporarily_unavailable`, `years_experience`, `status` ENUM, `sessions_completed_count` |
| `mentor_sessions` | `MentorSession` | Per discovery; status enum (`scheduled`, `confirmed`, `completed`, `cancelled`); `confirmed_by_mentor`, `confirmed_at`, `mentor_notes`, `meeting_link`, `reminder_24h_sent`, `reminder_1h_sent`, `reconfirmation_*` |
| `mentor_blocked_periods` | `AvailabilityException` | `kind` enum (`time_off`, `extra_hours`); date range |
| `availability` (JSONB on mentor) | `Availability` (relational) | Flatten Movê JSONB into rows: `mentor_id`, `day_of_week`, `start_time`, `end_time`. Easier to query, validate, and add exclusion constraints |
| `tags` | `Tag` (global, no `team_id`) | Categories pre-seeded |
| `mentor_tags` | `MentorTag` join | M:M |
| `mentee_interests` | `UserInterest` join | M:M, scoped to user_id |
| `session_reviews` | `Review` | 1:1 with session; `rating` 1–5; `comment`; `public` flag |
| `mentor_mentee_notes` | `MentorNote` | Private notes per (mentor, mentee) |
| `mentee_attendance` | `Attendance` | Records what actually happened post-session |
| `notifications` | `Notification` | In-app notifications. Replace Supabase Realtime with polling (v1) → Action Cable (v1.1) |
| `google_calendar_tokens` | `GoogleCalendarToken` | Per user, one row |

### 2.2 Defer to v1.1 (keep schema, ship later)

| Movê table | Reason to defer |
|---|---|
| `achievements`, `user_achievements` | Engagement feature; not a buyer-blocker |
| `trilhas`, `passos_trilha`, `progresso_trilha`, `progresso_passo` | L&D module; sell as Pro add-on |
| `planos_desenvolvimento`, `plano_itens` | Same; ties to trilhas |
| `mentoria_feedbacks` | Already structured into Reviews + new optional fields; merge or defer |
| `nps_respostas` | Replace with quarterly admin-triggered survey tool |
| `content_items`, `content_access_log`, `content_saves` | Content library; v1.1 |
| `referrals` | Internal referrals not relevant in B2B |
| `impact_history` | Demographic trajectory tracking; B2B may want headcount impact reporting later |

### 2.3 Drop entirely (not relevant for B2B)

| Movê table | Reason |
|---|---|
| `volunteer_applications` | Volunteer model doesn't apply |
| `volunteer_submissions` | Same |
| `mentee_penalties` | Replace with admin-configurable warning threshold + HR escalation. Hard bans are inappropriate for employees |
| `onboarding_questions`, `onboarding_quiz_attempts` | Friction during corporate onboarding |
| `platform_videos` | Replace with `Team.settings.theme.hero_video_url` per tenant |

### 2.4 New tables for the B2B pivot

| Table | Purpose |
|---|---|
| `teams` | Bullet Train provides this. One row per company tenant |
| `memberships` | Bullet Train provides this. user × team × role |
| `team.settings` JSONB | Brand theme (logo URL, primary color, accent color, brand name, hero video) |
| `team.domain` | Custom domain (`mentor.acme.com`); `slug` for fallback subdomain |
| `subscriptions` | Bullet Train Stripe integration; one per team |
| `audit_logs` (via `paper_trail`) | SOC2 readiness — log every admin action |
| `program_settings` (per team) | mentor approval policy, no-show threshold, default session duration, allowed durations, default `min_advance_hours`, branding |
| `invitations` | Bullet Train provides; HR invites employees as mentees/mentors |
| `sessions_calendar_views` (optional) | Pre-computed materialized view of upcoming sessions for admin dashboards |

### 2.5 Field-level changes

#### `profiles` (rebuild)

Drop demographics that don't apply at work (`age`, `professional_status`, `income_range`, `mentee_discovery_source`). Add work-relevant fields:

- `team_id` (FK)
- `user_id` (FK, UNIQUE within team — but a person could be in multiple teams)
- `display_name`, `headline` (e.g. "Senior PM, Product"), `department`, `office_location`, `manager_email` (optional), `seniority_level` (enum: junior, mid, senior, lead, principal)
- `phone`, `photo_url` (DigitalOcean Spaces), `description`
- `lgpd_consent`, `lgpd_consent_at` (keep — still required in BR)
- `email_notifications`
- `created_at`, `updated_at`

#### `mentors` → `Mentor`

`belongs_to :team`, `belongs_to :user` (NOT NULL — vs Movê's text-only email link). Fields per discovery: `specialty` (was `area`), `description`, `education`, `linkedin_url`, `availability` moved to relational `Availability` table, `status`, `min_advance_hours`, `temporarily_unavailable`, `disclaimer_accepted_at`, `years_experience` (was `anos_experiencia`), `sessions_completed_count` (cached counter).

Drop `commission_pct` (irrelevant for internal mentors).

#### `mentor_sessions` → `MentorSession`

Add: `confirmed_by_mentor`, `confirmed_at`, `mentor_notes`, `meeting_link`, `reminder_24h_sent`, `reminder_1h_sent`, `reconfirmation_sent_at`, `reconfirmation_confirmed_at`. No `service_id` (B2B mentorship doesn't have a service catalog). Keep `cancellation_token` only if public reconfirmation links need an unauthenticated cancel path; otherwise rely on signed JWT in URL.

Add DB constraint:
```sql
ALTER TABLE mentor_sessions
  ADD CONSTRAINT no_overlap_per_mentor
  EXCLUDE USING gist (
    mentor_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('scheduled', 'confirmed'));
```

This replaces Movê's `tr_prevent_session_overlap` trigger and is race-safe. Requires `btree_gist` extension (enabled at DB provisioning time).

---

## 3. Auth & RBAC mapping

### 3.1 Roles

| Movê | Rails / Bullet Train |
|---|---|
| `admin` (global) | `super_admin` boolean on `User` |
| `admin` (per platform) | Tenant `Owner` or `Manager` (Bullet Train `memberships.role`) |
| `voluntario` | DROP |
| `user` (mentee) | new role `Mentee` on `Membership` |
| Mentor (implicit, via `mentors` row) | new role `Mentor` on `Membership` (a user can be both Mentor + Mentee in same team) |

A user can wear two hats in the same team (be both a mentor for juniors and a mentee for an exec). Bullet Train allows multiple roles per membership.

### 3.2 Auth flow

| Movê | Rails |
|---|---|
| Supabase email+password | Devise + JWT (access + refresh-token rotation) |
| `auth.users.raw_user_meta_data` | Captured during invitation acceptance, stored in `Profile` |
| Magic link | Add for v1 — corporate users prefer this |
| Google SSO | Add for v1 (`omniauth-google-oauth2`); same OAuth client as Calendar sync |
| SAML / SCIM | Defer to v1.5 (Enterprise requirement) |

Refresh token rotation: short-lived access (15 min), rotated refresh (7 d). On each refresh, the old `jti` is denylisted and a new one issued.

---

## 4. RLS policies (PostgreSQL row-level security)

A single migration auto-detects every business table with `team_id` and enables RLS:

```sql
ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_isolation ON <t>
  USING (team_id = current_setting('app.current_team_id', true)::bigint);
```

`ApplicationController` runs an `around_action` that sets `SET LOCAL app.current_team_id = <id>` per request. `ApplicationJob` does the same for Sidekiq.

All new business tables get `team_id`. Cross-tenant leak specs at `api/spec/security/cross_tenant_spec.rb` — required in CI before merge.

Movê-specific row-level checks that **stay at the application layer** (Pundit policies) because RLS doesn't fit:

- `Mentor#approved?` — only HR admins can approve (Pundit policy on `Mentor#update` checking `:status` change).
- `MentorSession#cancellable?` — mentee can cancel only their own and only if `starts_at > now() + 1h`.
- `Review#publishable?` — only mentee owner.

---

## 5. Edge functions → Sidekiq jobs

| Edge function | Sidekiq job |
|---|---|
| `send-session-reminders` | `Reminders::SessionReminderJob` (cron every 5 min) |
| `send-reconfirmation` | `Reminders::ReconfirmationJob` (cron every 5 min) |
| `auto-cancel-unconfirmed` | `Reminders::AutoCancelUnconfirmedJob` (cron every 5 min) |
| `send-review-reminders` | `Reminders::ReviewReminderJob` (cron every 1 hour) |
| `send-mentorship-reminder` | merge into above |
| `send-onboarding-nudge` | `Onboarding::NudgeJob` (cron daily) |
| `on-user-created` | `User#after_commit_on_create` callback + `Welcome::EmailJob` |
| `delete-user-account` | `Lgpd::AccountDeletionJob` (admin-triggered only) |
| `google-calendar-auth`, `google-calendar-sync` | Rails controller `Api::V1::GoogleCalendarController` + `Calendar::SyncJob` |

Cron via `sidekiq-cron`. Schedule lives in `api/config/sidekiq_cron.yml`.

Queue names:

- `default` — generic
- `email_worker` — Resend sends (rate-limited)
- `calendar_worker` — Google API (rate-limited)
- `report_worker` — analytics

(no `wa_worker` — WhatsApp is out of scope for B2B)

---

## 6. Storage mapping

| Movê | Rails |
|---|---|
| Supabase `mentor-photos` bucket | DigitalOcean Spaces (S3-compatible), Active Storage with `aws-s3` service pointing at the Spaces endpoint |
| Supabase `volunteer-content` bucket | DROP (volunteer flow removed) |
| Email inline images | Resend supports remote URLs; same Spaces bucket |

Bucket key structure (one bucket per environment):
```
move-prod/tenant-{team_id}/avatars/{user_id}/...
move-prod/tenant-{team_id}/mentor-photos/{mentor_id}/...
move-prod/tenant-{team_id}/team-logos/...
move-prod/tenant-{team_id}/hero-images/...
```

Spaces has a built-in CDN front; emit `https://move-prod.<region>.cdn.digitaloceanspaces.com/...` for public-readable assets and signed URLs for private ones.

---

## 7. Frontend mapping

Decision: **keep the React SPA, swap Supabase for Rails REST API.**

| Movê piece | Action |
|---|---|
| `src/integrations/supabase/client.ts` | Replace with `src/integrations/api/client.ts` — fetch wrapper that injects `Authorization: Bearer <jwt>` and `X-Tenant-Slug: <slug>` |
| `src/contexts/AuthContext.tsx` | Rewrite: instead of Supabase session, manage access+refresh JWT in memory + httpOnly cookie for refresh |
| Direct `supabase.from().select()` calls in components | Replace with TanStack Query hooks: `useMentorsQuery()`, `useBookSession()`, etc. that hit Rails endpoints |
| Real-time `.on('*')` subscriptions | Replace with `refetchInterval` polling (v1) or Action Cable (v1.1) |
| RLS-driven authorization | Keep — Rails Pundit returns 403/404. Front-end shows/hides features based on `useAuth().roles` |
| React Router 6 | Keep |
| shadcn/ui + Tailwind | Keep — drives the white-label theming via CSS vars |
| Tailwind config | Replace static colors with `var(--primary)` etc., wire to Team.settings via runtime CSS injection |

### 7.1 White-label theming

At runtime on app boot:
1. Detect tenant from hostname (`mentor.acme.com`).
2. Fetch `GET /api/v1/public/tenant?domain=mentor.acme.com` → returns `{ slug, name, logo_url, primary_color, secondary_color, brand_name, hero_video_url }`.
3. Inject CSS vars on `:root`:
   ```css
   :root {
     --primary: <primary_hex>;
     --secondary: <secondary_hex>;
   }
   ```
4. Render `<title>`, `<link rel="icon">`, footer copy from response.

All shadcn components already read CSS vars — no per-component changes needed.

---

## 8. Naming & code conventions

| Movê (Portuguese mix) | Rails (English convention) |
|---|---|
| `mentores` route | `/mentors` |
| `minhas-mentorias` route | `/my-sessions` |
| `trilhas`, `passos_trilha` tables | `paths`, `path_steps` (deferred) |
| `planos_desenvolvimento` | `development_plans` (deferred) |
| `mentee_avisou` column | `gave_advance_notice` |
| `aprendizado_principal` | `key_learning` |
| `acoes_planejadas` | `planned_actions` |
| `meta_tipo`, `meta_descricao` | `goal_type`, `goal_description` |

Code, columns, commits in English. User-facing copy in pt-BR primary, en-US locale file added during v1 if buyer needs it.

---

## 9. Deltas to capture

These are decisions that need an explicit yes/no from the friend (and Leonardo) before Epic 0 starts:

1. **Rename app?** Stay "Movê" or pick a B2B-friendly name?
2. **Per-seat vs per-tenant pricing?** Recommended: tiered tenant fee with seat caps (Starter 50, Pro 200, Enterprise unlimited).
3. **SSO in v1 or v1.5?** Recommended: Google SSO in v1 (cheap to add, big sales unlock); SAML/SCIM in v1.5.
4. **Multi-language at launch?** Recommended: pt-BR + en-US locale files in v1; en-US is one extra week of copywriting.
5. **Drop the volunteer/content/trilhas modules?** Recommended: drop volunteer + onboarding quiz + NPS; defer trilhas + content + dev plans + achievements to v1.1.
6. **Penalty system?** Recommended: replace with soft warnings + admin alert; no auto-ban.
7. **Hosting region?** DigitalOcean NYC3 (US-buyer-friendly) or AMS3/FRA1 (EU). Recommended: NYC3 if first sales targets are US-based; AMS3 if BR-only.
8. **Codebase layout.** Monorepo (api + frontend + infra in one repo) or split? Recommended: monorepo.
9. **Fresh repo or fork existing?** Recommended: **fresh repo** with this `migration/` directory carried over for context.

Defaults assumed in subsequent docs (`03-EPICS-AND-TASKS.md`, `04-INFRA-MIGRATION.md`):

- Fresh repo, monorepo layout.
- Drop volunteer/quiz/NPS/penalties; defer trilhas/content/achievements.
- Stay "Movê" as branding, use `move-app` as repo name.
- Per-tenant tiered Stripe billing with seat caps.
- Google SSO in v1, SAML in v1.5.
- pt-BR primary, en-US in v1 if friend agrees.
- DigitalOcean NYC3.
