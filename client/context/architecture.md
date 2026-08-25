# Architecture

## Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Frontend framework | React 19 + Vite + TypeScript | SPA build tool and UI runtime |
| State management | Redux Toolkit + React-Redux | Global state — auth, course context, entity caches |
| Component library | MUI Joy UI (`@mui/joy`) | Buttons, inputs, cards, tables, modals, tabs |
| Utility styling | Tailwind CSS | Layout, spacing, one-off utility classes alongside Joy components |
| Routing | react-router-dom v6 | Route trees per role, protected routes |
| HTTP client | axios | API calls to the Django backend, with interceptors for JWT refresh |
| Toasts | react-toastify | Success/error/info feedback |
| Motion | framer-motion | Page transitions, list/card enter animations, modal transitions |
| Icons | lucide-react | All iconography |
| Backend framework | Django + Django REST Framework | REST API, business logic, validation |
| Auth | djangorestframework-simplejwt | Access/refresh JWT issued on army-number + password login |
| Media storage | Cloudinary (prod) / local `MEDIA_ROOT` (dev) | Submission files, profile photos, resources |
| Plagiarism detection | scikit-learn (TF-IDF + cosine similarity) + `python-docx` + `pdfplumber` | Sentence-level text extraction and cross-submission similarity scoring — DS-triggered, not automatic |
| External source checking | Google Programmable Search JSON API + `requests` | Web-source matching for plagiarism checks — snippet comparison only, never fetches the actual external page; free tier caps at 100 queries/day |
| CORS | django-cors-headers | Allow the Vite dev server / deployed frontend origin |
| Env config | python-dotenv | Loads `.env.development` or `.env.production` per environment |
| Database | SQLite (dev) / PostgreSQL (prod) | Relational store |
| Cache | Local in-memory cache (dev) / Redis (prod) | Computed progress/grade caching, rate limiting |
| SMS | EgoSms API | Announcement delivery — SMS channel |
| Email | Gmail SMTP | Announcement delivery — email channel |

---

## Repository Layout

```
/
├── AGENTS.md
├── client/                                  → React frontend (this app)
│   ├── context/
│   │   ├── project-overview.md
│   │   ├── architecture.md
│   │   ├── ui-tokens.md
│   │   ├── ui-rules.md
│   │   ├── ui-registry.md
│   │   ├── code-standards.md
│   │   ├── library-docs.md
│   │   ├── build-plan.md
│   │   └── progress-tracker.md
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.ts                     → Redux store setup
│   │   │   ├── hooks.ts                     → typed useAppDispatch / useAppSelector
│   │   │   └── router.tsx                   → Route tree, role-based route guards
│   │   ├── theme/
│   │   │   ├── tokens.ts                    → Single source of truth for colors/spacing/radii
│   │   │   ├── joyTheme.ts                  → extendTheme() built from tokens.ts
│   │   │   └── tailwind.preset.js           → Tailwind theme.extend built from tokens.ts
│   │   ├── features/
│   │   │   ├── auth/                        → login, change-password, session slice
│   │   │   ├── courses/                     → course list/detail, land groups
│   │   │   ├── personnel/                   → officers, directing staff registries
│   │   │   ├── activities/                  → activities, weight editor, DS assignments
│   │   │   ├── timetable/                   → lesson scheduling
│   │   │   ├── assessments/                 → assessment scheduling, submissions, marking
│   │   │   ├── announcements/               → composer, notification center
│   │   │   ├── reports/                     → progress/marks/completion reports
│   │   │   └── archive/                     → read-only archived course views
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx             → Sidebar + topbar shell, role-aware nav
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Topbar.tsx
│   │   │   ├── common/                      → shared presentational components
│   │   │   └── charts/                      → progress rings, bar/line charts
│   │   ├── lib/
│   │   │   ├── apiClient.ts                 → axios instance, JWT interceptor, refresh flow
│   │   │   ├── endpoints.ts                 → API path constants
│   │   │   └── utils.ts                    → shared helpers (dates, grade bands, file validation)
│   │   ├── types/
│   │   │   └── index.ts                     → Shared TypeScript types/interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
└── server/                                  → Django backend
    ├── config/
    │   ├── settings/
    │   │   ├── base.py                      → Shared settings
    │   │   ├── development.py               → SQLite, local storage, LocMem cache, DEBUG=True
    │   │   └── production.py                → Postgres, Cloudinary, Redis cache, DEBUG=False
    │   ├── urls.py
    │   └── wsgi.py / asgi.py
    ├── requirements/
    │   ├── base.txt
    │   ├── development.txt
    │   └── production.txt
    ├── .env.development
    ├── .env.production
    ├── accounts/                             → Custom User model, auth, password policy
    ├── courses/                              → Course, LandGroup
    ├── personnel/                            → OfficerProfile, DirectingStaffProfile
    ├── activities/                           → Activity, ActivityAssignment
    ├── scheduling/                           → TimetableEntry, AssessmentSchedule
    ├── assessments/                          → Submission, Mark, PlagiarismReport
    ├── announcements/                        → Announcement, Notification, delivery log
    ├── common/                               → Shared permissions, pagination, validators
    └── manage.py
```

---

## System Boundaries

| Folder | Owns |
| --- | --- |
| `client/src/features/*` | Feature-scoped Redux slices, RTK Query-style API hooks, and feature pages. No cross-feature imports except through `types/` and `lib/`. |
| `client/src/components/` | Presentational UI only. No API calls, no Redux access. |
| `client/src/lib/` | axios instance, endpoint constants, pure utility functions. |
| `client/src/theme/` | The only place raw color/spacing values are allowed to exist. |
| `server/accounts/` | Custom User model, JWT login serializer, password policy, password reset. |
| `server/courses/`, `personnel/`, `activities/`, `scheduling/`, `assessments/`, `announcements/` | One Django app per bounded domain. Models, serializers, views, permissions for that domain only. |
| `server/common/` | Shared DRF permission classes (`IsAdmin`, `IsDirectingStaff`, `IsOfficer`, `IsNotArchived`), pagination classes, file validators. |

---

## Data Flow

### Standard CRUD (e.g. Admin creates an Activity)

```
Component (features/activities)
        ↓ dispatch thunk / RTK Query mutation
Redux slice (activities/activitiesSlice.ts)
        ↓ axios via lib/apiClient.ts
DRF ViewSet (server/activities/views.py)
        ↓ permission check (IsAdmin, IsNotArchived)
Serializer validation (weight sum, uniqueness)
        ↓
PostgreSQL / SQLite write
        ↓
Response → slice updates cache → component re-renders
```

### Marks Entry → Auto Grade / Degree Class / Progress

```
DS submits marks + remarks (features/assessments)
        ↓
POST /api/assessments/{id}/marks/
        ↓ DRF view
Mark record saved (server/assessments/models.py)
        ↓
Grading service (server/assessments/services/grading.py) runs:
  - activity grade band lookup
  - officer's weighted score recompute (activity_score × activity_weight)
  - course progress % recompute
  - degree class recompute once all mandatory activities are marked complete
        ↓
Cached in Redis (prod) / LocMem (dev), keyed by officer + course
        ↓
Officer/Admin dashboards read the cached computed values
```

### Announcement Delivery (fan-out across three channels)

```
Sender composes announcement + selects recipients (features/announcements)
        ↓
POST /api/announcements/
        ↓ DRF view creates Announcement + resolves recipient User queryset
        ↓ for each recipient, in parallel:
   ├── Notification row created (in-app, read/unread)
   ├── EgoSms API call (SMS channel) → delivery status logged
   └── Gmail SMTP send (email channel) → delivery status logged
        ↓
Sender's Sent History shows per-channel delivery status per recipient
```

### File Submission (docx/pdf only)

```
Officer selects file (features/assessments)
        ↓ client-side extension/size check (utils.ts)
        ↓
POST /api/assessments/{id}/submissions/ (multipart)
        ↓ DRF serializer validates extension (.docx/.pdf), MIME type, size, deadline not passed
        ↓
File stored: Cloudinary (prod) / local MEDIA_ROOT (dev)
        ↓
Submission record saved, officer's activity status → "Submitted"
        ↓
No automatic plagiarism check — DS triggers one later, if/when they choose to
(see Plagiarism Check below)
```

### Plagiarism Check (DS-triggered only — never automatic)

A DS clicks "Run Plagiarism Check" on a submission from the marking screen
(`POST .../submissions/{id}/check-plagiarism/`, `IsDirectingStaff`-only,
`server/assessments/services/plagiarism.py`). Runs synchronously within that
one request; always safe to re-run (fully overwrites the previous report).

```
DS clicks "Run Plagiarism Check" on one Submission
        ↓
Extract text (cached after first time — Submission.extracted_text):
python-docx (.docx) or pdfplumber (.pdf)
        ↓ extraction fails (image-only PDF, corrupt file)?
        │        └── PlagiarismReport.status = "failed" → DS sees "Could not be screened"
        ↓ extraction succeeds
Split into sentences (simple rule-based splitter)
        ↓
For each sentence, compare against two source pools:
  - Internal: every other Submission for the same AssessmentSchedule (both Land
    Groups) — extracted+cached the first time any DS checks anyone on this
    assessment — TF-IDF + cosine similarity, sentence-to-sentence (scikit-learn)
  - External: the ~10 most distinctive sentences only, searched via Google
    Programmable Search (assessments/services/web_search.py) and compared
    against the returned snippet — quota-gated (100 free queries/day,
    project-wide), silently skipped (not an error) once spent or if unconfigured
        ↓
Each sentence banded by its best match, whichever source scored higher:
  ≥75% → "plagiarised", 40–75% → "paraphrased", below → "original" (no highlight)
        ↓
PlagiarismReport saved:
  - score = word-weighted % of the submission flagged plagiarised/paraphrased
  - highlights = every sentence in order, with its band/similarity/source
  - external_checked = whether the web-search step actually ran this time
  - status = "completed"
        ↓
Visible on the DS marking screen only — never surfaced to the Officer, and
never surfaced to Admin either (DS-only, by explicit product decision)
```

---

## Database Schema (Django models, key fields)

### `accounts.User` (custom user model)

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | Primary key |
| army_number | string, unique | `USERNAME_FIELD` — used for login |
| role | enum | `admin` / `directing_staff` / `officer` |
| rank | string | e.g. Lieutenant Colonel |
| full_name | string | |
| country | string | Sponsoring nation |
| phone_number | string | For SMS delivery |
| email | string | For email delivery |
| avatar | image, nullable | Cloudinary (prod) / local `MEDIA_ROOT` (dev), same environment-aware storage as Submissions. Settable at registration time (Admin, on the Officer/DS registration form) or self-service afterward (`users/me/avatar/`, `ProfilePage`) |
| password | hashed | Django's built-in hasher |
| must_change_password | boolean | True until first password change |
| is_active | boolean | Deactivation flag |
| created_at | datetime | |

### `courses.Course`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| code | string, unique | e.g. `2026/27` |
| start_year | integer | e.g. 2026 |
| status | enum | `active` / `completed` / `archived` |
| created_at | datetime | |

### `courses.LandGroup`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| course | FK → Course | |
| name | enum | `red` / `blue` (display: "Red Land" / "Blue Land") |

### `personnel.OfficerProfile`

| Field | Type | Notes |
| --- | --- | --- |
| user | FK → User (one-to-one) | |
| course | FK → Course | |
| land_group | FK → LandGroup | |

### `personnel.DirectingStaffProfile`

| Field | Type | Notes |
| --- | --- | --- |
| user | FK → User (one-to-one) | |
| course | FK → Course | |

### `activities.Activity`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| course | FK → Course | |
| name | string | e.g. "Tactical Exercise Without Troops" |
| weight_percent | decimal | All activities for a course must sum to exactly 100.00 |
| is_mandatory | boolean | Always `true` under current rules |

### `activities.ActivityAssignment`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| activity | FK → Activity | |
| land_group | FK → LandGroup | |
| directing_staff | FK → DirectingStaffProfile | |

**Constraint:** unique together (`activity`, `land_group`) — one DS per activity per land group. Application-level validation additionally blocks the same `directing_staff` being assigned to the *same* `activity` across both land groups.

### `scheduling.TimetableEntry`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| activity | FK → Activity | |
| land_group | FK → LandGroup | |
| room | string | |
| start_at | datetime | |
| end_at | datetime | |

### `scheduling.AssessmentSchedule`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| activity | FK → Activity (one-to-one) | |
| instructions | text | Assessment guide from the DS |
| deadline | datetime | Governs both officer submission window and DS marking window |

### `assessments.Submission`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| assessment | FK → AssessmentSchedule | |
| officer | FK → OfficerProfile | |
| file_url | string | Storage-relative name (`default_storage.save()`'s return value), not a full URL — resolved to an absolute, downloadable URL via `default_storage.url()` at the API layer (`_BaseSubmissionSerializer.get_file_url`, exposed to every role since it's not sensitive, unlike the plagiarism fields). DS uses this for the "Download submitted file" link on the marking screen |
| file_type | enum | `docx` / `pdf` |
| submitted_at | datetime | |
| is_late | boolean | Derived at save time against `deadline` |

### `assessments.Mark`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| assessment | FK → AssessmentSchedule | |
| officer | FK → OfficerProfile | |
| score | decimal | 0–100 |
| remarks | text | |
| comments | text | |
| is_complete | boolean | DS approval of activity completion |
| marked_by | FK → DirectingStaffProfile | |
| marked_at | datetime | |

**Constraint:** unique together (`assessment`, `officer`).

### `assessments.PlagiarismReport`

DS-triggered only — not created at Submission upload time, only on the first `check-plagiarism` call. See Plagiarism Check above.

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| submission | FK → Submission (one-to-one) | |
| status | enum | `not_checked` / `completed` / `failed` |
| score | decimal, nullable | Word-weighted % of the submission flagged plagiarised/paraphrased |
| highlights | JSON | Every sentence in order: `[{text, band, similarity_percent, source}]` — `band` is `plagiarised`/`paraphrased`/`original`, `source` is `{type: "internal", submission_id, officer_name, army_number}` or `{type: "external", url, title, snippet}` or `null` |
| external_checked | boolean | Whether the Google Programmable Search step actually ran this check (false if unconfigured or daily quota spent) |
| checked_at | datetime, nullable | |

### `assessments.ExternalSearchQuota`

Tracks Google Programmable Search usage per calendar day (the free tier is 100 queries/day, project-wide). See `assessments/services/web_search.py`.

| Field | Type | Notes |
| --- | --- | --- |
| date | date, unique | |
| query_count | positive int | Queries used so far today |

### `announcements.Announcement`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| sender | FK → User | |
| title | string | |
| body | text | |
| scope | enum | `all_officers` / `all_ds` / `course` / `land_group` / `activity` / `individual` |
| course | FK → Course, nullable | |
| land_group | FK → LandGroup, nullable | |
| activity | FK → Activity, nullable | |
| created_at | datetime | |

### `announcements.Notification`

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | |
| announcement | FK → Announcement | |
| recipient | FK → User | |
| is_read | boolean | |
| sms_status | enum | `sent` / `failed` / `not_applicable` |
| email_status | enum | `sent` / `failed` / `not_applicable` |
| created_at | datetime | |

---

## Media Storage

| Path pattern | Contents | Dev | Prod |
| --- | --- | --- | --- |
| `submissions/{course_code}/{officer_id}/{assessment_id}.{ext}` | Officer assessment uploads | `MEDIA_ROOT/submissions/...` | Cloudinary |
| `resources/{course_code}/{activity_id}/` | DS-shared academic resources | `MEDIA_ROOT/resources/...` | Cloudinary |
| `profiles/{user_id}.jpg` | Profile photos | `MEDIA_ROOT/profiles/...` | Cloudinary |

Access: authenticated users only. Officers may only read their own submissions; DS may read submissions for activities they are assigned to; Admin reads all.

---

## Authentication

- Login is **army number + password**, not email.
- `POST /api/auth/login/` (SimpleJWT custom serializer) returns `access` + `refresh` tokens.
- `must_change_password=true` on the returned user object forces a client-side redirect to `/change-password` before any protected route is reachable — enforced both in the React route guard and by a DRF permission that blocks all non-password-change endpoints server-side.
- Protected routes: everything except `/login` and `/change-password`.
- Role-based route trees: `/admin/*`, `/ds/*`, `/officer/*` — guarded both by the React router (redirect on role mismatch) and by DRF permission classes (`IsAdmin`, `IsDirectingStaff`, `IsOfficer`) on every endpoint.
- Access token stored in memory (Redux), refresh token in an httpOnly cookie set by the backend. axios interceptor refreshes the access token on 401 and retries once.

---

## Environment Configuration

| Concern | Development | Production |
| --- | --- | --- |
| Settings module | `config.settings.development` | `config.settings.production` |
| Env file | `.env.development` (loaded via python-dotenv) | `.env.production` |
| Requirements | `requirements/development.txt` | `requirements/production.txt` |
| Database | SQLite | PostgreSQL |
| Media storage | Local `MEDIA_ROOT` | Cloudinary |
| Cache backend | `LocMemCache` | `django_redis.cache.RedisCache` |
| Debug | `True` | `False` |
| CORS allowed origins | Vite dev server (`http://localhost:5173`) | Deployed frontend origin only |
| App server | `manage.py runserver` | `gunicorn config.wsgi:application` (added 2026-08-25 — was entirely absent before, meaning there was no way to actually run this in production) |
| Django's own static files (`/admin/`) | Served by `runserver` automatically | WhiteNoise (`STATIC_ROOT` + `STATICFILES_STORAGE`, added 2026-08-25) — unrelated to Cloudinary, which only handles user-uploaded media, not Django admin's CSS/JS |

`DJANGO_ENV` environment variable selects which settings module and `.env` file load in `manage.py` / `wsgi.py`. Client-side: Vite reads `client/.env.production` (added 2026-08-25 as an empty placeholder — `VITE_API_BASE_URL` must be filled in with the real deployed backend URL before building, or the deployed frontend has no idea where the API lives) the same way `.env.development` is read for local dev.

---

## Invariants

Rules the AI agent must never violate:

- Activity weights for a course must sum to exactly 100.00% before the activity list can be saved — validated server-side, never trusted from the client alone.
- A Directing Staff can never be assigned to teach the same Activity to both Land Groups — validated server-side on `ActivityAssignment` creation/update.
- Submission uploads accept only `.docx` and `.pdf` — validated by extension **and** MIME type, both client-side (UX) and server-side (source of truth).
- No submission is accepted after an `AssessmentSchedule.deadline` has passed, and no `Mark` can be entered after that same deadline plus any Admin-configured grace period — the deadline is the single source of truth for both windows.
- Grade, degree class, and course progress are **always computed**, never stored as manually-editable fields.
- No `Submission` is ever screened for plagiarism automatically — a DS must explicitly trigger a check, per submission, and may re-run it any time. If text extraction fails, the submission is marked `failed` for review, never silently scored as 0%.
- `PlagiarismReport.score` and `.highlights` are never exposed through any Officer-facing **or Admin-facing** endpoint or serializer — they are DS-only fields, enforced by serializer field scoping (a dedicated `AdminSubmissionSerializer`, not just `OfficerSubmissionSerializer` reused), not just frontend hiding.
- Once a `Course.status` is `archived`, every write (create/update/delete) to that course's scoped data (land groups, activities, assignments, timetable, assessments, submissions, marks) is rejected by a shared `IsNotArchived` permission — reads remain open.
- All API queries are scoped to the requesting user's role and, for Officers/DS, to their own course/activity/land-group data — never return cross-user or cross-course data by accident.
- Announcement delivery always attempts all three channels (in-app, SMS, email) and records per-channel status — a failure on one channel never blocks or hides the others.
- `role` on `accounts.User` is always one of `admin` / `directing_staff` / `officer` — never any other value.
- Raw color values and Tailwind's built-in color classes never appear in components — always reference `theme/tokens.ts` (see `ui-tokens.md`).
