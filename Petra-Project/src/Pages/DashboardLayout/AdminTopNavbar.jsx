import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Check, ChevronDown, CreditCard, LogOut, Menu, Settings, UserRound, X, AlertCircle } from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, getFirstName, getUserInitials, normalizeUser } from "../../utils/userProfile";
import "../../Styles/DashBoardLayout/TopNavbar.css";

const formatToday = () => new Intl.DateTimeFormat("en-NG", { weekday: "long", month: "short", day: "numeric" }).format(new Date());

function useDropdown() {
  const [open, setOpen] = useState(false);
  const [root, setRoot] = useState(null);
  const [trigger, setTrigger] = useState(null);
  const [menu, setMenu] = useState(null);
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger?.focus?.();
  }, [trigger]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (root && !root.contains(event.target)) close(false); };
    const onKeyDown = (event) => { if (event.key === "Escape") { event.preventDefault(); close(true); } };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, root, close]);
  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => menu?.querySelector('[role="menuitem"]')?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, menu]);
  return { open, setOpen, close, rootRef: setRoot, triggerRef: setTrigger, menuRef: setMenu, menuElement: menu };
}

function moveMenuFocus(event, menu) {
  const items = Array.from(menu?.querySelectorAll('[role="menuitem"]') || []);
  if (!items.length) return;
  const index = items.indexOf(document.activeElement);
  if (event.key === "ArrowDown") { event.preventDefault(); items[(index + 1) % items.length]?.focus(); }
  else if (event.key === "ArrowUp") { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus(); }
  else if (event.key === "Home") { event.preventDefault(); items[0]?.focus(); }
  else if (event.key === "End") { event.preventDefault(); items[items.length - 1]?.focus(); }
}

const toNotification = (item) => ({
  id: item.id,
  title: item.title || item.subject || "School notification",
  body: item.body || item.message || item.description || "Open notifications to view details.",
  unread: !(item.readAt || item.isRead || item.read || item.status === "read"),
});

export default function AdminTopNavbar({ onMenuClick }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const notificationDropdown = useDropdown();
  const profileDropdown = useDropdown();
  const [notifications, setNotifications] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        notificationApi.list({ page: 1, limit: 8 }),
        notificationApi.unreadSummary(),
      ]);
      const records = listResponse?.notifications || listResponse?.data?.notifications || (Array.isArray(listResponse?.data) ? listResponse.data : []);
      setNotifications(Array.isArray(records) ? records.map(toNotification) : []);
      setUnreadTotal(Number(summaryResponse?.total ?? summaryResponse?.data?.total ?? 0));
      setNotificationError("");
    } catch (error) {
      setNotificationError(error?.message || "Notifications could not be loaded.");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const displayName = getDisplayName(userInfo) || "Administrator";
  const firstName = getFirstName(userInfo) || "Administrator";
  const initials = getUserInitials(userInfo);
  const role = userInfo?.role || "Administrator";
  const unreadCount = unreadTotal || notifications.filter((item) => item.unread).length;

  const markNotificationRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item));
      setUnreadTotal((count) => Math.max(0, count - 1));
    } catch (error) {
      setNotificationError(error?.message || "Could not mark this notification as read.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
      setUnreadTotal(0);
    } catch (error) {
      setNotificationError(error?.message || "Could not update notifications.");
    }
  };

  const handleLogout = async () => {
    profileDropdown.close(false);
    try { await authApi.logout(); } catch { /* Always clear local session state. */ }
    try {
      window.sessionStorage.removeItem("petra_user_info");
      window.localStorage.removeItem("petra_user_info");
    } catch {}
    setUserInfo(normalizeUser({}));
    navigate("/signin", { replace: true });
  };

  const openNotifications = () => {
    notificationDropdown.close(false);
    navigate("/dashboard/communication/notifications");
  };

  return (
    <header className={["tn-root", isScrolled && "is-scrolled"].filter(Boolean).join(" ")} aria-label="Admin dashboard navigation">
      <div className="tn-root__left">
        <button type="button" className="tn-btn tn-menu-btn" onClick={() => onMenuClick?.()} aria-label="Toggle sidebar" title="Toggle sidebar">
          <Menu size={19} aria-hidden="true" />
        </button>
        <div className="tn-greeting">
          <div className="tn-greeting__line"><span>Welcome, </span><strong>{firstName}</strong></div>
          <span className="tn-date"><CalendarDays size={12} aria-hidden="true" />{formatToday()}</span>
        </div>
      </div>
      <div className="tn-root__right">
        <div className="tn-dropdown" ref={notificationDropdown.rootRef}>
          <button ref={notificationDropdown.triggerRef} type="button" className="tn-btn tn-bell-btn"
            onClick={() => { profileDropdown.setOpen(false); notificationDropdown.setOpen((value) => !value); }}
            aria-label={unreadCount ? "Notifications, " + unreadCount + " unread" : "Notifications"}
            title="Notifications" aria-haspopup="menu" aria-expanded={notificationDropdown.open} aria-controls="tn-notification-menu">
            <Bell size={18} aria-hidden="true" />
            {unreadCount > 0 && <span className="tn-badge" aria-hidden="true">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {notificationDropdown.open && (
            <div ref={notificationDropdown.menuRef} id="tn-notification-menu" className="tn-dropdown-panel tn-notification-panel"
              role="menu" aria-label="Notifications" onKeyDown={(event) => moveMenuFocus(event, notificationDropdown.menuElement)}>
              <div className="tn-panel-head">
                <div><strong>Notifications</strong><span>{unreadCount ? unreadCount + " unread" : "All caught up"}</span></div>
                <button type="button" className="tn-x-btn" onClick={() => notificationDropdown.close(true)} aria-label="Close notifications"><X size={16} /></button>
              </div>
              <div className="tn-notification-list">
                {notificationError ? (
                  <div className="tn-notice"><AlertCircle size={16} /><span className="tn-notice__copy"><strong>Unable to load notifications</strong><span>{notificationError}</span></span></div>
                ) : notifications.length ? notifications.map((item) => (
                  <button type="button" role="menuitem" className={["tn-notice", item.unread && "is-unread"].filter(Boolean).join(" ")} key={item.id}
                    onClick={async () => { await markNotificationRead(item.id); openNotifications(); }}>
                    <span className="tn-notice__icon" aria-hidden="true"><Bell size={15} /></span>
                    <span className="tn-notice__copy"><strong>{item.title}</strong><span>{item.body}</span></span>
                    {item.unread ? <span className="tn-unread-dot" aria-label="Unread" /> : <Check className="tn-read-icon" size={15} aria-label="Read" />}
                  </button>
                )) : (
                  <div className="tn-notice"><span className="tn-notice__copy"><strong>No notifications yet</strong><span>New school updates will appear here.</span></span></div>
                )}
              </div>
              <div className="tn-panel-footer">
                <button type="button" className="tn-text-btn" onClick={markAllAsRead} role="menuitem" disabled={!unreadCount}>Mark all as read</button>
                <button type="button" className="tn-text-btn" onClick={openNotifications} role="menuitem">View all</button>
              </div>
            </div>
          )}
        </div>
        <div className="tn-dropdown" ref={profileDropdown.rootRef}>
          <button ref={profileDropdown.triggerRef} type="button" className="tn-profile-btn"
            onClick={() => { notificationDropdown.setOpen(false); profileDropdown.setOpen((value) => !value); }}
            aria-haspopup="menu" aria-expanded={profileDropdown.open} aria-controls="tn-profile-menu">
            <span className="tn-avatar" aria-hidden="true">{initials}</span>
            <span className="tn-profile-copy"><strong>{displayName}</strong><small>{role}</small></span>
            <ChevronDown className={profileDropdown.open ? "tn-chevron is-open" : "tn-chevron"} size={15} aria-hidden="true" />
          </button>
          {profileDropdown.open && (
            <div ref={profileDropdown.menuRef} id="tn-profile-menu" className="tn-dropdown-panel tn-profile-panel"
              role="menu" aria-label="Profile menu" onKeyDown={(event) => moveMenuFocus(event, profileDropdown.menuElement)}>
              <button type="button" role="menuitem" className="tn-menu-item" onClick={() => { profileDropdown.close(false); navigate("/dashboard/setup/profile"); }}><UserRound size={16} />Profile</button>
              <button type="button" role="menuitem" className="tn-menu-item" onClick={() => { profileDropdown.close(false); navigate("/dashboard/settings"); }}><Settings size={16} />Settings</button>
              <button type="button" role="menuitem" className="tn-menu-item" onClick={() => { profileDropdown.close(false); navigate("/dashboard/finance"); }}><CreditCard size={16} />Finance</button>
              <div className="tn-menu-divider" aria-hidden="true" />
              <button type="button" role="menuitem" className="tn-menu-item tn-danger-item" onClick={handleLogout}><LogOut size={16} />Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
