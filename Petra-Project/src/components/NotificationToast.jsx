import { useEffect, useRef, useState } from "react";
import { X, Bell } from "lucide-react";
import { notificationApi } from "../services/notificationApi";

const POLL_MS = 3000;

export default function NotificationToast() {
  const [toast, setToast] = useState(null);
  const initializedRef = useRef(false);
  const latestIdRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const data = await notificationApi.list({ page: 1, limit: 10 });
        if (!active) return;
        const latest = data?.notifications?.[0];
        if (!latest?.id) return;

        if (!initializedRef.current) {
          initializedRef.current = true;
          latestIdRef.current = latest.id;
          return;
        }

        if (latest.id !== latestIdRef.current) {
          latestIdRef.current = latest.id;
          setToast({
            id: latest.id,
            title: latest.title || "New notification",
            body: latest.body || "You have a new notification.",
          });
        }
      } catch {
        // Notification UI is non-blocking.
      }
    };

    check();
    timerRef.current = window.setInterval(check, POLL_MS);

    return () => {
      active = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 99999,
        width: "min(380px, calc(100vw - 32px))",
        padding: "14px 16px",
        borderRadius: 14,
        background: "#0f172a",
        color: "#fff",
        boxShadow: "0 18px 45px rgba(0,0,0,.28)",
        border: "1px solid rgba(255,255,255,.12)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <Bell size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{toast.title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.9 }}>{toast.body}</div>
      </div>
      <button
        type="button"
        aria-label="Close notification"
        onClick={() => setToast(null)}
        style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 2 }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
