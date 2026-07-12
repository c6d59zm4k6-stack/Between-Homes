/// <reference lib="webworker" />
// @ts-nocheck
// This file is intentionally excluded from the app's tsconfig (see
// tsconfig.app.json) — it runs in the Service Worker global scope, not
// the DOM, and TypeScript's DOM lib fights with `self`/`addEventListener`
// here. vite-plugin-pwa (injectManifest mode) bundles this file directly.

import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// A check-in reminder arriving from api/check-reminders.ts (triggered by
// the free external scheduler, not Vercel's own limited cron).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Between Homes";
  const options = {
    body: data.body || "Still on the move? A quick photo or line takes 20 seconds.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => w.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
