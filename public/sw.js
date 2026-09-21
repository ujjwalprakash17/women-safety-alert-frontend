// Minimal service worker for Milestone 1 — just enough for PWA installability.
// Push-notification handling (the actual reason we need a service worker for
// the real product) is deferred to Milestone 2+.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through for now — no offline caching strategy yet.
});
