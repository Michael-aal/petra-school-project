import { request } from "./apiClient";

const urlBase64ToUint8Array = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getRegistration = async () => {
  if (!("serviceWorker" in navigator)) throw new Error("This browser does not support service workers.");
  if (!window.isSecureContext) throw new Error("Device notifications require HTTPS or localhost.");

  const registration = await navigator.serviceWorker.register("/petra-push-sw.js", { scope: "/" });
  await registration.update();

  const activeRegistration = await navigator.serviceWorker.ready;
  if (!activeRegistration.active) {
    throw new Error("Petra's notification service worker is not active yet. Refresh the page and try again.");
  }

  return activeRegistration;
};

const getPermissionError = (permission) => {
  if (permission === "denied") {
    return "Notifications are blocked for Petra in this browser. Open the site permissions, allow Notifications, then try again.";
  }
  return "Notification permission was not granted.";
};

export const pushNotificationService = {
  isSupported: () => Boolean(
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window,
  ),

  permission: () => ("Notification" in window ? Notification.permission : "denied"),

  enable: async () => {
    if (!pushNotificationService.isSupported()) {
      throw new Error("Device notifications are not supported here. Use HTTPS or localhost in a supported browser.");
    }

    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error(getPermissionError(permission));

    const registration = await getRegistration();

    const { publicKey } = await request("/api/notifications/push/public-key");
    if (!publicKey) throw new Error("Petra device notifications are not configured yet.");

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await request("/api/notifications/push/subscribe", {
      method: "POST",
      body: {
        subscription: subscription.toJSON(),
        deviceName: `${navigator.platform || "Device"} ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Browser"}`,
      },
    });

    return { enabled: true, permission };
  },

  diagnostics: async () => {
    const supported = pushNotificationService.isSupported();
    const permission = "Notification" in window ? Notification.permission : "unsupported";
    const result = {
      supported,
      permission,
      serviceWorkerRegistered: false,
      serviceWorkerActive: false,
      serviceWorkerVersion: null,
      subscription: false,
      endpoint: null,
      backendConfigured: false,
      backendStorageAvailable: false,
      backendSubscribed: false,
      backendSubscriptionCount: 0,
      error: null,
    };

    if (!supported) {
      result.error = "This browser or connection does not support device notifications.";
      return result;
    }

    try {
      const registration = await getRegistration();
      result.serviceWorkerRegistered = Boolean(registration);
      result.serviceWorkerActive = Boolean(registration.active);
      result.serviceWorkerVersion = registration.active?.scriptURL || null;

      if (permission !== "granted") return result;

      const subscription = await registration.pushManager.getSubscription();
      result.subscription = Boolean(subscription);
      result.endpoint = subscription?.endpoint || null;

      const status = await request(
        result.endpoint
          ? `/api/notifications/push/status?endpoint=${encodeURIComponent(result.endpoint)}`
          : "/api/notifications/push/status",
      );
      result.backendConfigured = Boolean(status?.configured);
      result.backendStorageAvailable = Boolean(status?.storageAvailable);
      result.backendSubscribed = Boolean(status?.subscribed);
      result.backendSubscriptionCount = Number(status?.subscriptionCount || 0);
    } catch (error) {
      result.error = error?.message || "Unable to inspect device notification status.";
    }

    return result;
  },

  syncIfGranted: async () => {
    if (!pushNotificationService.isSupported() || Notification.permission !== "granted") return { enabled: false };
    return pushNotificationService.enable();
  },

  sendTest: async () => request("/api/notifications/push/test", { method: "POST" }),

  // This deliberately bypasses the Web Push network path. It proves whether
  // Chrome + the service worker + the operating system can display a notification.
  // If this appears but the push test does not, the failure is upstream of the OS UI.
  testSystemNotification: async () => {
    if (!pushNotificationService.isSupported()) {
      throw new Error("System notification testing is not supported in this browser/context.");
    }
    if (Notification.permission !== "granted") {
      throw new Error(getPermissionError(Notification.permission));
    }

    const registration = await getRegistration();
    await registration.showNotification("Petra School system test", {
      body: "Chrome successfully displayed a local system notification from Petra.",
      tag: `petra-system-test-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: "/dashboard/communication/notifications", systemTest: true },
    });

    return { sent: true };
  },

  disable: async () => {
    if (!pushNotificationService.isSupported()) return { removed: 0 };
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return { removed: 0 };
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return request("/api/notifications/push/unsubscribe", {
      method: "POST",
      body: { endpoint },
    });
  },
};

export default pushNotificationService;
