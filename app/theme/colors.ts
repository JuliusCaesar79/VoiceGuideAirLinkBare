// app/theme/colors.ts
// Single source of truth for colors used across the app.
// lightColors is the original palette (kept 1:1 with the values every
// screen used before centralizing). darkColors is its dark-mode
// counterpart — same keys, so any screen can switch palettes without
// touching its styles.
//
// Two kinds of tokens live here, and screens must not mix them up:
//  - "surface/neutral" tokens (white, textPrimary, gray*, divider/dockBorder)
//    flip between palettes — they're the plain page background and the
//    text/borders that sit directly on it.
//  - "brand/accent" tokens (brandYellow, brandBlack, highlightYellow,
//    pureWhite) stay IDENTICAL in both palettes on purpose — they're used
//    on fixed-color surfaces (yellow buttons, the yellow accent card, a
//    colored danger button) that don't change with theme, so the text/
//    border sitting on them must not change either.

export type ThemeColors = {
  brandYellow: string;
  brandBlack: string;
  pureWhite: string;
  white: string;
  textPrimary: string;

  gray900: string;
  gray700: string;
  gray500: string;
  gray400: string;
  gray100: string;
  gray50: string;

  highlightYellow: string;
  success: string;
  danger: string;

  shadow: string;
  dividerLight: string;
  dockBorder: string;
};

export const lightColors: ThemeColors = {
  brandYellow: "#FFC226",
  brandBlack: "#000000",
  pureWhite: "#FFFFFF",
  white: "#FFFFFF",
  textPrimary: "#000000",

  gray900: "#111827",
  gray700: "#444444",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",

  highlightYellow: "#FFF8E5",
  success: "#16A34A",
  danger: "#DC2626",

  shadow: "#000000",
  dividerLight: "rgba(0,0,0,0.10)",
  dockBorder: "rgba(0,0,0,0.06)",
};

export const darkColors: ThemeColors = {
  brandYellow: "#FFC226",
  brandBlack: "#000000",
  pureWhite: "#FFFFFF",
  white: "#15161A",
  textPrimary: "#F3F4F6",

  gray900: "#F3F4F6",
  gray700: "#D1D5DB",
  gray500: "#9CA3AF",
  gray400: "#6B7280",
  gray100: "#26272C",
  gray50: "#1D1E23",

  highlightYellow: "#FFF8E5",
  success: "#22C55E",
  danger: "#F87171",

  shadow: "#000000",
  dividerLight: "rgba(255,255,255,0.12)",
  dockBorder: "rgba(255,255,255,0.08)",
};

// Backwards-compatible alias: static light palette, for the few places
// that render before the theme is loaded (App.tsx's pre-ready fallback)
// or that intentionally stay fixed regardless of theme (native debug screen).
export const colors = lightColors;
