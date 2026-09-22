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

  // Deep-link into the specific alert (name, phone, live location, Navigate)
  // instead of always landing on the dashboard — the session id was already
  // being attached to the notification's data and just never used.
  const sessionId = event.notification.data && event.notification.data.sessionId;
  const targetPath = sessionId ? `/sos/${sessionId}` : "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(targetPath);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
