import { useCallback, useEffect, useRef, useState } from "react";
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
import "../../Styles/DashBoardLayout/TopNavbar.css";

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
  onMenuClick = () => {},
  firstName = "Martince",
  fullName = "Martince Core",
  initials = "MC",
  role = "Administrator",
  onNavigate = () => {},
  onLogout = () => {},
}) {
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
    onNavigate(id);
  };

  const handleLogout = () => {
    profileDropdown.close(false);
    onLogout();
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
          onClick={onMenuClick}
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
        </div>
      </div>
    </header>
  );
}
