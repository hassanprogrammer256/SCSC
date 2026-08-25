// Single source of truth for colors/spacing/radii — see context/ui-tokens.md.
// client/src/index.css hand-mirrors these same hex values as CSS custom
// properties (the project's actual "tokens.css"), consumed by Tailwind's
// @theme inline block and by Joy via theme/joyTheme.ts. Components should
// reference the CSS variables (Tailwind classes / Joy `color` prop); this
// file exists for the few places that need a real hex string in JS — chart
// series colors (Recharts) and anywhere `var(--...)` can't be used directly.

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

export const rolePalettes = {
  admin: {
    light: { primary: "#4B5563", primaryDark: "#30363F", primaryLight: "#E9EBEE" },
    dark: { primary: "#9CA3AF", primaryDark: "#23262B", primaryLight: "#2A2E35" },
  },
  directing_staff: {
    light: { primary: "#2E7D46", primaryDark: "#1F5730", primaryLight: "#E3F1E7" },
    dark: { primary: "#5FBE7C", primaryDark: "#183F26", primaryLight: "#1E3B27" },
  },
  officer: {
    light: { primary: "#2159A6", primaryDark: "#123B75", primaryLight: "#E4ECF8" },
    dark: { primary: "#5B9BE0", primaryDark: "#0E2A54", primaryLight: "#1B3A63" },
  },
} as const;

export const semantic = {
  light: {
    accent: "#B9902F",
    accentLight: "#FBF3DE",
    redLand: "#C0392B",
    redLandLight: "#FBE4E1",
    blueLand: "#1F5FA8",
    blueLandLight: "#E1EBF7",
    success: "#1E8A5F",
    successLight: "#DFF3EA",
    warning: "#C9791D",
    warningLight: "#FBEAD7",
    error: "#C0392B",
    errorLight: "#FBE4E1",
    info: "#2C6FBB",
    infoLight: "#E4EEF9",
  },
  dark: {
    accent: "#D9B454",
    accentLight: "#3A2E12",
    redLand: "#E5675A",
    redLandLight: "#4A1F1B",
    blueLand: "#6AA3E0",
    blueLandLight: "#16283D",
    success: "#34C97A",
    successLight: "#163C29",
    warning: "#F0A648",
    warningLight: "#4A2F12",
    error: "#E5675A",
    errorLight: "#4A1F1B",
    info: "#6AA3E0",
    infoLight: "#16283D",
  },
} as const;

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

export type ThemeMode = "light" | "dark";
export type RolePaletteKey = keyof typeof rolePalettes;
