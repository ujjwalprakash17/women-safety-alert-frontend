"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type SosSession } from "@/lib/api";
import { useSosLive } from "@/lib/useSosLive";
import { useAuthedUser } from "@/lib/useAuthedUser";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

export default function WatchSosPage() {
  const params = useParams();
  const id = params.id as string;

  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const [session, setSession] = useState<SosSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setSession(await api.getSos(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isActive = session?.status === "active";
  const live = useSosLive(isActive ? id : null);
  const resolved = session?.status === "resolved" || live.status === "resolved";

  const displayLat = live.lat ?? session?.lat;
  const displayLng = live.lng ?? session?.lng;
  const mapsUrl =
    displayLat != null && displayLng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${displayLat},${displayLng}`
      : null;

  if (authLoading || loading) return <PageLoading />;

  return (
    <>
      <Topbar me={me} />

      <main className="page">
        <div className="card card-wide stack">
          {(error || authError) && <p className="alert">{error ?? authError}</p>}

          {!error && session && (
            <>
              <div className="spread">
                <h1>{session.display_name ?? "Watching alert"}</h1>
                <span className={`badge ${resolved ? "badge-resolved" : "badge-active"}`}>
                  {resolved ? "Resolved" : "Live"}
                </span>
              </div>

              {resolved ? (
                <p className="meta">This alert has been resolved — nothing more to watch here.</p>
              ) : (
                <>
                  {session.phone_number && (
                    <p className="meta">{session.phone_number}</p>
                  )}
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

                  <div className="row">
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        Navigate
                      </a>
                    )}
                    {session.phone_number && (
                      <a href={`tel:${session.phone_number}`} className="btn btn-outline">
                        Call
                      </a>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
