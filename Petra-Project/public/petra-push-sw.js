const SW_VERSION = "petra-push-v6";

const postDiagnostic = async (payload) => {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "PETRA_PUSH_DIAGNOSTIC", payload: { version: SW_VERSION, ...payload } });
  }
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    await postDiagnostic({ phase: "activate", ok: true });
  })());
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

    // Always create a real system notification. This is intentional even when
    // Petra is the active tab: users opted into device alerts and should get
    // the same external notification regardless of tab visibility.
    try {
      if (typeof self.registration.showNotification !== "function") {
        throw new Error("Service worker showNotification() is unavailable in this browser.");
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

      await postDiagnostic({ phase: "showNotification", ok: true, notificationId: notificationPayload.notificationId });
    } catch (error) {
      await postDiagnostic({
        phase: "showNotification",
        ok: false,
        notificationId: notificationPayload.notificationId,
        error: String(error?.message || error || "showNotification() failed").slice(0, 300),
      });
      throw error;
    }

    // Keep the existing in-app experience too. The page can display its
    // persistent popup without replacing or deleting the notification above.
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: "PETRA_NOTIFICATION", payload: notificationPayload });
    }
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
