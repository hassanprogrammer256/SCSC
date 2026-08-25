# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here.
2. If yes — match its exact classes/props, don't reinvent the pattern.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component, update this file with the component name, file path, and exact classes/props used. Use the table shape below for every entry:

```
### ComponentName

File: src/components/.../ComponentName.tsx
Last updated: YYYY-MM-DD

| Property | Value |
| --- | --- |
| Background | |
| Border | |
| Border radius | |
| Text — primary | |
| Text — secondary | |
| Spacing | |
| Hover state | |
| Shadow | |
| Accent usage | |

**Pattern notes:**
Freeform notes on behavior, state, props, and anything a future builder needs to match this component exactly.
```

---

## Components

### Card

File: `src/components/common/Card.tsx`
Last updated: 2026-08-24

| Property | Value |
| --- | --- |
| Background | `surface` |
| Border | `1px solid border` |
| Border radius | `16px` (`rounded-xl`) |
| Text — primary | `textPrimary`, 16px/600 (title) |
| Spacing | `p-6`, `gap-4` between title row and body |
| Shadow | `0px 1px 3px rgba(19,34,61,0.08), 0px 1px 2px rgba(19,34,61,0.06)` |

**Pattern notes:**
The base wrapper for every dashboard content block. Optional `title` + `action` header row (action right-aligned, e.g. a `View All` link or calendar nav). Every other card-shaped component below (`StatCard`, `DeadlineList`, `NoticeBoard`, `ActivityFeed`, `QuickLinksGrid`, `MiniCalendar`, `RosterSnapshot`, `PendingMarkingList`, `ActivityStatusList`, `RemarksList`, chart cards) either wraps `Card` or hand-rolls the identical class string — always match this exact background/border/radius/shadow combo, never a colored card background (see `ui-rules.md`).

### StatCard

File: `src/components/common/StatCard.tsx`
Last updated: 2026-08-24

| Property | Value |
| --- | --- |
| Icon badge | 40×40px, `rounded-lg`, bg `<color>Light`, icon `<color>` |
| Stat number | 28px / 700 / `textPrimary` |
| Label | 14px / 500 / `textSecondary` |
| Sub-line | 12px / `textMuted` |

**Pattern notes:**
`color` prop is one of `primary | info | accent | success | warning | error` — pass a different one per card in a stat row so the row reads as a set (per `ui-rules.md`). Used on all three dashboards' top stat row.

### LandGroupChip / StatusChip / GradeChip / PlagiarismChip

Files: `src/components/common/{LandGroupChip,StatusChip,GradeChip,PlagiarismChip}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Pill chips, `12px/600`, `px-[10px] py-[2px]`, `border-radius: full`. `LandGroupChip` and `StatusChip` use Joy `variant="soft"`; `GradeChip` always uses `variant="solid"` so grade and status chips stay visually distinct even when both are red (see `ui-rules.md` → Badges & Chips). `GradeChip` maps band → the underlying semantic var (`accent`/`success`/`info`/`error`), never a `--color-distinction`-style custom property (that alias only exists inside Tailwind's `@theme` block, not as a real global CSS variable). `PlagiarismChip` implements the exact 3-band + not-checked/failed spec from `ui-tokens.md` and must never be imported into an Officer- or Admin-facing component — DS-only, not DS/Admin (corrected 2026-08-25: plagiarism checking became DS-triggered rather than automatic, and Admin lost visibility into results entirely).

### WelcomeBanner

File: `src/components/common/WelcomeBanner.tsx`
Last updated: 2026-08-25

**Pattern notes:**
The one deliberate colored-card exception — `linear-gradient(135deg, primary 0%, primaryDark 100%)`, `rounded-2xl`, `p-6`, white/85%-opacity text. One per dashboard, top of page. Takes `greeting`, `name`, `subtitle`, optional `note` and `action`. Greeting text is hardcoded `#FFFFFF` (was `var(--color-text-inverse)`, which flips near-black in dark mode against this always-dark gradient — same contrast bug as `Sidebar`, same fix). Subtitle/note already used hardcoded `rgba(255,255,255,0.85)` before this fix and were unaffected.

### DeadlineList / NoticeBoard / ActivityFeed / QuickLinksGrid / RosterSnapshot / PendingMarkingList / ActivityStatusList / RemarksList

Files: `src/components/common/*.tsx`
Last updated: 2026-08-25

**Pattern notes:**
All wrap `Card`. Deadline pills are `variant="outlined"` (bordered, not filled) colored by urgency (`error` ≤0 days, `warning` ≤3 days, else `info`) — never filled, so they read as "due" not "scheduled" (`ui-rules.md`). `PendingMarkingList` always renders `PlagiarismChip` before any marks input and is DS-only (only ever mounted on `DsDashboard`). `ActivityStatusList` pairs a `StatusChip` (submission status) with a `GradeChip` once a grade exists.

### MiniCalendar

File: `src/components/common/MiniCalendar.tsx`
Last updated: 2026-08-24

**Pattern notes:**
Read-only month grid (no navigation wired) — today = solid `primary` circle, highlighted days = `primaryLight` circle. Preview of the real Timetable feature (Phase 4). Takes `year`, `month` (0-indexed), `today`, `highlightDays`.

### ComingSoon

File: `src/components/common/ComingSoon.tsx`
Last updated: 2026-08-24

**Pattern notes:**
Mounted for every nav route in `navConfig.ts` that isn't a built dashboard, plus a catch-all `*` per role branch in `router.tsx`. Centered icon + title + muted helper text, no CTA.

### Sidebar

File: `src/components/layout/Sidebar.tsx`
Last updated: 2026-08-25

| Property | Value |
| --- | --- |
| Background | `primaryDark` (role-dependent) |
| Width | 280px expanded / 72px collapsed |
| Active item | hardcoded `#FFFFFF` text, `rgba(255,255,255,0.06)` bg, 4px `accent` left border |
| Inactive item | `rgba(255,255,255,0.72)`, hover → white |
| Section label | `rgba(255,255,255,0.45)`, 11px, uppercase, `0.06em` tracking |

**Pattern notes:**
Renders `NavGroup[]` from `app/navConfig.ts` via `NavLink`. Logo mark is the real SCSC crest image (`public/scsc-logo.jpg`, 40x40px circle, `object-cover`, 2px white ring) — replaced the earlier gradient "SCSC" monogram box at explicit user request, see `ui-tokens.md`. Full nav tree renders for every role even though most items are `ComingSoon` — see `router.tsx`.

**Contrast fix (2026-08-25):** title and active-nav-item text used `var(--color-text-inverse)`, which flips to near-black in `[data-theme="dark"]` (by design, for light-background surfaces) — but the DS/Officer sidebar background stays dark in *both* theme modes (`--color-primary-dark` never lightens), so dark-mode DS/Officer sidebars had near-invisible text. Fixed by hardcoding `#FFFFFF` in both spots instead of using the theme-dependent token — matches the sidebar's existing hardcoded-white convention used elsewhere (inactive item colors, section labels). Any future sidebar-only text must use a hardcoded white/rgba-white value, never `--color-text-inverse` — that token is only correct for surfaces that actually lighten in dark mode.

### Topbar

File: `src/components/layout/Topbar.tsx`
Last updated: 2026-08-25

**Pattern notes:**
64px, `bg-surface`, `border-b border-border`. Left: sidebar-collapse toggle + search. Center-right: course `Select` (Admin sees archived courses tagged "— Archived"; DS/Officer see only the active course, no switching). Right: notification bell (Joy `Badge`, badge count = real unread count from `notificationsSlice`) → dropdown of the 5 most recent real `AppNotification`s (unread = bold + full opacity, read = dimmed), "View All" footer item routes to the role's `/announcements` page; clicking an unread item marks it read. Theme toggle (`Sun`/`Moon`, the only user-togglable appearance setting), profile `Dropdown` (avatar → rank/name/army-number header, Profile, Change Password, Sign Out). Avatar falls back to `initials(user.fullName)` as children when `user.avatarUrl` is undefined (the real `accounts.User` has no avatar field). Sign Out calls `POST /api/auth/logout/` (clears the refresh cookie) before dispatching `clearSession()` — failure there still clears the local session so the user never gets stuck.

### AppShell

File: `src/components/layout/AppShell.tsx`
Last updated: 2026-08-24

**Pattern notes:**
Sets `data-role` (from session) and `data-theme` (from `themeSlice`, persisted to `localStorage`) on `<html>` — the only two places these attributes are ever set. Owns sidebar-collapsed state and the topbar's selected-course state (Admin only; local, not persisted). Renders `<Outlet />` inside a `max-w-[1440px]` centered content column.

### LoginPage

File: `src/features/auth/LoginPage.tsx`
Last updated: 2026-08-24

**Pattern notes:**
Full SCSC crest (`/scsc-logo.jpg`) — the only page that uses it, per `ui-tokens.md` (sidebar/topbar use the simplified monogram instead). Army number input uses `font-mono`. Dispatches the real `login` thunk (`authSlice.ts`) against `POST /api/auth/login/` — Button shows Joy's `loading` state while the request is in flight. `lib/mocks/users.ts`'s three demo accounts are now display-only (the "PREVIEW — DEMO ACCOUNTS" box lists their army numbers + the shared seeded password). Forced password-change redirect is intentionally still skipped for this pass (seeded demo accounts have `must_change_password=False` server-side).

### Charts — LandGroupComparisonChart / ProgressRing / MarksBarChart

Files: `src/components/charts/*.tsx`
Last updated: 2026-08-24

**Pattern notes:**
Recharts (added as an approved dependency, see `code-standards.md`). Colors are always read from `theme/tokens.ts` (never re-declared hex) via `useAppSelector(selectThemeMode)` since SVG `fill`/`stroke` props need literal hex, not `var(--...)`. `ProgressRing` follows the ui-tokens.md three-state fill rule (role `primary` <50%, `warning` 50–79%, `success` 80–100%). Bar charts use `redLand`/`blueLand` (Land Group comparison) or `success` (marks distribution) per the Chart Colors table.

### Dashboards — AdminDashboard / DsDashboard / OfficerDashboard

Files: `src/features/dashboard/*.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Content matches `build-plan.md` Features 22–24 exactly (stat row → primary content → secondary content, three rows per dashboard). All data is real now (Phase 6 rewiring) — `course.officerCount`/`directingStaffCount`/`progressPercent`, real Marks-derived Land Group comparison, real `officerProgressSlice`-driven progress ring/degree class, real deadlines from `assessmentSchedulesSlice`. The two exceptions: `NoticeBoard` and `ActivityFeed` on `AdminDashboard` stay on `lib/mocks/dashboard.ts` — no real backend source exists for either (Notices needs Announcements' delivery data shaped as notices, not built; there's no audit-log feature anywhere in build-plan.md's 32 features). `MiniCalendar` on `DsDashboard` also stays a decorative preview (Phase 4's real `TimetablePage` is the actual timetable). Officer's projected degree class uses the real `progress.degreeClass` from the backend, not the display-only `getDegreeClassBand()` mirror in `lib/utils.ts` (that mirror is still used pre-computation elsewhere, e.g. `MarkingRow`-adjacent previews, per `code-standards.md`'s "frontend mirrors purely for display" rule).

### ViewToggle

File: `src/components/common/ViewToggle.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Toolbar grid/list icon toggle (`LayoutGrid`/`List` from lucide) per `ui-rules.md` → Grid / List Toggle. `value: "grid" | "list"`, controlled. Selected side uses `variant="soft" color="primary"`; unselected `variant="plain" color="neutral"`. Used by Officers and Directing Staff registries.

### EmptyState

File: `src/components/common/EmptyState.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Generic empty-state block per `ui-rules.md` → Empty States: muted icon (28px) + short muted title + optional muted description + optional CTA `action` node. CTA only passed when the current role has a real next action (e.g. Admin/DS get "Register Officer", a page with nothing to do next gets none). Always wrapped in a `Card` by the caller, not self-carding.

### CoursesListPage

File: `src/features/courses/CoursesListPage.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`/admin/courses`. Card grid, one card per course: code (`font-mono`, 18px/700), `StatusChip` (active→success, completed→info, archived→warning), officer/DS counts with `Users`/`ShieldCheck` icons, `LinearProgress determinate` + `progressPercent` (always 0 until Phase 5/6's grading service lands — see `build-plan.md`). Whole card is clickable → `/admin/courses/:courseId`. Top-right `Create Course` button opens `CreateCourseModal`. Real data via `coursesSlice` (`fetchCourses`), no mocks.

### CreateCourseModal

File: `src/features/courses/CreateCourseModal.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Joy `Modal`/`ModalDialog`. Single `Course Code` input, pre-filled with `suggestCourseCode()` (current year → `YYYY/YY+1`), editable. Helper text states the one-active-course-at-a-time rule. Submits via `createCourse` thunk + `.unwrap()`, success toast names the course and confirms Land Groups were created, error toast surfaces the backend's exact validation message (e.g. "Only one course may be active at a time…") via `extractApiError`.

### CourseDetailPage

File: `src/features/courses/CourseDetailPage.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`/admin/courses/:courseId`. Back arrow + course code (mono) + `StatusChip` header, then Joy `Tabs`: Overview (3 `StatCard`s + a details `Card`), Land Groups (`LandGroupsPanel`), Officers (`OfficersPage` with `courseId` pinned), Directing Staff (`DirectingStaffPage` with `courseId` pinned), Activities (`ComingSoon` — Phase 3). Course resolved from the already-fetched `coursesSlice` list via `selectCourseById`, not a separate detail fetch.

### LandGroupsPanel / LandGroupsPage

Files: `src/features/courses/{LandGroupsPanel,LandGroupsPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Read-only two-column roster split (Red Land card / Blue Land card), never a CRUD screen — Land Groups only ever come from a course's auto-created rows. `LandGroupsPanel` takes an optional `courseId` (pinned from `CourseDetailPage`'s tab, or falls back to the topbar-selected course via `useSelectedCourseId()` when rendered standalone). `LandGroupsPage` is the thin `/admin/land-groups` wrapper. Reuses `officersSlice` data filtered by `landGroup` rather than a separate fetch.

### PersonnelIdentityFields

File: `src/features/personnel/PersonnelIdentityFields.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Shared field set (Army Number mono, Rank, Full Name, Country required; Phone Number, Email optional) used identically by `RegisterOfficerModal` and `RegisterDirectingStaffModal` — only Land Group lives outside it (Officer-only). Controlled via a single `value`/`onChange(RegisterPersonnelInput)` pair.

### RegisterOfficerModal / RegisterDirectingStaffModal / PersonnelIdentityFields

Files: `src/features/personnel/{RegisterOfficerModal,RegisterDirectingStaffModal,PersonnelIdentityFields}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Both modals take an optional `courseId` — pinned when opened from a course's own tab, falling back to the topbar-selected course (`useSelectedCourseId()`) when opened from the global registry page, per the `/architect` Phase 2 decision log in `build-plan.md`. Officer adds a required Land Group `Select` sourced from the resolved course's `landGroups`. On submit, success toast states the officer/DS name and the one-time `initialPassword` returned by the API (never re-fetchable — see `library-docs.md`). Form state resets on close (success or cancel) rather than via an effect keyed on `open`, to satisfy `react-hooks/set-state-in-effect`.

`PersonnelIdentityFields` (shared by both modals) gained an optional avatar-upload control (2026-08-25) — same visual pattern as `ProfilePage`'s photo picker (Joy `Avatar` + circular camera-icon overlay button + hidden `<input type="file" accept="image/*">`), but with a live blob-URL preview (`useMemo` keyed on the selected `File`, no upload happens until the whole form submits) instead of an immediate upload, since there's no user to attach the photo to until registration actually creates one. Both `register{Officer,DirectingStaff}` thunks send `multipart/form-data` (not JSON) to carry the optional file, matching `submitAssessmentFile`'s "no explicit Content-Type" pattern. Backend: `personnel/serializers.py`'s `_BaseRegistrationSerializer` gained a write-only `avatar` `ImageField` (`required=False`), applied to the created/reused `User` in `_resolve_user` — entirely optional, an admin can still register without a photo and the officer/DS can add one themselves later via `ProfilePage`.

### WeightTotalBadge

File: `src/components/common/WeightTotalBadge.tsx`
Last updated: 2026-08-26

**Pattern notes:**
Thin wrapper around `StatusChip` implementing the `ui-tokens.md` three-state Weight Total Indicator (`<100` warning, `=100` success, `>100` error — the last is defensive only, the server never allows it to actually happen). Purely informational, per the Phase 3 `/architect` decision log in `build-plan.md`: there is no "finalize" gate, sitting under 100% is a normal in-progress state. Rounds `total` before both display and comparison (`.toFixed(2)` / `Math.round(total * 100) / 100`) — fixed 2026-08-26 after 30 activities at realistic decimal weights (3.33% × 30) exposed raw floating-point drift (`99.99999999999996%`, never satisfying `=== 100`); see `code-standards.md` → Numeric Display.

### ActivitiesPage / ActivityFormModal

Files: `src/features/activities/{ActivitiesPage,ActivityFormModal}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`ActivitiesPage` follows the `OfficersPage` optional-`courseId`-prop pattern exactly (tab-pinned in `CourseDetailPage`, topbar-scoped at `/admin/activities`). Single dense table (name left, weight % right-aligned per `ui-rules.md` → Tables), no grid/list `ViewToggle` — a short ordered list with a running total reads better as one table. `WeightTotalBadge` sits next to the page title. Row actions: edit (opens `ActivityFormModal` pre-filled, keyed by `activity?.id ?? "new"` so create/edit share one component without a reset-effect) and delete (inline Joy `Modal` confirm dialog, `role="alertdialog"`, danger button — no separate reusable ConfirmDialog component yet, only one caller exists). `ActivityFormModal` shows a live "would total X%" helper text under the weight input and disables Save when that would exceed 100% — the one client-side UX affordance backed by the server's real validation.

### AssignmentBoard

File: `src/features/activities/AssignmentBoard.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Standalone `/admin/assignments` page only (never a `CourseDetailPage` tab — none is reserved for it). Rows = Activities, columns = Red Land / Blue Land (fixed order), each cell a Joy `Select` of the course's Directing Staff plus "— Unassigned —". Conflict prevention is structural: a DS already assigned to an Activity's other Land Group is filtered out of that cell's option list entirely (never shown-then-rejected). Picking a different DS in an already-filled cell PATCHes the existing `ActivityAssignment` in place rather than delete+recreate — see `assignmentsSlice.ts`'s `upsertAssignment` thunk. Every row/column pairing joins `activitiesSlice`, `assignmentsSlice`, and `directingStaffSlice` client-side (ids only over the wire) rather than a server-side join, matching the rest of the app's convention.

### TimetablePage / LessonFormModal

Files: `src/features/timetable/{TimetablePage,LessonFormModal}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Admin-only, standalone `/admin/timetable` (topbar-scoped via `useSelectedCourseId()`, no `CourseDetailPage` tab). Local calendar/list toggle (not the shared `ViewToggle` — that component's type is locked to `grid`/`list` with mismatched icons; this page hand-rolls a two-button `Calendar`/`List` toggle instead). Month grid follows `MiniCalendar`'s cell-generation math but adds real content: each day cell lists that day's entries as small pills colored by Land Group (`redLand`/`blueLand` tokens, not `LandGroupChip` itself — pills need to be compact and truncate). Clicking an empty day cell opens `LessonFormModal` pre-filled with that date (09:00–11:00 default window); clicking an existing pill opens it in edit mode. List view is the dense table alternative (`ui-rules.md` → Calendar/Timetable Views) sorted chronologically. Week/day calendar sub-views are trimmed from this pass — a documented scope trim (see `progress-tracker.md`), not an oversight; month + list cover the actual usage pattern (sparse per-course lessons) adequately for now.

### AssessmentsPage / AssessmentFormModal

Files: `src/features/assessments/{AssessmentsPage,AssessmentFormModal}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Admin-only, standalone `/admin/assessments` (same no-tab pattern as Timetable/Assignments). One row per Activity (not per schedule — `AssessmentSchedule` is 1:1 with `Activity`), `StatusChip` shows `warning` "Not scheduled" / `success` countdown / `error` "Deadline passed". `AssessmentFormModal`'s Schedule/Edit action is a single component keyed by `activity.id`, deciding create-vs-PATCH internally based on whether a `schedule` prop is present — same pattern as `ActivityFormModal`. Deadline sets both the Officer submission window and the DS marking window (Phase 5) — instructions/guide content is captured in the same modal since the backend model is one combined record, not split across two screens despite `project-overview.md`'s workflow language attributing "DS schedules the assessment" to the DS role; see the Phase 4 decision log in `progress-tracker.md`.

### OfficerActivitiesPage / OfficerActivityDetailPage / OfficerProgressPage

Files: `src/features/assessments/{OfficerActivitiesPage,OfficerActivityDetailPage,OfficerProgressPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Officer-role screens, all reading `selectActiveCourse` (not `useSelectedCourseId()` — Officers never get a topbar course switcher). `OfficerActivitiesPage` (`/officer/activities`) is a card grid, one card per Activity, status chip computed client-side from schedule+submission+mark presence. `OfficerActivityDetailPage` (`/officer/activities/:activityId`, manual sibling route in `router.tsx`, not nav-driven) shows the guide/instructions + deadline, a drag-and-drop file zone (native `<input type="file" accept=".docx,.pdf">`, hand-rolled — no new dependency) that only renders when no submission exists yet and the deadline hasn't passed, and the Mark/remarks once available. Never renders plagiarism data — `OfficerSubmissionSerializer` doesn't send those fields to begin with, so there's nothing to accidentally leak. `OfficerProgressPage` (`/officer/progress`) reuses the Phase 1 `ProgressRing` and `ActivityStatusList` components (mapping the real `OfficerProgress` API shape into the `OfficerActivityProgress` mock-era prop shape those components already expect, rather than changing them) plus `GradeChip` for the projected degree class.

### DsAssessmentsPage / DsMarkingPage / MarkingRow

Files: `src/features/assessments/{DsAssessmentsPage,DsMarkingPage,MarkingRow}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`DsAssessmentsPage` (`/ds/assessments`) lists the DS's own `ActivityAssignment` rows (now DS-readable, scoped server-side to their own assignments only) joined against Activities/Schedules, with a live pending-marking count. Clicking a row navigates to `DsMarkingPage` (`/ds/assessments/:assessmentId/marking`, manual sibling route). The roster there is the officer list (also newly DS-readable, server-scoped to the Land Groups the DS actually teaches) filtered client-side to the one Land Group this specific Activity's assignment covers. Each roster row is a `MarkingRow` — its own component per `code-standards.md`'s one-component-per-file rule — rendering `PlagiarismChip` *before* the score/remarks/comments inputs (`ui-rules.md` → Tables), with an "Approve Completion" `Checkbox` and a Save button that creates-or-PATCHes via `saveMark` depending on whether a `Mark` already exists for that officer.

Plagiarism checking (2026-08-25 redesign) is DS-triggered from `MarkingRow` — a "Run Plagiarism Check" / "Re-check" `Button` next to the chip dispatches `checkPlagiarism` (`submissionsSlice.ts`) and shows a `loading` state during the (synchronous, up to ~15s cold) request. Once a report exists, a "View Report" `Button` opens `PlagiarismReportModal`. Nothing here is automatic — no check ever fires from the upload flow.

`MarkingRow` also gained a download control (2026-08-25) — a Joy `IconButton` (`component="a"`, `download`, `target="_blank"`) wrapping a `lucide-react` `Download` icon, wrapped in a `Tooltip`, sitting first in the row's action group (before the plagiarism chip/buttons). Points at `submission.fileUrl` — a new read-only field the backend resolves via `default_storage.url()`, shared across every role's serializer (not sensitive, unlike the plagiarism fields), so this same field is available if a download control is ever added to the Officer's or Admin's own submission views later.

### PlagiarismReportModal

File: `src/features/assessments/PlagiarismReportModal.tsx`
Last updated: 2026-08-25

**Pattern notes:**
DS-only, opened from `MarkingRow`'s "View Report". Standard `Modal`/`ModalDialog` pattern (same shape as `UsersPage`'s deactivate-confirm dialog). Renders `submission.plagiarismHighlights` inline as one `Typography` block — each sentence a `<span>` (or an `<a target="_blank">` for an external-source match) colored per `ui-tokens.md` → Plagiarism Highlighting, wrapped in a Joy `Tooltip` naming its source; unflagged ("original" band) sentences render as plain text with no wrapper. A small color-swatch legend and the overall score + "web sources checked" note sit above the text. `legendSwatch()`/`sourceLabel()` are private unexported helpers in the same file — not a one-component-per-file violation, since only `PlagiarismReportModal` itself is exported (see `code-standards.md`; same precedent as `ProfilePage.tsx`'s `PolicyItem`).

### OfficersPage / DirectingStaffPage

Files: `src/features/personnel/{OfficersPage,DirectingStaffPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Both take an optional `courseId` prop (same pin/fallback pattern as the register modals above), so the identical component renders at `/admin/officers` / `/admin/directing-staff` (topbar-scoped) and inside `CourseDetailPage`'s tabs (URL-scoped). Toolbar: `ViewToggle`, `Register…` button, plus a Land Group filter `Select` (Officers only). Grid view: `Card`s with `Avatar src={user.avatarUrl}` (falls back to `initials(fullName)` when absent — fixed 2026-08-25, the `Avatar` previously never received `src` at all, so an uploaded photo was invisible everywhere in the admin UI even after the upload itself worked). List view: `Table` styled per `ui-rules.md` → Tables (uppercase 12px/600 headers, 14px rows, `surfaceSecondary` hover, no alternating rows) — text-only, no avatar column. Officer cards/rows always show `LandGroupChip` inline with the name, never a separate column.

### ReportsPage / DsReportSubmitPage

Files: `src/features/reports/{ReportsPage,DsReportSubmitPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`ReportsPage` (`/admin/reports`) is four Joy `Tabs` sub-views over one course-scoped data fetch: Progress (every officer's real progress/weighted-average/degree-class, from `CourseViewSet.progress_report`, a bulk action avoiding an N+1), Completion (same rows filtered to `outstandingActivities.length > 0`), Plagiarism Overview (Admin-scoped `submissionsSlice` filtered to `plagiarismScore >= 40`, reusing `PlagiarismChip`), DS Reports (Admin's inbox — `AssessmentReport` rows as plain `Card`s). A Land Group `Select` filters the Progress/Completion tabs. `DsReportSubmitPage` (`/ds/reports/submit`) is a simple form (Activity `Select` scoped to the DS's own assignments + `Textarea`) plus the DS's own previously-submitted reports below it.

### AnnouncementComposerPage / NotificationCenterPage

Files: `src/features/announcements/{AnnouncementComposerPage,NotificationCenterPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`AnnouncementComposerPage` is shared by `/admin/announcements` and `/ds/announcements` — the scope `Select`'s options and the "individual" recipient checklist both adapt to `selectCurrentUser().role` (DS: Activity/Individual only, individual list = own officers; Admin: all 6 scopes, individual list = officers + DS). Sent History renders below the form from the sender's own `announcementsSlice.items`. `NotificationCenterPage` is Officer-only (`/officer/announcements`) — Admin/DS read notifications via the topbar bell instead, matching `project-overview.md`'s page list exactly (Officer is the only role documented as having an "announcements + notifications received" page).

### UsersPage

File: `src/features/admin/UsersPage.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Admin-only `/admin/users`. Table with per-row "Reset Password" (posts, toasts the new one-time password once — same "never re-fetchable" rule as registration) and "Deactivate"/"Reactivate" (deactivate goes through the same inline `Modal` confirm-dialog pattern as `ActivitiesPage`'s delete; reactivate doesn't need confirmation, it's the reversible direction). Every action is logged server-side (`accounts.UserActionLog`) — no UI surface for that log exists or is needed, it's a backend audit trail only.

### ArchivePage / ArchivedCourseDetailPage

Files: `src/features/courses/{ArchivePage,ArchivedCourseDetailPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
`ArchivePage` (`/admin/archive`) is a simple card grid of `selectArchivedCourses`, linking to `ArchivedCourseDetailPage` (`/admin/archive/:courseId`). The archived detail page is a **separate component from `CourseDetailPage`**, not the same interactive tabs gated by a flag — it renders plain `Table`s (Officers, Directing Staff, Activities & Assignments, Final Progress) with zero buttons anywhere in its tree, satisfying `ui-rules.md`'s "no edit/delete controls rendered at all, not just disabled" invariant structurally rather than by conditional hiding. `CourseDetailPage` itself redirects (`<Navigate>`) to this page if `course.status === "archived"`, so a stale/direct link to the live interactive URL can never expose write controls for an archived course. `CourseDetailPage`'s Overview tab gained a "Course Lifecycle" card (Mark Completed → Archive Course, the latter behind a confirm `Modal`) — both call `courses.views.CourseViewSet`'s `status` PATCH / `archive` action respectively.

### ProfilePage

File: `src/features/auth/ProfilePage.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Shared by all 3 roles (`/admin/profile`, `/ds/profile`, `/officer/profile`) — one component, reads everything from the authenticated `user` in Redux, no role branching. Only Officer has a "Profile" sidebar nav item; Admin/DS reach it via the Topbar's account-menu dropdown ("Profile" and "Change Password" both navigate to the same page — "Change Password" is not a separate screen), so both roles needed a manual `<Route path="profile">` in `router.tsx` alongside their `courses/:courseId`-style dynamic routes rather than a nav-config-driven one.

Avatar: Joy `Avatar` (88px) showing `user.avatarUrl`, falling back to `initials(fullName)`. A small circular camera-icon button overlaid `-bottom-1 -right-1` triggers a hidden `<input type="file" accept="image/*">`; selecting a file dispatches `uploadAvatar` (posts `multipart/form-data` to `users/me/avatar/`, backed by `User.avatar` — local `MEDIA_ROOT` in dev, Cloudinary in prod via `default_storage`, same environment-aware storage pattern as Phase 5's Submission files, see `architecture.md` → Media Storage). No separate cropper/preview step — upload is immediate on file selection, matching this project's "no unnecessary intermediate steps" convention elsewhere (e.g. registration forms).

Change Password card: three password `Input`s plus a live policy checklist (`POLICY_RULES`, 5 rules) mirroring `accounts/validators.py`'s `PasswordPolicyValidator` exactly — every rule must be green (client-side UX only) *and* the current password field non-empty *and* new/confirm must match before the submit button un-disables; the server (`users/me/change-password/`) is still the actual source of truth and re-validates independently.

### DsOfficersPage / DsActivitiesPage / OfficerSubmissionsPage / OfficerMarksPage

Files: `src/features/personnel/DsOfficersPage.tsx`, `src/features/activities/DsActivitiesPage.tsx`, `src/features/assessments/{OfficerSubmissionsPage,OfficerMarksPage}.tsx`
Last updated: 2026-08-25

**Pattern notes:**
Four small read-only table pages filling in nav items that existed in `navConfig.ts` since earlier phases but had never gotten a real page (`ComingSoon` since Phase 1) — none needed a new backend endpoint, all reuse an already-course-and-role-scoped Redux slice built for a different screen in an earlier phase (`officersSlice`, `activitiesSlice`+`assignmentsSlice`+`assessmentsSlice` joined client-side, `submissionsSlice`, `marksSlice` respectively). Same dense-table pattern as `DirectingStaffPage`/`ActivitiesPage` — no `ViewToggle`, no forms, no mutation actions; these are all "what's mine" read views for DS/Officer, not admin CRUD screens.
