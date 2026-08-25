# Code Standards

Implementation rules and conventions for the entire project — client (React/TypeScript) and server (Django). The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

- **Think before implementing** — understand the domain rule being encoded (weight totals, DS-conflict prevention, deadline windows, archive locking) before writing a line.
- **Read context files first** — never assume; verify against `architecture.md` and `project-overview.md`.
- **Scope is sacred** — build only what the current feature in `build-plan.md` requires.
- **Domain rules are never optional** — activity weights summing to 100%, DS not teaching the same activity to both land groups, docx/pdf-only uploads, deadline-gated submission/marking, archived-course read-only enforcement: these are validated server-side always, never trusted from the client alone.
- **Clean over clever** — simple readable code a junior developer can follow.
- **One thing at a time** — complete one feature fully before the next.
- **Failures are expected** — wrap external calls (EgoSms, Gmail SMTP, Cloudinary) in try/except, log failures, never let one channel's failure crash the whole announcement send.

---

## Frontend (client/)

### TypeScript

- Strict mode enabled — no exceptions.
- Never use `any` — use `unknown` and narrow.
- Never use type assertions (`as SomeType`) unless unavoidable, and comment why.
- All function parameters and return types explicitly typed.
- Use `type` for object shapes/unions; `interface` only for extendable component props.
- Use `const` by default; `let` only when reassignment is necessary.

### File and Folder Naming

- Folders: kebab-case — `activity-assignments`, `land-groups`.
- Component files: PascalCase — `MarksTable.tsx`, `WeightEditor.tsx`.
- Slice/utility files: camelCase — `activitiesSlice.ts`, `apiClient.ts`.
- One component per file — never export multiple components from one file.
- Index/barrel files only in `components/common/` — never elsewhere.

### Component Structure

```typescript
"use client"; // n/a for Vite SPA — omit; included only as a structural placeholder if a file needs a directive

// 1. External imports
import { useState } from "react";
import { Button, Input } from "@mui/joy";

// 2. Internal imports
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { WeightTotalBadge } from "@/components/common/WeightTotalBadge";

// 3. Type definitions
type Props = {
  courseId: string;
};

// 4. Component
export function ActivityWeightEditor({ courseId }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports.
- Props type defined directly above the component, not in a shared file unless truly shared.
- No inline styles — Joy `sx` prop or Tailwind classes only, using tokens from `theme/tokens.ts`.

### Redux (Redux Toolkit)

- One slice per feature domain (`authSlice`, `coursesSlice`, `activitiesSlice`, `assessmentsSlice`, `announcementsSlice`).
- Async data fetching via `createAsyncThunk`, never raw `useEffect` + `axios` calls scattered through components.
- Selectors live next to the slice (`selectActiveCourse`, `selectOfficerProgress`) — components never reach into `state.foo.bar` directly.
- Every thunk handles `pending`/`fulfilled`/`rejected` explicitly in `extraReducers` — no silently ignored rejections.
- **Every list-fetching thunk uses `fetchAllPages()` (`lib/apiClient.ts`), never a bare `apiClient.get()` read of page 1.** Every list endpoint is paginated server-side (`PAGE_SIZE=20`, `common/pagination.py`); reading `data.results` directly silently drops everything past row 20. This bug existed in all 12 list-fetching slices simultaneously until 2026-08-26 — invisible at small test scale (≤20 rows), but a real, silent data-loss bug the moment a real course roster/activity list/submission table exceeds one page. See `progress-tracker.md`'s 2026-08-26 entry.

```typescript
// features/activities/activitiesSlice.ts
export const fetchActivities = createAsyncThunk("activities/fetchAll", async (courseId: string) => {
  const results = await fetchAllPages<ApiActivity>(endpoints.activities(courseId));
  return { courseId, items: results.map(mapApiActivity) };
});
```

### API Client

- All requests go through `lib/apiClient.ts` — a single axios instance with the JWT auth header interceptor and 401-refresh-retry logic. Never instantiate axios ad hoc in a component or slice.
- Endpoint paths are constants in `lib/endpoints.ts` — never inline string URLs in slices.

### Numeric Display

- Never render a summed/derived percentage or float straight from `state` — round it first (`.toFixed(2)` for display text, `Math.round(value * 100) / 100` before any `===`/threshold comparison). Plain JS addition of realistic decimal values (e.g. `3.33` repeated) drifts to things like `99.99999999999996` well before it would ever equal `100` by strict comparison — invisible with small round-number test data, real with anything realistic. See `WeightTotalBadge`/`ActivityFormModal` and `progress-tracker.md`'s 2026-08-26 entry.

### Error Handling (frontend)

- Never show a raw error message to the user — map to a human-readable `react-toastify` toast.
- Console errors always include a context prefix: `[activitiesSlice/fetchActivities]`.
- Never leave an empty `catch` block.

### Comments

- No comments explaining *what* the code does — code must be self-explanatory.
- Comments only for *why* — e.g. why a deadline check happens client-side too (UX) in addition to server-side (source of truth).
- Never leave TODO comments in committed code.

### Dependencies

Approved frontend dependencies:

- `react`, `react-dom`, `react-router-dom` — app + routing
- `@reduxjs/toolkit`, `react-redux` — state
- `@mui/joy`, `@emotion/react`, `@emotion/styled` — component library (Joy's peer deps)
- `tailwindcss` — utility styling
- `axios` — HTTP
- `react-toastify` — toasts
- `framer-motion` — animation
- `lucide-react` — icons
- `recharts` — dashboard charts (bar / line / radial progress ring)

Never install a new package without checking: does Joy UI already have this component? Does the browser/`Intl` API already provide this? Is there a simpler native solution? Update this list before adding anything new.

---

## Backend (server/)

### Django App Structure

- One Django app per bounded domain (`accounts`, `courses`, `personnel`, `activities`, `scheduling`, `assessments`, `announcements`), plus `common/` for shared permissions/pagination/validators.
- Each app: `models.py`, `serializers.py`, `views.py`, `permissions.py` (if app-specific), `urls.py`, `services/` (for non-trivial business logic like grading calculations).
- Business logic (grade calculation, weight validation, DS-conflict checks, announcement fan-out) lives in `services/`, not in views or serializers — views/serializers stay thin (validate input, call service, shape output).

### Views

- Class-based `ViewSet`s via DRF, registered through a router.
- Every ViewSet declares explicit `permission_classes` — never rely on a global default alone for role-sensitive endpoints.
- Every write endpoint on course-scoped data includes the shared `IsNotArchived` permission.

```python
# server/activities/views.py
class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated, IsAdmin, IsNotArchived]

    def get_queryset(self):
        return Activity.objects.filter(course_id=self.kwargs["course_id"])
```

### Serializers

- All cross-field validation (weight totals, DS same-activity-both-groups conflict, file extension/MIME, deadline windows) lives in serializer `validate()` methods — never only in the frontend.
- Serializers never expose more fields than the requesting role should see (e.g. an Officer's submission serializer never includes other officers' marks).

```python
# server/activities/serializers.py
class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ["id", "course", "name", "weight_percent", "is_mandatory"]

    def validate(self, attrs):
        total = Activity.objects.filter(course=attrs["course"]).exclude(
            pk=self.instance.pk if self.instance else None
        ).aggregate(Sum("weight_percent"))["weight_percent__sum"] or 0
        if total + attrs["weight_percent"] > 100:
            raise serializers.ValidationError("Activity weights cannot exceed 100% for this course.")
        return attrs
```

### Plagiarism Service

- Lives at `assessments/services/plagiarism.py`. **DS-triggered only** — never runs automatically when a Submission is created; called exclusively from `SubmissionViewSet.check_plagiarism` (`POST .../submissions/{id}/check-plagiarism/`, `IsDirectingStaff`-only permission). Always safe to re-run: fully overwrites the previous `PlagiarismReport`.
- Text extraction is wrapped in try/except per file type; any failure sets `PlagiarismReport.status = "failed"` and stops there. Extracted text is cached on `Submission.extracted_text` after first success (`get_or_extract_text`) — never re-parsed from disk on a later check, whether as the submission being checked or as another officer's comparison source. `warm_cohort_cache` eagerly extracts the whole assessment's cohort on whichever check happens to run first for that assessment (a one-time cost per assessment, not per check).
- Comparison happens at **sentence granularity**, not whole-document — `split_sentences()` (simple regex splitter, no NLP dependency) breaks the submission into sentences, and each one independently gets a band (`plagiarised` ≥75% similarity, `paraphrased` 40–75%, `original` below — never flagged if under `MIN_SENTENCE_WORDS`, to avoid noise on short generic sentences) plus a source.
- Two source pools, always both attempted: **internal** — every other `Submission` for the same `AssessmentSchedule` (never the whole course, never the officer's own prior submissions to a different activity), TF-IDF/cosine same as before, just sentence-to-sentence; **external** — the top `EXTERNAL_SENTENCES_PER_CHECK` most distinctive sentences searched via Google Programmable Search (`assessments/services/web_search.py`), compared against the returned **snippet only** (never fetches the actual external page). External search is quota-gated (`ExternalSearchQuota`, `PLAGIARISM_EXTERNAL_DAILY_QUOTA`) and silently skipped — not an error — when unconfigured or the daily cap is spent; `PlagiarismReport.external_checked` records whether it actually ran this check.
- `PlagiarismReport.score` (word-weighted % flagged) and `.highlights` (the full per-sentence array: text/band/similarity/source) are excluded from any serializer reachable by an Officer or **Admin** request — enforced with dedicated `OfficerSubmissionSerializer`/`AdminSubmissionSerializer` (neither has plagiarism fields) versus `DsSubmissionSerializer` (the only one that does), never a single serializer with conditional field visibility that could be misconfigured. Admin has no plagiarism visibility at all, by explicit product decision — this isn't just a frontend hide, the fields are absent from Admin's API responses.

### Error Handling (backend)

- Every view method that can fail wraps external-service calls (EgoSms, Gmail SMTP, Cloudinary) in `try/except`, logs via Django's `logging`, and never lets one failure raise an unhandled 500 that blocks unrelated work (e.g. one failed SMS never blocks the email send or the in-app notification).
- API errors return DRF's standard error shape (`{"detail": "..."}` or field-keyed validation errors) — never a raw Python traceback to the client. `DEBUG=False` in production always.

### Environment Variables

All environment variables defined in `.env.development` or `.env.production`, loaded via `python-dotenv` based on `DJANGO_ENV`. Never hardcode a key, URL, or secret anywhere in the codebase.

| Variable | Used In |
| --- | --- |
| `DJANGO_ENV` | `manage.py`, `config/settings/__init__.py` |
| `SECRET_KEY` | `config/settings/base.py` |
| `DATABASE_URL` (prod only) | `config/settings/production.py` |
| `CLOUDINARY_URL` (prod only) | `config/settings/production.py` |
| `REDIS_URL` (prod only) | `config/settings/production.py` |
| `CORS_ALLOWED_ORIGINS` | `config/settings/base.py` |
| `EGOSMS_USERNAME`, `EGOSMS_PASSWORD`, `EGOSMS_SENDER_ID` | `announcements/services/sms.py` |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (Gmail SMTP) | `config/settings/base.py`, `announcements/services/email.py` |

`NEXT_PUBLIC_`-style browser-exposed prefixes don't apply here — the frontend only ever talks to the backend's public API, never reads backend secrets directly. Frontend-only config (API base URL) lives in Vite's `import.meta.env.VITE_API_BASE_URL`, set via `client/.env.development` / `client/.env.production`.

### Dependencies (backend)

Approved backend dependencies:

- `django`, `djangorestframework` — framework + API
- `djangorestframework-simplejwt` — JWT auth
- `django-cors-headers` — CORS
- `drf-nested-routers` — auto-generated URLs for course-scoped nested resources (`courses/{course_pk}/officers/` etc.), matching `ModelViewSet`'s router pattern instead of hand-written nested `path()` entries
- `python-dotenv` — env loading
- `cloudinary`, `django-cloudinary-storage` — production media storage
- `psycopg2-binary` — PostgreSQL driver (production)
- `django-redis` — production cache backend
- `requests` — EgoSms HTTP integration
- `scikit-learn` — TF-IDF + cosine similarity for plagiarism scoring
- `python-docx` — text extraction from `.docx` submissions
- `pdfplumber` — text extraction from `.pdf` submissions

Never install a new package without updating this list first.

---

## Grading Constants

Grade bands and degree-class thresholds are defined once, server-side, and never hardcoded elsewhere:

```python
# server/assessments/services/grading.py
ACTIVITY_GRADE_BANDS = [
    (80, 100, "Distinction"),
    (70, 79.99, "Merit"),
    (50, 69.99, "Pass"),
    (0, 49.99, "Fail"),
]

DEGREE_CLASS_BANDS = [
    (80, 100, "Pass with Distinction"),
    (65, 79.99, "Pass with Merit"),
    (50, 64.99, "Pass"),
    (0, 49.99, "Fail / Not Completed"),
]
```

Import and use these constants everywhere grade/degree-class logic is needed — never re-declare threshold numbers inline in a view, serializer, or frontend component. The frontend mirrors these bands purely for display (e.g. coloring a projected grade before the backend confirms it) via `lib/utils.ts`'s `getGradeBand()` — the backend's computed value is always the source of truth once available.
