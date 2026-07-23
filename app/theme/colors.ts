// app/theme/colors.ts
// Single source of truth for colors used across the app.
// Values must stay 1:1 with what each screen used before centralizing,
// so the app looks exactly the same after this refactor.

export const colors = {
  brandYellow: "#FFC226",
  brandBlack: "#000000",
  white: "#FFFFFF",

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
} as const;
