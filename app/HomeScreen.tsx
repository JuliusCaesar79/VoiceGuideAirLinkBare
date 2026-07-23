// app/HomeScreen.tsx

import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { colors, fontSize, fontWeight } from "./theme";
import { SUPPORTED_LANGUAGES, setAppLanguage, type SupportedLanguageCode } from "./i18n";

type Props = {
  onGuidePress: () => void;
  onGuestPress: () => void;
};

// Make sure this file exists:
// /assets/images/logo-voiceguide-airlink.png
const logo = require("../assets/images/logo-voiceguide-airlink.png");

export default function HomeScreen({ onGuidePress, onGuestPress }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* MAIN */}
        <View style={styles.main}>
          {/* TOP: Logo + Title */}
          <View style={styles.topSection}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>{t("home.appName")}</Text>
            <Text style={styles.tagline}>{t("home.tagline")}</Text>
          </View>

          {/* MIDDLE: Role selection */}
          <View style={styles.middleSection}>
            <Text style={styles.subtitle}>{t("home.chooseRole")}</Text>

            <Pressable
              style={[styles.buttonBase, styles.buttonGuide]}
              onPress={onGuidePress}
            >
              <Text style={styles.buttonGuideText}>{t("home.guideTitle")}</Text>
              <Text style={styles.buttonHelper}>{t("home.guideHelper")}</Text>
            </Pressable>

            <Pressable
              style={[styles.buttonBase, styles.buttonGuest]}
              onPress={onGuestPress}
            >
              <Text style={styles.buttonGuestText}>{t("home.guestTitle")}</Text>
              <Text style={styles.buttonHelperLight}>{t("home.guestHelper")}</Text>
            </Pressable>
          </View>
        </View>

        {/* FOOTER */}
        <View
          style={[
            styles.footerSection,
            // ✅ ensures footer sits ABOVE Android gesture/3-button nav bar
            { paddingBottom: Math.max(10, insets.bottom + 10) },
          ]}
        >
          {/* LANGUAGE SWITCHER */}
          <View style={styles.languageRow}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setAppLanguage(lang.code as SupportedLanguageCode)}
                  style={[
                    styles.languagePill,
                    isActive && styles.languagePillActive,
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text
                    style={[
                      styles.languagePillText,
                      isActive && styles.languagePillTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.footerText}>{t("home.footer")}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },

  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingTop: 18, // slightly less: gives a more balanced vertical rhythm
  },

  // Keeps content compact while footer stays at bottom.
  main: {
    flex: 1,
    justifyContent: "center",
  },

  topSection: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 18,
  },
  logo: {
    width: 170, // slightly reduced for less "crowding" feeling
    height: 170,
  },
  appName: {
    marginTop: 6,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.brandBlack,
    textAlign: "center",
  },
  tagline: {
    marginTop: 4,
    fontSize: fontSize.base,
    color: colors.gray500,
    textAlign: "center",
  },

  middleSection: {
    alignItems: "center",
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.gray700,
    marginBottom: 14, // a touch more breathing room
  },

  buttonBase: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 7,
  },
  buttonGuide: {
    backgroundColor: colors.brandYellow,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonGuest: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brandYellow,
  },

  buttonGuideText: {
    color: colors.brandBlack,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  buttonGuestText: {
    color: colors.brandYellow,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  buttonHelper: {
    marginTop: 4,
    fontSize: fontSize.sm,
    color: colors.gray900,
    textAlign: "center",
  },
  buttonHelperLight: {
    marginTop: 4,
    fontSize: fontSize.sm,
    color: colors.gray500,
    textAlign: "center",
  },

  footerSection: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: "center",
  },

  languageRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  languagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginHorizontal: 3,
  },
  languagePillActive: {
    backgroundColor: colors.highlightYellow,
  },
  languagePillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray400,
  },
  languagePillTextActive: {
    color: colors.brandBlack,
  },
});
