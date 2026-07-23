// app/components/CustomAlertHost.tsx
// Mounted once near the app root. Registers itself with alertBridge so
// showAlert(...) calls anywhere (components or plain functions) render
// through the single branded CustomAlert modal. Queues alerts that arrive
// while one is already visible, same as native Alert.alert would.

import React, { useCallback, useEffect, useRef, useState } from "react";
import CustomAlert from "./CustomAlert";
import { registerAlertHandler, AlertButton } from "./alertBridge";
import i18n from "../i18n";

type AlertEntry = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

export default function CustomAlertHost() {
  const [current, setCurrent] = useState<AlertEntry | null>(null);
  const queueRef = useRef<AlertEntry[]>([]);

  const showNext = useCallback(() => {
    queueRef.current.shift();
    setCurrent(queueRef.current[0] ?? null);
  }, []);

  useEffect(() => {
    registerAlertHandler((title, message, buttons) => {
      const finalButtons: AlertButton[] =
        buttons && buttons.length > 0 ? buttons : [{ text: i18n.t("common.ok") }];
      const entry: AlertEntry = { title, message, buttons: finalButtons };

      queueRef.current.push(entry);
      if (queueRef.current.length === 1) {
        setCurrent(entry);
      }
    });

    return () => registerAlertHandler(null);
  }, []);

  return (
    <CustomAlert
      visible={current !== null}
      title={current?.title ?? ""}
      message={current?.message}
      buttons={current?.buttons ?? []}
      onDismiss={showNext}
    />
  );
}
