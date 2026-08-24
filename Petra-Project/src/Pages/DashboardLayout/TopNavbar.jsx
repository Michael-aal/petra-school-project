import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import {
  getDisplayName,
  getFirstName,
  normalizeUser,
} from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";
import { useToasts } from "../../context/ToastContext";
import "../../Styles/DashBoardLayout/TopNavbar.css";

export default function TopNavbar({ onToggle }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const { info } = useToasts();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAskNuvoraClick = () => {
    if (location.pathname.startsWith("/staff")) {
      navigate("/staff/ask-nuvora");
    } else if (location.pathname.startsWith("/portal")) {
      navigate("/portal/ask-nuvora");
    } else {
      navigate("/dashboard/ask-nuvora");
    }
  };

  const handleMenuClick = () => {
    onToggle?.();
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      try {
        window.sessionStorage.removeItem("petra_user_info");
      } catch (e) {}
      try {
        window.localStorage.removeItem("petra_user_info");
      } catch (e) {}
      try {
        window.localStorage.removeItem("petra_selected_school_id");
      } catch (e) {}
      try {
        setUserInfo(normalizeUser({}));
      } catch {
        // ignore
      }
      navigate("/signin", { replace: true });
    }
  };

  const unreadCount = Number(
    userInfo?.unreadNotifications || userInfo?.notificationCount || 0,
  );

  return (
    <header className="top-navbar">
      <div className="top-left">
        <button
          className="menu-btn"
          onClick={handleMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="top-welcome">Welcome, {getFirstName(userInfo)}</div>
      </div>

      <div className="top-right">
        <button
          type="button"
          className="icon-btn flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-200"
          onClick={handleAskNuvoraClick}
          title="Ask Nuvora AI"
        >
          <Sparkles size={16} className="text-orange-600" />
          <span className="hidden sm:inline">Ask Nuvora</span>
        </button>

        <div className="notification-menu" ref={notifRef}>
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications((current) => !current)}
            aria-expanded={showNotifications}
            aria-haspopup="menu"
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="nav-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {showNotifications ? (
            <div className="notification-dropdown" role="menu">
              <div className="notification-header">
                <strong>Notifications</strong>
                <button
                  type="button"
                  className="notification-close"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                >
                  ×
                </button>
              </div>
              <div className="notification-body">
                <p className="notification-empty">No new notifications</p>
              </div>
              <button
                type="button"
                className="notification-action"
                onClick={() => {
                  setShowNotifications(false);
                  info(
                    "Notifications",
                    "Live notifications will appear here as they arrive.",
                  );
                }}
              >
                See all Notifications
              </button>
            </div>
          ) : null}
        </div>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-info"
            onClick={() => setShowMenu((current) => !current)}
            aria-expanded={showMenu}
            aria-haspopup="menu"
          >
            <UserAvatar
              user={userInfo}
              size={36}
              className="avatar"
              alt={getDisplayName(userInfo)}
            />
            <div className="user-meta">
              <div className="user-name">
                <span className="greets">Hi,</span> {getDisplayName(userInfo)}
              </div>
            </div>
            <div className="user-caret">
              <ChevronDown size={16} />
            </div>
          </button>

          {showMenu ? (
            <div className="account-dropdown" role="menu">
              <div className="account-dropdown-header">
                <UserAvatar user={userInfo} size={44} />
                <div>
                  <strong>{getDisplayName(userInfo)}</strong>
                  <span>{userInfo?.email || "No email available"}</span>
                </div>
              </div>
              <div className="account-dropdown-body">
                <div>
                  <span>Username</span>
                  <strong>{userInfo?.username || "—"}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{userInfo?.role || "User"}</strong>
                </div>
              </div>
              <div className="account-dropdown-actions">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/setup/profile")}
                >
                  <UserIcon size={16} /> Profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  <Settings size={16} /> Settings
                </button>
                <button type="button" onClick={handleLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
