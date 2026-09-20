// <<<<<<< ui/modern-nuvora-topbar
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
=======
import { useContext, useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, User as UserIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, normalizeUser } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";
import CommandPalette from "../../components/CommandPalette/CommandPalette";
// >>>>>>> main
import "../../Styles/DashBoardLayout/TopNavbar.css";
import { authApi } from "../../services/authApi";

const MOCK_NOTIFICATIONS = [
  {
    id: "notification-1",
    title: "New application received",
    body: "A new student application is ready for review.",
    unread: true,
  },
  {
    id: "notification-2",
    title: "Payment update",
    body: "A recent school payment has been recorded.",
    unread: true,
  },
  {
    id: "notification-3",
    title: "System reminder",
    body: "Review your latest dashboard activity.",
    unread: true,
  },
];

// <<<<<<< ui/modern-nuvora-topbar
const formatToday = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

function useDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close(false);
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return undefined;

    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return { open, setOpen, close, rootRef, triggerRef, menuRef };
}

function moveMenuFocus(event, menuRef) {
  const items = Array.from(
    menuRef.current?.querySelectorAll('[role="menuitem"]') || []
  );

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
  }
}

export default function TopNavbar({
  onMenuClick,
  firstName = "Martince",
  fullName = "Martince Core",
  initials = "MC",
  role = "Administrator",
  onNavigate,
  onLogout,
}) {
  const navigate = useNavigate();
  const notificationDropdown = useDropdown();
  const profileDropdown = useDropdown();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const handleNotificationKeyDown = (event) => {
    if (event.key === "Escape") return;
    moveMenuFocus(event, notificationDropdown.menuRef);
  };

  const handleProfileKeyDown = (event) => {
    if (event.key === "Escape") return;
    moveMenuFocus(event, profileDropdown.menuRef);
  };

  const markNotificationRead = (id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false }))
    );
  };

  const handleProfileNavigate = (id) => {
    profileDropdown.close(false);
    if (onNavigate) {
      onNavigate(id);
      return;
    }

    const routes = {
      profile: "/dashboard/setup/profile",
      settings: "/dashboard/settings",
      billing: "/dashboard/finance",
    };
    navigate(routes[id] || "/dashboard");
  };

  const handleLogout = async () => {
    profileDropdown.close(false);
    if (onLogout) {
      await onLogout();
      return;
    }

    try {
      await authApi.logout();
    } finally {
      navigate("/signin", { replace: true });
    }
  };

  return (
    <header
      className={`tn-root${isScrolled ? " is-scrolled" : ""}`}
      aria-label="Dashboard navigation"
    >
      <div className="tn-root__left">
        <button
          type="button"
          className="tn-btn tn-menu-btn"
          onClick={() => onMenuClick?.()}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={19} aria-hidden="true" />
        </button>

        <div className="tn-greeting">
          <div className="tn-greeting__line">
            <span>Welcome, </span>
            <strong>{firstName}</strong>
          </div>
          <span className="tn-date">
            <CalendarDays size={12} aria-hidden="true" />
            {formatToday()}
          </span>
        </div>
      </div>

      <div className="tn-root__right">
        <div className="tn-dropdown" ref={notificationDropdown.rootRef}>
          <button
            ref={notificationDropdown.triggerRef}
            type="button"
            className="tn-btn tn-bell-btn"
            onClick={() => {
              profileDropdown.setOpen(false);
              notificationDropdown.setOpen((current) => !current);
            }}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            title="Notifications"
            aria-haspopup="menu"
            aria-expanded={notificationDropdown.open}
            aria-controls="tn-notification-menu"
          >
            <Bell size={18} aria-hidden="true" />
            {unreadCount > 0 ? (
              <span className="tn-badge" aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {notificationDropdown.open ? (
            <div
              ref={notificationDropdown.menuRef}
              id="tn-notification-menu"
              className="tn-dropdown-panel tn-notification-panel"
              role="menu"
              aria-label="Notifications"
              onKeyDown={handleNotificationKeyDown}
            >
              <div className="tn-panel-head">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up"}
                  </span>
                </div>

                <button
                  type="button"
                  className="tn-x-btn"
                  onClick={() => notificationDropdown.close(true)}
                  aria-label="Close notifications"
                  title="Close notifications"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="tn-notification-list">
                {notifications.map((notification) => (
                  <button
                    type="button"
                    role="menuitem"
                    className={`tn-notice${notification.unread ? " is-unread" : ""}`}
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <span className="tn-notice__icon" aria-hidden="true">
                      <Bell size={15} />
                    </span>

                    <span className="tn-notice__copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.body}</span>
                    </span>

                    {notification.unread ? (
                      <span className="tn-unread-dot" aria-label="Unread" />
                    ) : (
                      <Check
                        className="tn-read-icon"
                        size={15}
                        aria-label="Read"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="tn-panel-footer">
                <button
                  type="button"
                  className="tn-text-btn"
                  onClick={markAllAsRead}
                  role="menuitem"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="tn-dropdown" ref={profileDropdown.rootRef}>
          <button
            ref={profileDropdown.triggerRef}
            type="button"
            className="tn-profile-btn"
            onClick={() => {
              notificationDropdown.setOpen(false);
              profileDropdown.setOpen((current) => !current);
            }}
            aria-haspopup="menu"
            aria-expanded={profileDropdown.open}
            aria-controls="tn-profile-menu"
          >
            <span className="tn-avatar" aria-hidden="true">
              {initials}
            </span>

            <span className="tn-profile-copy">
              <strong>{fullName}</strong>
              <small>{role}</small>
            </span>

            <ChevronDown
              className={`tn-chevron${profileDropdown.open ? " is-open" : ""}`}
              size={15}
              aria-hidden="true"
            />
          </button>

          {profileDropdown.open ? (
            <div
              ref={profileDropdown.menuRef}
              id="tn-profile-menu"
              className="tn-dropdown-panel tn-profile-panel"
              role="menu"
              aria-label="Profile menu"
              onKeyDown={handleProfileKeyDown}
            >
              <button
                type="button"
                role="menuitem"
                className="tn-menu-item"
                onClick={() => handleProfileNavigate("profile")}
              >
                <UserRound size={16} aria-hidden="true" />
                Profile
              </button>

              <button
                type="button"
                role="menuitem"
                className="tn-menu-item"
                onClick={() => handleProfileNavigate("settings")}
              >
                <Settings size={16} aria-hidden="true" />
                Settings
              </button>

              <button
                type="button"
                role="menuitem"
                className="tn-menu-item"
                onClick={() => handleProfileNavigate("billing")}
              >
                <CreditCard size={16} aria-hidden="true" />
                Billing
              </button>

              <div className="tn-menu-divider" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                className="tn-menu-item tn-danger-item"
                onClick={handleLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          ) : null}
=======
export default function TopNavbar({ onToggle }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("shopeers-theme") === "dark"; } catch { return false; } });
  const [unread, setUnread] = useState(Number(userInfo?.unreadNotifications || userInfo?.notificationCount || 0));
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sync = (event) => setDark(Boolean(event.detail));
    window.addEventListener("shopeers-theme-change", sync);
    return () => window.removeEventListener("shopeers-theme-change", sync);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotificationsOpen(false);
        setPaletteOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const result = await notificationApi.list({ page: 1, limit: 10 });
        if (active) setUnread(Array.isArray(result?.notifications) ? result.notifications.length : 0);
      } catch {}
    };
    poll();
    const timer = window.setInterval(poll, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("shopeers-theme", next ? "dark" : "light"); } catch {}
    document.documentElement.classList.toggle("shopeers-dark", next);
    window.dispatchEvent(new CustomEvent("shopeers-theme-change", { detail: next }));
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    try { window.sessionStorage.removeItem("petra_user_info"); window.localStorage.removeItem("petra_user_info"); window.localStorage.removeItem("petra_selected_school_id"); } catch {}
    try { setUserInfo(normalizeUser({})); } catch {}
    navigate("/signin", { replace: true });
  };

  return (
    <>
      <header className="top-navbar">
        <div className="top-left">
          <button type="button" className="menu-btn" onClick={() => onToggle?.()} aria-label="Toggle sidebar">
            <Menu size={18} strokeWidth={2} />
          </button>
          <div className="top-search" onClick={() => setPaletteOpen(true)} role="button" tabIndex={0} aria-label="Open command palette">
            <Search size={16} />
            <span className="search-placeholder">Search modules, learners, actions...</span>
            <kbd>⌘K</kbd>
          </div>
        </div>
        <div className="top-right">
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="notification-menu" ref={notificationRef}>
            <button type="button" className="icon-btn notification-button" onClick={() => setNotificationsOpen((value) => !value)} aria-expanded={notificationsOpen} aria-haspopup="menu" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="nav-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
            {notificationsOpen && (
              <div className="notification-dropdown" role="menu">
                <div className="notification-header">
                  <strong>Notifications</strong>
                  <span>{unread} new</span>
                </div>
                <p>{unread ? "You have recent school updates to review." : "No new notifications."}</p>
                <button type="button" className="notification-action" onClick={() => { setNotificationsOpen(false); navigate("/dashboard/communication/notifications"); }}>
                  See all Notifications
                </button>
              </div>
            )}
          </div>
          <div className="user-menu" ref={menuRef}>
            <button type="button" className="user-info" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-haspopup="menu">
              <UserAvatar user={userInfo} size={36} className="avatar" alt={getDisplayName(userInfo)} />
              <div className="user-meta">
                <strong>{getDisplayName(userInfo)}</strong>
                <span>{userInfo?.role || "Admin"}</span>
              </div>
              <ChevronDown size={15} />
            </button>
            {menuOpen && (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-header">
                  <UserAvatar user={userInfo} size={44} />
                  <div>
                    <strong>{getDisplayName(userInfo)}</strong>
                    <span>{userInfo?.email || "No email available"}</span>
                  </div>
                </div>
                <div className="account-dropdown-actions">
                  <button type="button" onClick={() => navigate("/dashboard/setup/profile")}><UserIcon size={16} />Profile</button>
                  <button type="button" onClick={() => navigate("/dashboard/settings")}><Settings size={16} />Settings</button>
                  <button type="button" onClick={logout}><LogOut size={16} />Logout</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
