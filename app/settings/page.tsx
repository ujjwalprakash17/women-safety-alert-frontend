"use client";

import { useEffect, useRef, useState } from "react";
import { api, subscribeToPush, unsubscribeFromPush } from "@/lib/api";
import { uploadAvatar } from "@/lib/avatarUpload";
import { isValidIndianMobile } from "@/lib/phone";
import { useAuthedUser } from "@/lib/useAuthedUser";
import { useToast } from "@/components/ToastProvider";
import Avatar from "@/components/Avatar";
import PhoneInput from "@/components/PhoneInput";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

export default function SettingsPage() {
  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const { showToast } = useToast();
  // Each field is null (meaning "no local edit yet, show the loaded value")
  // until the user actually types in it — computed during render instead of
  // synced from `me` via an effect.
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [radiusOverride, setRadiusOverride] = useState<number | null>(null);
  const [avatarUrlOverride, setAvatarUrlOverride] = useState<string | null>(null);
  const name = nameOverride ?? me?.display_name ?? "";
  const phone = phoneOverride ?? me?.phone_number ?? "";
  const radiusKm = radiusOverride ?? me?.default_radius_km ?? 5;
  const avatarUrl = avatarUrlOverride ?? me?.avatar_url ?? null;
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (authError) showToast(authError, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authError]);

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
    if (phone && !isValidIndianMobile(phone)) {
      showToast("Enter a valid 10-digit mobile number, or leave it blank.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({
        display_name: name,
        phone_number: phone || undefined,
        default_radius_km: radiusKm,
      });
      showToast("Settings saved.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file || !me) return;

    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, me.supabase_user_id);
      await api.updateProfile({
        display_name: name,
        phone_number: phone || undefined,
        avatar_url: url,
      });
      setAvatarUrlOverride(url);
      showToast("Profile photo updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleTogglePush() {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        showToast("Push alerts disabled.", "success");
      } else {
        await subscribeToPush();
        setPushEnabled(true);
        showToast("Push alerts enabled.", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
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

          <div className="avatar-picker">
            <Avatar name={name || me?.email} url={avatarUrl} size="lg" />
            <div className="stack-tight">
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? "Uploading..." : "Change photo"}
              </button>
              <p className="meta">Shown to responders when you raise an alert.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <hr className="divider" />

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
              <PhoneInput value={phone} onChange={setPhoneOverride} />
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
