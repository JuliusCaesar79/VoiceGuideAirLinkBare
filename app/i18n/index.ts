// app/i18n/index.ts
// i18next setup: device-locale auto-detection on first launch, with a
// manually-picked language (stored on-device) taking priority after that.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import it from "./locales/it.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

export const LANGUAGE_STORAGE_KEY = "@voiceguide_language";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const FALLBACK_LANGUAGE: SupportedLanguageCode = "en";

const isSupportedLanguage = (code: string): code is SupportedLanguageCode =>
  SUPPORTED_LANGUAGES.some((lang) => lang.code === code);

function detectDeviceLanguage(): SupportedLanguageCode {
  const deviceLocales = getLocales();
  for (const locale of deviceLocales) {
    if (isSupportedLanguage(locale.languageCode)) {
      return locale.languageCode;
    }
  }
  return FALLBACK_LANGUAGE;
}

/**
 * Initializes i18next. Must be awaited before rendering the app so the
 * first render already uses the right language (stored override, or the
 * device locale if the user never picked one manually).
 */
export async function initI18n(): Promise<void> {
  let storedLanguage: string | null = null;
  try {
    storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // AsyncStorage unavailable: fall back to device detection below.
  }

  const initialLanguage =
    storedLanguage && isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : detectDeviceLanguage();

  await i18n.use(initReactI18next).init({
    lng: initialLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    resources: {
      en: { translation: en },
      it: { translation: it },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

/**
 * Called when the user manually picks a language from the switcher —
 * persists the choice so it takes priority over device-locale detection
 * on future launches.
 */
export async function setAppLanguage(code: SupportedLanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Non-fatal: language still changes for the current session.
  }
}

export default i18n;
