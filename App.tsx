// App.tsx

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./app/HomeScreen";
import ActivateLicenseScreen from "./app/screens/ActivateLicenseScreen";
import GuestJoinScreen from "./app/screens/guest/GuestJoinScreen";
import GuideDashboardScreen from "./app/screens/guide/GuideDashboardScreen";
import GuideTourScreen from "./app/screens/guide/GuideTourScreen";
import GuestTourScreen from "./app/screens/guest/GuestTourScreen";
import { apiEndSession } from "./app/config/api";
import i18n, { initI18n } from "./app/i18n";
import { colors } from "./app/theme";
import { showAlert } from "./app/components/alertBridge";
import CustomAlertHost from "./app/components/CustomAlertHost";

const { VoiceGuideForeground } = NativeModules as any;

// Usato SOLO per la schermata di DEBUG nativa
const DEBUG_CHANNEL_NAME = "test-voice";

type Role = "idle" | "guide" | "guest";
type Screen =
  | "home"
  | "activateLicense"
  | "guestJoin"
  | "guideDashboard"
  | "guideTour"
  | "guestTour"
  | "debugNative";

/**
 * Richiesta permesso microfono per Android.
 */
async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: i18n.t("permissions.micTitle"),
        message: i18n.t("permissions.micMessage"),
        buttonNeutral: i18n.t("permissions.askLater"),
        buttonNegative: i18n.t("common.cancel"),
        buttonPositive: i18n.t("common.ok"),
      }
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else {
      showAlert(
        i18n.t("permissions.requiredTitle"),
        i18n.t("permissions.requiredMessage")
      );
      return false;
    }
  } catch (err) {
    console.warn("Error requesting microphone permission:", err);
    showAlert(i18n.t("common.error"), i18n.t("permissions.errorRequestMic"));
    return false;
  }
}

/**
 * Helper: controlla che il modulo nativo esista.
 */
function ensureNativeModule(): boolean {
  if (!VoiceGuideForeground) {
    console.log("NativeModules:", NativeModules);
    showAlert(i18n.t("common.error"), i18n.t("permissions.nativeModuleMissing"));
    return false;
  }
  return true;
}

/**
 * Helper: avvia broadcast GUIDA con canale dinamico (PIN).
 */
async function startGuideBroadcast(channelName: string | null) {
  const ok = await requestMicPermission();
  if (!ok) return;

  if (!ensureNativeModule()) return;

  if (!channelName) {
    showAlert(i18n.t("common.error"), i18n.t("permissions.missingChannelGuide"));
    return;
  }

  try {
    VoiceGuideForeground.startGuideBroadcast(channelName, null);
  } catch (e) {
    console.error("Error startGuideBroadcast:", e);
    showAlert(i18n.t("common.error"), String(e));
  }
}

/**
 * Helper: avvia ascolto OSPITE con canale dinamico (PIN).
 */
async function startGuestListening(channelName: string | null) {
  const ok = await requestMicPermission();
  if (!ok) return;

  if (!ensureNativeModule()) return;

  if (!channelName) {
    showAlert(i18n.t("common.error"), i18n.t("permissions.missingChannelGuest"));
    return;
  }

  try {
    VoiceGuideForeground.startGuestListening(channelName, null);
  } catch (e) {
    console.error("Error startGuestListening:", e);
    showAlert(i18n.t("common.error"), String(e));
  }
}

/**
 * Helper: ferma il servizio foreground.
 */
function stopForegroundService() {
  if (!VoiceGuideForeground) {
    showAlert(i18n.t("common.error"), i18n.t("permissions.nativeModuleMissing"));
    return;
  }
  try {
    VoiceGuideForeground.stopService();
  } catch (e) {
    console.error("Error stopService:", e);
    showAlert(i18n.t("common.error"), String(e));
  }
}

/**
 * Schermata di DEBUG Nativo (motore Kotlin + Agora)
 */
function NativeDebugScreen(props: { onBack: () => void }) {
  const [role, setRole] = useState<Role>("idle");
  const active = role !== "idle";

  const handleStartGuide = async () => {
    if (active) {
      showAlert(
        "Service already running",
        "Stop the current session with STOP ALL before changing role."
      );
      return;
    }
    // Debug: canale fisso
    await startGuideBroadcast(DEBUG_CHANNEL_NAME);
    setRole("guide");
  };

  const handleStartGuest = async () => {
    if (active) {
      showAlert(
        "Service already running",
        "Stop the current session with STOP ALL before changing role."
      );
      return;
    }
    await startGuestListening(DEBUG_CHANNEL_NAME);
    setRole("guest");
  };

  const handleStop = () => {
    if (!active) return;
    stopForegroundService();
    setRole("idle");
  };

  const renderStatus = () => {
    if (role === "guide") return "Tour status: ON – GUIDA";
    if (role === "guest") return "Tour status: ON – OSPITE";
    return "Tour status: OFF";
  };

  const renderHint = () => {
    if (role === "guide")
      return "Stai trasmettendo come GUIDA sul canale di debug.";
    if (role === "guest")
      return "Stai ascoltando come OSPITE sul canale di debug.";
    return "Seleziona se partire come GUIDA o come OSPITE.";
  };

  return (
    <SafeAreaView style={stylesDebug.container}>
      <View style={stylesDebug.box}>
        <Text style={stylesDebug.title}>VoiceGuide AirLink</Text>
        <Text style={stylesDebug.subtitle}>Native Kotlin audio engine</Text>

        <Text style={stylesDebug.status}>{renderStatus()}</Text>
        <Text style={stylesDebug.channel}>
          Channel (Agora): {DEBUG_CHANNEL_NAME}
        </Text>
        <Text style={stylesDebug.hint}>{renderHint()}</Text>

        <Pressable
          style={[stylesDebug.button, active && stylesDebug.buttonDisabled]}
          onPress={handleStartGuide}
          disabled={active}
        >
          <Text style={stylesDebug.buttonText}>START GUIDE TOUR (AGORA)</Text>
        </Pressable>

        <Pressable
          style={[stylesDebug.button, active && stylesDebug.buttonDisabled]}
          onPress={handleStartGuest}
          disabled={active}
        >
          <Text style={stylesDebug.buttonText}>START GUEST (LISTEN)</Text>
        </Pressable>

        <Pressable
          style={[
            stylesDebug.button,
            stylesDebug.stopButton,
            !active && stylesDebug.buttonDisabled,
          ]}
          onPress={handleStop}
          disabled={!active}
        >
          <Text style={stylesDebug.buttonText}>STOP ALL</Text>
        </Pressable>

        <Pressable
          style={[stylesDebug.button, { marginTop: 20 }]}
          onPress={props.onBack}
        >
          <Text style={stylesDebug.buttonText}>Torna alla Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/**
 * App principale
 */
function AppInner(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("home");

  // OSPITE
  const [guestPin, setGuestPin] = useState<string | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [guestListenerId, setGuestListenerId] = useState<string | null>(null);

  // GUIDA - PIN e sessionId (da apiStartSession)
  const [guidePin, setGuidePin] = useState<string | null>(null);
  const [guideSessionId, setGuideSessionId] = useState<string | null>(null);

  // Licenza attiva: code + maxGuests
  const [activeLicense, setActiveLicense] = useState<{
    code: string;
    maxGuests: number;
  } | null>(null);

  // Handler centralizzato per chiusura tour guida
  const handleGuideEnd = async () => {
    // 1) Ferma audio nativo
    stopForegroundService();

    // 2) Chiama backend per chiudere la sessione
    if (guideSessionId) {
      try {
        await apiEndSession(guideSessionId);
      } catch (err) {
        console.warn("Error calling apiEndSession:", err);
        // Non blocchiamo l'utente: se fallisce il backend, comunque torniamo home
      }
    }

    // 🔥 3) Consuma la licenza lato app: la prossima volta si ripasserà da "Activate License"
    setActiveLicense(null);

    // 4) Pulizia stato guida + ritorno home
    setGuidePin(null);
    setGuideSessionId(null);
    setScreen("home");
  };

  if (screen === "home") {
    return (
      <HomeScreen
        onGuidePress={() => {
          // Se c'è già una licenza attiva → dashboard
          if (activeLicense) {
            setScreen("guideDashboard");
          } else {
            // altrimenti → attivazione licenza
            setScreen("activateLicense");
          }
        }}
        onGuestPress={() => setScreen("guestJoin")}
      />
    );
  }

  if (screen === "activateLicense") {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ActivateLicenseScreen
          onActivated={({ code, maxGuests }) => {
            const guests = maxGuests ?? 10; // fallback di sicurezza (default DB)
            setActiveLicense({ code, maxGuests: guests });
            // dopo attivazione → dashboard
            setScreen("guideDashboard");
          }}
          onBack={() => setScreen("home")}
        />
      </SafeAreaView>
    );
  }

  if (screen === "guideDashboard") {
    // Fallback nel caso rarissimo di assenza licenza in memoria
    const license = activeLicense || { code: "", maxGuests: 10 };

    return (
      <GuideDashboardScreen
        maxGuests={license.maxGuests}
        licenseCode={license.code}
        onStartTour={(pin, sessionId) => {
          setGuidePin(pin);
          setGuideSessionId(sessionId ?? null);
          setScreen("guideTour");
        }}
        onDebug={() => setScreen("debugNative")}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "guideTour") {
    return (
      <GuideTourScreen
        sessionId={guideSessionId ?? ""}
        pin={guidePin ?? "—"}
        maxGuests={activeLicense?.maxGuests ?? 10}
        onStartBroadcast={() => startGuideBroadcast(guidePin)}
        onStopBroadcast={stopForegroundService}
        onEnd={handleGuideEnd}
      />
    );
  }

  if (screen === "guestJoin") {
    return (
      <GuestJoinScreen
        onBack={() => setScreen("home")}
        onJoin={({ pin, listenerId, sessionId }) => {
          console.log(
            "Guest joined:",
            pin,
            "listener=",
            listenerId,
            "session=",
            sessionId
          );
          setGuestPin(pin);
          setGuestListenerId(listenerId ?? null);
          setGuestSessionId(sessionId ?? null);
          setScreen("guestTour");
        }}
      />
    );
  }

  if (screen === "guestTour") {
    return (
      <GuestTourScreen
        pin={guestPin ?? "—"}
        sessionId={guestSessionId ?? ""}
        listenerId={guestListenerId}
        onLeave={() => {
          stopForegroundService();
          setGuestPin(null);
          setGuestSessionId(null);
          setGuestListenerId(null);
          setScreen("home");
        }}
        onStartListening={() => startGuestListening(guestPin)}
        onStopListening={stopForegroundService}
      />
    );
  }

  // debugNative
  return <NativeDebugScreen onBack={() => setScreen("home")} />;
}

export default function App(): React.JSX.Element {
  const [i18nReady, setI18nReady] = useState(false);

  React.useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} />;
  }

  return (
    <SafeAreaProvider>
      <AppInner />
      <CustomAlertHost />
    </SafeAreaProvider>
  );
}

const stylesDebug = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#0b1120",
    alignItems: "center",
    width: "85%",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#facc15",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    color: "#e5e7eb",
    marginBottom: 4,
  },
  channel: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 10,
  },
  hint: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    marginVertical: 6,
    minWidth: 260,
    alignItems: "center",
    backgroundColor: "#facc15",
  },
  stopButton: {
    backgroundColor: "#ef4444",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
  },
});

const stylesBack = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  text: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
