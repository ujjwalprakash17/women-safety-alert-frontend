"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ShieldIcon from "@/components/ShieldIcon";
import PageLoading from "@/components/PageLoading";

type Status = "checking" | "ready" | "no-session" | "submitting" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase's reset-link redirect creates a temporary recovery session —
    // if there isn't one, this page was opened directly, not via the email.
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "no-session");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus("ready");
      return;
    }
    setStatus("done");
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  if (status === "checking") return <PageLoading />;

  return (
    <main className="page">
      <div className="card stack stack-center">
        <span className="brand-mark brand-mark-lg">
          <ShieldIcon size={24} />
        </span>

        {status === "no-session" && (
          <div>
            <h1>Link expired</h1>
            <p>This reset link is invalid or has expired — request a new one from the login page.</p>
          </div>
        )}

        {status === "done" && (
          <div>
            <h1>Password updated</h1>
            <p>Taking you to your dashboard...</p>
          </div>
        )}

        {(status === "ready" || status === "submitting") && (
          <>
            <div>
              <h1>Set a new password</h1>
              <p>Choose a new password for your account.</p>
            </div>
            <form onSubmit={handleSubmit} className="stack self-stretch">
              <label>
                New password
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
                {status === "submitting" ? "Updating..." : "Update password"}
              </button>
            </form>
            {error && <p className="alert">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}
