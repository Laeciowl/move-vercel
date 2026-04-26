# 01 — Discovery: reverse-engineered spec of Movê (Lovable.dev)

> Source: full file-by-file walk of `/Users/leonardozappani/move-vercel` on 2026-04-26. All file:line references are absolute paths.

---

## 1. Stack snapshot

- **Frontend:** Vite 5 + React 18 + TypeScript, shadcn/ui (Radix UI + Tailwind), React Router 6, TanStack Query 5, Framer Motion 12, react-hook-form, Zod, date-fns.
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage + Realtime). Deno edge functions. JS/TS client SDK (`@supabase/supabase-js`).
- **Auth UX:** `@lovable.dev/cloud-auth-js` shim around Supabase auth.
- **Build:** Vite (`vite.config.ts`), Vitest unit tests, Playwright (`playwright.config.ts`) e2e fixture.
- **Deploy:** Vercel (`vercel.json`).
- **Lock-in:** Lovable.dev project metadata in `.lovable/`, `.idea/`, generated `bun.lock` + `bun.lockb` + `package-lock.json` (multiple lockfiles, fix during migration).

---

## 2. Domain entities & DB schema

Schema lives in `/Users/leonardozappani/move-vercel/supabase/migrations/`. ~30 migration files starting at `20260116062026_remix_migration_from_pg_dump.sql`. Key tables below.

### 2.1 Auth & profile

#### `auth.users` (Supabase native)
- `id` UUID PK, `email` TEXT, `raw_user_meta_data` JSONB.
- Metadata blob: `{ name, age, city, state, professional_status, income_range, phone, mentee_discovery_source }`.
- Trigger `on_auth_user_created_profile` runs `handle_new_user_profile()` → creates `public.profiles` row.

#### `public.profiles` (mentee profile)
Migrations: `20260116062026:210-227`, `20260116064017:20-30`, `20260119172331:1-26`, `20260422180000:9-10`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `auth.users(id)` UNIQUE ON DELETE CASCADE | |
| `name` | TEXT NOT NULL | |
| `age` | INTEGER CHECK 18–100 | |
| `city`, `state` | TEXT NOT NULL | |
| `professional_status` | ENUM | `desempregado`, `estudante`, `estagiario`, `empregado`, `freelancer_pj` |
| `income_range` | ENUM | `sem_renda`, `ate_1500`, `1500_3000`, `acima_3000` |
| `phone`, `photo_url`, `description` | TEXT | optional |
| `lgpd_consent`, `lgpd_consent_at` | BOOL / TIMESTAMPTZ | |
| `onboarding_completed`, `onboarding_quiz_passed`, `first_mentorship_booked` | BOOLEAN | |
| `mentee_discovery_source` | ENUM | `indicacao`, `linkedin`, `redes_sociais`, `outro` |
| `email_notifications` | BOOLEAN | reminder opt-out |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

Triggers: `track_profile_impact_change`, `update_profiles_updated_at`. RLS: own-row read/write only.

#### `public.user_roles`
Migration `20260116071741:1-41`. RBAC table. Enum `app_role`: `admin`, `moderator`, `user` (code also references `voluntario`).
- `(user_id, role)` UNIQUE. Helper `has_role(user_id, role)` SECURITY DEFINER.
- Admin assignment via `add_admin_by_email()` RPC (`20260119002746:2-30`).

#### `public.impact_history`
Tracks each professional_status / income_range change for a mentee — used to show "lives transformed" stats. Insert-only via trigger on `profiles` insert/update.

### 2.2 Mentor & sessions (the core)

#### `public.mentors`
Base `20260116062026:191-206`; enhancements in `20260204130518:1-5`, `20260116071000:44-47`, `20260213010622:1-30`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | TEXT NOT NULL | links to `auth.users.email` (no FK!) |
| `name`, `area`, `description` | TEXT NOT NULL | |
| `education`, `photo_url`, `linkedin_url` | TEXT | optional |
| `availability` | JSONB DEFAULT '[]' | `[{ day: "monday", times: ["09:00","14:00"], duration?: 30 }]` |
| `status` | ENUM | `pending`, `approved`, `rejected` |
| `min_advance_hours` | INT DEFAULT 24 | CHECK IN (12, 24, 48, 72) |
| `sessions_completed_count` | INT | denormalized; maintained by trigger |
| `disclaimer_accepted`, `disclaimer_accepted_at` | BOOL / TIMESTAMPTZ | |
| `temporarily_unavailable` | BOOLEAN | blocks new bookings |
| `anos_experiencia` | INTEGER | optional |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

Note: `email` is the link to `auth.users` — no FK constraint. RLS uses `email = auth.email()`.

#### `public.mentor_sessions`
Base `20260116062026:176-187`. Many later migrations added columns.

| Column | Notes |
|---|---|
| `id` UUID PK | |
| `mentor_id` UUID FK → `mentors(id)` ON DELETE CASCADE | |
| `user_id` UUID FK → `auth.users(id)` ON DELETE CASCADE | the mentee |
| `scheduled_at` TIMESTAMPTZ NOT NULL | |
| `status` ENUM | `scheduled`, `completed`, `cancelled` |
| `duration` INT DEFAULT 30 | minutes; 30/45/60 |
| `completed_at` TIMESTAMPTZ | |
| `notes` TEXT | mentee's stated objective |
| `confirmed_by_mentor` BOOL DEFAULT false | mentor accepts request |
| `confirmed_at` TIMESTAMPTZ | |
| `mentor_notes` TEXT | private |
| `meeting_link` TEXT | Google Meet or custom URL |
| `reminder_24h_sent` BOOL | |
| `reminder_1h_sent` BOOL | |
| `reconfirmation_sent`, `reconfirmation_sent_at` | 6h-before flow |
| `reconfirmation_confirmed`, `reconfirmation_confirmed_at` | mentee confirms via email link |
| `created_at` | |

**Triggers** (`20260204130518`):
- `tr_validate_session_schedule` — enforces `scheduled_at >= now() + min_advance_hours`.
- `tr_prevent_session_overlap` — uses `tstzrange && tstzrange` against existing scheduled sessions for the same mentor.
- `tr_update_mentor_sessions_completed_count` — keeps `mentors.sessions_completed_count` in sync when a session flips to `completed`.

**RPCs:**
- `get_mentor_booked_slots(_mentor_id uuid)` returns occupied slots for booking UI.

#### `public.mentor_blocked_periods`
Migration `20260116071000:1-51`.
- `mentor_id`, `start_date`, `end_date` (CHECK >=), `reason`, `created_at`.
- Index on `(start_date, end_date)`. Public-readable; mentor-writable.

### 2.3 Tags / matching

#### `public.tags`
Migration `20260205200234:1-19`. 45 tags seeded (lines 93–144). `slug` UNIQUE, `category` (e.g. "Carreira e Desenvolvimento", "Tecnologia", "Negócios").

#### `public.mentor_tags`
M:M `mentor_id ↔ tag_id`. UNIQUE pair. Mentor-managed.

#### `public.mentee_interests`
M:M `user_id ↔ tag_id`. UNIQUE pair. Mentee-managed.

### 2.4 Feedback & attendance

#### `public.session_reviews`
Migration `20260119184528:1-36`. 1:1 with `mentor_sessions`. `rating` 1–5, `comment`, `review_publico` flag.

#### `public.mentor_mentee_notes`
Mentor's private notes per mentee. UNIQUE `(mentor_id, mentee_user_id)`.

#### `public.mentee_attendance`
Migration `20260325131237:28-64`. Records what actually happened in a session:
- `status` ENUM: `realizada`, `no_show_mentorado`, `no_show_mentor`, `cancelada_mentorado`, `cancelada_mentor`, `reagendada`.
- `mentee_avisou` BOOL (gave advance notice).
- `mentor_observations`.
- Trigger `update_mentee_penalties()` cascades into `mentee_penalties`.

#### `public.mentee_penalties`
Migration `20260325131237:65-90`. Escalation:
- 1st no-show → `aviso_1`
- 2nd → `bloqueado_7d`
- 3rd → `bloqueado_30d`
- 4th+ → `banido`

UNIQUE `user_id`. `blocked_until` timestamp.

#### `public.mentoria_feedbacks`
Migration `20260216163209:129-149`. Post-session structured feedback: `aprendizado_principal`, `acoes_planejadas` TEXT[], `teve_resultado`.

### 2.5 Gamification

#### `public.achievements` & `public.user_achievements`
Migration `20260211014702:19-143`. ~46 achievements seeded.
- Categories: `mentorias`, `tempo`, `impacto`, `consistencia`, `conteudo`, `exploracao`, `areas`, `preparacao`, `engajamento`, `especial`.
- Criteria types: `count`, `sum`, `streak`, `unique`, `special`.
- For both `mentor`, `mentorado`, or `ambos`.
- `user_achievements` tracks `progress` and `unlocked_at`.

### 2.6 Content & engagement

#### `public.content_items`
PDFs and videos. `item_type` ∈ {`pdf`, `video`}.

#### `public.content_access_log`, `public.content_saves`
Engagement tracking.

### 2.7 Learning paths

#### `public.trilhas`
Migration `20260216163209:12-21`. Curated learning paths.

#### `public.passos_trilha`
Steps per trail. `tipo` ∈ {`conteudo`, `download`, `video`, `acao`, `mentoria`}. `tags_mentor_requeridas` TEXT[] (steps requiring a mentorship session with specific mentor expertise).

#### `public.progresso_trilha`, `public.progresso_passo`
Per-mentee progress.

#### `public.planos_desenvolvimento` & `public.plano_itens`
Migration `20260216163209:155-210`. Personal development plan. Goal types: `primeiro_emprego`, `transicao`, `promocao`, `habilidades`, `outro`. Items can reference trilha/mentoria/acao via `tipo` + `referencia_id`.

### 2.8 Other

#### `public.notifications`
In-app notifications. Real-time via `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications`. Triggers fire on new content, new session, etc.

#### `public.google_calendar_tokens`
OAuth tokens per user. `access_token`, `refresh_token`, `expires_at`, `google_email`, `connected_at`.

#### `public.referrals`
Referral codes. Not heavily used.

#### `public.nps_respostas`
NPS survey responses (`nota` 0–10).

#### `public.volunteer_applications`, `public.volunteer_submissions`
Volunteer signup form + content submissions awaiting admin review.

#### `public.platform_videos`
CMS for hero/onboarding video URLs (YouTube). Keys: `hero_video`, `onboarding_video`.

#### `public.onboarding_questions`, `public.onboarding_quiz_attempts`
Onboarding quiz with score tracking.

### 2.9 Storage buckets

- **`mentor-photos`** — public read; authenticated write; owner delete.
- **`volunteer-content`** — public read; volunteers/admins write.

### 2.10 Enums (representative)

| Enum | Values |
|---|---|
| `app_role` | admin, moderator, user (+ voluntario in code) |
| `professional_status` | desempregado, estudante, estagiario, empregado, freelancer_pj |
| `income_range` | sem_renda, ate_1500, 1500_3000, acima_3000 |
| mentor `status` | pending, approved, rejected |
| session `status` | scheduled, completed, cancelled |
| attendance `status` | realizada, no_show_mentorado, no_show_mentor, cancelada_mentorado, cancelada_mentor, reagendada |
| penalty `status` | ativo, aviso_1, bloqueado_7d, bloqueado_30d, banido |
| achievement `category` | mentorias, tempo, impacto, consistencia, conteudo, exploracao, areas, preparacao, engajamento, especial |
| achievement `criteria_type` | count, sum, streak, unique, special |
| achievement `user_type` | mentor, mentorado, ambos |
| content `item_type` | pdf, video |
| trail step `tipo` | conteudo, download, video, acao, mentoria |
| dev plan goal `meta_tipo` | primeiro_emprego, transicao, promocao, habilidades, outro |

---

## 3. Auth model

- **Provider:** Supabase Auth (`@supabase/supabase-js` + `@lovable.dev/cloud-auth-js` wrapper).
- **Strategy:** email + password. Magic links not used.
- **Profile auto-creation:** trigger `on_auth_user_created_profile` populates `public.profiles` from `raw_user_meta_data`.
- **Roles:** `user_roles` table + `has_role()` SECURITY DEFINER function. Admin assignment via `add_admin_by_email()` RPC.
- **Mentor identity:** `mentors.email` text — no FK to `auth.users.id`. Ownership checked via `email = auth.email()` in RLS.
- **Session:** JWT in browser, auto-refresh by Supabase client.
- **Frontend context:** `src/contexts/AuthContext.tsx` exposes `{ user, session, profile, loading, signOut, refreshProfile }`.
- **Permission checks:** custom hooks — `useMentorCheck`, `useAdminCheck`, `useVolunteerCheck`, `usePendingMentorCheck`.

---

## 4. Pages & features

Routes registered in `/Users/leonardozappani/move-vercel/src/App.tsx`. Pages under `/Users/leonardozappani/move-vercel/src/pages/`.

### 4.1 Public

| Route | File | Purpose |
|---|---|---|
| `/` | `Index.tsx` | Public landing |
| `/auth` | `Auth.tsx` | Login |
| `/cadastro` | `Signup.tsx` | Signup with profile capture |
| `/para-mentorados`, `/para-mentores` | informational | |
| `/termos` | terms of service | |

### 4.2 Authenticated mentee

| Route | File | Reads | Writes |
|---|---|---|---|
| `/dashboard`, `/inicio` | `Dashboard.tsx` | profile, impact_history, upcoming sessions | profile updates → `impact_history` insert via trigger |
| `/mentores` | `Mentors.tsx` | `get_public_mentors()` RPC, mentor_tags, mentee_interests, blocked periods, booked slots, reviews | `mentor_sessions` insert (booking) |
| `/minhas-mentorias` | `MinhasMentorias.tsx` | mentor_sessions joined with mentors | cancel / reschedule / review / reconfirm |
| `/interesses` | `Interests.tsx` | tags | `mentee_interests` insert/delete |
| `/conteudos`, `/conteudos/salvos` | `Contents.tsx`, `SavedContents.tsx` | content_items, content_saves | `content_access_log`, `content_saves` |
| `/trilhas`, `/trilhas/:id` | `Trails.tsx`, `TrailDetail.tsx` | trilhas, passos_trilha, progresso_* | progress updates |
| `/plano` | `DevPlan.tsx` | planos_desenvolvimento, plano_itens | full CRUD |
| `/conquistas` | `Achievements.tsx` | achievements, user_achievements | — |
| `/avaliar` | `Nps.tsx` | nps_respostas | insert |
| `/reconfirmar` | `Reconfirmar.tsx` | mentor_sessions | confirm reconfirmation |
| `/ajuda`, `/comunidades` | help / social | — | — |

### 4.3 Authenticated mentor

| Route | File | Purpose |
|---|---|---|
| `/mentor/agenda` | `MentorAgenda.tsx` | calendar of own sessions; confirm/complete; manage availability/blocked-periods/tags/profile; Google Calendar connect; toggle `temporarily_unavailable`; mentor notes per mentee |
| `/mentor/perfil` | `MentorProfile.tsx` | full public profile |

### 4.4 Volunteer

| Route | File |
|---|---|
| `/voluntario` | `Volunteer.tsx` (signup) |
| `/onboarding-voluntario` | `VolunteerOnboarding.tsx` |

### 4.5 Admin (`/admin`, `Admin.tsx`)

- Approve/reject pending mentors (`status` field).
- View platform stats (RPCs: `get_activation_rate`, `get_retention_rate`, `get_admin_alerts`).
- Manage volunteer applications + content submissions.
- Edit `platform_videos` (YouTube URLs).
- View users, roles, penalties.

---

## 5. Business rules

### 5.1 Time zones

- All times `TIMESTAMPTZ`.
- Display formatted to `pt-BR` `America/Sao_Paulo` in edge functions and UI.
- Availability JSON uses day-of-week names (`monday`...) and `HH:mm` strings — no TZ conversion at storage. Risk: ambiguous if mentor in another timezone. Worth fixing on migration.

### 5.2 Conflict detection (`tr_prevent_session_overlap`)

```sql
SELECT COUNT(*) FROM public.mentor_sessions s
WHERE s.mentor_id = NEW.mentor_id
  AND s.status = 'scheduled'
  AND s.id IS DISTINCT FROM NEW.id
  AND tstzrange(s.scheduled_at, s.scheduled_at + make_interval(mins => COALESCE(s.duration, 30)), '[)')
   && tstzrange(NEW.scheduled_at, NEW.scheduled_at + make_interval(mins => COALESCE(NEW.duration, 30)), '[)');
```

In Rails: replicate via `validate :no_overlap` with a window query, plus DB-level `EXCLUDE USING gist (mentor_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` constraint for race-safety.

### 5.3 Minimum advance notice (`tr_validate_session_schedule`)

`scheduled_at >= now() + make_interval(hours => min_advance_hours)`. Default 24h; mentor picks 12/24/48/72.

### 5.4 Slot generation

Done client-side in `BookingCalendar`:
1. Walk next 30 days.
2. For each day matching `availability[].day`, take the listed `times`.
3. Drop slots inside any `mentor_blocked_periods` row.
4. Drop slots already in `get_mentor_booked_slots(mentor_id)`.

No precomputed slots. Migrate same logic to Rails service: `Mentors::AvailabilityCalculator`.

### 5.5 Reminder lifecycle

| Edge function | Window | Action |
|---|---|---|
| `send-session-reminders` | 24h before, then 1h before | email mentee + mentor; flip `reminder_24h_sent` / `reminder_1h_sent` |
| `send-reconfirmation` | 6h before | email mentee with confirm/cancel deep links; set `reconfirmation_sent` |
| `auto-cancel-unconfirmed` | 3h before | if `reconfirmation_sent && reconfirmation_confirmed IS NULL` → `status='cancelled'` |
| `send-review-reminders` | post-session | email mentee asking for review |
| `send-mentorship-reminder` | generic | legacy |
| `send-onboarding-nudge` | post-signup | onboarding email |

### 5.6 Penalty escalation

Trigger `update_mentee_penalties()` on `mentee_attendance` insert with status `no_show_mentorado` and `mentee_avisou=false`:
- Increment `total_no_shows`.
- Map to `aviso_1` / `bloqueado_7d` / `bloqueado_30d` / `banido` per count.
- Set `blocked_until` accordingly.
- Block enforced on booking attempt (RLS/check on insert).

### 5.7 Achievement unlock

No automatic unlock logic in DB beyond `sessions_completed_count` trigger. Front-end + admin scripts presumably calculate. Worth rewriting in Rails as a single `Achievements::Unlocker` service triggered after each session/content interaction.

---

## 6. External integrations

### 6.1 Google Calendar (OAuth + sync)

- **Functions:** `supabase/functions/google-calendar-auth/`, `supabase/functions/google-calendar-sync/`.
- **Flow:**
  1. Mentor clicks Connect → `google-calendar-auth?action=get-auth-url` returns Google authorize URL with scopes `calendar.events`, `userinfo.email`.
  2. Browser redirected back → `GoogleCalendarCallbackHandler` posts code → `google-calendar-auth?action=exchange-code` swaps for tokens → row inserted in `google_calendar_tokens`.
  3. On session insert/update, `google-calendar-sync` creates a Google Calendar event with `conferenceData.createRequest` → returns Meet URL → stored in `mentor_sessions.meeting_link`.
- **Token refresh:** refresh when `expires_at < now() - 5min`.

### 6.2 Email (Resend)

`RESEND_API_KEY` env var. All edge functions that email use Resend HTTP API. HTML templates with brand colors `#f97316` (primary), `#1e3a5f` (secondary).

### 6.3 Realtime

In-app notifications via Supabase Realtime channel listening on `public.notifications`. `NotificationBell` component subscribes.

### 6.4 No payments

No Stripe / PayPal / Pagar.me. Project monetization is volunteer-driven.

---

## 7. Frontend architecture

### 7.1 Routing

`src/App.tsx`. React Router 6 declarative. ~25 routes. Easy to migrate to Next.js app router or keep as-is.

### 7.2 UI

- shadcn/ui components everywhere (Dialog, Button, Calendar, Sheet, Toast/Sonner, Form, etc.).
- Framer Motion for transitions.
- Tailwind + custom design tokens in `tailwind.config.ts` (colors via CSS vars: `--primary`, `--secondary`, `--destructive`, `--muted`, `--accent`, `--popover`, `--card`, `--sidebar`).
- Font: Plus Jakarta Sans.

### 7.3 State

- TanStack Query for server state.
- React Context for auth.
- Local `useState`. No Redux/Zustand.

### 7.4 Reusable components (high value)

Mentor-side: `MentorPanel`, `MentorAvailabilityEditor`, `MentorAdvanceNoticeEditor`, `MentorBlockedPeriodsManager`, `MentorTagsEditor`, `MentorSessionConfirmation`, `MentorMenteeNotes`, `MentorPublicFeedbacks`, `MentorRatingDisplay`, `MentorMatchBadge`, `MentorShareButton`, `MentorFeaturedAchievementsEditor`, `MentorAttendanceReport`, `MentorProgressMilestones`.

Mentee-side: `BookingCalendar`, `MenteeSessions`, `MenteeInterestsEditor`, `SessionReviewModal`, `SessionManagement`, `RescheduleWithAvailability`, `PostMentorshipFeedback`, `MenteeAttendanceBadge`.

Platform: `NotificationBell`, `OnboardingTour`, `OnboardingQuiz`, `ProfileEditModal`, `ProfileCompletionBanner`, `DeleteAccountModal`, `ChangePasswordModal`, `NpsModal`, `TagSelector`, `VolunteerPanel`, `GoogleCalendarSettings`, `GoogleCalendarCallbackHandler`, `MentorGoogleCalendarRequiredBanner`, `PlatformGuide`, `WhatsAppTemplates`, `BugReportButton`, `ContentLibrary`, `ContentSubmissionModal`, `TrailsDashboardCard`.

### 7.5 Tightly coupled to Supabase

- `src/integrations/supabase/client.ts` (client init).
- Direct `.from('table').select().eq()` calls scattered across components.
- Real-time `.on('*')` listeners.
- RLS-driven authorization (no front-end checks beyond UI conditional rendering).

Migration: replace with thin `src/integrations/api/*` SDK that calls Rails REST. Replace realtime with polling first (`refetchInterval`) and Action Cable later.

---

## 8. Lovable / Vercel / Supabase artifacts to remove

| Artifact | Action |
|---|---|
| `.lovable/` directory | delete |
| `.idea/` (JetBrains) | delete |
| `vercel.json` | delete |
| Multiple lockfiles (`bun.lock`, `bun.lockb`, `package-lock.json`) | pick one (`pnpm-lock.yaml`) |
| `@lovable.dev/cloud-auth-js` dependency | replace with bespoke auth client to Rails |
| `@supabase/supabase-js` dependency | remove after API SDK replaces all reads/writes |
| `lovable-tagger` (devDep) | remove |
| `supabase/` directory | keep migrations as **read-only reference**; do not run them in Rails — port the schema via Rails migrations |
| Supabase `RESEND_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `JWT_SECRET` env vars | move to Rails credentials.yml.enc |

---

## 9. Counts (for sizing the migration)

| Category | Count |
|---|---|
| Tables | 28 (excluding `auth.*`) |
| Enums | 13 explicit + 2 inline CHECK |
| Triggers | 10+ |
| RPC functions | 20+ |
| Edge functions | 8 |
| Pages (frontend routes) | ~25 |
| Components | ~70 |
| Migration files | 30 |

---

## 10. Open questions to resolve before coding

1. **Mentor email PK vs FK.** `mentors.email` has no FK to `auth.users`. Migrating to Rails: should `Mentor` `belongs_to :user` (nullable, optional)? Yes, recommended.
2. **Penalty system in B2B.** Banning employees from booking is HR-territory. Soften to "warn HR admin after N no-shows", no auto-bans.
3. **Volunteer flow.** Drop entirely? Or repurpose as "internal SME submission" for content?
4. **Trilhas / Dev plans.** Useful for B2B L&D. Keep but ship as v1.1, not v1.0.
5. **Achievements.** Useful for engagement. Defer to v1.1.
6. **NPS.** Replace with admin-triggered surveys per quarter.
7. **WhatsApp templates component.** Repurpose for email templates? Or drop.
8. **LGPD self-deletion.** B2B buyer probably wants HR-controlled deletion + retention policy. Move to admin panel only.

These get answered in [`02-ALIGNMENT.md`](02-ALIGNMENT.md).
