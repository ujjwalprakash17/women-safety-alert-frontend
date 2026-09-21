"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ShieldIcon from "@/components/ShieldIcon";
import PageLoading from "@/components/PageLoading";

type Status = "checking" | "idle" | "redirecting" | "submitting";
type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
        return;
      }
      setStatus("idle");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/dashboard");
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleSignIn() {
    setError(null);
    setStatus("redirecting");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setStatus("submitting");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus("idle");
      }
      // On success, the auth-state listener above redirects to /dashboard.
    } else if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) {
        setError(error.message);
        setStatus("idle");
      } else if (!data.session) {
        // Email confirmation is required before a session is issued.
        setNotice("Account created — check your email to confirm it before signing in.");
        setStatus("idle");
      }
      // If a session came back immediately (confirmation disabled), the
      // listener above handles the redirect.
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setStatus("idle");
      if (error) {
        setError(error.message);
      } else {
        setNotice("If that email has an account, a reset link has been sent.");
      }
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  if (status === "checking") return <PageLoading />;

  return (
    <main className="page">
      <div className="card stack stack-center">
        <span className="brand-mark brand-mark-lg">
          <ShieldIcon size={24} />
        </span>
        <div>
          <h1>Women Safety SOS</h1>
          <p>
            {mode === "signin" && "Sign in to continue."}
            {mode === "signup" && "Create an account to continue."}
            {mode === "forgot" && "Enter your email to reset your password."}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGoogleSignIn}
          disabled={status === "redirecting" || status === "submitting"}
        >
          <GoogleIcon />
          {status === "redirecting" ? "Redirecting to Google..." : "Continue with Google"}
        </button>

        <p className="divider-text">or</p>

        <form onSubmit={handleEmailSubmit} className="stack self-stretch">
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {mode !== "forgot" && (
            <label>
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
          )}

          <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
            {status === "submitting"
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>

        {error && <p className="alert">{error}</p>}
        {notice && <p className="meta">{notice}</p>}

        <div className="stack stack-tight">
          {mode === "signin" && (
            <>
              <button type="button" className="link" onClick={() => switchMode("signup")}>
                Don&apos;t have an account? Sign up
              </button>
              <button type="button" className="link" onClick={() => switchMode("forgot")}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== "signin" && (
            <button type="button" className="link" onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          )}
        </div>

        <p className="meta">
          By continuing you agree to our <Link href="/terms" className="link">Terms</Link> and{" "}
          <Link href="/privacy" className="link">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
