// app/theme/typography.ts
// Font sizes/weights used across the app, kept 1:1 with existing values
// so the app looks exactly the same after this refactor.

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 22,
  display: 26,
  displayLg: 28,
  hero: 30,
} as const;

export const fontWeight = {
  bold: "700",
  extraBold: "800",
  black: "900",
} as const;
