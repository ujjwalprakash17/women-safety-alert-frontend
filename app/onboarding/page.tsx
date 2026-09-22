"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { isValidIndianMobile } from "@/lib/phone";
import { useAuthedUser } from "@/lib/useAuthedUser";
import { useToast } from "@/components/ToastProvider";
import PageLoading from "@/components/PageLoading";
import PhoneInput from "@/components/PhoneInput";
import ShieldIcon from "@/components/ShieldIcon";

export default function OnboardingPage() {
  const router = useRouter();
  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authError) showToast(authError, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authError]);

  // Already fully onboarded but landed here anyway (e.g. back button) —
  // send them on, nothing to do here.
  useEffect(() => {
    if (me?.display_name && me?.consent_accepted_at) {
      router.replace("/dashboard");
    }
  }, [me, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      showToast("Please confirm you understand and agree before continuing.", "error");
      return;
    }
    if (phone && !isValidIndianMobile(phone)) {
      showToast("Enter a valid 10-digit mobile number, or leave it blank.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({
        display_name: name,
        phone_number: phone || undefined,
        accept_consent: consent,
      });
      router.replace("/dashboard");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
      setSaving(false);
    }
  }

  if (authLoading) return <PageLoading />;

  return (
    <main className="page">
      <div className="card stack">
        <div className="stack-center">
          <span className="brand-mark brand-mark-lg">
            <ShieldIcon size={24} />
          </span>
          <div>
            <h1>Just a few details</h1>
            <p>This is what nearby responders and trusted contacts will see.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <label>
            Your name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Phone number (optional)
            <PhoneInput value={phone} onChange={setPhone} />
          </label>

          <label className="row row-top">
            <input
              type="checkbox"
              className="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <span className="meta">
              I understand this app is a communication tool and does not replace calling local
              emergency services directly, and I agree to the{" "}
              <Link href="/terms" className="link">Terms</Link> and{" "}
              <Link href="/privacy" className="link">Privacy Policy</Link>. I understand
              misusing the alert system may have legal consequences.
            </span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
