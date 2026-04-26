# 06 — Frontend strategy: keep the React SPA, swap the backend

> Decision: **keep the existing Vite + React + shadcn frontend, replace Supabase calls with a thin Rails API SDK, and add white-label theming.** This saves an estimated 3–5 weeks vs. rewriting in Next.js.

---

## 1. Why keep it

- Stack is current (React 18, Vite 5, TypeScript, shadcn/ui, Tailwind). Nothing legacy.
- ~70 components already cover the feature surface. Visual quality is good.
- Routing (React Router 6) is simple to migrate or even keep.
- Testing infra (Vitest + Playwright) is solid.
- Buyer perception: switching to Next.js doesn't add user-visible value. Speed-to-market does.

If, after a v1 launch, we want SSR for SEO of public mentor profiles or marketing pages, we can introduce a thin Next.js layer alongside the SPA later. Not a v1 problem.

---

## 2. Why swap the backend

- Supabase RLS does the auth heavy-lifting today, but the codebase calls Supabase directly from components (`supabase.from('mentors').select()...`). This is **not** a clean architecture for a B2B product:
  - No central place to add per-tenant scoping.
  - No central place for billing gates ("trial expired → 402").
  - No way to add domain logic that spans tables (the booking validator, calendar sync, etc.).
  - Every component imports the Supabase client → coupled lock-in.
- Moving to a Rails REST API behind a thin SDK keeps components pure, tests easier, and unlocks the Bullet Train multi-tenant + RLS + RBAC pattern.

---

## 3. The new SDK shape

Create `frontend/src/integrations/api/`:

```
api/
├── client.ts                  fetch wrapper, JWT + tenant slug, 401 retry
├── tenant.ts                  GET /api/v1/public/tenant?domain=
├── auth.ts                    login, signup, refresh, logout, google OAuth
├── mentors.ts                 list, show, update (mentor self), approve (admin)
├── sessions.ts                list, create, cancel, reschedule, confirm, complete
├── availability.ts            GET /api/v1/mentors/:id/availability?from=&to=
├── tags.ts                    list
├── interests.ts               list, add, remove (mentee)
├── reviews.ts                 create, list-for-mentor
├── notifications.ts           list, mark-read
├── google_calendar.ts         authorize, status, disconnect
├── admin.ts                   alerts, dashboard, settings, audit
└── billing.ts                 portal-url
```

Every function returns a typed Promise. TanStack Query hooks live alongside (`hooks/useMentors.ts`, etc.) and call into `api/`.

### 3.1 `client.ts` skeleton

```ts
import { z } from "zod";

interface Options { method?: string; body?: unknown; auth?: boolean; }

const ACCESS_KEY = "mové.access_token";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) sessionStorage.setItem(ACCESS_KEY, token);
  else sessionStorage.removeItem(ACCESS_KEY);
}

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const tenantSlug = window.__TENANT_SLUG__; // set by tenant.ts before app renders

export async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${baseUrl}${path}`, {
    method: opts.method ?? "GET",
    headers,
    credentials: "include", // refresh token cookie
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${baseUrl}${path}`, { method: opts.method ?? "GET", headers, credentials: "include", body: opts.body ? JSON.stringify(opts.body) : undefined });
    }
  }

  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}
```

Refresh-token flow lives in `auth.ts`. Refresh token is stored in an httpOnly cookie set by Rails; access token in `sessionStorage`.

---

## 4. Tenant boot

Before React mounts, fetch tenant metadata:

```ts
// frontend/src/main.tsx
async function bootTenant() {
  const domain = window.location.hostname;
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/public/tenant?domain=${domain}`);
  if (res.ok) {
    const tenant = await res.json();
    window.__TENANT_SLUG__ = tenant.slug;
    document.title = tenant.brand_name;
    setIcon(tenant.logo_url);
    document.documentElement.style.setProperty("--primary", tenant.primary_color);
    document.documentElement.style.setProperty("--secondary", tenant.secondary_color);
  } else {
    // No tenant configured → show the marketing home
    window.__TENANT_SLUG__ = null;
  }
}

bootTenant().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
});
```

Tenant response shape:
```json
{
  "slug": "acme",
  "brand_name": "Acme Mentor",
  "logo_url": "https://r2.move-app.com/tenant-1/logo.png",
  "primary_color": "#0040A0",
  "secondary_color": "#FF8800",
  "hero_video_url": "https://youtu.be/...",
  "support_email": "people-ops@acme.com"
}
```

---

## 5. Tailwind theme via CSS vars

Already mostly the case. Confirm `tailwind.config.ts` reads CSS variables:

```ts
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
    },
  },
},
```

Default values in `index.css`:

```css
:root {
  --primary: 222 47% 11%;
  --secondary: 210 40% 96%;
  /* shadcn defaults */
}
```

At runtime, tenant boot overrides these via inline style. No rebuild per tenant.

For more advanced branding (custom fonts), serve a per-tenant `theme.css` from R2 and inject `<link>` at runtime.

---

## 6. Component-by-component migration

Group the rewrite into batches. Each batch is one PR.

### Batch 1: auth + bootstrap (Epic 3.1–3.4)

- `App.tsx` (router stays)
- `main.tsx` (tenant boot)
- `contexts/AuthContext.tsx`
- `pages/Auth.tsx`, `Signup.tsx`
- `hooks/useAuth.ts`

### Batch 2: dashboard + profile

- `pages/Dashboard.tsx`
- `components/ProfileEditModal.tsx`, `ProfileCompletionBanner.tsx`
- `components/DeleteAccountModal.tsx`, `ChangePasswordModal.tsx`

### Batch 3: mentor discovery + booking

- `pages/Mentors.tsx`
- `components/MentorCard.tsx`, `MentorDetailModal.tsx`
- `components/BookingCalendar.tsx` — replace local slot computation with `availability.ts` API call
- `components/MentorMatchBadge.tsx`, `MentorRatingDisplay.tsx`, `MentorShareButton.tsx`

### Batch 4: mentee sessions + reviews

- `pages/MinhasMentorias.tsx`
- `components/MenteeSessions.tsx`, `SessionManagement.tsx`, `RescheduleWithAvailability.tsx`
- `components/SessionReviewModal.tsx`, `PostMentorshipFeedback.tsx`
- `pages/Reconfirmar.tsx` — wired to public `/api/v1/public/sessions/:token/confirm`

### Batch 5: mentor agenda

- `pages/MentorAgenda.tsx`
- `components/MentorPanel.tsx`, `MentorAvailabilityEditor.tsx`, `MentorAdvanceNoticeEditor.tsx`, `MentorBlockedPeriodsManager.tsx`, `MentorTagsEditor.tsx`, `MentorSessionConfirmation.tsx`, `MentorMenteeNotes.tsx`

### Batch 6: tags & interests

- `pages/Interests.tsx`
- `components/TagSelector.tsx`, `MenteeInterestsEditor.tsx`
- `hooks/useTags.ts`, `useMenteeInterests.ts`

### Batch 7: Google Calendar

- `components/GoogleCalendarSettings.tsx`, `GoogleCalendarCallbackHandler.tsx`, `MentorGoogleCalendarRequiredBanner.tsx`
- `hooks/useGoogleCalendarConnectionStatus.ts`

### Batch 8: notifications

- `components/NotificationBell.tsx` — replace real-time with `refetchInterval: 30s`

### Batch 9: admin

- `pages/Admin.tsx`
- `components/MentorAttendanceReport.tsx`

### Drop / out-of-scope batches

- `pages/Volunteer.tsx`, `VolunteerOnboarding.tsx` and `VolunteerPanel`, `ContentSubmissionModal` — delete or stash in `frontend/src/_archive/`
- `pages/Nps.tsx`, `OnboardingQuiz.tsx` — delete or stash
- `pages/Trails.tsx`, `TrailDetail.tsx`, `DevPlan.tsx`, `Achievements.tsx`, `Contents.tsx`, `SavedContents.tsx` — leave-as-is but wire to a "coming soon" placeholder if reachable from nav; otherwise hide nav links

---

## 7. Real-time vs. polling

Movê uses Supabase Realtime for `notifications`. For v1, use TanStack Query polling:

```ts
useQuery({
  queryKey: ["notifications"],
  queryFn: () => api.notifications.list(),
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
});
```

For v1.1 add Action Cable. Trade-off: real-time is nicer UX but pollings is one-tenth the engineering effort and acceptable for in-app notifications.

---

## 8. Testing strategy

- Unit (Vitest): every API SDK module (`api/mentors.ts` etc.) gets MSW-mocked tests.
- Integration: smoke tests on each TanStack Query hook against MSW.
- E2E (Playwright): full booking flow against a seeded staging Rails. Use `/api/v1/test/setup` (only available in `RAILS_ENV=test`) to seed deterministic data.
- Visual: leave Storybook out of v1; reconsider when component count grows.

---

## 9. Cleanup checklist before shipping v1

- [ ] `grep -r "supabase" frontend/src/` returns zero matches
- [ ] `grep -r "@lovable" frontend/src/` returns zero matches
- [ ] `package.json` no longer lists `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `lovable-tagger`
- [ ] Single lockfile: `pnpm-lock.yaml`. Remove `bun.lock`, `bun.lockb`, `package-lock.json`
- [ ] `.lovable/`, `.idea/`, `vercel.json` deleted from repo root
- [ ] All `console.log` removed
- [ ] `playwright-fixture.ts` updated to seed Rails state
- [ ] `tailwind.config.ts` reads CSS vars for primary/secondary
- [ ] `index.html` `<title>` is dynamic via tenant boot
- [ ] Favicon dynamic per tenant
- [ ] Documentation in `frontend/README.md` reflects new stack

---

## 10. Migration risk register (frontend-specific)

| Risk | Mitigation |
|---|---|
| Components scattered with direct Supabase calls — easy to miss one | Replace `client.ts` with a stub that throws on every call; CI fails immediately if any unconverted code remains |
| TanStack Query cache stale after mutations | Standardize: every mutation calls `queryClient.invalidateQueries` for affected keys |
| Tenant slug not yet known when first request fires (race) | `bootTenant()` awaits before React mounts; AuthContext also re-checks |
| 401 storms after JWT expiry | Refresh on first 401 and only retry once; show toast and route to login on second failure |
| White-label CSS conflicts with shadcn defaults | Stick to the `--primary` / `--secondary` HSL scheme shadcn already uses; never hard-code colors in components |
| Mentor JSONB → relational availability migration during ETL | Front-end already represents availability as a relational shape internally — only the API contract changes |
