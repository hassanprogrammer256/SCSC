// Joy's extendTheme() eagerly decomposes every palette color into RGB
// channels at construction time (for its rgba()-overlay hover/active states),
// so it can never accept a var(--...) string — passing CSS variables here
// throws "MUI: Unsupported color" at runtime. Literal fallback hex (the
// Officer light/dark palette) is used purely so Joy's own internals resolve;
// role/theme-reactive color for everything else in the app comes from the
// CSS custom properties directly (Tailwind classes, or sx={{ ... "var(--color-...)" }}),
// never from Joy's palette. The few Joy components that use a semantic
// `color` prop (Button, Badge, MenuItem) carry an explicit sx override next
// to their usage so they still track the live role/theme.
import { extendTheme } from "@mui/joy/styles";
import { neutrals, rolePalettes, semantic } from "@/theme/tokens";

export const joyTheme = extendTheme({
  fontFamily: {
    body: "var(--font-sans)",
    display: "var(--font-sans)",
  },
  radius: {
    xs: "var(--radius-sm)",
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          500: rolePalettes.officer.light.primary,
          600: rolePalettes.officer.light.primaryDark,
          softBg: rolePalettes.officer.light.primaryLight,
        },
        warning: { 500: semantic.light.accent, softBg: semantic.light.accentLight },
        success: { 500: semantic.light.success, softBg: semantic.light.successLight },
        danger: { 500: semantic.light.error, softBg: semantic.light.errorLight },
        neutral: { softBg: neutrals.light.surfaceSecondary },
      },
    },
    dark: {
      palette: {
        primary: {
          500: rolePalettes.officer.dark.primary,
          600: rolePalettes.officer.dark.primaryDark,
          softBg: rolePalettes.officer.dark.primaryLight,
        },
        warning: { 500: semantic.dark.accent, softBg: semantic.dark.accentLight },
        success: { 500: semantic.dark.success, softBg: semantic.dark.successLight },
        danger: { 500: semantic.dark.error, softBg: semantic.dark.errorLight },
        neutral: { softBg: neutrals.dark.surfaceSecondary },
      },
    },
  },
  components: {
    // Joy's FormControl defaults `required`'s asterisk to danger[500] (red).
    // ui-rules.md → Forms requires accent gold instead, never red (red is
    // reserved for error/Red Land) — overridden once here for every form.
    JoyFormControl: {
      styleOverrides: {
        root: { "--FormLabel-asteriskColor": "var(--color-accent)" },
      },
    },
  },
});
