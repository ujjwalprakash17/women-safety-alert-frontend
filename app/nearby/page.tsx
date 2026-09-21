"use client";

import { useState } from "react";
import Link from "next/link";
import { api, getCurrentPosition, type NearbySosSession } from "@/lib/api";
import { useAuthedUser } from "@/lib/useAuthedUser";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

const RADIUS_STEPS = [5, 10, 20];

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export default function NearbyPage() {
  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const [sessions, setSessions] = useState<NearbySosSession[] | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState(20);
  const [usedRadiusKm, setUsedRadiusKm] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(ceiling = maxRadiusKm) {
    setError(null);
    setSearching(true);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Dynamic radius: start at 5km and expand through the step list up to
      // the chosen ceiling, stopping as soon as a step finds something —
      // matches the PRD's "starts at 5km, auto-expands if too few found."
      const steps = RADIUS_STEPS.filter((r) => r <= ceiling);
      if (steps[steps.length - 1] !== ceiling) steps.push(ceiling);

      let results: NearbySosSession[] = [];
      let radiusUsed = steps[0];
      for (const step of steps) {
        results = await api.nearbySos(latitude, longitude, step);
        radiusUsed = step;
        if (results.length > 0) break;
      }

      setSessions(results);
      setUsedRadiusKm(radiusUsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  function handleMaxRadiusChange(value: number) {
    setMaxRadiusKm(value);
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
              value={maxRadiusKm}
              onChange={(e) => handleMaxRadiusChange(Number(e.target.value))}
            >
              <option value={5}>Up to 5 km</option>
              <option value={10}>Up to 10 km</option>
              <option value={20}>Up to 20 km</option>
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
            <p className="meta">No active alerts within {usedRadiusKm} km right now.</p>
          )}

          {sessions !== null && sessions.length > 0 && (
            <div className="stack">
              {usedRadiusKm !== RADIUS_STEPS[0] && (
                <p className="meta">
                  Nothing within {RADIUS_STEPS[0]} km — expanded the search to {usedRadiusKm} km.
                </p>
              )}
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
