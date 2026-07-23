// app/screens/ActivateLicenseScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { apiActivateLicense } from "../config/api";
import { colors, fontSize, fontWeight } from "../theme";

type Props = {
  onActivated: (payload: { code: string; maxGuests?: number | null }) => void;
  onBack: () => void;
};

export default function ActivateLicenseScreen({ onActivated, onBack }: Props) {
  const { t } = useTranslation();
  const [licenseCode, setLicenseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxGuests, setMaxGuests] = useState<number | null>(null);

  const handleActivate = async () => {
    const trimmed = licenseCode.trim();
    setError(null);

    if (!trimmed) {
      setError(t("activateLicense.errorEmpty"));
      return;
    }

    setLoading(true);

    try {
      const res = await apiActivateLicense(trimmed);

      const remaining =
        typeof res?.remaining_minutes === "number"
          ? t("activateLicense.remainingMinutes", { minutes: res.remaining_minutes })
          : t("common.unknown");

      const guestsFromApi =
        typeof res?.max_guests === "number" ? res.max_guests : null;

      setMaxGuests(guestsFromApi);

      const finalCode: string = res?.code || trimmed;

      onActivated({ code: finalCode, maxGuests: guestsFromApi });

      Alert.alert(
        t("activateLicense.successTitle"),
        t("activateLicense.successBody", {
          code: finalCode,
          remaining,
          guestsLine: guestsFromApi
            ? t("activateLicense.maxGuestsLine", { maxGuests: guestsFromApi })
            : "",
        })
      );
    } catch (err: any) {
      setError(err?.message || t("activateLicense.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !licenseCode.trim();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>{t("common.backToHome")}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* MAIN CONTENT */}
          <View style={styles.cardWrap}>
            <Text style={styles.title}>{t("activateLicense.title")}</Text>

            <Text style={styles.subtitle}>{t("activateLicense.subtitle")}</Text>

            {maxGuests !== null && (
              <View style={styles.capacityCard}>
                <Text style={styles.capacityLabel}>
                  {t("activateLicense.capacityLabel")}
                </Text>
                <Text style={styles.capacityValue}>
                  {t("activateLicense.capacityValue", { maxGuests })}
                </Text>
                <Text style={styles.capacityHelper}>
                  {t("activateLicense.capacityHelper")}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={t("activateLicense.placeholder")}
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              autoCorrect={false}
              value={licenseCode}
              onChangeText={(text) => {
                setLicenseCode(text);
                if (error) setError(null);
              }}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={handleActivate}
              disabled={isDisabled}
            >
              <Text style={styles.buttonText}>
                {loading ? t("activateLicense.activating") : t("activateLicense.activate")}
              </Text>
            </Pressable>

            <Text style={styles.helperText}>{t("activateLicense.helper")}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },

  /* HEADER: always pushed down, never glued to top */
  header: {
    paddingHorizontal: 32,
    backgroundColor: colors.white,

    minHeight: 64,          // ⭐ key line: moves Back to Home down
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  backText: {
    fontSize: fontSize.base,
    color: colors.brandBlack,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 26,
    justifyContent: "center",
  },

  cardWrap: {
    alignItems: "center",
  },

  title: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray500,
    marginBottom: 22,
    textAlign: "center",
    lineHeight: 20,
  },

  capacityCard: {
    width: "100%",
    backgroundColor: colors.highlightYellow,
    borderColor: colors.brandYellow,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: "center",
  },
  capacityLabel: {
    fontSize: fontSize.md,
    color: colors.gray500,
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
  },
  capacityHelper: {
    marginTop: 6,
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: "center",
    lineHeight: 16,
  },

  input: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.brandYellow,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: fontSize.lg,
    color: colors.brandBlack,
    marginBottom: 10,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.base,
    marginBottom: 10,
    textAlign: "center",
  },

  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: colors.brandYellow,
    marginTop: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.brandBlack,
    fontWeight: fontWeight.extraBold,
    fontSize: fontSize.lg,
  },

  helperText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 16,
  },
});
