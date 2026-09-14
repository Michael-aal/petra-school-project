import { Bell, Search, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import "../page-styles/NotificationsPage.css";
import { notificationApi } from "../../../../services/notificationApi";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 250);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item));
      setUnread((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(err?.message || "Unable to update notification.");
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
        <button type="button" className="notifications-send-button" onClick={markAllRead} disabled={!unread}>
          <CheckCheck size={16} />
          <span>Mark all read</span>
        </button>
      </section>

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
                {!item.isRead ? (
                  <button type="button" className="notification-tag tone-blue" onClick={() => markRead(item.id)}>
                    Mark read
                  </button>
                ) : null}
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
