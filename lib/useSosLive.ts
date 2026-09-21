import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SosLiveStatus = "connecting" | "open" | "resolved" | "closed" | "error";

export interface SosLiveState {
  lat: number | null;
  lng: number | null;
  status: SosLiveStatus;
  lastUpdatedAt: string | null;
}

/** Watches one SOS session's live location over a WebSocket while `sessionId`
 * is set. UI-agnostic on purpose (no map dependency) — swap in a real map
 * later without touching this hook. No auto-reconnect yet: a dropped socket
 * just surfaces as status "closed"; reconnecting would also need to re-fetch
 * current state via HTTP to backfill anything missed, deferred for now. */
export function useSosLive(sessionId: string | null): SosLiveState {
  const [state, setState] = useState<SosLiveState>({
    lat: null,
    lng: null,
    status: "connecting",
    lastUpdatedAt: null,
  });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let ws: WebSocket | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || cancelled) return;

      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      ws = new WebSocket(`${wsBase}/ws/sos/${sessionId}?token=${encodeURIComponent(token)}`);

      ws.onopen = () => setState((s) => ({ ...s, status: "open" }));

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "location") {
          setState((s) => ({ ...s, lat: msg.lat, lng: msg.lng, lastUpdatedAt: msg.updated_at }));
        } else if (msg.type === "resolved") {
          setState((s) => ({ ...s, status: "resolved" }));
        }
      };

      ws.onclose = () =>
        setState((s) => (s.status === "resolved" ? s : { ...s, status: "closed" }));
      ws.onerror = () => setState((s) => ({ ...s, status: "error" }));
    })();

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [sessionId]);

  return state;
}
