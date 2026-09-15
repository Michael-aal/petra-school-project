import { request } from "./apiClient";

const urlBase64ToUint8Array = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const getRegistration = async () => {
  if (!("serviceWorker" in navigator)) throw new Error("This browser does not support service workers.");
  return navigator.serviceWorker.register("/petra-push-sw.js", { scope: "/" });
};

export const pushNotificationService = {
  isSupported: () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window,

  permission: () => ("Notification" in window ? Notification.permission : "denied"),

  enable: async () => {
    if (!pushNotificationService.isSupported()) throw new Error("Device notifications are not supported by this browser.");

    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission was not granted.");

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

    return { enabled: true };
  },

  syncIfGranted: async () => {
    if (!pushNotificationService.isSupported() || Notification.permission !== "granted") return { enabled: false };
    return pushNotificationService.enable();
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
