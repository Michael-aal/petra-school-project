import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Settings, User as UserIcon, X } from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { getDisplayName, getFirstName } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";
import "../../Styles/DashBoardLayout/TopNavbar.css";

export default function TopNavbar({ onToggle }) {
  const { userInfo } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // FIXED: Simplified to just call the parent's toggle function
  const handleMenuClick = () => {
    if (onToggle) onToggle();
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      window.localStorage.removeItem("petra_user_info");
      navigate("/signin", { replace: true });
    }
  };

  return (
    <header className="top-navbar">
      <div className="top-left">
        <button className="menu-btn" onClick={handleMenuClick} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div className="top-welcome">Welcome, {getFirstName(userInfo)}</div>
      </div>

      <div className="top-right">
        <div className="notification-menu" ref={notifRef}>
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications((current) => !current)}
          >
            <Bell size={20} />
          </button>

          {showNotifications && (
            <div className="notification-dropdown" role="menu">
              <div className="notification-header">
                <strong>Notifications</strong>
                <button type="button" className="notification-close" onClick={() => setShowNotifications(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="notification-body">
                <p className="notification-empty">No new notifications</p>
              </div>
              <button type="button" className="notification-action" onClick={() => setShowNotifications(false)}>
                See all Notifications
              </button>
            </div>
          )}
        </div>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-info"
            onClick={() => setShowMenu((current) => !current)}
          >
            <UserAvatar user={userInfo} size={36} className="avatar" alt={getDisplayName(userInfo)} />
            <div className="user-meta">
              <div className="user-name">
                <span className="greets">Hi,</span> {getDisplayName(userInfo)}
              </div>
            </div>
            <div className="user-caret">
              <ChevronDown size={16} />
            </div>
          </button>

          {showMenu && (
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
                <button type="button" onClick={() => navigate("/dashboard/setup/profile")}>
                  <UserIcon size={16} /> Profile
                </button>
                <button type="button" onClick={() => navigate("/dashboard/settings")}>
                  <Settings size={16} /> Settings
                </button>
                <button type="button" onClick={handleLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}