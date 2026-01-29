// app/screens/guest/GuestTourScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiGetSessionStatus, apiLeaveListener } from "../../config/api";

type Props = {
  pin: string;
  sessionId: string;
  listenerId: string | null;
  onLeave: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
};

const BRAND_YELLOW = "#FFC226";
const BRAND_BLACK = "#000000";

export default function GuestTourScreen({
  pin,
  sessionId,
  listenerId,
  onLeave,
  onStartListening,
  onStopListening,
}: Props) {
  const [isListening, setIsListening] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

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
    Alert.alert("Leave tour?", "You will stop listening and exit the session.", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave Tour", style: "destructive", onPress: handleLeave },
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

      Alert.alert(
        "Tour ended",
        "This tour session has expired or was closed by the guide."
      );
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

  const statusLabel = isListening ? "LISTENING" : "READY";
  const statusColor = isListening ? "#16A34A" : "#9CA3AF";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      {/* CONTENT (scrollable) */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Guest Tour</Text>
          <Text style={styles.subtitle}>Listen to your guide in real time.</Text>

          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Tour PIN</Text>
          <Text style={styles.pinValue}>{pin}</Text>

          <Text style={styles.helperText}>
            You are connected to this tour. Keep this screen open while listening.
          </Text>

          <View style={styles.dividerHorizontal} />

          <View style={styles.countdownBlock}>
            <Text style={styles.label}>Time remaining</Text>
            <Text style={styles.countdownValue}>
              {formatSeconds(remainingSeconds)}
            </Text>
            <Text style={styles.helperText}>
              When time runs out, the tour will end automatically.
            </Text>
          </View>
        </View>

        {/* Spacer so content never hides behind the dock */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ACTION DOCK (fixed, safe above navbar) */}
      <View style={styles.dock}>
        <Pressable
          style={[
            styles.listenButton,
            isListening && styles.listenButtonActive,
          ]}
          onPress={isListening ? handleStopListening : handleStartListening}
        >
          <Text
            style={[
              styles.listenButtonText,
              isListening && styles.listenButtonTextActive,
            ]}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </Text>
        </Pressable>

        <Pressable style={styles.leaveButton} onPress={confirmLeave}>
          <Text style={styles.leaveButtonText}>Leave Tour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    fontSize: 30,
    fontWeight: "800",
    color: BRAND_BLACK,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
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
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  card: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BRAND_YELLOW,
    backgroundColor: "#FFF8E5",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  label: {
    fontSize: 14,
    color: "#6B7280",
  },

  pinValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "900",
    color: BRAND_BLACK,
    letterSpacing: 1,
  },

  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 15,
  },

  dividerHorizontal: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.10)",
    marginTop: 14,
    marginBottom: 14,
  },

  countdownBlock: {
    alignItems: "center",
  },

  countdownValue: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "900",
    color: BRAND_BLACK,
  },

  // ✅ Fixed action dock
  dock: {
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },

  listenButton: {
    backgroundColor: BRAND_YELLOW,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  listenButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: BRAND_BLACK,
    shadowOpacity: 0.0,
    elevation: 0,
  },
  listenButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_BLACK,
  },
  listenButtonTextActive: {
    color: BRAND_BLACK,
  },

  leaveButton: {
    marginTop: 12,
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
