# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the Django API step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Phase 1 — Foundation

### 01 Auth — Army Number Login + Forced Password Change

**UI:**

- Login page — army number input (monospace), password input, Sign In button. Institutional header (college name, crest/monogram).
- Change Password page — current password, new password, confirm new password, live policy checklist (8+ chars, upper, lower, digit, special).

**Logic:**

- `POST /api/auth/login/` via custom SimpleJWT serializer keyed on `army_number`.
- `must_change_password=true` on response forces redirect to `/change-password` before any other route.
- `POST /api/auth/change-password/` validates the policy server-side, clears the flag.
- Access token in Redux memory; refresh token httpOnly cookie; axios interceptor refresh-and-retry on 401.

---

### 02 App Shell — Sidebar + Topbar, Role-Based Route Guards

**UI:**

- `AppShell` — collapsible navy sidebar, grouped nav per role (see `project-overview.md`), topbar with search, Course selector, notification bell, theme toggle, profile menu.
- Empty dashboard placeholders per role so routing can be verified end to end.

**Logic:**

- `RequireAuth` / `RequireRole` route guards (react-router-dom v6) per `library-docs.md`.
- Redux `authSlice` holds session, role, and `must_change_password`.

---

### 03 Django Project Setup

**Logic:**

- `config/settings/{base,development,production}.py` split; `DJANGO_ENV`-driven selection in `manage.py`.
- Custom `accounts.User` model (`army_number` as `USERNAME_FIELD`, `role`, `rank`, `full_name`, `country`, `phone_number`, `email`, `must_change_password`).
- `django-cors-headers` configured for the Vite dev origin.
- `.env.development` / `.env.production` + `requirements/{base,development,production}.txt`.
- Cache backend switched via settings module (`LocMemCache` dev / `django_redis` prod).

---

### 04 Database Schema

**Logic:**

- Create all apps and models from `architecture.md`: `courses` (Course, LandGroup), `personnel` (OfficerProfile, DirectingStaffProfile), `activities` (Activity, ActivityAssignment), `scheduling` (TimetableEntry, AssessmentSchedule), `assessments` (Submission, Mark), `announcements` (Announcement, Notification).
- Migrations for all apps.
- Shared `common/permissions.py`: `IsAdmin`, `IsDirectingStaff`, `IsOfficer`, `IsNotArchived`.
- Media storage config: local `MEDIA_ROOT` (dev) / Cloudinary `raw` resource type (prod).

---

## Phase 2 — Course & Personnel Management (Admin)

### 05 Course Management — UI

Course list (mock data) — cards/table showing code (`2026/27`), status, officer/DS counts, progress %. Create Course modal (code auto-suggested from current year, e.g. `2026/27`). Course detail page shell with tabs: Overview, Land Groups, Officers, Directing Staff, Activities.

### 06 Course Management — Logic

`POST/GET /api/courses/` CRUD, scoped to Admin. Creating a course auto-creates its two `LandGroup` rows (Red Land, Blue Land). Course status defaults to `active`.

### 07 Officer Registration — UI + Logic

**UI:** Register Officer form — army number, rank, full name, country, phone, email, Land Group select. Officer grid/list (per `ui-rules.md` grid-vs-list toggle), filterable by course and land group.

**Logic:** `POST /api/courses/{id}/officers/` creates the `User` (role=officer) + `OfficerProfile`, generates and hashes the 4-digit initial password, returns it once for the Admin to relay (and triggers the same SMS/email delivery path built in Phase 7 once available — until then, displayed on-screen with a copy button).

### 08 Directing Staff Registration — UI + Logic

Same pattern as Officer registration, without a Land Group field (a DS isn't tied to a land group directly — only to Activities, per land group, via assignment in Phase 3).

---

## Phase 3 — Activities, Assignments & Weighting

### 09 Activities — UI

Activities list per course with weight column and a running-total badge (`ui-tokens.md` three-state indicator). Add/Edit Activity form (name, weight %).

### 10 Activities — Logic

`POST/PUT /api/courses/{id}/activities/` — serializer `validate()` rejects any save where the course's total weight would exceed or, on final save, not equal 100%. Save button disabled client-side as a UX affordance; server validation is the source of truth.

### 11 DS ↔ Activity Assignment — UI

Assignment board: rows = Activities, columns = Red Land / Blue Land, each cell a DS picker. Already-assigned-elsewhere DS for the same activity is visually flagged before submit.

### 12 DS ↔ Activity Assignment — Logic

`POST /api/activities/{id}/assignments/` — serializer rejects assigning a DS to both land groups of the same Activity. Unique-together constraint (`activity`, `land_group`) enforced at the DB level as a second guard.

---

## Phase 4 — Timetable & Assessment Scheduling

### 13 Timetable — UI

Calendar view (month/week/day, per the Events design reference) with Land-Group-colored entry pills; list view alternative for dense editing. Add Lesson modal — Activity, Land Group, Room, Date/Time.

### 14 Timetable — Logic

`POST /api/timetable/` CRUD, scoped to course + `IsNotArchived`. Conflict check: same Room + overlapping time window rejected with a clear error.

### 15 Assessment Scheduling — UI

Per-activity assessment form — instructions/guide (rich text or plain textarea), single deadline field with a countdown preview shown to Admin/DS.

### 16 Assessment Scheduling — Logic

`POST /api/activities/{id}/assessment/` creates the `AssessmentSchedule`. Deadline is the single field gating both `assessments.Submission` creation and `assessments.Mark` creation in Phase 5.

---

## Phase 5 — Submissions, Plagiarism & Grading

### 17 Officer Submission — UI

Activity detail page (Officer view) — guide/instructions, deadline countdown, file drop zone restricted to `.docx`/`.pdf`, submission history/status (Not Submitted / Submitted / Late).

### 18 Officer Submission — Logic

`POST /api/assessments/{id}/submissions/` multipart upload. Serializer validates extension + MIME + deadline not passed; rejects with a specific message per failure reason. File stored via the environment's configured storage backend.

### 19 Plagiarism Detection — Logic

Triggered automatically the moment a `Submission` saves (per `architecture.md`'s plagiarism data-flow). Extracts text (`python-docx` / `pdfplumber`), computes TF-IDF cosine similarity against every other submission on the same assessment (`scikit-learn`), and saves a `PlagiarismReport` (score + ranked matches, or `failed` if extraction fails). No UI of its own yet — the score becomes visible once Feature 20's marking screen renders it.

### 20 DS Marking — UI

Marking screen per assessment: roster of officers in the DS's assigned land group for that activity, a **Plagiarism** badge/column (per `ui-rules.md`, DS/Admin-only, with a matched-submissions detail view), score input, remarks, comments, "Approve Completion" toggle (accent-styled).

### 21 DS Marking — Logic + Auto Grade/Degree Class/Progress

`POST /api/assessments/{id}/marks/` saves the `Mark`. `assessments/services/grading.py` recomputes, per officer: activity grade band, weighted score contribution, course progress %, and (once every mandatory activity is marked complete) degree class — using the constants from `code-standards.md`, cached per `architecture.md`'s data-flow section.

---

## Phase 6 — Dashboards & Reports

### 22 Admin Dashboard

Stat cards (Total Officers, Total DS, Active Courses, Overall Completion %), Land-Group comparison chart, upcoming deadlines list, recent activity feed, quick links (mirrors the reference admin dashboard design's stat-row + charts + notice-board rhythm).

### 23 DS Dashboard

Assigned activities summary, pending-marking count, upcoming assessment deadlines, roster snapshot per land group.

### 24 Officer Dashboard

Course progress ring, per-activity status list, upcoming deadlines, latest remarks/comments.

### 25 Reports (Progress / Marks / Completion)

Filterable by course / land group / activity; exportable table view. Progress report shows every officer's weighted score and projected degree class; completion report flags officers with outstanding mandatory activities. Includes a Plagiarism overview (DS/Admin-only) surfacing any submission above the high-similarity threshold across the course.

### 26 DS Assessment Report Submission to Admin

DS-side form to submit a written report once marking for an activity is complete; Admin-side inbox view of submitted reports per activity.

---

## Phase 7 — Announcements & Notifications

### 27 Announcement Composer — UI

Title/body form with a recipient-scope picker (All Officers / All DS / Course / Land Group / Activity / Individuals) that adapts to the sender's role (DS only sees their own officers/activities as scope options).

### 28 Announcement Delivery — Logic

`POST /api/announcements/` resolves the recipient queryset from `scope`, then for each recipient: creates a `Notification` row, calls `sms.send_sms()` (EgoSms), calls Django's `send_mail()` (Gmail SMTP) — each wrapped independently per `library-docs.md`, each recording its own status on the `Notification` row.

### 29 Notification Center — UI + Logic

Bell dropdown + full notification list page, read/unread state, per-channel delivery status visible to the sender in Sent History.

---

## Phase 8 — Archive & Administration

### 30 Archive — UI

`/admin/archive` list of archived courses; archived course detail pages render every tab (roster, activities, marks, timetable) in a visibly read-only mode (no edit/delete controls rendered at all, not just disabled).

### 31 Archive — Logic

`POST /api/courses/{id}/archive/` — only allowed when every officer on the course has completed all mandatory activities; sets `status="archived"`. From that point, `IsNotArchived` rejects all writes to that course's scoped data across every endpoint.

### 32 User & Password Management

Admin user list — reset password (regenerates a new one-time password, forces `must_change_password=true` again), deactivate/reactivate account. All actions logged with actor, target, and timestamp.

---

## Feature Count

| Phase | Features |
| --- | --- |
| Phase 1 — Foundation | 4 |
| Phase 2 — Course & Personnel | 4 |
| Phase 3 — Activities & Assignments | 4 |
| Phase 4 — Timetable & Scheduling | 4 |
| Phase 5 — Submissions, Plagiarism & Grading | 5 |
| Phase 6 — Dashboards & Reports | 5 |
| Phase 7 — Announcements | 3 |
| Phase 8 — Archive & Admin | 3 |
| **Total** | **32** |
