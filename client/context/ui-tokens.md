# UI Tokens

Design tokens for SCSC ERP, derived from the delivered dashboard designs (`context/designs/*.jpg`) and the **SCSC crest** (`client/public/scsc-logo.jpg`): a sky-blue field, a green hill, a grey crowned crane, a gold scalloped border and sunburst, a white book, and a navy ribbon bearing *"Ad Bellum Pacis Causa"*. Those four crest colors map directly onto the system's palette:

- **Blue** (the crest's sky field) → **Officer** role color
- **Green** (the crest's hill) → **Directing Staff** role color
- **Grey** (the crest's crane body, and its plain institutional weight) → **Admin** role color
- **Gold** (the crest's border and sunburst) → shared **accent**, used for rank/achievement across all three roles, never role-specific

Each role palette exists in a **light** and a **dark** variant. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

---

## How to Use

Tokens live in exactly one place — `src/theme/tokens.ts` — and are consumed by both Joy UI and Tailwind so there is never a second copy of a color value. Two independent things are switched at runtime:

1. **Theme mode** — `light` / `dark`, a user preference, toggled from the topbar.
2. **Role palette** — `officer` / `directingStaff` / `admin`, derived from the signed-in user's role, **never user-selectable**.

Both are applied as attributes on the app root (`<html data-theme="dark" data-role="officer">`), and every token below is expressed as a CSS custom property so Joy UI, Tailwind, and any hand-written CSS all read the same cascade.

```typescript
// src/theme/tokens.ts

// Neutrals — shared by every role, switched only by data-theme
export const neutrals = {
  light: {
    background: "#F3F5F9",
    surface: "#FFFFFF",
    surfaceSecondary: "#EEF1F6",
    border: "#E1E6EE",
    textPrimary: "#13223D",
    textSecondary: "#5B6675",
    textMuted: "#98A2B3",
    textInverse: "#FFFFFF",
  },
  dark: {
    background: "#0F1620",
    surface: "#161F2C",
    surfaceSecondary: "#1D2733",
    border: "#2A3644",
    textPrimary: "#EDF1F7",
    textSecondary: "#A9B4C4",
    textMuted: "#6C7789",
    textInverse: "#0F1620",
  },
} as const;

// Role palettes — the one thing that visually distinguishes Officer / DS / Admin
export const rolePalettes = {
  officer: {
    // Crest sky blue
    light: { primary: "#2159A6", primaryDark: "#123B75", primaryLight: "#E4ECF8" },
    dark: { primary: "#5B9BE0", primaryDark: "#0E2A54", primaryLight: "#1B3A63" },
  },
  directingStaff: {
    // Crest hill green
    light: { primary: "#2E7D46", primaryDark: "#1F5730", primaryLight: "#E3F1E7" },
    dark: { primary: "#5FBE7C", primaryDark: "#183F26", primaryLight: "#1E3B27" },
  },
  admin: {
    // Crest crane grey — institutional neutral
    light: { primary: "#4B5563", primaryDark: "#30363F", primaryLight: "#E9EBEE" },
    dark: { primary: "#9CA3AF", primaryDark: "#23262B", primaryLight: "#2A2E35" },
  },
} as const;

// Shared semantic tokens — identical in meaning for every role, mode-adjusted for contrast
export const semantic = {
  light: {
    accent: "#B9902F", accentLight: "#FBF3DE",          // crest gold — rank/achievement
    redLand: "#C0392B", redLandLight: "#FBE4E1",
    blueLand: "#1F5FA8", blueLandLight: "#E1EBF7",
    success: "#1E8A5F", successLight: "#DFF3EA",
    warning: "#C9791D", warningLight: "#FBEAD7",
    error: "#C0392B", errorLight: "#FBE4E1",
    info: "#2C6FBB", infoLight: "#E4EEF9",
  },
  dark: {
    accent: "#D9B454", accentLight: "#3A2E12",
    redLand: "#E5675A", redLandLight: "#4A1F1B",
    blueLand: "#6AA3E0", blueLandLight: "#16283D",
    success: "#34C97A", successLight: "#163C29",
    warning: "#F0A648", warningLight: "#4A2F12",
    error: "#E5675A", errorLight: "#4A1F1B",
    info: "#6AA3E0", infoLight: "#16283D",
  },
} as const;

// Degree class / grade tokens always alias the semantic set — never redefined separately
export const gradeTokens = (mode: "light" | "dark") => ({
  distinction: semantic[mode].accent,
  merit: semantic[mode].success,
  pass: semantic[mode].info,
  fail: semantic[mode].error,
});

export const radius = { sm: "4px", md: "8px", lg: "12px", xl: "16px", full: "9999px" } as const;
export const font = {
  sans: "'Public Sans', 'Inter', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const;
```

```css
/* src/theme/tokens.css — generated once from tokens.ts, committed alongside it */
:root {
  --color-background: #F3F5F9;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #EEF1F6;
  --color-border: #E1E6EE;
  --color-text-primary: #13223D;
  --color-text-secondary: #5B6675;
  --color-text-muted: #98A2B3;
  --color-text-inverse: #FFFFFF;

  --color-accent: #B9902F;
  --color-accent-light: #FBF3DE;
  --color-red-land: #C0392B;
  --color-red-land-light: #FBE4E1;
  --color-blue-land: #1F5FA8;
  --color-blue-land-light: #E1EBF7;
  --color-success: #1E8A5F;
  --color-success-light: #DFF3EA;
  --color-warning: #C9791D;
  --color-warning-light: #FBEAD7;
  --color-error: #C0392B;
  --color-error-light: #FBE4E1;
  --color-info: #2C6FBB;
  --color-info-light: #E4EEF9;
}

[data-theme="dark"] {
  --color-background: #0F1620;
  --color-surface: #161F2C;
  --color-surface-secondary: #1D2733;
  --color-border: #2A3644;
  --color-text-primary: #EDF1F7;
  --color-text-secondary: #A9B4C4;
  --color-text-muted: #6C7789;
  --color-text-inverse: #0F1620;

  --color-accent: #D9B454;
  --color-accent-light: #3A2E12;
  --color-red-land: #E5675A;
  --color-red-land-light: #4A1F1B;
  --color-blue-land: #6AA3E0;
  --color-blue-land-light: #16283D;
  --color-success: #34C97A;
  --color-success-light: #163C29;
  --color-warning: #F0A648;
  --color-warning-light: #4A2F12;
  --color-error: #E5675A;
  --color-error-light: #4A1F1B;
  --color-info: #6AA3E0;
  --color-info-light: #16283D;
}

/* Role primary — the one axis that differs Officer vs DS vs Admin */
[data-role="officer"] {
  --color-primary: #2159A6; --color-primary-dark: #123B75; --color-primary-light: #E4ECF8;
}
[data-role="officer"][data-theme="dark"] {
  --color-primary: #5B9BE0; --color-primary-dark: #0E2A54; --color-primary-light: #1B3A63;
}
[data-role="directing-staff"] {
  --color-primary: #2E7D46; --color-primary-dark: #1F5730; --color-primary-light: #E3F1E7;
}
[data-role="directing-staff"][data-theme="dark"] {
  --color-primary: #5FBE7C; --color-primary-dark: #183F26; --color-primary-light: #1E3B27;
}
[data-role="admin"] {
  --color-primary: #4B5563; --color-primary-dark: #30363F; --color-primary-light: #E9EBEE;
}
[data-role="admin"][data-theme="dark"] {
  --color-primary: #9CA3AF; --color-primary-dark: #23262B; --color-primary-light: #2A2E35;
}
```

```typescript
// src/theme/joyTheme.ts — Joy proxies the CSS variables rather than duplicating values,
// so role/mode switching is a pure CSS-cascade change, not a re-render of the theme object
import { extendTheme } from "@mui/joy/styles";

export const joyTheme = extendTheme({
  fontFamily: { body: "var(--font-sans)", display: "var(--font-sans)" },
  colorSchemes: {
    light: {
      palette: {
        primary: { 500: "var(--color-primary)", 600: "var(--color-primary-dark)", softBg: "var(--color-primary-light)" },
        warning: { 500: "var(--color-accent)", softBg: "var(--color-accent-light)" },
        success: { 500: "var(--color-success)", softBg: "var(--color-success-light)" },
        danger: { 500: "var(--color-error)", softBg: "var(--color-error-light)" },
        neutral: { softBg: "var(--color-surface-secondary)" },
      },
    },
    dark: {
      palette: {
        primary: { 500: "var(--color-primary)", 600: "var(--color-primary-dark)", softBg: "var(--color-primary-light)" },
        warning: { 500: "var(--color-accent)", softBg: "var(--color-accent-light)" },
        success: { 500: "var(--color-success)", softBg: "var(--color-success-light)" },
        danger: { 500: "var(--color-error)", softBg: "var(--color-error-light)" },
        neutral: { softBg: "var(--color-surface-secondary)" },
      },
    },
  },
});
```

```tsx
// src/components/layout/AppShell.tsx — where the two attributes get set, once, from session state
const roleAttr = { officer: "officer", directing_staff: "directing-staff", admin: "admin" }[user.role];

useEffect(() => {
  document.documentElement.setAttribute("data-role", roleAttr);
}, [roleAttr]);

useEffect(() => {
  document.documentElement.setAttribute("data-theme", themeMode); // "light" | "dark", from a small local preference slice
}, [themeMode]);
```

```javascript
// tailwind.config.js — reads the same CSS variables, never a second copy of the hex values
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-secondary": "var(--color-surface-secondary)",
        border: "var(--color-border)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        accent: "var(--color-accent)",
        "red-land": "var(--color-red-land)",
        "blue-land": "var(--color-blue-land)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
      borderRadius: { sm: "4px", md: "8px", lg: "12px", xl: "16px" },
      fontFamily: { sans: ["var(--font-sans)"], mono: ["var(--font-mono)"] },
    },
  },
};
```

```tsx
// Correct — Tailwind utility referencing the CSS-variable-backed token; automatically
// follows both the active role and the active theme mode with zero component-level logic
<div className="bg-surface border border-border rounded-xl" />

// Correct — Joy component, theme applied automatically via CssVarsProvider
<Button color="primary">Save</Button>

// Never — hardcoded hex
<div className="bg-[#2159A6]" />

// Never — raw Tailwind color scale
<div className="bg-blue-600 text-gray-500" />

// Never — reading role/mode with JS branching to pick a color; let the CSS cascade do it
const color = user.role === "officer" ? "#2159A6" : "#2E7D46"; // ✗
```

---

## Color Usage Guide

### Page Layout

| Element | Token |
| --- | --- |
| Page background | `background` |
| Card / surface | `surface` |
| Secondary surface (table header, hover row) | `surfaceSecondary` |
| Sidebar background | `primaryDark` — this is the one place the active role palette is always visible |
| Default border | `border` |

### Typography

| Element | Token |
| --- | --- |
| Headings, primary content | `textPrimary` |
| Secondary text, labels | `textSecondary` |
| Placeholder, muted, timestamps | `textMuted` |
| On dark surfaces (sidebar, hero banners) | `textInverse` |

### Role Palettes

| Role | Light `primary` | Light `primaryDark` | Dark `primary` | Crest reference |
| --- | --- | --- | --- | --- |
| Officer | `#2159A6` | `#123B75` | `#5B9BE0` | Sky-blue field behind the crane |
| Directing Staff | `#2E7D46` | `#1F5730` | `#5FBE7C` | Green hill beneath the crane |
| Admin | `#4B5563` | `#30363F` | `#9CA3AF` | Crane's grey body — institutional neutral |

Used for: sidebar background, active nav item indicator, primary buttons, focus rings, headers of official documents/reports, the app's welcome banner. This is the **only** axis that differs between the three role experiences — every other token below (semantic status, Land Group, grade, accent) is identical across roles, so meaning stays unambiguous no matter who's logged in.

| Element | Token |
| --- | --- |
| Primary button background | `primary` |
| Primary button hover | `primaryDark` |
| Light tinted background (info panels, active row) | `primaryLight` |

### Accent (Crest Gold) — rank & achievement, shared across all roles

Used sparingly for: Distinction badges, course-progress milestone markers, DS rank chips, "Approved" completion ticks. Deliberately **not** role-tinted — gold reads as an institutional mark of achievement regardless of which role is viewing it.

| Element | Token |
| --- | --- |
| Accent badge background | `accentLight` |
| Accent badge text / icon | `accent` |

### Land Group Colors

Always color-code Red Land and Blue Land consistently — badges, calendar entries, roster filters, chart series. These are independent of the Officer role's blue primary: an Officer's chrome (sidebar, buttons) is always role-blue regardless of which Land Group they're in, while their Land Group badge is red or blue based on their actual group. The two are visually distinct in context (chrome vs. chip) and are never meant to be read as the same signal.

| Group | Background | Text/Fill |
| --- | --- | --- |
| Red Land | `redLandLight` | `redLand` |
| Blue Land | `blueLandLight` | `blueLand` |

### Status Badges

| Status | Background | Text |
| --- | --- | --- |
| Active / Approved / Submitted on time | `successLight` | `success` |
| Pending / Due soon / Awaiting marks | `warningLight` | `warning` |
| Overdue / Inactive / Rejected | `errorLight` | `error` |
| Informational (scheduled, in-app notice) | `infoLight` | `info` |

### Plagiarism Score Badge

**DS-only** — never rendered on any Officer- or Admin-facing screen. Checking is DS-triggered (a button, not automatic); Admin has no plagiarism visibility at all, in the API or the UI.

```
0–19%:  successLight background, success text   — "Low similarity"
20–39%: warningLight background, warning text   — "Review recommended"
40%+:   errorLight background, error text        — "High similarity"
Not yet run / failed extraction: surfaceSecondary background, textMuted text — "Not Checked" / "Could not be screened"
```

### Plagiarism Highlighting

DS-only, inside `PlagiarismReportModal` (opened via MarkingRow's "View Report"). Renders the full submission text inline, one sentence at a time, colored by its similarity band — never a separate arbitrary color scale, reuses the same semantic pair as the score badge above:

```
Plagiarised (≥75% similarity):  errorLight background, 2px error underline
Paraphrased (40–75% similarity): warningLight background, 2px warning underline
Original (<40%, or too short to flag): no highlight — plain text
```

A flagged span is wrapped in a hover tooltip naming its source — another officer's name/army number (internal match), or a page title + link (external match, opens in a new tab). Unflagged text carries no tooltip and isn't interactive.

### Degree Class / Grade Colors

Always aliases of the shared semantic set — never a separate value, and never role-tinted (a Distinction must look identical whether an Admin or a DS is viewing it).

| Class | Token | Aliases |
| --- | --- | --- |
| Pass with Distinction | `distinction` | `accent` |
| Pass with Merit | `merit` | `success` |
| Pass | `pass` | `info` |
| Fail / Not Completed | `fail` | `error` |

---

## Typography Scale

| Element | Size | Weight | Line height | Token |
| --- | --- | --- | --- | --- |
| Page title | 22px | 700 | 30px | `textPrimary` |
| Section / card heading | 16px | 600 | 24px | `textPrimary` |
| Stat number | 28px | 700 | 34px | `textPrimary` |
| Body / table row text | 14px | 500 | 20px | `textPrimary` |
| Label / column header (uppercase) | 12px | 600 | 16px | `textSecondary` |
| Muted / timestamp | 12px | 400 | 16px | `textMuted` |
| Army number / course code (monospace) | 13px | 500 | 18px | `textSecondary`, `font-mono` |

Body font: **Public Sans** (falls back to Inter, then system sans). Monospace for army numbers, course codes, and roll numbers: **IBM Plex Mono**. Typography tokens never change between light/dark or between roles — only their color values do, automatically, via the CSS variables above.

---

## Spacing

| Token | Value | Usage |
| --- | --- | --- |
| `gap-1` | 4px | Tight inline gaps (icon + label) |
| `gap-2` | 8px | Badge/tag gaps |
| `gap-3` | 12px | Form field gaps |
| `gap-4` | 16px | Section internal gaps |
| `gap-6` | 24px | Between cards |
| `gap-8` | 32px | Page section gaps |
| `p-4` | 16px | Compact card padding |
| `p-6` | 24px | Standard card padding |
| `px-4 py-2` | 16px / 8px | Button padding |
| `px-3 py-1` | 12px / 4px | Badge padding |

---

## Component Tokens

### Cards

```
background: surface
border: 1px solid border
border-radius: 16px
padding: 24px
box-shadow (light): 0px 1px 3px rgba(19,34,61,0.08), 0px 1px 2px rgba(19,34,61,0.06)
box-shadow (dark): 0px 1px 3px rgba(0,0,0,0.35), 0px 1px 2px rgba(0,0,0,0.25)
```

### Sidebar

```
background: primaryDark (role-dependent — see Role Palettes table)
text (inactive): rgba(255,255,255,0.72) in light role-dark, rgba(255,255,255,0.65) in dark mode
text (active): textInverse, with accent-colored (gold) left indicator bar, 4px
active item background: rgba(255,255,255,0.06)
section label: rgba(255,255,255,0.45), 11px, uppercase, letter-spacing 0.06em
```

The sidebar is always the most visible role signal in the UI — an Officer's sidebar is navy-blue, a DS's is forest green, an Admin's is charcoal grey, in both light and dark mode. Toggling light/dark never changes which role's sidebar color scheme is showing, only overall page brightness.

### Buttons (Joy `Button`)

**Primary:** `color="primary"` → background `primary` (role-dependent), text `textInverse`, radius `md` (8px)
**Secondary:** `variant="outlined" color="neutral"` → background `surface`, border `border`, text `textPrimary`
**Danger (e.g. deactivate user, reject submission):** `color="danger"` mapped to `error`
**Accent (e.g. "Archive Course", "Approve Completion"):** `color="warning"` mapped to `accent` (gold, not role-tinted)

### Form Inputs (Joy `Input` / `Select` / `Textarea`)

```
background: surface
border: 1px solid border
border-radius: 8px
padding: 8px 12px
focus ring: 2px solid primary at 20% opacity (role-dependent)
placeholder: textMuted
```

### Badges (Joy `Chip`)

```
border-radius: 9999px (pill)
padding: 2px 10px
font-size: 12px
font-weight: 600
```

### Progress Ring (course completion %, attendance-style)

```
track: surfaceSecondary
fill: primary (0–49%, role-dependent), warning (50–79%), success (80–100%)
stroke-width: 8px
```

### Weight Total Indicator (Activity weight editor)

```
< 100%: warningLight background, warning text — "Weights total 62% — 38% remaining"
= 100%: successLight background, success text — "Weights total 100% ✓"
> 100%: errorLight background, error text — save disabled
```

### Land Group Filter Pills

```
unselected: surface background, border border, text textSecondary
selected (Red Land): redLandLight background, redLand text and border
selected (Blue Land): blueLandLight background, blueLand text and border
```

### Chart Colors

| Chart | Color |
| --- | --- |
| Course progress over time (line/area) | `primary` stroke (role-dependent), gradient fill to transparent |
| Marks distribution (bar) | `success` bars |
| Red Land vs Blue Land comparison (grouped bar) | `redLand` / `blueLand` |
| Submission status donut (on time / late / missing) | `success` / `warning` / `error` |
| Grid lines | `1px dashed border` |
| Axis labels | `textMuted`, 12px |

### Logo Mark

```
image: client/public/scsc-logo.jpg (the real crest)
shape: circular, border-radius: full
size: 40x40px
ring: 2px solid rgba(255,255,255,0.25)
object-fit: cover
```

The real SCSC crest renders everywhere the mark appears — login page, official report headers, and the sidebar header — at a consistent circular 40px size. (An earlier pass used a synthesized gradient-tile "SCSC" monogram in the sidebar instead of the crest image; that was replaced on user request — the crest is legible enough at this size and consistency across every surface was preferred over a separate abbreviated mark.)

---

## Invariants

- Never use hex values directly in components — always reference the CSS-variable-backed tokens, via Joy's theme or the generated Tailwind classes.
- The role palette (`data-role`) is set exactly once per session from the authenticated user's role and is **never user-selectable** — there is no UI control to "preview" another role's colors. The theme mode (`data-theme`) is the only user-togglable axis.
- Only `primary` / `primaryDark` / `primaryLight` differ between roles. Every semantic token (`success`, `warning`, `error`, `info`, `accent`, `redLand`, `blueLand`, `distinction`, `merit`, `pass`, `fail`) is identical across all three roles — this is what keeps a red "Fail" or a gold "Distinction" legible and consistent regardless of who's viewing it.
- Body font is Public Sans; army numbers, course codes, and roll numbers always use the monospace token — never render them in the body sans font.
- Never use Tailwind's built-in color classes (`bg-blue-600`, `text-gray-500`) — use project tokens only.
- Red Land is always `redLand`/`redLandLight` and Blue Land is always `blueLand`/`blueLandLight` — never swapped, never a different red/blue elsewhere in the UI for unrelated meaning (use `error`/`info` for non-land-group red/blue needs to avoid confusion), and never confused with the Officer role's blue primary (chrome vs. chip, always distinguishable by context).
- Accent (crest gold) is reserved for rank, achievement, and Distinction — never used as a generic decorative color, and never made role-specific.
- The plagiarism score badge and highlighted-report viewer only ever appear in DS views — if a component might render on an Officer- or Admin-facing route, it must not receive plagiarism data at all (not just visually hidden).
- Degree class colors (`distinction`, `merit`, `pass`, `fail`) are only ever applied to grade/degree-class badges — never reused for unrelated status meaning.
- Dark mode is a first-class mode, not an afterthought filter — every semantic and role token has an explicit dark-mode value above; never apply a CSS `filter: invert()` or opacity trick to fake dark mode.
