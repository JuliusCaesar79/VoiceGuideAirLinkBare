// app/screens/guide/GuideDashboardScreen.tsx

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { apiStartSession } from "../../config/api";
import { colors, fontSize, fontWeight } from "../../theme";
import { showAlert } from "../../components/alertBridge";

type Props = {
  maxGuests: number;
  licenseCode: string;
  // Passiamo PIN e sessionId al padre (App.tsx)
  onStartTour: (pin: string, sessionId: string | null) => void;
  onDebug?: () => void;
  onBack: () => void;
};

function useSpring() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.93, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 9 }).start();
  return { scale, onPressIn, onPressOut };
}

export default function GuideDashboardScreen({
  maxGuests,
  licenseCode,
  onStartTour,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonSpring = useSpring();

  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleStartSession = async () => {
    setError(null);

    if (!licenseCode) {
      setError(t("guideDashboard.errorMissingLicense"));
      return;
    }

    setLoading(true);

    try {
      const res = await apiStartSession(licenseCode, maxGuests);

      const pin: string = res?.pin || "N/A";
      const sessionId: string | null = res?.id || null;

      setCurrentPin(pin);
      setCurrentSessionId(sessionId);

      showAlert(
        t("guideDashboard.successTitle"),
        t("guideDashboard.successBody", { pin, maxGuests })
      );

      onStartTour(pin, sessionId);
    } catch (err: any) {
      setError(err?.message || t("guideDashboard.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      {/* HEADER (top) */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>{t("common.backToHome")}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* MAIN */}
        <View style={styles.main}>
          {/* TITLE */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{t("guideDashboard.title")}</Text>
            <Text style={styles.subtitle}>{t("guideDashboard.subtitle")}</Text>
          </View>

          {/* LICENSE CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t("guideDashboard.cardLabel")}</Text>
            <Text style={styles.cardValue}>
              {t("guideDashboard.cardValue", { maxGuests })}
            </Text>
            <Text style={styles.cardHelper}>{t("guideDashboard.cardHelper")}</Text>
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            {error && <Text style={styles.error}>{error}</Text>}

            <Animated.View style={{ width: "100%", transform: [{ scale: buttonSpring.scale }] }}>
              <View style={styles.shadowStack}>
                <View style={[styles.fakeShadow, isDisabled && styles.fakeShadowDisabled]} />
                <Pressable
                  style={[styles.buttonPrimary, isDisabled && styles.buttonDisabled]}
                  onPress={handleStartSession}
                  onPressIn={buttonSpring.onPressIn}
                  onPressOut={buttonSpring.onPressOut}
                  disabled={isDisabled}
                >
                  <Text style={styles.buttonPrimaryText}>
                    {loading ? t("guideDashboard.starting") : t("guideDashboard.startTour")}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>

          {/* CURRENT SESSION INFO (PIN) */}
          {currentPin && (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>{t("guideDashboard.sessionLabel")}</Text>
              <Text style={styles.sessionPin}>{currentPin}</Text>

              {currentSessionId && (
                <Text style={styles.sessionHelper}>
                  {t("guideDashboard.sessionIdLine", { id: currentSessionId })}
                </Text>
              )}

              <Text style={styles.sessionHelper}>
                {t("guideDashboard.sessionHelper")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header spinto leggermente in basso, come “standard” campagna UI
  header: {
    paddingHorizontal: 32,
    backgroundColor: colors.white,
    minHeight: 64,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  backText: {
    color: colors.brandBlack,
    fontSize: fontSize.base,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 26,
    justifyContent: "center",
  },

  main: {
    alignItems: "center",
  },

  titleBlock: {
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray500,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  card: {
    width: "100%",
    backgroundColor: colors.highlightYellow,
    borderColor: colors.brandYellow,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: fontSize.md,
    color: colors.gray500,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
  },
  cardHelper: {
    marginTop: 8,
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: "center",
    lineHeight: 16,
  },

  actions: {
    width: "100%",
    marginBottom: 14,
  },

  error: {
    color: colors.danger,
    fontSize: fontSize.base,
    marginBottom: 10,
    textAlign: "center",
  },

  // Flat offset "fake shadow" instead of native elevation/shadow* — Android's
  // native drop shadow rendered an unreliable corner glitch (see HomeScreen).
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
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  fakeShadowDisabled: {
    opacity: 0.6,
  },
  buttonPrimary: {
    backgroundColor: colors.brandYellow,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: colors.brandBlack,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extraBold,
  },
  buttonDisabled: {
    opacity: 0.75,
  },

  sessionCard: {
    width: "100%",
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.brandBlack,
    backgroundColor: colors.gray50,
    alignItems: "center",
  },
  sessionLabel: {
    fontSize: fontSize.md,
    color: colors.gray500,
    marginBottom: 4,
  },
  sessionPin: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.black,
    color: colors.brandBlack,
  },
  sessionHelper: {
    marginTop: 6,
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: "center",
    lineHeight: 16,
  },
});
