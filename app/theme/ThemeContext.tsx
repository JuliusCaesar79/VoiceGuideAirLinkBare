// app/theme/ThemeContext.tsx
// Theme mode (auto/light/dark) with on-device persistence, mirroring the
// language-switcher pattern in app/i18n/index.ts: a manual pick overrides
// system detection and is remembered for future launches.

import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { lightColors, darkColors, type ThemeColors } from "./colors";

export const THEME_STORAGE_KEY = "@voiceguide_theme_mode";

export const THEME_MODES = ["auto", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const isThemeMode = (value: string): value is ThemeMode =>
  (THEME_MODES as readonly string[]).includes(value);

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Reads the persisted theme choice. Awaited before the first render (see
 * App.tsx, alongside initI18n) so the app never flashes the wrong palette.
 */
export async function loadStoredThemeMode(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isThemeMode(stored)) {
      return stored;
    }
  } catch {
    // AsyncStorage unavailable: fall back to "auto" below.
  }
  return "auto";
}

export function ThemeProvider({
  initialMode = "auto",
  children,
}: {
  initialMode?: ThemeMode;
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
      // Non-fatal: theme still changes for the current session.
    });
  };

  const scheme: "light" | "dark" =
    mode === "auto" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: scheme === "dark" ? darkColors : lightColors,
      setMode,
    }),
    [mode, scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
