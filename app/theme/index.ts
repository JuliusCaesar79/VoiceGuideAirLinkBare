// app/theme/index.ts
// Single import point: `import { colors, fontSize, fontWeight } from "../theme"`
// For theme-reactive colors inside a component, use `useTheme()` instead of
// the static `colors` export (see ThemeContext.tsx).

export { colors, lightColors, darkColors, type ThemeColors } from "./colors";
export { fontSize, fontWeight } from "./typography";
export {
  ThemeProvider,
  useTheme,
  loadStoredThemeMode,
  THEME_MODES,
  type ThemeMode,
} from "./ThemeContext";
