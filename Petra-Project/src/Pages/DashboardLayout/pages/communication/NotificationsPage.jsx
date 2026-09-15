import { Bell, Search, CheckCheck, Smartphone, Send, RefreshCw, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import "../page-styles/NotificationsPage.css";
import { notificationApi } from "../../../../services/notificationApi";
import { pushNotificationService } from "../../../../services/pushNotificationService";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const statusLabel = (value) => value ? "Ready" : "Not ready";

function DiagnosticRow({ label, value, detail }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.14)" }}>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 14 }}>{label}</strong>
        {detail ? <span style={{ display: "block", marginTop: 3, fontSize: 12, opacity: 0.7, overflowWrap: "anywhere" }}>{detail}</span> : null}
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
        {value ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        {statusLabel(value)}
      </span>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagnosticsBusy, setDiagnosticsBusy] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await notificationApi.list(search ? { search } : {});
      setNotifications(Array.isArray(result?.notifications) ? result.notifications : []);
      setUnread(Number(result?.unread || 0));
    } catch (err) {
      setError(err?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const inspectDeviceNotifications = useCallback(async () => {
    setDiagnosticsBusy(true);
    try {
      const result = await pushNotificationService.diagnostics();
      setDiagnostics(result);
      setPushEnabled(Boolean(result?.permission === "granted" && result?.subscription && result?.backendSubscribed));
    } catch (err) {
      setDiagnostics({ error: err?.message || "Unable to inspect device notification status." });
    } finally {
      setDiagnosticsBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 250);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  useEffect(() => {
    void inspectDeviceNotifications();
  }, [inspectDeviceNotifications]);

  const enableDeviceNotifications = async () => {
    setPushBusy(true);
    setPushMessage("");
    setError("");
    try {
      await pushNotificationService.enable();
      setPushMessage("Device notifications are enabled. The test button now forces a real external system notification.");
      await inspectDeviceNotifications();
    } catch (err) {
      setPushMessage(err?.message || "Unable to enable device notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestNotification = async () => {
    setPushBusy(true);
    setPushMessage("");
    setError("");
    try {
      if (!pushEnabled) await pushNotificationService.enable();
      const result = await pushNotificationService.sendTest();
      setPushMessage(result?.message || "External test sent. Check your system notification area.");
      await inspectDeviceNotifications();
    } catch (err) {
      const deliveryErrors = err?.data?.errors?.[0]?.deliveryErrors || [];
      const firstDeliveryError = Array.isArray(deliveryErrors) && deliveryErrors[0]?.message;
      setPushMessage(firstDeliveryError ? `Push delivery failed: ${firstDeliveryError}` : (err?.message || "Unable to send the external device notification."));
    } finally {
      setPushBusy(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item));
      setUnread((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(err?.message || "Unable to update notification.");
    }
  };

  const deleteNotification = async (item) => {
    if (!item?.canDelete) return;
    try {
      await notificationApi.delete(item.id);
      setNotifications((items) => items.filter((notification) => notification.id !== item.id));
      if (!item.isRead) setUnread((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(err?.message || "Unable to delete notification.");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
    } catch (err) {
      setError(err?.message || "Unable to update notifications.");
    }
  };

  const permissionGranted = diagnostics?.permission === "granted";
  const diagnosticsReady = Boolean(
    diagnostics?.supported &&
    permissionGranted &&
    diagnostics?.serviceWorkerRegistered &&
    diagnostics?.serviceWorkerActive &&
    diagnostics?.subscription &&
    diagnostics?.backendSubscribed,
  );

  return (
    <div className="notifications-page dashboard-page">
      <section className="notifications-hero">
        <div className="notifications-search-wrap">
          <Search size={17} className="notifications-search-icon" />
          <input
            type="search"
            className="notifications-search"
            placeholder="Search notifications..."
            aria-label="Search notifications"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="notifications-session">
          <span className="notifications-session-dot" />
          <span>{unread} unread</span>
        </div>
      </section>

      <section className="notifications-toolbar">
        <div className="notifications-title-block">
          <div className="notifications-title-icon"><Bell size={20} /></div>
          <div>
            <h1>Notifications</h1>
            <p>Automatic updates from payments, messages, announcements, and school activity</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {pushNotificationService.isSupported() && !pushEnabled ? (
            <button type="button" className="notifications-send-button" onClick={enableDeviceNotifications} disabled={pushBusy}>
              <Smartphone size={16} />
              <span>{pushBusy ? "Enabling..." : "Enable device alerts"}</span>
            </button>
          ) : null}
          {pushNotificationService.isSupported() && pushEnabled ? (
            <button type="button" className="notifications-send-button" onClick={sendTestNotification} disabled={pushBusy}>
              <Send size={16} />
              <span>{pushBusy ? "Sending..." : "Send external test"}</span>
            </button>
          ) : null}
          <button type="button" className="notifications-send-button" onClick={markAllRead} disabled={!unread}>
            <CheckCheck size={16} />
            <span>Mark all read</span>
          </button>
        </div>
      </section>

      <section className="notification-card" style={{ marginBottom: 16 }} aria-label="Device notification status">
        <div className="notification-card-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ marginBottom: 4 }}>Device Notifications</h2>
              <p style={{ margin: 0 }}>
                {diagnosticsReady ? "Everything needed for Petra device alerts is connected." : "Check each layer below to see exactly where device alerts are stopping."}
              </p>
            </div>
            <button type="button" className="notifications-send-button" onClick={inspectDeviceNotifications} disabled={diagnosticsBusy}>
              <RefreshCw size={16} />
              <span>{diagnosticsBusy ? "Checking..." : "Refresh status"}</span>
            </button>
          </div>

          {diagnostics ? (
            <div style={{ marginTop: 14 }}>
              <DiagnosticRow label="Browser support" value={diagnostics.supported} detail={diagnostics.error && !diagnostics.supported ? diagnostics.error : "Secure context, Service Worker, Push API, and Notifications API"} />
              <DiagnosticRow label="Notification permission" value={permissionGranted} detail={`Browser permission: ${diagnostics.permission || "unknown"}`} />
              <DiagnosticRow label="Service worker registered" value={diagnostics.serviceWorkerRegistered} />
              <DiagnosticRow label="Service worker active" value={diagnostics.serviceWorkerActive} />
              <DiagnosticRow label="Push subscription" value={diagnostics.subscription} detail={diagnostics.endpoint ? `Endpoint: ${diagnostics.endpoint}` : "No browser push subscription found"} />
              <DiagnosticRow label="Backend configured" value={diagnostics.backendConfigured} detail="VAPID keys and push configuration" />
              <DiagnosticRow label="Backend storage" value={diagnostics.backendStorageAvailable} detail={`Redis subscription records: ${diagnostics.backendSubscriptionCount || 0}`} />
              <DiagnosticRow label="This device registered with Petra" value={diagnostics.backendSubscribed} />
              {diagnostics.error ? <p style={{ margin: "12px 0 0", fontSize: 13 }}>{diagnostics.error}</p> : null}
            </div>
          ) : (
            <p style={{ marginTop: 14 }}>Checking device notification status...</p>
          )}
        </div>
      </section>

      {pushMessage ? <div className="notification-empty-state notification-card"><div className="notification-card-body"><p>{pushMessage}</p></div></div> : null}
      {error ? <div className="notification-empty-state notification-card"><div className="notification-card-body"><p>{error}</p></div></div> : null}

      <section className="notifications-list" aria-label="Notification list">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className="notification-card">
              <div className="notification-card-icon skeleton" style={{ width: 36, height: 36 }} />
              <div className="notification-card-body">
                <div className="skeleton" style={{ height: 18, width: "42%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: "88%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "68%" }} />
              </div>
            </article>
          ))
        ) : notifications.length ? notifications.map((item) => (
          <article key={item.id} className={`notification-card ${item.isRead ? "" : "notification-unread"}`}>
            <div className="notification-card-icon tone-blue"><Bell size={18} /></div>
            <div className="notification-card-body">
              <div className="notification-card-main">
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                  <div className="notification-card-meta"><span>{formatDate(item.createdAt)}</span></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {!item.isRead ? (
                    <button type="button" className="notification-tag tone-blue" onClick={() => markRead(item.id)}>
                      Mark read
                    </button>
                  ) : null}
                  {item.canDelete ? (
                    <button
                      type="button"
                      className="notification-tag"
                      onClick={() => deleteNotification(item)}
                      aria-label={`Delete notification: ${item.title}`}
                      title="Delete notification"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        )) : (
          <article className="notification-card notification-empty-state">
            <div className="notification-card-icon tone-blue"><Bell size={18} /></div>
            <div className="notification-card-body">
              <h2>No notifications</h2>
              <p>New automatic school updates will appear here.</p>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
