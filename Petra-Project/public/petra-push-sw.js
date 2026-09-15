const SW_VERSION = "petra-push-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = {
        title: "Petra School",
        body: event.data?.text?.() || "You have a new notification.",
      };
    }

    const notificationPayload = {
      title: String(payload.title || "Petra School"),
      body: String(payload.body || "You have a new notification."),
      url: payload.url || "/dashboard/communication/notifications",
      notificationId: payload.notificationId || null,
      tag: String(payload.tag || `${SW_VERSION}-${Date.now()}`),
    };

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const visibleClient = clients.find((client) => client.visibilityState === "visible");

    if (visibleClient && payload.forceExternal !== true) {
      visibleClient.postMessage({ type: "PETRA_NOTIFICATION", payload: notificationPayload });
      return;
    }

    await self.registration.showNotification(notificationPayload.title, {
      body: notificationPayload.body,
      tag: notificationPayload.tag,
      renotify: true,
      requireInteraction: true,
      silent: false,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: notificationPayload.url,
        notificationId: notificationPayload.notificationId,
      },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/dashboard/communication/notifications",
    self.location.origin,
  ).href;

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
