// app/components/alertBridge.ts
// Lets code outside the React tree (e.g. App.tsx helper functions that run
// before any component renders) trigger the branded CustomAlert modal,
// the same way they used to call Alert.alert(title, message, buttons).

export type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type ShowAlertFn = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => void;

let handler: ShowAlertFn | null = null;

export function registerAlertHandler(fn: ShowAlertFn | null) {
  handler = fn;
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  if (!handler) {
    console.warn("CustomAlertHost not mounted yet, dropped alert:", title, message);
    return;
  }
  handler(title, message, buttons);
}
