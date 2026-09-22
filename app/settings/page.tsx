"use client";

import { useEffect, useState } from "react";
import { api, subscribeToPush, unsubscribeFromPush } from "@/lib/api";
import { useAuthedUser } from "@/lib/useAuthedUser";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

export default function SettingsPage() {
  const { me, loading: authLoading, error: authError } = useAuthedUser();
  // Each field is null (meaning "no local edit yet, show the loaded value")
  // until the user actually types in it — computed during render instead of
  // synced from `me` via an effect.
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [radiusOverride, setRadiusOverride] = useState<number | null>(null);
  const name = nameOverride ?? me?.display_name ?? "";
  const phone = phoneOverride ?? me?.phone_number ?? "";
  const radiusKm = radiusOverride ?? me?.default_radius_km ?? 5;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } catch {
        // Leave as null — the toggle just won't render in unsupported browsers.
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      await api.updateProfile({
        display_name: name,
        phone_number: phone || undefined,
        default_radius_km: radiusKm,
      });
      setNotice("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePush() {
    setError(null);
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        await subscribeToPush();
        setPushEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPushBusy(false);
    }
  }

  if (authLoading) return <PageLoading />;

  return (
    <>
      <Topbar me={me} />

      <main className="page">
        <div className="card card-wide stack">
          <h1>Settings</h1>

          {(error || authError) && <p className="alert">{error ?? authError}</p>}
          {notice && <p className="meta">{notice}</p>}

          <form onSubmit={handleSave} className="stack">
            <label>
              Name
              <input
                className="input"
                value={name}
                onChange={(e) => setNameOverride(e.target.value)}
                required
              />
            </label>
            <label>
              Phone number
              <input
                className="input"
                type="tel"
                placeholder="+91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhoneOverride(e.target.value)}
              />
            </label>
            <label>
              Default nearby-search radius
              <select
                className="input"
                value={radiusKm}
                onChange={(e) => setRadiusOverride(Number(e.target.value))}
              >
                <option value={5}>Up to 5 km</option>
                <option value={10}>Up to 10 km</option>
                <option value={20}>Up to 20 km</option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>

          <hr className="divider" />

          {pushEnabled !== null && (
            <div className="spread">
              <div>
                <strong>Push alerts</strong>
                <p className="meta">Get notified when someone nearby triggers an SOS.</p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={handleTogglePush}
                disabled={pushBusy}
              >
                {pushBusy ? "..." : pushEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          )}

          <p className="meta">
            Email: {me?.email ?? "—"}
          </p>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
