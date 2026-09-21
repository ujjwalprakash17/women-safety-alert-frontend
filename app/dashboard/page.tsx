"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { api, getCurrentPosition, type Me, type SosOutcome, type SosSession } from "@/lib/api";
import ShieldIcon from "@/components/ShieldIcon";

type LoadState = "loading" | "ready" | "unauthenticated";

export default function DashboardPage() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [session, setSession] = useState<SosSession | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const meResult = await api.me();
        setMe(meResult);
        setLoadState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoadState("ready");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loadState === "loading") {
    return (
      <main className="page">
        <p className="meta">Loading...</p>
      </main>
    );
  }

  const initial = (me?.email ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <ShieldIcon />
          </span>
          Women Safety SOS
        </div>
        <div className="row">
          <span className="meta">{me?.email}</span>
          <div className="avatar">{initial}</div>
          <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="page">
        <div className="card card-wide stack">
          {error && <p className="alert">{error}</p>}

          {!session || session.status === "resolved" ? (
            <div className="stack stack-center">
              <div>
                <p className="eyebrow">Milestone 2</p>
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
                Location: {session.lat.toFixed(5)}, {session.lng.toFixed(5)}
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
    </>
  );
}
