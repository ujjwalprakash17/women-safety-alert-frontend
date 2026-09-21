"use client";

import { useState } from "react";
import Link from "next/link";
import { api, getCurrentPosition, type NearbySosSession } from "@/lib/api";
import { useAuthedUser } from "@/lib/useAuthedUser";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export default function NearbyPage() {
  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const [sessions, setSessions] = useState<NearbySosSession[] | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(radius = radiusKm) {
    setError(null);
    setSearching(true);
    try {
      const position = await getCurrentPosition();
      const results = await api.nearbySos(
        position.coords.latitude,
        position.coords.longitude,
        radius
      );
      setSessions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  function handleRadiusChange(value: number) {
    setRadiusKm(value);
    if (sessions !== null) handleSearch(value);
  }

  if (authLoading) return <PageLoading />;

  return (
    <>
      <Topbar me={me} />

      <main className="page">
        <div className="card card-wide stack">
          <div className="spread">
            <div>
              <h1>Nearby alerts</h1>
            </div>
            <select
              className="input input-inline"
              value={radiusKm}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
            </select>
          </div>

          {(error || authError) && <p className="alert">{error ?? authError}</p>}

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSearch()}
            disabled={searching}
          >
            {searching ? "Searching..." : sessions === null ? "Search nearby" : "Refresh"}
          </button>

          {sessions === null && (
            <p className="meta">Tap search to find active alerts near you.</p>
          )}

          {sessions !== null && sessions.length === 0 && (
            <p className="meta">No active alerts nearby right now.</p>
          )}

          {sessions !== null && sessions.length > 0 && (
            <div className="stack">
              {sessions.map((s) => (
                <Link key={s.id} href={`/sos/${s.id}`} className="list-item stack">
                  <div className="spread">
                    <span className="badge badge-active">Live</span>
                    <span className="meta">{formatDistance(s.distance_meters)}</span>
                  </div>
                  <p className="meta">
                    Triggered {new Date(s.created_at).toLocaleTimeString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
