/**
 * Service Worker — Web Push Notifications (Phase 2e)
 *
 * Listens for push events from the browser Push API and displays
 * notifications. Clicking a notification focuses the existing tab
 * or opens the app root.
 */

/* eslint-env serviceworker */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Notification", body: event.data.text() };
  }

  const { title = "Notification", body = "", data = {}, requireInteraction = false } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data,
      tag: data.deliveryId ?? "default",
      requireInteraction,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if any.
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab.
        return self.clients.openWindow("/");
      }),
  );
});
