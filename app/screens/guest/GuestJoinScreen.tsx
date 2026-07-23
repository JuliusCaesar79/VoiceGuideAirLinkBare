// app/screens/guest/GuestJoinScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { apiJoinPin } from "../../config/api";
import { colors, fontSize, fontWeight } from "../../theme";

type Props = {
  onJoin: (payload: {
    pin: string;
    listenerId: string | null;
    sessionId: string | null;
  }) => void;
  onBack: () => void;
};

export default function GuestJoinScreen({ onJoin, onBack }: Props) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const trimmed = pin.trim();
    if (!trimmed) {
      setError("Please enter the PIN code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiJoinPin(trimmed);

      const listenerId: string | null = res?.id ?? null;
      const sessionId: string | null = res?.session_id ?? null;

      Alert.alert(
        "Joined tour",
        `You are now connected to the tour.\nPIN: ${trimmed}\nListener ID: ${
          listenerId || "n/a"
        }`
      );

      onJoin({
        pin: trimmed,
        listenerId,
        sessionId,
      });
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to join the tour. Please check the PIN and try again."
      );
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
          <Text style={styles.backText}>← Back to Home</Text>
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
            <Text style={styles.title}>Enter Tour PIN</Text>
            <Text style={styles.subtitle}>
              Type the PIN code you received from your guide to join the tour.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. 006BT9"
              placeholderTextColor={colors.gray400}
              keyboardType="default"
              autoCapitalize="characters"
              value={pin}
              onChangeText={(t) => {
                setPin(t);
                if (error) setError(null);
              }}
              maxLength={8}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.helperText}>
              Don&apos;t have a PIN? Ask your tour guide.
            </Text>

            <Pressable
              style={[
                styles.button,
                isDisabled && styles.buttonDisabled,
                !isDisabled && styles.buttonEnabled,
              ]}
              disabled={isDisabled}
              onPress={handleJoin}
            >
              <Text
                style={[
                  styles.buttonText,
                  isDisabled && styles.buttonTextDisabled,
                ]}
              >
                {loading ? "Joining…" : "Join Tour"}
              </Text>
            </Pressable>
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

  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // Stato attivo: giallo pieno
  buttonEnabled: {
    backgroundColor: colors.brandYellow,
    opacity: 1,
  },

  // Stato disabilitato: NON “slavato” giallo, ma neutro elegante
  buttonDisabled: {
    backgroundColor: colors.gray100,
    shadowOpacity: 0,
    elevation: 0,
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
