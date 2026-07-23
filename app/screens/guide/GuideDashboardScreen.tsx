// app/screens/guide/GuideDashboardScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { apiStartSession } from "../../config/api";
import { colors, fontSize, fontWeight } from "../../theme";

type Props = {
  maxGuests: number;
  licenseCode: string;
  // Passiamo PIN e sessionId al padre (App.tsx)
  onStartTour: (pin: string, sessionId: string | null) => void;
  onDebug?: () => void;
  onBack: () => void;
};

export default function GuideDashboardScreen({
  maxGuests,
  licenseCode,
  onStartTour,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      Alert.alert(
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

            <Pressable
              style={[styles.buttonPrimary, isDisabled && styles.buttonDisabled]}
              onPress={handleStartSession}
              disabled={isDisabled}
            >
              <Text style={styles.buttonPrimaryText}>
                {loading ? t("guideDashboard.starting") : t("guideDashboard.startTour")}
              </Text>
            </Pressable>
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

  buttonPrimary: {
    backgroundColor: colors.brandYellow,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
