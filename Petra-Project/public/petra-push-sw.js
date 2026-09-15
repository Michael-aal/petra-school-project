const SW_VERSION = "petra-push-v7";

const postDiagnostic = async (payload) => {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "PETRA_PUSH_DIAGNOSTIC", payload: { version: SW_VERSION, ...payload } });
  }
};

const getVisibleUserIds = async () => {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const ids = [];
  for (const client of clients) {
    try {
      const channel = new MessageChannel();
      const id = await new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          resolve(value || null);
        };
        channel.port1.onmessage = (event) => finish(event.data?.userId);
        client.postMessage({ type: "PETRA_GET_CURRENT_USER" }, [channel.port2]);
        setTimeout(() => finish(null), 750);
      });
      if (id) ids.push(String(id));
    } catch {
      // A client that cannot answer does not identify the active account.
    }
  }
  return [...new Set(ids)];
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
      recipientUserId: payload.recipientUserId ? String(payload.recipientUserId) : null,
      tag: String(payload.tag || `${SW_VERSION}-${Date.now()}`),
    };

    // Private notifications must never be surfaced to a browser client
    // logged into a different Petra account. This also protects the external
    // system notification when sender and recipient share one browser/device.
    if (notificationPayload.recipientUserId) {
      const activeUserIds = await getVisibleUserIds();
      if (activeUserIds.length && !activeUserIds.includes(notificationPayload.recipientUserId)) {
        await postDiagnostic({
          phase: "recipient-filtered",
          ok: true,
          notificationId: notificationPayload.notificationId,
          recipientUserId: notificationPayload.recipientUserId,
        });
        return;
      }
    }

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
          recipientUserId: notificationPayload.recipientUserId,
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
