// app/audio/useAudioStatus.ts
// Live audio link status coming from the native module ("VGAudioStatus"
// events): connection state, network quality and — for guests — the real
// guide→guest delay measured by Agora. Used for the connection indicator
// and to measure latency in the field.
//
// If the native module doesn't emit these events yet (e.g. an iOS build
// without them), the hook simply stays in its initial "unknown" state.

import { useEffect, useState } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";

// Agora CONNECTION_STATE_* values
const CONNECTION_STATE = {
  1: "disconnected",
  2: "connecting",
  3: "connected",
  4: "reconnecting",
  5: "failed",
} as const;

export type ConnectionState =
  | (typeof CONNECTION_STATE)[keyof typeof CONNECTION_STATE]
  | "unknown";

export type LinkLevel = "good" | "fair" | "poor" | "offline" | "unknown";

export type AudioStatus = {
  connection: ConnectionState;
  level: LinkLevel;
  /** Guide → guest delay in ms (guests only; null until measured). */
  delayMs: number | null;
  /** Audio packet loss in % (guests only). */
  lossRate: number | null;
};

const INITIAL: AudioStatus = {
  connection: "unknown",
  level: "unknown",
  delayMs: null,
  lossRate: null,
};

// Agora QUALITY_*: 1 excellent, 2 good, 3 poor, 4 bad, 5 very bad, 6 down
function levelFromQuality(q: number): LinkLevel {
  if (q === 1 || q === 2) return "good";
  if (q === 3) return "fair";
  if (q === 4 || q === 5) return "poor";
  if (q === 6) return "offline";
  return "unknown";
}

export function useAudioStatus(active: boolean): AudioStatus {
  const [status, setStatus] = useState<AudioStatus>(INITIAL);

  useEffect(() => {
    const native = NativeModules.VoiceGuideForeground;
    if (!active || !native) {
      setStatus(INITIAL);
      return;
    }

    const emitter = new NativeEventEmitter(native);
    const sub = emitter.addListener("VGAudioStatus", (e: any) => {
      if (e?.type === "connection") {
        const connection: ConnectionState =
          CONNECTION_STATE[e.state as keyof typeof CONNECTION_STATE] ?? "unknown";
        setStatus((prev) => ({
          ...prev,
          connection,
          level:
            connection === "connected"
              ? prev.level === "offline" ? "unknown" : prev.level
              : connection === "reconnecting" || connection === "connecting"
              ? "poor"
              : "offline",
        }));
      } else if (e?.type === "quality") {
        const level = levelFromQuality(Number(e.quality));
        if (level !== "unknown") setStatus((prev) => ({ ...prev, level }));
      } else if (e?.type === "stats") {
        const delay = Number(e.e2eDelay);
        setStatus((prev) => ({
          ...prev,
          delayMs: delay > 0 ? delay : prev.delayMs,
          lossRate: typeof e.lossRate === "number" ? e.lossRate : prev.lossRate,
        }));
      }
    });

    return () => sub.remove();
  }, [active]);

  return status;
}
