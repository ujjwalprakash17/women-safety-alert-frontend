"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's legacy flag — not in the standard Navigator type.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const days = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (!isMobile() || isStandalone() || recentlyDismissed()) return;
    } catch {
      return;
    }

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Deferred a tick so this isn't a synchronous setState-in-effect (React
      // flags that as a cascading-render risk even though it's a one-time flip).
      queueMicrotask(() => {
        setIsIos(true);
        setVisible(true);
      });
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        <strong>Install this app</strong>
        <p className="meta">
          {isIos
            ? "Tap the Share icon, then \"Add to Home Screen\" for the best experience."
            : "Add it to your home screen for a faster, full-screen experience."}
        </p>
      </div>
      <div className="row">
        {!isIos && (
          <button type="button" className="btn btn-primary btn-icon" onClick={handleInstall}>
            Install
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={dismiss}>
          {isIos ? "Got it" : "Not now"}
        </button>
      </div>
    </div>
  );
}
