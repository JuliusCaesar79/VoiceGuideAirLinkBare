// app/screens/guest/GuestJoinScreen.tsx

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { apiJoinPin } from "../../config/api";
import { colors, fontSize, fontWeight } from "../../theme";
import { showAlert } from "../../components/alertBridge";

type Props = {
  onJoin: (payload: {
    pin: string;
    listenerId: string | null;
    sessionId: string | null;
  }) => void;
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

export default function GuestJoinScreen({ onJoin, onBack }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonSpring = useSpring();

  const handleJoin = async () => {
    const trimmed = pin.trim();
    if (!trimmed) {
      setError(t("guestJoin.errorEmpty"));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiJoinPin(trimmed);

      const listenerId: string | null = res?.id ?? null;
      const sessionId: string | null = res?.session_id ?? null;

      showAlert(
        t("guestJoin.successTitle"),
        t("guestJoin.successBody", {
          pin: trimmed,
          listenerId: listenerId || t("guestJoin.notAvailable"),
        })
      );

      onJoin({
        pin: trimmed,
        listenerId,
        sessionId,
      });
    } catch (err: any) {
      setError(err?.message || t("guestJoin.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const normalizedPin = pin.replace(/\s+/g, "");
  const isValidLikePin = normalizedPin.length >= 4; // soglia “minima” UX
  const isDisabled = loading || !isValidLikePin;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
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
          <View style={styles.content}>
            <Text style={styles.title}>{t("guestJoin.title")}</Text>
            <Text style={styles.subtitle}>{t("guestJoin.subtitle")}</Text>

            <TextInput
              style={styles.input}
              placeholder={t("guestJoin.placeholder")}
              placeholderTextColor={colors.gray400}
              keyboardType="default"
              autoCapitalize="characters"
              value={pin}
              onChangeText={(text) => {
                setPin(text);
                if (error) setError(null);
              }}
              maxLength={8}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.helperText}>{t("guestJoin.helper")}</Text>

            <Animated.View style={{ width: "100%", transform: [{ scale: buttonSpring.scale }] }}>
              <View style={styles.shadowStack}>
                <View style={[styles.fakeShadow, isDisabled && styles.fakeShadowHidden]} />
                <Pressable
                  style={[
                    styles.button,
                    isDisabled && styles.buttonDisabled,
                    !isDisabled && styles.buttonEnabled,
                  ]}
                  disabled={isDisabled}
                  onPress={handleJoin}
                  onPressIn={buttonSpring.onPressIn}
                  onPressOut={buttonSpring.onPressOut}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDisabled && styles.buttonTextDisabled,
                    ]}
                  >
                    {loading ? t("guestJoin.joining") : t("guestJoin.join")}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
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

  // ⭐ Header standard: spinge giù “Back to Home” senza rischi navbar
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
    fontSize: fontSize.base,
    color: colors.brandBlack,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 26,
    justifyContent: "center",
  },

  content: {
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

  input: {
    width: "100%",
    borderWidth: 2,
    borderColor: colors.brandYellow,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    fontSize: fontSize.xxl,
    textAlign: "center",
    marginBottom: 10,
    color: colors.brandBlack,
  },

  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginBottom: 10,
    textAlign: "center",
  },

  helperText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    marginBottom: 22,
    textAlign: "center",
    lineHeight: 16,
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
  fakeShadowHidden: {
    opacity: 0,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Stato attivo: giallo pieno
  buttonEnabled: {
    backgroundColor: colors.brandYellow,
    opacity: 1,
  },

  // Stato disabilitato: NON “slavato” giallo, ma neutro elegante
  buttonDisabled: {
    backgroundColor: colors.gray100,
  },

  buttonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
  },
  buttonTextDisabled: {
    color: colors.gray400,
  },
});
