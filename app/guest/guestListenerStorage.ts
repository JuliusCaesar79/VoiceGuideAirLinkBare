// app/guest/guestListenerStorage.ts
// Remembers the listener id the backend gave this device for a tour PIN, so
// that a guest who closes/reopens the app (or taps "Leave" by mistake) and
// re-enters the same PIN gets their own slot back instead of using up a new
// one against the tour's max listeners.

import AsyncStorage from "@react-native-async-storage/async-storage";

export const GUEST_LISTENER_STORAGE_KEY = "@voiceguide_guest_listener";

type StoredListener = { pin: string; listenerId: string };

/**
 * Returns the stored listener id only if it was issued for this same PIN.
 * A stale id from an older tour is harmless anyway: the backend ignores ids
 * that don't belong to the session behind the PIN.
 */
export async function loadGuestListenerId(pin: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_LISTENER_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredListener;
    return stored?.pin === pin ? stored.listenerId : null;
  } catch {
    return null;
  }
}

export async function saveGuestListenerId(pin: string, listenerId: string): Promise<void> {
  try {
    const value: StoredListener = { pin, listenerId };
    await AsyncStorage.setItem(GUEST_LISTENER_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Non-fatal: worst case a rejoin takes a new slot, as before.
  }
}
