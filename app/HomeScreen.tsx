// app/HomeScreen.tsx

import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { colors, fontSize, fontWeight } from "./theme";
import { SUPPORTED_LANGUAGES, setAppLanguage, type SupportedLanguageCode } from "./i18n";

type Props = {
  onGuidePress: () => void;
  onGuestPress: () => void;
};

// Trimmed version of /assets/images/logo-voiceguide-airlink.png
// (original has a lot of empty canvas around the mark; this crop
// lets the logo render bigger without an oversized bounding box).
const logo = require("../assets/images/logo-voiceguide-airlink-trimmed.png");

function useSpring() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.93, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 9 }).start();
  return { scale, onPressIn, onPressOut };
}

export default function HomeScreen({ onGuidePress, onGuestPress }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const guideSpring = useSpring();
  const guestSpring = useSpring();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* MAIN */}
        <View style={styles.main}>
          {/* TOP: Logo */}
          <View style={styles.topSection}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>{t("home.tagline")}</Text>
          </View>

          {/* MIDDLE: Role selection */}
          <View style={styles.middleSection}>
            <Text style={styles.subtitle}>{t("home.chooseRole")}</Text>

            <Animated.View style={[styles.buttonMargin, { transform: [{ scale: guideSpring.scale }] }]}>
              <View style={styles.shadowStack}>
                <View style={[styles.fakeShadow, styles.fakeShadowGuide]} />
                <Pressable
                  style={[styles.buttonInner, styles.buttonGuide]}
                  onPress={onGuidePress}
                  onPressIn={guideSpring.onPressIn}
                  onPressOut={guideSpring.onPressOut}
                >
                  <Text style={styles.buttonGuideText}>{t("home.guideTitle")}</Text>
                  <Text style={styles.buttonHelper}>{t("home.guideHelper")}</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View style={[styles.buttonMargin, { transform: [{ scale: guestSpring.scale }] }]}>
              <View style={styles.shadowStack}>
                <View style={[styles.fakeShadow, styles.fakeShadowGuest]} />
                <Pressable
                  style={[styles.buttonInner, styles.buttonGuest]}
                  onPress={onGuestPress}
                  onPressIn={guestSpring.onPressIn}
                  onPressOut={guestSpring.onPressOut}
                >
                  <Text style={styles.buttonGuestText}>{t("home.guestTitle")}</Text>
                  <Text style={styles.buttonHelperLight}>{t("home.guestHelper")}</Text>
                </Pressable>
              </View>
            </Animated.View>
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
    marginBottom: 28,
  },
  logo: {
    width: 220,
    height: 161, // matches trimmed logo's aspect ratio (924x678)
  },
  tagline: {
    marginTop: 10,
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
    marginBottom: 22,
  },

  buttonMargin: {
    width: "100%",
    marginVertical: 9,
  },
  // Android's native drop shadow (elevation/shadow*) renders unreliably
  // here — a stray notch appears at one rounded corner no matter how the
  // layers are split. Faking it instead: a flat, solid-color rounded
  // rectangle sits behind the button, offset down, as its "shadow". No
  // native shadow rendering involved, so no corner glitch on any device.
  shadowStack: {
    position: "relative",
  },
  fakeShadow: {
    position: "absolute",
    top: 5,
    left: 0,
    right: 0,
    bottom: -5,
    borderRadius: 16,
  },
  fakeShadowGuide: {
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  fakeShadowGuest: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  buttonInner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGuide: {
    backgroundColor: colors.brandYellow,
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
