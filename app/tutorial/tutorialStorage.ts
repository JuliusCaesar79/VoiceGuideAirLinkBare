// app/tutorial/tutorialStorage.ts
// Tracks whether the user has completed (or skipped) the onboarding
// tutorial, mirroring the persistence pattern used for language/theme:
// read once before the first render, write once when the user finishes.

import AsyncStorage from "@react-native-async-storage/async-storage";

export const TUTORIAL_STORAGE_KEY = "@voiceguide_tutorial_seen";

/**
 * Awaited before the first render (see App.tsx, alongside initI18n and
 * loadStoredThemeMode) so the tutorial only ever shows on a genuine first
 * launch, never flashes on top of Home for a returning user.
 */
export async function loadTutorialSeen(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
    return stored === "true";
  } catch {
    // AsyncStorage unavailable: default to not-seen (safer to show it once
    // more than to risk never showing it at all).
    return false;
  }
}

export async function markTutorialSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  } catch {
    // Non-fatal: worst case the tutorial reappears on next launch.
  }
}
