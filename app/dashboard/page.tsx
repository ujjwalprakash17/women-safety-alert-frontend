"use client";

import { useEffect, useState } from "react";
import {
  api,
  getCurrentPosition,
  subscribeToPush,
  type SosOutcome,
  type SosSession,
} from "@/lib/api";
import { useSosLive } from "@/lib/useSosLive";
import { useAuthedUser } from "@/lib/useAuthedUser";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

export default function DashboardPage() {
  const { me, loading, error: authError } = useAuthedUser();
  const [session, setSession] = useState<SosSession | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [enablingAlerts, setEnablingAlerts] = useState(false);

  const isActive = session?.status === "active";
  const live = useSosLive(isActive ? session!.id : null);

  // Check whether push is already enabled for this browser, so returning
  // users aren't re-prompted for a permission they've already granted.
  useEffect(() => {
    (async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } catch {
        // Push isn't available in this browser — leave pushEnabled as null,
        // the "Enable alerts" row just won't render.
      }
    })();
  }, []);

  // The producer side of the live map: while a session is active, keep
  // posting fresh browser locations so there's something for connected
  // WebSocket watchers (useSosLive above) to actually receive.
  useEffect(() => {
    if (!session || session.status !== "active") return;
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        api
          .updateSosLocation(session.id, position.coords.latitude, position.coords.longitude)
          .catch(() => {
            // Best-effort — a single missed update isn't worth surfacing an error for.
          });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [session?.id, session?.status]);

  async function handleTrigger() {
    setError(null);
    setTriggering(true);
    try {
      const position = await getCurrentPosition();
      const created = await api.triggerSos(
        position.coords.latitude,
        position.coords.longitude
      );
      setSession(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTriggering(false);
    }
  }

  async function handleResolve(outcome: SosOutcome) {
    if (!session) return;
    setError(null);
    setResolving(true);
    try {
      const resolved = await api.resolveSos(session.id, outcome);
      setSession(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResolving(false);
    }
  }

  async function handleEnableAlerts() {
    setError(null);
    setEnablingAlerts(true);
    try {
      await subscribeToPush();
      setPushEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEnablingAlerts(false);
    }
  }

  if (loading) return <PageLoading />;

  const displayLat = live.lat ?? session?.lat;
  const displayLng = live.lng ?? session?.lng;

  return (
    <>
      <Topbar me={me} />

      <main className="page">
        <div className="card card-wide stack">
          {(error || authError) && <p className="alert">{error ?? authError}</p>}

          {pushEnabled !== null && (
            <div className="spread">
              <span className="meta">Push alerts</span>
              {pushEnabled ? (
                <span className="badge badge-resolved">On</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-icon"
                  onClick={handleEnableAlerts}
                  disabled={enablingAlerts}
                >
                  {enablingAlerts ? "Enabling..." : "Enable"}
                </button>
              )}
            </div>
          )}

          {!session || session.status === "resolved" ? (
            <div className="stack stack-center">
              <div>
                <h1>
                  {session?.status === "resolved" ? "Session resolved" : "Ready when you are"}
                </h1>
                <p>
                  {session?.status === "resolved"
                    ? `Tagged as "${session.outcome}". You can trigger a new one any time.`
                    : "Trigger an SOS and share your live location."}
                </p>
              </div>
              <button
                type="button"
                className="sos-button"
                onClick={handleTrigger}
                disabled={triggering}
              >
                {triggering ? "Locating..." : "SOS"}
              </button>
            </div>
          ) : (
            <div className="stack">
              <div className="spread">
                <h1>SOS Active</h1>
                <span className="badge badge-active">Live</span>
              </div>
              <p className="meta">
                Location: {displayLat?.toFixed(5)}, {displayLng?.toFixed(5)}
              </p>
              <p className="meta">
                {live.status === "open" && "Live updates connected"}
                {live.status === "connecting" && "Connecting to live updates..."}
                {live.status === "closed" && "Live updates disconnected"}
                {live.status === "error" && "Live updates unavailable"}
                {live.lastUpdatedAt &&
                  ` · last update ${new Date(live.lastUpdatedAt).toLocaleTimeString()}`}
              </p>
              <p className="meta">
                Triggered {new Date(session.created_at).toLocaleTimeString()}
              </p>

              <hr className="divider" />

              <div>
                <label>Mark as resolved</label>
                <div className="outcome-buttons">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={resolving}
                    onClick={() => handleResolve("real")}
                  >
                    Real
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={resolving}
                    onClick={() => handleResolve("false_alarm")}
                  >
                    False alarm
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={resolving}
                    onClick={() => handleResolve("test")}
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
