# Project Overview

## About the Project

**SCSC ERP** is the enterprise resource planning system for the **Senior Command and Staff College (SCSC)**, Jinja — Kimaka, Uganda. The college runs residential courses for mid-level and high-level army officers from multiple countries. The system replaces manual registers and spreadsheets with a single platform for registering courses, officers, and Directing Staff (DS); assigning instruction and marking duties; timetabling lessons and assessments; collecting assessment submissions; awarding marks; and auto-calculating grades, degree class, and course progress.

Every course is identified by the academic year it starts in, written as a two-year span — e.g. officers who enroll in 2026 are on **Course 2026/27**. Within a course, officers are split into two **Land Groups — Red Land and Blue Land**. Both groups take the exact same set of mandatory **Activities** (the course's military training modules), just on different schedules, with different Directing Staff, and in different rooms.

---

## The Problem It Solves

Running a staff college course involves a lot of interlocking constraints that are easy to get wrong by hand: activity weights must sum to exactly 100%, a DS must never be double-booked to teach the same activity to both land groups, every officer must clear every mandatory activity, and marks, grades, and degree classifications must stay consistent across dozens of officers and activities as the course progresses. Deadlines for assessment submission and marks entry are per-activity and easy to lose track of on paper.

SCSC ERP encodes these rules directly into the system: weight totals are validated at entry, DS-to-activity assignment prevents the same-activity-both-groups conflict, submissions are locked to `.docx`/`.pdf` only, deadlines drive both the officer's submission window and the DS's marking window, and grades/degree class/course progress are calculated automatically the moment a DS awards marks — never entered by hand.

---

## Roles

| Role | Who they are |
| --- | --- |
| **Admin** | College administration staff. Registers courses, officers, and DS. Sets activity weights, assigns DS to activities, builds timetables, schedules assessments, manages announcements and archiving. |
| **Directing Staff (DS)** | Higher-ranked officers who instruct. Each DS is assigned specific Activities to teach — never the same Activity to both Land Groups. Schedules activity assessments, marks work, approves activity completion, shares resources. |
| **Officer** | The student — a mid/high-level army officer enrolled on a course, in one Land Group. Submits assessment work, tracks progress, views marks and DS remarks. |

---

## Pages

```
/login                                  → Army Number + password sign-in
/change-password                        → Forced password change (first login / expired policy)

/admin/dashboard                        → College-wide overview
/admin/courses                          → Course list (e.g. 2026/27, 2025/26 …)
/admin/courses/:courseId                → Course detail — land groups, roster, progress
/admin/officers                         → Officer registry (grid, filter by course/land group)
/admin/officers/:id                     → Officer detail — profile, marks, submissions, progress
/admin/directing-staff                  → DS registry
/admin/directing-staff/:id              → DS detail — assigned activities, marking history
/admin/activities                       → Activities per course + weight editor (must total 100%)
/admin/assignments                      → DS ↔ Activity ↔ Land Group assignment board
/admin/timetable                        → Lesson/lecture schedule (room, date, land group)
/admin/assessments                      → Assessment scheduling + deadlines per activity
/admin/announcements                    → Compose + sent history
/admin/users                            → Account management, password resets, deactivation
/admin/reports                          → Progress, marks, and completion reports
/admin/archive                          → Read-only list of archived (completed) courses
/admin/archive/:courseId                → Read-only archived course detail

/ds/dashboard                           → DS overview — activities, deadlines, pending marking
/ds/officers                            → Roster of officers under the DS's assigned activities
/ds/activities                          → Activities assigned to this DS (by land group)
/ds/activities/:id                      → Activity detail — schedule, guide, roster
/ds/assessments                         → Assessments scheduled by this DS
/ds/assessments/:id/marking             → Award marks, remarks, comments; approve completion
/ds/resources                           → Academic resources shared with officers
/ds/announcements                       → Compose to own officers (by land group / activity)
/ds/reports/submit                      → Submit assessment report to Admin

/officer/dashboard                      → Progress overview, upcoming deadlines
/officer/activities                     → This officer's activities (schedule, status)
/officer/activities/:id                 → Activity detail — guide, resources, submission
/officer/submissions                    → Submission history across all activities
/officer/marks                          → Marks, remarks, and comments per activity
/officer/progress                       → Grade breakdown, degree class projection, % complete
/officer/announcements                  → Announcements + notifications received
/officer/profile                        → Personal info, change password
```

---

## Navigation

Left sidebar, grouped by function, collapsible. Groups shown differ by role:

**Admin:** Dashboard · Courses · Personnel (Officers, Directing Staff) · Academic (Land Groups, Activities, Assignments, Timetable, Assessments) · Announcements · Reports · User Management · Archive

**Directing Staff:** Dashboard · My Officers · My Activities · Assessments & Marking · Resources · Announcements · Reports

**Officer:** Dashboard · My Activities · Submissions · Marks & Remarks · Academic Progress · Announcements · Profile

Top bar (all roles): global search, **Course selector** (switch between the active course and, for Admin, prior courses), notification bell (in-app announcements/notifications with unread count), theme toggle, profile menu (Profile, Change Password, Sign Out).

---

## Core User Flow

### Authentication

- Admin registers a user (Officer or DS) with their **army number**; the system auto-generates a **4-digit initial password**.
- The user signs in with **army number + initial password**.
- First login always redirects to `/change-password` before any other page is reachable.
- New password must meet the standard policy: minimum 8 characters, at least one lowercase letter, one uppercase letter, one digit, and one special character.
- The user may change their password again at any time from Profile.

### Admin Workflow (in order)

1. **Create a Course** — e.g. `2026/27`. Course is created with status `active`.
2. **Register Directing Staff** for the course.
3. **Register Officers** for the course, assigning each to a Land Group — **Red Land** or **Blue Land**.
4. **Define Activities** for the course and set each Activity's **weight (%)** — the Admin cannot save the activity list until weights sum to exactly **100%**.
5. **Assign DS to Activities**, per Land Group. A DS may teach an Activity to Red Land or Blue Land — never both. The same Activity is taught to both groups by two different DS (or the same DS cannot be picked twice for one Activity across groups).
6. **Timetable** lessons/lectures — Activity + Land Group + Room + Date/Time. Both Land Groups take the same Activities at different intervals.
7. **Schedule Assessments** for each Activity — sets the submission/marking **deadline** (one deadline governs both the officer's submission window and the DS's marks-entry window for that activity).
8. **Manage users** — reset passwords, deactivate accounts.
9. **Send announcements** — chooses recipients (all officers, all DS, a specific course, a specific land group, or individuals).
10. **Archive** a course once completed — the course becomes read-only and moves to the Archive.

### Directing Staff Workflow

1. Views **My Officers** — the roster filtered to the Land Group(s) and Activities assigned to this DS.
2. **Schedules the activity assessment** for an assigned Activity (within the deadline set by Admin) and provides **assessment guide/instructions**.
3. Officers submit work (`.docx`/`.pdf` upload) before the deadline. Each submission is automatically screened for **plagiarism** against every other submission for that activity, producing a similarity score.
4. DS reviews the **plagiarism score** alongside the submission, then **awards marks**, writes **remarks and comments**, and **approves activity completion** per officer.
5. DS **submits an assessment report** to Admin once marking for that activity is done.
6. DS **shares academic resources** with their officers.
7. DS **sends announcements** to a chosen subset of their officers (by Land Group and/or Activity).
8. DS **receives notifications** from Admin.

### Officer Workflow

1. Views **Academic Progress** — per-activity marks, auto-calculated grade, projected degree class, and overall course completion %.
2. **Submits assessment work** for each Activity before its deadline (`.docx`/`.pdf` only).
3. Views **marks, remarks, and comments** left by the DS once released.
4. Receives **announcements/notifications** from Admin and DS.

### Grading & Progress (automatic)

- Each Activity carries a weight (%) set by Admin; all Activities in a course sum to 100%.
- When a DS awards marks for an Activity, the officer's **weighted score contribution** = `activity_score × activity_weight`.
- **Grade per activity** is derived from a standard band (configurable by Admin, default): 80–100 Distinction · 70–79 Merit · 50–69 Pass · below 50 Fail.
- **Course progress (%)** increases each time an Activity is marked complete, proportional to that Activity's weight.
- **Degree class** is derived from the officer's overall weighted average once all mandatory Activities are complete: 80–100% Pass with Distinction · 65–79% Pass with Merit · 50–64% Pass · below 50% Fail / Not Completed.
- An Officer cannot be marked as having completed the course while any mandatory Activity is outstanding.

### Plagiarism Detection (automatic)

- The moment an Officer's submission finishes uploading, the system extracts its text and compares it against every other submission made for the **same Activity** (same course, both Land Groups — the two groups sit the same activity, so cross-group copying is checked too), producing a **plagiarism score (0–100%)**.
- The score reflects the **highest similarity match** found, plus a ranked list of the other submissions it matches most closely (officer name, army number, matched %).
- The plagiarism score and its matched-submission detail are visible to **DS and Admin only** — never surfaced to the Officer, to avoid revealing the detection method or discouraging honest resubmission behavior.
- A DS sees the plagiarism score directly on the marking screen for each submission before entering marks, and can open the matched-submissions detail to compare passages.
- If text extraction fails (e.g. a scanned/image-only PDF with no extractable text), the submission is flagged **"Could not be screened"** rather than silently given a score of 0 — the DS is told to review it manually.
- Plagiarism status per submission: `pending` (queued/processing) → `completed` (score available) → `failed` (could not extract text).

### Announcements & Notifications

- Announcements are delivered through **three channels simultaneously**: in-app notification (bell icon), **SMS via EgoSms**, and **email via Gmail**.
- Admin can target: all officers, all DS, a specific course, a specific Land Group, or individually selected users.
- DS can target: their own officers, filtered further by Land Group and/or Activity.
- Delivery status per channel (sent/failed) is visible to the sender.

### Archive

- Only **completed courses** can be archived, and only by Admin.
- Archived courses are **read-only** everywhere in the system — rosters, marks, timetables, and reports remain viewable but no create/edit/delete action is available.
- The Archive is centralized (`/admin/archive`) and lists every past course.

---

## Data Architecture Notes

- **Course-scoped data** — Land Groups, Activities, Assignments, Timetable, Assessments, Marks all belong to exactly one Course and are never shared across courses.
- **User accounts persist across courses** — the same army number is reused if an officer or DS returns for a later course, but their course-specific records (marks, land group, activity assignments) are separate per course.
- **Marks are immutable history once a course is archived** — archiving freezes all course-scoped tables against further writes.
- **Grade/degree class/progress are computed, never stored as free-entry fields** — they are derived from Marks + Activity weights at read time (or cached and recalculated on every mark change).

---

## Features In Scope

- Army Number + password authentication (JWT), forced password change on first login, standard password policy
- Course creation and management, named by academic year span (e.g. `2026/27`)
- Officer registration with Land Group assignment (Red Land / Blue Land)
- Directing Staff registration
- Activity definition per course with weight (%) validated to total exactly 100%
- DS-to-Activity assignment per Land Group, with same-activity-both-groups conflict prevented
- Timetabling of lessons/lectures — Activity, Land Group, Room, Date/Time
- Assessment scheduling per Activity with a single deadline governing submission and marking
- Assessment work submission — `.docx` and `.pdf` only, size-limited, deadline-enforced
- Automatic plagiarism screening of every submission against all other submissions for the same activity, with a similarity score and matched-submission detail visible to DS/Admin
- Marks entry, remarks, comments, and activity-completion approval by DS
- Auto-calculated grade per activity, degree class, and course progress (%)
- DS assessment report submission to Admin
- Academic resource sharing (DS → officers)
- Announcements with recipient targeting, delivered via in-app notification + SMS (EgoSms) + email (Gmail)
- Centralized read-only Archive of completed courses
- Role-based dashboards for Admin, DS, and Officer
- Reports: progress, marks, completion, per course/land group/activity
- User management: registration, password reset, deactivation

## Features Out of Scope

- Fees, finance, or payments of any kind
- Hostel, transport, or library management
- Parent/guardian portal
- Multi-language UI
- In-app chat/messaging between users
- Video conferencing / online lesson delivery
- Biometric attendance
- Alumni portal
- Mobile native apps (web-responsive only)
- Public self-registration — all accounts are created by Admin only

---

## Target Users

- **Admin** — college administration staff running course logistics end to end.
- **Directing Staff** — senior officers instructing and marking, usually managing multiple activities and one Land Group's worth of officers at a time.
- **Officer** — a mid/high-level army officer from a partner nation, focused on submitting work on time and tracking their standing.

---

## Success Criteria

- Admin can stand up a new course (`2026/27`), register officers and DS, define activities, assign DS, timetable lessons, and schedule assessments without leaving the system.
- Activity weights cannot be saved unless they total exactly 100% for the course.
- The system blocks assigning the same DS to teach the same Activity to both Land Groups.
- Officers can only upload `.docx`/`.pdf` files, and only before the activity's deadline.
- Every submission is automatically screened for plagiarism against all other submissions for the same activity, and the score reaches the DS's marking screen before marks are entered.
- Grades, degree class, and course progress update automatically and correctly the moment marks are entered — no manual calculation anywhere.
- Announcements reliably fire on all three channels (in-app, SMS, email) with per-channel delivery status visible to the sender.
- Archived courses are fully read-only across every page and role.
- UI is visually consistent across all three role experiences and reflects the college's institutional identity.
