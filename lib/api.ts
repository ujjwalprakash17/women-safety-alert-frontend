import { supabase } from "./supabaseClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }
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

export interface Me {
  id: string;
  supabase_user_id: string;
  phone_number: string | null;
  email: string | null;
  created_at: string;
}

export const api = {
  me: (): Promise<Me> => authedFetch("/me"),

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

  nearbySos: (
    lat: number,
    lng: number,
    radiusKm = 5
  ): Promise<(SosSession & { distance_meters: number })[]> =>
    authedFetch(`/sos/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
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
