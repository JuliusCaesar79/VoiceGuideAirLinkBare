// app/screens/guest/GuestTourScreen.tsx

import React, { useState, useEffect, useRef } from "react";
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
import { apiGetSessionStatus, apiLeaveListener } from "../../config/api";
import { colors, fontSize, fontWeight } from "../../theme";
import { showAlert } from "../../components/alertBridge";

type Props = {
  pin: string;
  sessionId: string;
  listenerId: string | null;
  onLeave: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
};

function useSpring() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.93, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 9 }).start();
  return { scale, onPressIn, onPressOut };
}

export default function GuestTourScreen({
  pin,
  sessionId,
  listenerId,
  onLeave,
  onStartListening,
  onStopListening,
}: Props) {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const listenSpring = useSpring();

  const formatSeconds = (sec: number | null) => {
    if (sec === null || sec < 0) return "--:--";

    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStartListening = () => {
    if (!isListening) {
      onStartListening();
      setIsListening(true);
    }
  };

  const handleStopListening = () => {
    if (isListening) {
      onStopListening();
      setIsListening(false);
    }
  };

  const handleLeave = async () => {
    // Ferma l’ascolto audio
    if (isListening) {
      onStopListening();
      setIsListening(false);
    }

    // Notifica il backend che questo listener ha lasciato
    if (listenerId) {
      try {
        await apiLeaveListener(listenerId);
      } catch (err) {
        console.log("Error calling apiLeaveListener:", err);
      }
    }

    onLeave();
  };

  const confirmLeave = () => {
    showAlert(t("guestTour.confirmLeaveTitle"), t("guestTour.confirmLeaveBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("guestTour.leaveTour"), style: "destructive", onPress: handleLeave },
    ]);
  };

  // Polling stato sessione + countdown fluido
  useEffect(() => {
    if (!sessionId) return;

    let pollingInterval: any;
    let tickInterval: any;
    let ended = false;

    const handleSessionEnded = () => {
      if (ended) return;
      ended = true;

      if (pollingInterval) clearInterval(pollingInterval);
      if (tickInterval) clearInterval(tickInterval);

      if (isListening) {
        onStopListening();
        setIsListening(false);
      }

      showAlert(t("guestTour.endedTitle"), t("guestTour.endedBody"));
      onLeave();
    };

    const fetchStatus = async () => {
      try {
        const status = await apiGetSessionStatus(sessionId);

        const backendRemaining =
          typeof status.remaining_seconds === "number"
            ? status.remaining_seconds
            : null;
        setRemainingSeconds(backendRemaining);

        if (!status.is_active) {
          handleSessionEnded();
        }
      } catch (err) {
        console.log("Error fetching session status (guest):", err);
      }
    };

    fetchStatus();
    pollingInterval = setInterval(fetchStatus, 5000);

    tickInterval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (tickInterval) clearInterval(tickInterval);
    };
  }, [sessionId, isListening, onStopListening, onLeave]);

  const statusLabel = isListening ? t("guestTour.statusListening") : t("guestTour.statusReady");
  const statusColor = isListening ? colors.success : colors.gray400;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      {/* CONTENT (scrollable) */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("guestTour.title")}</Text>
          <Text style={styles.subtitle}>{t("guestTour.subtitle")}</Text>

          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>{t("guestTour.pinLabel")}</Text>
          <Text style={styles.pinValue}>{pin}</Text>

          <Text style={styles.helperText}>{t("guestTour.connectedHelper")}</Text>

          <View style={styles.dividerHorizontal} />

          <View style={styles.countdownBlock}>
            <Text style={styles.label}>{t("guestTour.timeRemainingLabel")}</Text>
            <Text style={styles.countdownValue}>
              {formatSeconds(remainingSeconds)}
            </Text>
            <Text style={styles.helperText}>{t("guestTour.timeRemainingHelper")}</Text>
          </View>
        </View>

        {/* Spacer so content never hides behind the dock */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ACTION DOCK (fixed, safe above navbar) */}
      <View style={styles.dock}>
        <Animated.View style={{ transform: [{ scale: listenSpring.scale }] }}>
          <View style={styles.shadowStack}>
            <View
              style={[
                styles.fakeShadow,
                isListening && styles.fakeShadowLight,
              ]}
            />
            <Pressable
              style={[
                styles.listenButton,
                isListening && styles.listenButtonActive,
              ]}
              onPress={isListening ? handleStopListening : handleStartListening}
              onPressIn={listenSpring.onPressIn}
              onPressOut={listenSpring.onPressOut}
            >
              <Text
                style={[
                  styles.listenButtonText,
                  isListening && styles.listenButtonTextActive,
                ]}
              >
                {isListening ? t("guestTour.stopListening") : t("guestTour.startListening")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Pressable style={styles.leaveButton} onPress={confirmLeave}>
          <Text style={styles.leaveButtonText}>{t("guestTour.leaveTour")}</Text>
        </Pressable>
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
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 18,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: fontSize.md,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 20,
  },

  statusBadge: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },

  card: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.brandYellow,
    backgroundColor: colors.highlightYellow,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  label: {
    fontSize: fontSize.md,
    color: colors.gray500,
  },

  pinValue: {
    marginTop: 6,
    fontSize: fontSize.displayLg,
    fontWeight: fontWeight.black,
    color: colors.brandBlack,
    letterSpacing: 1,
  },

  helperText: {
    marginTop: 8,
    fontSize: fontSize.xs,
    color: colors.gray400,
    textAlign: "center",
    lineHeight: 15,
  },

  dividerHorizontal: {
    height: 1,
    width: "100%",
    backgroundColor: colors.dividerLight,
    marginTop: 14,
    marginBottom: 14,
  },

  countdownBlock: {
    alignItems: "center",
  },

  countdownValue: {
    marginTop: 6,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.black,
    color: colors.brandBlack,
  },

  // ✅ Fixed action dock
  dock: {
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.dockBorder,
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
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  fakeShadowLight: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  listenButton: {
    backgroundColor: colors.brandYellow,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  listenButtonActive: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brandBlack,
  },
  listenButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
  },
  listenButtonTextActive: {
    color: colors.brandBlack,
  },

  leaveButton: {
    marginTop: 12,
    backgroundColor: colors.danger,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extraBold,
  },
});
