# UI Rules

Concise rules for building the SCSC ERP UI. The delivered dashboard designs (`context/designs/*.jpg`) are the source of truth for layout rhythm — sidebar + topbar shell, card-based content, grid/list toggles, colored stat icons. These rules adapt that language to the military-college domain and to the Joy UI + Tailwind stack.

---

## Font

Load Public Sans (with Inter as fallback) once in `index.html` or via `@fontsource/public-sans`, and set it as the Joy theme's `fontFamily.body` (see `ui-tokens.md`). Never fall back to a bare system font stack.

Army numbers, course codes (`2026/27`), and roll numbers always render in the monospace token (`font-mono`) — never in the body sans font. This is the one deliberate typographic accent in the system; use it consistently so identifiers are always visually distinct from prose.

---

## Layout

- App shell: fixed left sidebar (**280px** expanded / **72px** collapsed) + topbar (**64px** height) + scrollable content area.
- Content max-width: **1440px**, centered, with **24px** side padding on desktop, **16px** on mobile.
- Gap between page sections: **24px**.
- Sidebar background is always the signed-in user's **role color** (`primaryDark`) — navy for Officer, forest green for Directing Staff, charcoal grey for Admin — regardless of light/dark mode. It is the one always-colored surface in the system, and the clearest visual cue for which role experience you're in. See `ui-tokens.md` → Role Palettes.
- No secondary sidebar, no nested drawers. Tabs (Joy `Tabs`) are used for in-page sub-navigation (e.g. an Officer or DS detail page), never a second sidebar.

---

## Sidebar

- Grouped by function with small-caps section labels (`rgba(255,255,255,0.45)`, 11px, uppercase, letter-spacing 0.06em) — see `project-overview.md` for the exact groups per role.
- Active item: `textInverse` text, subtle background tint (`rgba(255,255,255,0.06)`), and a **4px accent-colored left indicator bar** — never an underline, never a full-width colored block.
- Inactive item: `rgba(255,255,255,0.72)` text, transitions to `textInverse` on hover.
- Only one role's nav tree is ever mounted at a time — do not render Admin nav items for a DS session even if hidden via CSS.

---

## Topbar

- White background, full width, `border-b border-border`, height 64px, padding `0 24px`.
- Left: collapse-sidebar toggle + global search.
- Center-right: **Course selector** (`Select`, shows the active course code, e.g. `2026/27`; Admin can also jump to an archived course, which is visually tagged "Archived" and switches the whole app into read-only mode).
- Right: notification bell (Joy `Badge` for unread count) → opens a dropdown list of recent notifications, **theme toggle** (light/dark — the only user-togglable appearance setting), profile menu (avatar + rank + name, dropdown: Profile, Change Password, Sign Out).
- The theme toggle only ever switches `data-theme` between `light`/`dark` — it never offers a role or accent-color choice. Role color is identity, not preference; see `ui-tokens.md`.
- Never place a chat/messaging icon here — out of scope for this system.

---

## Cards

Every content block lives in a card.

```
background: surface
border: 1px solid border
border-radius: 16px
padding: 24px
box-shadow: 0px 1px 3px rgba(19,34,61,0.08), 0px 1px 2px rgba(19,34,61,0.06)
```

Never use a colored card background. Color is carried by icon badges, chips, progress fills, and text inside an otherwise white/neutral card — never the card surface itself. The one exception is the sidebar (see above) and full-width welcome banners (e.g. "Welcome back, Colonel ___"), which use `primary`/`primaryDark` as an intentional, singular accent per page.

---

## Stat Cards (dashboards)

Match the pattern from the reference dashboards: a colored icon badge (rounded square, tinted background + solid icon color from the token set), a large number, a label, and an active/inactive or trend sub-line.

```
icon badge: 40x40px, rounded-lg, background <status>Light, icon color <status>
stat number: 28px / weight 700 / textPrimary
label: 14px / weight 500 / textSecondary
sub-line: 12px / textMuted, or a small pill (successLight/success) for a trend
```

Use one distinct status color per stat card in a row (e.g. primary, info, accent, success) so the row reads as a set, not a wall of one color.

---

## Typography Hierarchy

**Page title** — 22px / 700 / `textPrimary`

**Section / card heading** — 16px / 600 / `textPrimary`

**Body / table row text** — 14px / 500 / `textPrimary`

**Column header (uppercase, tracked)** — 12px / 600 / `textSecondary`

**Muted / timestamp / helper text** — 12px / 400 / `textMuted`

---

## Badges & Chips

Use Joy `Chip`. Default shape is pill (`border-radius: 9999px`), padding `2px 10px`, 12px / 600.

- **Land Group chips** are always `redLand`/`blueLand` colored — see `ui-tokens.md`. Never recolor a land group chip for any other purpose.
- **Status chips** (Active/Inactive, Submitted/Late/Missing, Pending/Approved) use the success/warning/error/info set.
- **Degree class / grade chips** use the dedicated `distinction`/`merit`/`pass`/`fail` tokens — never reuse status colors for grades, since a "Fail" grade and an "Inactive" account should be visually distinguishable in context even though both are red-adjacent (use slightly different chip variants: grade chips are `solid`, status chips are `soft`).
- **Plagiarism score chips** use the three-band spec in `ui-tokens.md` and only ever render on DS/Admin screens — the marking screen and reports, never an Officer route.

---

## Buttons

**Primary** — `Button color="primary"`: navy background, white text, `md` radius, `px-4 py-2`, 14px/500. Used for the one main action per view (Save, Register Officer, Send Announcement).

**Secondary** — `Button variant="outlined" color="neutral"`: white background, `border` border, `textPrimary` text. Used for Cancel, Export, secondary navigation actions.

**Accent** — reserved for high-stakes affirmative actions tied to rank/completion semantics: "Approve Completion", "Archive Course". Uses the brass/gold token, never for routine actions.

**Danger** — `color="danger"`: reserved for destructive/irreversible actions (Deactivate User, Reject Submission, Delete Timetable Entry). Always paired with a confirmation dialog.

---

## Forms

- Joy `Input` / `Select` / `Textarea` / `Checkbox` throughout — never raw `<input>` elements.
- Label above field, 12px/600/`textSecondary`, not floating labels.
- Required fields marked with a small `accent`-colored asterisk, not red (red is reserved for error/Red Land).
- Validation errors appear inline below the field in `error` color, 12px — never as a raw browser alert or an unstyled thrown error.
- The **Activity weight editor** always shows a live running total with the three-state indicator described in `ui-tokens.md` (under 100 / exactly 100 / over 100), and the Save button is disabled unless the total is exactly 100%.
- The **file upload** control for assessment submissions only ever presents `.docx` and `.pdf` in its file picker `accept` attribute, shows the accepted types as helper text, and rejects other types with an inline error before any network call — never silently strips or accepts a disallowed file.

---

## Tables (Rosters, Marks Sheets, Timetables)

- No alternating row colors — white rows, separated by `border-b border-border`.
- Column headers: uppercase, 12px, weight 600, `textSecondary`.
- Row text: 14px, `textPrimary`.
- Row hover: `surfaceSecondary` background.
- Any row representing an Officer or DS shows their Land Group as a small colored dot or chip inline with their name — never only in a separate filterable column that requires scrolling to see.
- Marks sheets right-align numeric columns (score, weight, %) and left-align identity columns (army number, name).
- The DS marking screen shows a **Plagiarism** column/badge next to each submission, before the score/remarks inputs — so the DS sees it before marking, not after. Clicking it opens the matched-submissions detail (other officer, army number, matched %).

---

## Grid / List Toggle (Officer & DS registries)

Both a card-grid view and a dense list/table view are supported, matching the reference designs' grid-vs-list icon toggle in the toolbar. Grid cards show: avatar/initials, army number (monospace), rank + name, land group chip, status chip, and 2–3 quick actions (view, message-in-app, etc.).

---

## Empty States

Every section that can be empty must have one. Keep it minimal:

- Short descriptive text in `textMuted`.
- A relevant lucide icon above the text, in `textMuted` or the section's status color at low opacity.
- A CTA button only if there's a real next action available to the current role (e.g. Officer sees "No submissions yet" with no CTA; DS sees "No assessments scheduled" with a "Schedule Assessment" CTA).

---

## Calendar / Timetable & Events Views

Match the reference Events page: month/week/day toggle, a grid calendar with colored entry pills keyed by Land Group or activity type, and a right-hand upcoming list. Timetable entries always show their Land Group color; assessment deadlines are rendered as a distinct pill style (bordered, not filled) so they read as "due" rather than "scheduled lesson."

---

## Motion (framer-motion)

- Page-level transitions: fade + 8px vertical slide, 150–200ms, on route change.
- List/card entrances: staggered fade-in, 30–50ms stagger, not on every re-render — only on initial mount or filter change.
- Modals/drawers: scale-from-0.98 + fade, 150ms.
- Never animate table row reordering on sort — instant re-render is clearer for data-dense views.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-blue-600`, `text-red-500`) — use project tokens only.
- Never define colors anywhere but `theme/tokens.ts`.
- Never add a gradient to a card background — gradients are reserved for the logo mark and the sidebar's optional subtle depth treatment.
- Never mix Red Land / Blue Land coloring with unrelated status meaning (see `ui-tokens.md`).
- Never show a raw API error message to a user — always map to a human-readable toast via react-toastify.
- Never use `position: fixed` for in-content UI — only the sidebar and topbar are fixed; everything else uses normal flow or `sticky` within its own scroll container.
- Never let an Officer or DS view render data outside their own course/land-group/activity scope, even briefly during loading — gate rendering on the scoped query, don't render then filter.
- Never render a plagiarism score, badge, or matched-submission detail anywhere an Officer could see it, even in a shared component — build the DS/Admin marking and reports views with their own dedicated components rather than a shared one gated by a prop.
