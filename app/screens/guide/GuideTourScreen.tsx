// app/screens/guide/GuideTourScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { apiGetSessionStatus } from "../../config/api";
import { colors, fontSize, fontWeight } from "../../theme";
import { showAlert } from "../../components/alertBridge";

type Props = {
  sessionId: string;
  pin: string;
  maxGuests: number;
  onStartBroadcast: () => void;
  onStopBroadcast: () => void;
  onEnd: () => void;
};

export default function GuideTourScreen({
  sessionId,
  pin,
  maxGuests,
  onStartBroadcast,
  onStopBroadcast,
  onEnd,
}: Props) {
  const { t } = useTranslation();
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
    showAlert(
      t("guideTour.confirmEndTitle"),
      t("guideTour.confirmEndBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("guideTour.endTour"), style: "destructive", onPress: onEnd },
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

      showAlert(t("guideTour.endedTitle"), t("guideTour.endedBody"));
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

  const statusLabel = isBroadcasting ? t("guideTour.statusOnAir") : t("guideTour.statusReady");
  const statusColor = isBroadcasting ? colors.success : colors.gray400;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      {/* CONTENT (scrollable) */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("guideTour.title")}</Text>
          <Text style={styles.subtitle}>{t("guideTour.subtitle")}</Text>

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
              <Text style={styles.label}>{t("guideTour.pinLabel")}</Text>
              <Text style={styles.value}>{pin}</Text>
              <Text style={styles.helperText}>{t("guideTour.pinHelper")}</Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.infoBlock}>
              <Text style={styles.label}>{t("guideTour.guestsLabel")}</Text>
              <Text style={styles.value}>
                {currentGuests} / {maxGuests}
              </Text>
              <Text style={styles.helperText}>{t("guideTour.guestsHelper")}</Text>
            </View>
          </View>

          <View style={styles.dividerHorizontal} />

          <View style={styles.countdownBlock}>
            <Text style={styles.label}>{t("guideTour.countdownLabel")}</Text>
            <Text style={styles.countdownValue}>
              {formatSeconds(remainingSeconds)}
            </Text>
            <Text style={styles.helperText}>{t("guideTour.countdownHelper")}</Text>
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
            {isBroadcasting ? t("guideTour.stopBroadcasting") : t("guideTour.startBroadcasting")}
          </Text>
        </Pressable>

        <Pressable style={styles.endButton} onPress={confirmEndTour}>
          <Text style={styles.endButtonText}>{t("guideTour.endTour")}</Text>
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
    paddingTop: 18, // meno vuoto sopra rispetto a 28
    paddingBottom: 0,
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
    fontSize: fontSize.md,
    color: colors.gray500,
  },
  value: {
    marginTop: 6,
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    color: colors.brandBlack,
  },
  countdownValue: {
    marginTop: 6,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.black,
    color: colors.brandBlack,
  },
  helperText: {
    marginTop: 6,
    fontSize: fontSize.xs,
    color: colors.gray400,
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.dockBorder,
  },

  broadcastButton: {
    backgroundColor: colors.brandYellow,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  broadcastButtonActive: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brandBlack,
    shadowOpacity: 0.0,
    elevation: 0,
  },
  broadcastButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extraBold,
    color: colors.brandBlack,
  },
  broadcastButtonTextActive: {
    color: colors.brandBlack,
  },

  endButton: {
    marginTop: 12,
    backgroundColor: colors.danger,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  endButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extraBold,
  },
});
