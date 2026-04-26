# 05 — Data migration strategy

> Move existing Movê data from Supabase Postgres into the new Rails + Bullet Train Postgres. Optional in v1 (the B2B pivot may not need legacy data); included for completeness in case any pilot tenant carries users over.

---

## 1. Strategy options

| Option | When to choose | Effort |
|---|---|---|
| **Skip migration** | Greenfield B2B sale; no legacy users to bring | 0 days |
| **Per-tenant CSV import** | Customer hands us a CSV of mentors/employees | 1 day |
| **Live ETL from Supabase** | Friend wants to migrate the existing volunteer Movê community to a new "Movê Open" tenant on the new infra | 3–5 days |
| **Database dump + transform** | Big bang cutover, downtime acceptable | 5–7 days |

**Default recommendation:** start with **CSV import** for early B2B logos and skip the legacy ETL entirely. If the friend wants to keep the community alive on the new stack, schedule the **live ETL** later (Phase C in `04-INFRA-MIGRATION.md`).

---

## 2. CSV import (B2B onboarding)

For each new corporate customer, HR sends two CSVs:

### 2.1 `mentors.csv`

```csv
email,name,department,headline,years_experience,linkedin_url,photo_url,specialties
jane@acme.com,Jane Doe,Product,Senior PM,8,https://linkedin.com/in/jane,,Product;Career;Leadership
```

### 2.2 `mentees.csv`

```csv
email,name,department,headline,interests
bob@acme.com,Bob Smith,Engineering,Junior Engineer,Career;Technology
```

### 2.3 Rake task

```ruby
# api/lib/tasks/movê.rake
namespace :movê do
  desc "Import a corporate tenant's mentors/mentees from CSV"
  task :import_csv, [:team_slug, :mentors_path, :mentees_path] => :environment do |_, args|
    team = Team.find_by!(slug: args[:team_slug])
    Mentors::CsvImporter.new(team, Pathname(args[:mentors_path])).call
    Mentees::CsvImporter.new(team, Pathname(args[:mentees_path])).call
  end
end
```

The importer creates `User`, `Membership` (role: `mentor` or `mentee`), `Profile`, and `Mentor` rows; tags resolved by `slug`/`name` against the global `Tag` table (creating any missing). Sends invitation emails (Devise passwordless or Bullet Train invitation flow). Idempotent on `email`.

### 2.4 Frontend admin UI for CSV upload

Wire `AdminCsvUploader.tsx` (new component) to `POST /api/v1/admin/imports` accepting multipart upload. Background job processes async; status polls via `/api/v1/admin/imports/:id`.

---

## 3. Live ETL from Supabase (optional, ambitious)

If the friend decides to migrate the existing Movê community to a "Movê Open" tenant on the new stack, here is the plan.

### 3.1 Approach

Run a Rake task against a Supabase service-role API key. Read each table over the Supabase REST API in pages of 500. Insert into Rails Postgres via Active Record, with `team_id` set to the destination Open tenant.

```ruby
# api/lib/tasks/movê.rake
namespace :movê do
  desc "Migrate Movê Open community from Supabase"
  task migrate_community: :environment do
    team = Team.find_by!(slug: "open")
    Movê::Migrator.new(
      team: team,
      supabase_url: ENV.fetch("SUPABASE_URL"),
      service_key: ENV.fetch("SUPABASE_SERVICE_KEY"),
    ).call
  end
end
```

`Movê::Migrator` runs each step idempotently:

1. `migrate_users` — `auth.users` → `User` + `Profile`. Hash a placeholder password; force password reset on first login. `external_id` column on `Profile` keeps the original Supabase UUID so subsequent ETL passes are idempotent.
2. `migrate_mentors` — `mentors` → `Mentor`. Resolves `email` → `user_id` via `User.find_by(email:)`.
3. `migrate_tags` — `tags` already global (no team scope), upsert by `slug`.
4. `migrate_mentor_tags` and `migrate_mentee_interests` — M:M joins.
5. `migrate_mentor_sessions` — `mentor_sessions` → `MentorSession`. Map enums; preserve `external_id`.
6. `migrate_reviews` — `session_reviews` → `Review`.
7. `migrate_blocked_periods` — `mentor_blocked_periods` → `AvailabilityException`.
8. `migrate_availabilities` — flatten the JSONB on `mentors.availability` into `availabilities` rows.
9. `migrate_attendance` — `mentee_attendance` → `Attendance`. Skip `mentee_penalties` entirely (we replaced this with admin warnings).
10. `migrate_google_tokens` — `google_calendar_tokens` → `GoogleCalendarToken`. Re-encrypt with new key.
11. `migrate_notes` — `mentor_mentee_notes` → `MentorNote`.

### 3.2 Things explicitly **not** migrated

| Source table | Reason |
|---|---|
| `mentee_penalties` | Replaced with soft warnings; reset on migration |
| `volunteer_applications`, `volunteer_submissions` | Volunteer flow dropped |
| `onboarding_questions`, `onboarding_quiz_attempts` | Onboarding quiz dropped |
| `nps_respostas` | NPS module dropped (admin-triggered surveys instead) |
| `platform_videos` | Replaced with `Team.settings.theme.hero_video_url` |
| `referrals` | Drop |

### 3.3 Deferred tables (re-migrate later)

If/when v1.1 ships the L&D module, add migration steps for:

- `trilhas`, `passos_trilha`, `progresso_trilha`, `progresso_passo`
- `planos_desenvolvimento`, `plano_itens`
- `mentoria_feedbacks`
- `achievements`, `user_achievements`
- `content_items`, `content_access_log`, `content_saves`
- `impact_history`

These live on the same Movê Supabase project, so re-running the ETL with the v1.1 codebase migrates them.

### 3.4 Rollout

1. Run ETL against staging Rails first. Validate every count.
2. Manual spot-check on 10 random mentors and mentees.
3. Send each migrated user a one-time login email asking them to set a password (Devise reset flow). Frame as "we're upgrading the platform — please reset your password."
4. Open new platform; old Supabase project goes read-only for 7 days.
5. Sunset Supabase project after 30 days.

### 3.5 Risks

| Risk | Mitigation |
|---|---|
| Mentor `email` collision when same email exists on multiple Movê accounts | Pre-flight script lists collisions; Leonardo + friend reconcile manually |
| Time-zone drift in `availability` JSONB (assumes São Paulo) | Hard-code TZ during migration; mentors fix in UI later |
| Google Calendar tokens re-encryption | Re-encrypt with new master key; users may need to reconnect if refresh fails |
| RLS off during migration | ETL runs as superuser; switches to RLS-enforced session for verification |

---

## 4. Idempotency & re-runs

Every migration step must be safe to re-run:

- `User.find_or_initialize_by(email:)` instead of `create!`
- `Mentor.find_or_initialize_by(user:, team:)`
- `MentorSession.find_or_initialize_by(external_id:)` (carry Supabase UUID)
- Side-effect-free dry-run mode: `DRY_RUN=1 bundle exec rake movê:migrate_community` logs counts without writing

---

## 5. Verification queries

After each migration run:

```sql
-- count parity
SELECT 'mentors' AS t, COUNT(*) FROM mentors WHERE team_id = $TEAM
UNION ALL
SELECT 'sessions', COUNT(*) FROM mentor_sessions WHERE team_id = $TEAM
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews WHERE team_id = $TEAM
;

-- spot any orphans
SELECT s.id FROM mentor_sessions s
LEFT JOIN mentors m ON m.id = s.mentor_id
WHERE m.id IS NULL;

-- validate no overlaps survived
SELECT mentor_id, COUNT(*) FROM mentor_sessions
GROUP BY mentor_id, tstzrange(starts_at, ends_at, '[)')
HAVING COUNT(*) > 1;
```

Add these as RSpec system specs on staging dataset.

---

## 6. LGPD / GDPR considerations

- Communicate migration to users in advance (email + banner in old app).
- Provide opt-out: any user can request deletion before migration cutover.
- Maintain `lgpd_consent_at` from Movê's `profiles` row; treat as still valid unless purpose changed materially.
- Keep a 90-day archive of pre-migration Supabase dump in encrypted R2 in case of dispute.
