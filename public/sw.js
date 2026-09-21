// Service worker: PWA installability + Web Push (Milestone 3).
// No access to React state or lib/ modules here — fully self-contained.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through for now — no offline caching strategy yet.
});

self.addEventListener("push", (event) => {
  let data = { title: "SOS Alert", body: "Someone nearby triggered an SOS." };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // Non-JSON push payload — fall back to the default text above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { sessionId: data.session_id },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/dashboard");
      }
    })
  );
});
