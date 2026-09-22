import { supabase } from "./supabaseClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** FastAPI errors come back as {"detail": "..."} or, for validation errors,
 * {"detail": [{"msg": "...", ...}, ...]} — extract the human-readable part
 * instead of surfacing "409 Conflict: {"detail":"..."}" verbatim in the UI. */
async function extractErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `Something went wrong (${res.status}).`;

  try {
    const parsed = JSON.parse(text);
    const detail = parsed?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d?.msg ?? JSON.stringify(d)).join(", ");
    }
  } catch {
    // Not JSON — fall through to the raw text below.
  }
  return text;
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  // 204 No Content (e.g. DELETE endpoints) has no body — res.json() throws
  // on an empty string, so handle it once here instead of per-call-site.
  if (res.status === 204) return undefined;
  return res.json();
}

export type SosOutcome = "real" | "false_alarm" | "test";

export interface SosSession {
  id: string;
  user_id: string;
  status: "active" | "resolved";
  outcome: SosOutcome | null;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface NearbySosSession extends SosSession {
  distance_meters: number;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone_number: string;
  relationship_label: string | null;
  created_at: string;
}

export interface Me {
  id: string;
  supabase_user_id: string;
  phone_number: string | null;
  email: string | null;
  display_name: string | null;
  consent_accepted_at: string | null;
  created_at: string;
}

export const api = {
  me: (): Promise<Me> => authedFetch("/me"),

  updateProfile: (profile: {
    display_name: string;
    phone_number?: string;
    accept_consent: boolean;
  }): Promise<Me> => authedFetch("/me", { method: "PATCH", body: JSON.stringify(profile) }),

  triggerSos: (lat: number, lng: number): Promise<SosSession> =>
    authedFetch("/sos", { method: "POST", body: JSON.stringify({ lat, lng }) }),

  updateSosLocation: (id: string, lat: number, lng: number): Promise<SosSession> =>
    authedFetch(`/sos/${id}/location`, {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    }),

  resolveSos: (id: string, outcome: SosOutcome): Promise<SosSession> =>
    authedFetch(`/sos/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ outcome }),
    }),

  nearbySos: (lat: number, lng: number, radiusKm = 5): Promise<NearbySosSession[]> =>
    authedFetch(`/sos/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),

  getSos: (id: string): Promise<SosSession> => authedFetch(`/sos/${id}`),

  getActiveSos: (): Promise<SosSession | null> => authedFetch("/sos/active"),

  getVapidPublicKey: (): Promise<{ public_key: string }> =>
    authedFetch("/push/vapid-public-key"),

  subscribePush: (sub: {
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<{ id: string; endpoint: string }> =>
    authedFetch("/push/subscribe", { method: "POST", body: JSON.stringify(sub) }),

  listContacts: (): Promise<TrustedContact[]> => authedFetch("/contacts"),

  addContact: (contact: {
    name: string;
    phone_number: string;
    relationship_label?: string;
  }): Promise<TrustedContact> =>
    authedFetch("/contacts", { method: "POST", body: JSON.stringify(contact) }),

  deleteContact: (id: string): Promise<void> =>
    authedFetch(`/contacts/${id}`, { method: "DELETE" }),
};

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
    });
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

/** Requests notification permission + a push subscription, then registers it
 * with the backend. Must be called from a user gesture (a click handler) —
 * `Notification.requestPermission()` is blocked/bad UX if auto-run on mount. */
export async function subscribeToPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  const { public_key } = await api.getVapidPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // Cast needed: TS's Uint8Array is generic over ArrayBufferLike (which
    // includes SharedArrayBuffer), but the DOM's BufferSource/ArrayBufferView
    // expects a plain ArrayBuffer specifically — a real Uint8Array here is
    // always ArrayBuffer-backed, this is a type-system mismatch, not a bug.
    applicationServerKey: urlBase64ToUint8Array(public_key) as BufferSource,
  });

  const json = subscription.toJSON();
  await api.subscribePush({
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
  });
}
