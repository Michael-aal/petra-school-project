import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Command,
  Moon,
  Search,
  Sun,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, getFirstName, normalizeUser } from "../../utils/userProfile";
import { useToasts } from "../../context/ToastContext";
import "../../Styles/DashBoardLayout/TopNavbar.css";
import "../../Styles/DashBoardLayout/NuvoraShellPolish.css";

const POLL_MS = 3000;

const getTime = (item) => {
  const value = Date.parse(
    item?.createdAt || item?.created_at || item?.sentAt || item?.publishedAt || ""
  );
  return Number.isFinite(value) ? value : 0;
};

const formatToday = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

const getInitials = (name) => {
  const parts = String(name || "Martince Core").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0]?.slice(0, 2).toUpperCase() || "MC";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const mockNotifications = [
  { id: "mock-1", title: "New notification", body: "You have a new activity waiting for your attention.", unread: true },
  { id: "mock-2", title: "School update", body: "Your latest school dashboard information is ready to review.", unread: true },
  { id: "mock-3", title: "System reminder", body: "Remember to review your recent account activity.", unread: true },
];

export default function TopNavbar({ onToggle }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const { info } = useToasts();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("petra_theme") || "light"; } catch { return "light"; }
  });
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const initializedRef = useRef(false);
  const latestKeyRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const displayName = getDisplayName(userInfo) || "Martince Core";
  const firstName = getFirstName(userInfo) || "Martince";
  const initials = getInitials(displayName);
  const role = userInfo?.role || "Administrator";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("petra_theme", theme);
    } catch {
      // Theme persistence is best-effort.
    }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        if (showMenu) {
          setShowMenu(false);
          menuTriggerRef.current?.focus();
        }
        if (showNotifications) {
          setShowNotifications(false);
          notificationTriggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMenu, showNotifications]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleMenuKeyDown = (event) => {
    const items = Array.from(event.currentTarget.querySelectorAll('[role="menuitem"]'));
    if (!items.length) return;

    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setShowMenu(false);
      setShowNotifications(false);
      menuTriggerRef.current?.focus();
    }
  };

  const handleNuvoraClick = () => {
    if (location.pathname.startsWith("/staff")) navigate("/staff/ask-nuvora");
    else if (location.pathname.startsWith("/portal")) navigate("/portal/ask-nuvora");
    else navigate("/dashboard/ask-nuvora");
  };

  const isForCurrentUser = (notification) => {
    const recipientId = notification?.recipientUserId || notification?.recipientId || notification?.userId;
    return !recipientId || String(recipientId) === String(userInfo?.id);
  };

  const showIncoming = (notification) => {
    if (!isForCurrentUser(notification) || (!notification?.id && !notification?.tag)) return;

    const key = String(notification.id || notification.tag);
    if (key === latestKeyRef.current) return;

    latestKeyRef.current = key;
    setIncoming(notification);
    setNotifications((current) => [
      {
        id: key,
        title: notification.title || "New notification",
        body: notification.body || "You have a new notification.",
        unread: true,
      },
      ...current.filter((item) => item.id !== key),
    ]);
    setShowNotifications(true);
    info(notification.title || "New notification", notification.body || "You have a new notification.");
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "PETRA_GET_CURRENT_USER") {
        event.ports?.[0]?.postMessage({
          userId: userInfo?.id ? String(userInfo.id) : null,
        });
        return;
      }

      if (event.data?.type !== "PETRA_NOTIFICATION") return;

      const payload = event.data.payload || {};
      showIncoming({
        id: payload.notificationId || payload.tag,
        tag: payload.tag,
        title: payload.title,
        body: payload.body,
        recipientUserId: payload.recipientUserId,
      });
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
  }, [info, userInfo?.id]);

  useEffect(() => {
    let active = true;

    const checkNotifications = async () => {
      try {
        const result = await notificationApi.list({ page: 1, limit: 10 });
        if (!active) return;

        const list = Array.isArray(result?.notifications)
          ? result.notifications.filter(isForCurrentUser)
          : [];

        if (!list.length) {
          initializedRef.current = true;
          return;
        }

        const latest = [...list].sort((a, b) => getTime(b) - getTime(a))[0];
        if (!latest?.id) return;

        if (!initializedRef.current) {
          initializedRef.current = true;
          latestKeyRef.current = String(latest.id);
          return;
        }

        if (String(latest.id) !== latestKeyRef.current) showIncoming(latest);
      } catch {
        // Polling is non-blocking.
      }
    };

    checkNotifications();
    const timer = window.setInterval(checkNotifications, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [info, userInfo?.id]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      try { window.sessionStorage.removeItem("petra_user_info"); } catch {}
      try { window.localStorage.removeItem("petra_user_info"); } catch {}
      try { window.localStorage.removeItem("petra_selected_school_id"); } catch {}
      try { setUserInfo(normalizeUser({})); } catch {}
      navigate("/signin", { replace: true });
    }
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <header className="tn-navbar">
      {incoming ? (
        <div className="tn-incoming" role="alert" aria-live="polite" onClick={() => setIncoming(null)}>
          <Bell size={20} aria-hidden="true" />
          <div className="tn-incoming-copy">
            <strong>{incoming.title || "New notification"}</strong>
            <span>{incoming.body || "You have a new notification."}</span>
          </div>
          <button
            type="button"
            className="tn-incoming-close"
            aria-label="Close notification"
            onClick={(event) => {
              event.stopPropagation();
              setIncoming(null);
            }}
          >
            <X size={17} />
          </button>
        </div>
      ) : null}

      <div className="tn-left">
        <button type="button" className="tn-icon-btn tn-menu-btn" onClick={() => onToggle?.()} aria-label="Toggle menu" title="Toggle menu">
          <Menu size={19} aria-hidden="true" />
        </button>

        <div className="tn-greeting">
          <span>Welcome, <strong>{firstName}</strong></span>
          <small><CalendarDays size={12} aria-hidden="true" />{formatToday()}</small>
          </div>
        <div className="tn-search-wrap">
          <Search size={16} aria-hidden="true" />
          <input ref={searchRef} type="search" className="tn-search-input" placeholder="Search anything..." aria-label="Search anything" />
          <kbd><Command size={11} aria-hidden="true" />K</kbd>
        </div>
        <button type="button" className="tn-search-mobile" aria-label="Search" title="Search" onClick={() => searchRef.current?.focus()}><Search size={18} aria-hidden="true" /></button>
      </div>

      <div className="tn-right">
        <button type="button" className="tn-icon-btn tn-theme-btn" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" className="tn-icon-btn" onClick={handleNuvoraClick} aria-label="Nuvora" title="Nuvora">
          <UserRound size={18} />
        </button>

        <div className="tn-dropdown" ref={notificationRef}>
          <button
            ref={notificationTriggerRef}
            type="button"
            className="tn-icon-btn tn-bell-btn"
            onClick={() => {
              setShowNotifications((current) => !current);
              setShowMenu(false);
            }}
            aria-label="Notifications"
            title="Notifications"
            aria-haspopup="menu"
            aria-expanded={showNotifications}
            aria-controls="tn-notification-menu"
          >
            <Bell size={18} />
            {unreadCount > 0 ? <span className="tn-badge" aria-label={`${unreadCount} unread`}>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
          </button>

          {showNotifications ? (
            <div id="tn-notification-menu" className="tn-dropdown-panel tn-notification-panel" role="menu" aria-label="Notifications" onKeyDown={handleMenuKeyDown}>
              <div className="tn-panel-head">
                <div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "All caught up"}</span></div>
                <button type="button" className="tn-panel-close" onClick={() => { setShowNotifications(false); notificationTriggerRef.current?.focus(); }} aria-label="Close notifications">
                  <X size={16} />
                </button>
              </div>

              <div className="tn-notification-list">
                {notifications.slice(0, 3).map((notification) => (
                  <button
                    type="button"
                    role="menuitem"
                    className={`tn-notification-item ${notification.unread ? "is-unread" : ""}`}
                    key={notification.id}
                    onClick={() => setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, unread: false } : item))}
                  >
                    <span className="tn-notification-icon"><Bell size={15} /></span>
                    <span className="tn-notification-copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.body}</span>
                    </span>
                    {notification.unread ? <span className="tn-unread-dot" aria-label="Unread" /> : <Check size={15} />}
                  </button>
                ))}
              </div>

              <div className="tn-panel-footer">
                <button type="button" className="tn-mark-read" onClick={markAllAsRead} role="menuitem">Mark all as read</button>
                <button type="button" className="tn-see-all" onClick={() => { setShowNotifications(false); navigate("/dashboard/communication/notifications"); }} role="menuitem">See all</button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="tn-dropdown" ref={menuRef}>
          <button
            ref={menuTriggerRef}
            type="button"
            className="tn-profile-trigger"
            onClick={() => { setShowMenu((current) => !current); setShowNotifications(false); }}
            aria-haspopup="menu"
            aria-expanded={showMenu}
            aria-controls="tn-profile-menu"
          >
            <span className="tn-avatar">{initials}</span>
            <span className="tn-profile-copy"><strong>{displayName}</strong><small>{role}</small></span>
            <ChevronDown className={`tn-chevron ${showMenu ? "is-open" : ""}`} size={15} />
          </button>

          {showMenu ? (
            <div id="tn-profile-menu" className="tn-dropdown-panel tn-profile-panel" role="menu" aria-label="Profile menu" onKeyDown={handleMenuKeyDown}>
              <div className="tn-profile-summary">
                <span className="tn-avatar tn-avatar-large">{initials}</span>
                <div><strong>{displayName}</strong><span>{userInfo?.email || role}</span></div>
              </div>

              <div className="tn-menu-group">
                <button type="button" role="menuitem" className="tn-menu-item" onClick={() => navigate("/dashboard/setup/profile")}><UserRound size={16} />Profile</button>
                <button type="button" role="menuitem" className="tn-menu-item" onClick={() => navigate("/dashboard/settings")}><Settings size={16} />Settings</button>
                <button type="button" role="menuitem" className="tn-menu-item" onClick={() => navigate("/dashboard/finance")}><CreditCard size={16} />Billing</button>
              </div>

              <div className="tn-menu-divider" />

              <button type="button" role="menuitem" className="tn-menu-item tn-danger-item" onClick={handleLogout}><LogOut size={16} />Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
