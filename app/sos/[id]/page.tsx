"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type SosSession } from "@/lib/api";
import { useSosLive } from "@/lib/useSosLive";
import { useAuthedUser } from "@/lib/useAuthedUser";
import { useToast } from "@/components/ToastProvider";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

export default function WatchSosPage() {
  const params = useParams();
  const id = params.id as string;

  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const { showToast } = useToast();
  const [session, setSession] = useState<SosSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (authError) showToast(authError, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authError]);

  useEffect(() => {
    (async () => {
      try {
        setSession(await api.getSos(id));
      } catch (err) {
        showToast(err instanceof Error ? err.message : String(err), "error");
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {loadFailed || !session ? (
            <p className="meta">This alert couldn&apos;t be loaded — it may not exist anymore.</p>
          ) : (
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

                  {/* Navigate only, by design — no direct call/message option
                      on the responder screen (see PRD 3.4: kept minimal on
                      purpose). The phone number above is still shown as
                      reference text, not a one-tap call action. */}
                  {mapsUrl && (
                    <div className="row">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        Navigate
                      </a>
                    </div>
                  )}
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
