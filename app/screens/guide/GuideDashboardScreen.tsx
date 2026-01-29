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

import { apiStartSession } from "../../config/api";

type Props = {
  maxGuests: number;
  licenseCode: string;
  // Passiamo PIN e sessionId al padre (App.tsx)
  onStartTour: (pin: string, sessionId: string | null) => void;
  onDebug?: () => void;
  onBack: () => void;
};

const BRAND_YELLOW = "#FFC226";
const BRAND_BLACK = "#000000";

export default function GuideDashboardScreen({
  maxGuests,
  licenseCode,
  onStartTour,
  onBack,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleStartSession = async () => {
    setError(null);

    if (!licenseCode) {
      setError(
        "Missing active license. Please activate your license again from the home screen."
      );
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
        "Tour started",
        `Session started successfully.\nPIN: ${pin}\nMax guests: ${maxGuests}`
      );

      onStartTour(pin, sessionId);
    } catch (err: any) {
      setError(err?.message || "Unable to start a new tour at the moment.");
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
          <Text style={styles.backText}>← Back to Home</Text>
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
            <Text style={styles.title}>Guide Dashboard</Text>
            <Text style={styles.subtitle}>
              Check your license and start a new tour.
            </Text>
          </View>

          {/* LICENSE CARD */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Active License</Text>
            <Text style={styles.cardValue}>Up to {maxGuests} guests</Text>
            <Text style={styles.cardHelper}>
              This is the maximum number of guests allowed for your current
              license.
            </Text>
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
                {loading ? "Starting…" : "Start New Tour"}
              </Text>
            </Pressable>
          </View>

          {/* CURRENT SESSION INFO (PIN) */}
          {currentPin && (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionLabel}>Current Tour PIN</Text>
              <Text style={styles.sessionPin}>{currentPin}</Text>

              {currentSessionId && (
                <Text style={styles.sessionHelper}>
                  Session ID: {currentSessionId}
                </Text>
              )}

              <Text style={styles.sessionHelper}>
                Share this PIN with your guests so they can join the tour.
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
    backgroundColor: "#FFFFFF",
  },

  // Header spinto leggermente in basso, come “standard” campagna UI
  header: {
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
    minHeight: 64,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  backText: {
    color: BRAND_BLACK,
    fontSize: 13,
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
    fontSize: 30,
    fontWeight: "800",
    color: BRAND_BLACK,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFF8E5",
    borderColor: BRAND_YELLOW,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "800",
    color: BRAND_BLACK,
  },
  cardHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },

  actions: {
    width: "100%",
    marginBottom: 14,
  },

  error: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },

  buttonPrimary: {
    backgroundColor: BRAND_YELLOW,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimaryText: {
    color: BRAND_BLACK,
    fontSize: 18,
    fontWeight: "800",
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
    borderColor: BRAND_BLACK,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  sessionLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  sessionPin: {
    fontSize: 30,
    fontWeight: "900",
    color: BRAND_BLACK,
  },
  sessionHelper: {
    marginTop: 6,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
});
