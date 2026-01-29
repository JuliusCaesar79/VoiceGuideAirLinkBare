// app/config/api.ts

export const API_BASE_URL =
  "https://voiceguide-airlink-backend-production.up.railway.app";

// -------------------------------------------------------------
// CORE REQUEST WRAPPER
// -------------------------------------------------------------
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail: any = null;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    throw new Error(
      typeof detail === "string"
        ? detail
        : detail?.detail || `HTTP ${response.status}`
    );
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// SYSTEM: health
// -------------------------------------------------------------
export async function apiHealthz() {
  return request("/api/healthz");
}

// -------------------------------------------------------------
// LICENSE
// -------------------------------------------------------------
export async function apiActivateLicense(licenseCode: string) {
  return request("/api/activate-license", {
    method: "POST",
    body: JSON.stringify({ license_code: licenseCode }),
  });
}

// -------------------------------------------------------------
// SESSION (GUIDA)
// -------------------------------------------------------------
export async function apiStartSession(
  licenseCode: string,
  maxListeners?: number
) {
  const params = new URLSearchParams();
  params.append("license_code", licenseCode);
  if (maxListeners !== undefined) {
    params.append("max_listeners", String(maxListeners));
  }
  return request(`/api/start-session?${params}`, { method: "POST" });
}

export async function apiEndSession(sessionId: string) {
  const params = new URLSearchParams();
  params.append("session_id", sessionId);

  return request(`/api/end-session?${params}`, { method: "POST" });
}

// ⬅️ NEW: Session status (polling)
export async function apiGetSessionStatus(sessionId: string) {
  return request(`/api/sessions/${sessionId}/status`);
}

// -------------------------------------------------------------
// LISTENER (OSPITE)
// -------------------------------------------------------------
export async function apiJoinPin(pin: string, displayName?: string) {
  const params = new URLSearchParams();
  params.append("pin", pin);
  if (displayName) params.append("display_name", displayName);

  return request(`/api/join-pin?${params}`, { method: "POST" });
}

export async function apiGetListenerStatus(listenerId: string) {
  return request(`/api/listeners/${listenerId}`);
}

export async function apiLeaveListener(listenerId: string) {
  return request(`/api/listeners/${listenerId}/leave`, {
    method: "POST",
  });
}
