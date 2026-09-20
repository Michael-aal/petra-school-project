
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, normalizeUser } from "../../utils/userProfile";
import "../../Styles/DashBoardLayout/TopNavbar.css";

const formatNotificationTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

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

    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        close(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector('[role="menuitem"]')
        ?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return {
    open,
    setOpen,
    close,
    rootRef,
    triggerRef,
    menuRef,
  };
}

function moveMenuFocus(event, menuRef) {
  const items = Array.from(
    menuRef.current?.querySelectorAll('[role="menuitem"]') || []
  );

  if (!items.length) {
    return;
  }

  const currentIndex = items.indexOf(document.activeElement);

  if (event.key === "ArrowDown") {
    event.preventDefault();

    items[
      (currentIndex + 1) % items.length
    ]?.focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();

    items[
      (currentIndex - 1 + items.length) % items.length
    ]?.focus();
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
  firstName,
  fullName,
  initials,
  role,
  onNavigate,
  onLogout,
}) {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(UserContext);

  const notificationDropdown = useDropdown();
  const profileDropdown = useDropdown();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const displayName =
    fullName ||
    getDisplayName(userInfo) ||
    "Martince Core";

  const displayFirstName =
    firstName ||
    userInfo?.firstName ||
    displayName.split(" ")[0] ||
    "Martince";

  const displayRole =
    role ||
    userInfo?.role ||
    "Administrator";

  const displayInitials =
    initials ||
    userInfo?.initials ||
    displayName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "MC";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const result = await notificationApi.list({ page: 1, limit: 6 });
      const latest = Array.isArray(result?.notifications) ? result.notifications : [];
      setNotifications(latest);
      setUnreadCount(Number(result?.unread || 0));
    } catch {
      // Notification UI must never block the dashboard.
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const handleNotificationKeyDown = (event) => {
    if (event.key === "Escape") {
      return;
    }

    moveMenuFocus(
      event,
      notificationDropdown.menuRef
    );
  };

  const handleProfileKeyDown = (event) => {
    if (event.key === "Escape") {
      return;
    }

    moveMenuFocus(
      event,
      profileDropdown.menuRef
    );
  };

  const handleNotificationClick = async (notification) => {
    notificationDropdown.close(false);

    if (!notification?.id) {
      navigate("/dashboard/communication/notifications");
      return;
    }

    try {
      if (!notification.isRead) {
        await notificationApi.markRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // Still take the user to the notification centre.
    }

    navigate(
      notification.targetPath ||
        `/dashboard/communication/notifications?notification=${encodeURIComponent(notification.id)}`
    );
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch {
      // Keep the dropdown usable if the API is temporarily unavailable.
    }
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

    navigate(
      routes[id] || "/dashboard"
    );
  };

  const handleLogout = async () => {
    profileDropdown.close(false);

    if (onLogout) {
      await onLogout();
      return;
    }

    try {
      await authApi.logout();
    } catch {
      // Continue with local cleanup even if the API request fails.
    } finally {
      try {
        window.sessionStorage.removeItem(
          "petra_user_info"
        );

        window.localStorage.removeItem(
          "petra_user_info"
        );

        window.localStorage.removeItem(
          "petra_selected_school_id"
        );
      } catch {
        // Storage may be unavailable.
      }

      try {
        setUserInfo(normalizeUser({}));
      } catch {
        // Context cleanup should not block logout navigation.
      }

      navigate("/signin", {
        replace: true,
      });
    }
  };

  return (
    <header
      className={`tn-root${
        isScrolled ? " is-scrolled" : ""
      }`}
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
          <Menu
            size={19}
            aria-hidden="true"
          />
        </button>

        <div className="tn-greeting">
          <div className="tn-greeting__line">
            <span>Welcome, </span>
            <strong>{displayFirstName}</strong>
          </div>

          <span className="tn-date">
            <CalendarDays
              size={12}
              aria-hidden="true"
            />
            {formatToday()}
          </span>
        </div>
      </div>

      <div className="tn-root__right">
        <div
          className="tn-dropdown"
          ref={notificationDropdown.rootRef}
        >
          <button
            ref={notificationDropdown.triggerRef}
            type="button"
            className="tn-btn tn-bell-btn"
            onClick={() => {
              profileDropdown.setOpen(false);

              notificationDropdown.setOpen(
                (current) => !current
              );
            }}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            title="Notifications"
            aria-haspopup="menu"
            aria-expanded={
              notificationDropdown.open
            }
            aria-controls="tn-notification-menu"
          >
            <Bell
              size={18}
              aria-hidden="true"
            />

            {unreadCount > 0 && (
              <span
                className="tn-badge"
                aria-hidden="true"
              >
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          {notificationDropdown.open && (
            <div
              ref={notificationDropdown.menuRef}
              id="tn-notification-menu"
              className="tn-dropdown-panel tn-notification-panel"
              role="menu"
              aria-label="Notifications"
              onKeyDown={
                handleNotificationKeyDown
              }
            >
              <div className="tn-panel-head">
                <div>
                  <strong>
                    Notifications
                  </strong>

                  <span>{unreadCount > 0 ? `${unreadCount} unread` : notifications.length ? "Latest activity" : "All caught up"}</span>
                </div>

                <button
                  type="button"
                  className="tn-x-btn"
                  onClick={() =>
                    notificationDropdown.close(
                      true
                    )
                  }
                  aria-label="Close notifications"
                  title="Close notifications"
                >
                  <X
                    size={16}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="tn-notification-list">
                {notificationsLoading ? (
                  <div className="tn-notification-loading">
                    Loading latest notifications...
                  </div>
                ) : notifications.length ? (
                  notifications.map((notification, index) => (
                    <button
                      key={notification.id}
                      type="button"
                      role="menuitem"
                      className={`tn-notice${notification.isRead ? "" : " is-unread"}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <span className="tn-notice__icon" aria-hidden="true">
                        <Bell size={15} />
                      </span>

                      <span className="tn-notice__copy">
                        <span className="tn-notice__meta">
                          {index === 0 ? <strong className="tn-latest-label">Latest</strong> : null}
                          {notification.section ? (
                            <span className="tn-section-label">{notification.section}</span>
                          ) : null}
                          <span>{formatNotificationTime(notification.createdAt)}</span>
                        </span>
                        <strong>{notification.title}</strong>
                        <span>{notification.body}</span>
                      </span>

                      {!notification.isRead ? (
                        <span className="tn-unread-dot" aria-label="Unread" />
                      ) : (
                        <Check className="tn-read-icon" size={15} aria-label="Read" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="tn-notification-empty">
                    No new notifications yet.
                  </div>
                )}
              </div>

              <div className="tn-panel-footer">
                <div className="tn-panel-footer__actions">
                  <button
                    type="button"
                    className="tn-text-btn"
                    onClick={markAllAsRead}
                    role="menuitem"
                    disabled={!unreadCount}
                  >
                    Mark all as read
                  </button>
                  <button
                    type="button"
                    className="tn-text-btn tn-view-all-btn"
                    onClick={() => {
                      notificationDropdown.close(false);
                      navigate("/dashboard/communication/notifications");
                    }}
                    role="menuitem"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="tn-dropdown"
          ref={profileDropdown.rootRef}
        >
          <button
            ref={profileDropdown.triggerRef}
            type="button"
            className="tn-profile-btn"
            onClick={() => {
              notificationDropdown.setOpen(
                false
              );

              profileDropdown.setOpen(
                (current) => !current
              );
            }}
            aria-haspopup="menu"
            aria-expanded={
              profileDropdown.open
            }
            aria-controls="tn-profile-menu"
            title="Open profile menu"
          >
            <span
              className="tn-avatar"
              aria-hidden="true"
            >
              {displayInitials}
            </span>

            <span className="tn-profile-copy">
              <strong>{displayName}</strong>
              <small>{displayRole}</small>
            </span>

            <ChevronDown
              className={`tn-chevron${
                profileDropdown.open
                  ? " is-open"
                  : ""
              }`}
              size={15}
              aria-hidden="true"
            />
          </button>

          {profileDropdown.open && (
            <div
              ref={profileDropdown.menuRef}
              id="tn-profile-menu"
              className="tn-dropdown-panel tn-profile-panel"
              role="menu"
              aria-label="Profile menu"
              onKeyDown={
                handleProfileKeyDown
              }
            >
              <button
                type="button"
                role="menuitem"
                className="tn-menu-item"
                onClick={() =>
                  handleProfileNavigate(
                    "profile"
                  )
                }
              >
                <UserRound
                  size={16}
                  aria-hidden="true"
                />
                Profile
              </button>

              <button
                type="button"
                role="menuitem"
                className="tn-menu-item"
                onClick={() =>
                  handleProfileNavigate(
                    "settings"
                  )
                }
              >
                <Settings
                  size={16}
                  aria-hidden="true"
                />
                Settings
              </button>

              <button
                type="button"
                role="menuitem"
                className="tn-menu-item"
                onClick={() =>
                  handleProfileNavigate(
                    "billing"
                  )
                }
              >
                <CreditCard
                  size={16}
                  aria-hidden="true"
                />
                Billing
              </button>

              <div
                className="tn-menu-divider"
                aria-hidden="true"
              />

              <button
                type="button"
                role="menuitem"
                className="tn-menu-item tn-danger-item"
                onClick={handleLogout}
              >
                <LogOut
                  size={16}
                  aria-hidden="true"
                />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
