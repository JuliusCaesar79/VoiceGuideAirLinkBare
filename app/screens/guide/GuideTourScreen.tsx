// app/screens/guide/GuideTourScreen.tsx

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
import { apiGetSessionStatus } from "../../config/api";

type Props = {
  sessionId: string;
  pin: string;
  maxGuests: number;
  onStartBroadcast: () => void;
  onStopBroadcast: () => void;
  onEnd: () => void;
};

const BRAND_YELLOW = "#FFC226";
const BRAND_BLACK = "#000000";

export default function GuideTourScreen({
  sessionId,
  pin,
  maxGuests,
  onStartBroadcast,
  onStopBroadcast,
  onEnd,
}: Props) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentGuests, setCurrentGuests] = useState(0);

  // Tempo residuo in secondi (verità locale, riallineata dal backend)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Helper per formattare il countdown (mm:ss o hh:mm:ss)
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

  const handleToggleBroadcast = () => {
    if (!isBroadcasting) {
      onStartBroadcast();
      setIsBroadcasting(true);
    } else {
      onStopBroadcast();
      setIsBroadcasting(false);
    }
  };

  const confirmEndTour = () => {
    Alert.alert(
      "End tour?",
      "This will close the live session for everyone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Tour", style: "destructive", onPress: onEnd },
      ]
    );
  };

  /**
   * Polling stato sessione (ospiti + tempo residuo) ogni 5 secondi
   * + countdown locale fluido ogni 1 secondo.
   */
  useEffect(() => {
    if (!sessionId) return;

    let pollingInterval: any;
    let tickInterval: any;
    let ended = false; // per evitare doppie chiamate a onEnd

    const handleSessionEnded = () => {
      if (ended) return;
      ended = true;

      if (pollingInterval) clearInterval(pollingInterval);
      if (tickInterval) clearInterval(tickInterval);

      if (isBroadcasting) {
        onStopBroadcast();
        setIsBroadcasting(false);
      }

      Alert.alert(
        "Session ended",
        "Your tour session has expired or was closed."
      );
      onEnd();
    };

    const fetchStatus = async () => {
      try {
        const status = await apiGetSessionStatus(sessionId);

        setCurrentGuests(status.current_listeners ?? 0);

        const backendRemaining =
          typeof status.remaining_seconds === "number"
            ? status.remaining_seconds
            : null;
        setRemainingSeconds(backendRemaining);

        if (!status.is_active) {
          handleSessionEnded();
        }
      } catch (err) {
        console.log("Error fetching session status:", err);
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
  }, [sessionId, isBroadcasting, onEnd, onStopBroadcast]);

  const statusLabel = isBroadcasting ? "ON AIR" : "READY";
  const statusColor = isBroadcasting ? "#16A34A" : "#9CA3AF";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      {/* CONTENT (scrollable) */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Live Tour</Text>
          <Text style={styles.subtitle}>Start real-time audio for your group.</Text>

          {/* STATUS BADGE */}
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* INFO CARD */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Tour PIN</Text>
              <Text style={styles.value}>{pin}</Text>
              <Text style={styles.helperText}>Share this PIN with your guests.</Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Guests</Text>
              <Text style={styles.value}>
                {currentGuests} / {maxGuests}
              </Text>
              <Text style={styles.helperText}>
                Maximum allowed by your license.
              </Text>
            </View>
          </View>

          <View style={styles.dividerHorizontal} />

          <View style={styles.countdownBlock}>
            <Text style={styles.label}>Countdown</Text>
            <Text style={styles.countdownValue}>
              {formatSeconds(remainingSeconds)}
            </Text>
            <Text style={styles.helperText}>
              Time remaining for this session.
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
            styles.broadcastButton,
            isBroadcasting && styles.broadcastButtonActive,
          ]}
          onPress={handleToggleBroadcast}
        >
          <Text
            style={[
              styles.broadcastButtonText,
              isBroadcasting && styles.broadcastButtonTextActive,
            ]}
          >
            {isBroadcasting ? "Stop Broadcasting" : "Start Broadcasting"}
          </Text>
        </Pressable>

        <Pressable style={styles.endButton} onPress={confirmEndTour}>
          <Text style={styles.endButtonText}>End Tour</Text>
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
    paddingTop: 18, // meno vuoto sopra rispetto a 28
    paddingBottom: 0,
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
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  infoBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    marginHorizontal: 6,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    marginTop: 14,
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    color: "#6B7280",
  },
  value: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "900",
    color: BRAND_BLACK,
  },
  countdownValue: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "900",
    color: BRAND_BLACK,
  },
  helperText: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 15,
  },

  countdownBlock: {
    alignItems: "center",
  },

  // ✅ Fixed action dock
  dock: {
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 16, // SafeAreaView edges bottom adds extra when needed
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },

  broadcastButton: {
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
  broadcastButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: BRAND_BLACK,
    shadowOpacity: 0.0,
    elevation: 0,
  },
  broadcastButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_BLACK,
  },
  broadcastButtonTextActive: {
    color: BRAND_BLACK,
  },

  endButton: {
    marginTop: 12,
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  endButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
