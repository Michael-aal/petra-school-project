import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User as UserIcon,
  X,
} from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { getDisplayName, getFirstName } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";
import "../../Styles/DashBoardLayout/TopNavbar.css";

export default function TopNavbar({ onToggle }) {
  const { userInfo } = useContext(UserContext);
  const [showButton, setShowBtn] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleMenuClick = () => {
    setShowBtn(!showButton);
    if (onToggle) onToggle();
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
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
          {!showButton ? <Menu /> : <Menu />}
        </button>
        <div className="top-welcome">Welcome, {getFirstName(userInfo)}</div>
      </div>

      <div className="top-right">
        <button className="icon-btn" aria-label="Notifications">
          <Bell />
        </button>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-info"
            onClick={() => setShowMenu((current) => !current)}
            aria-expanded={showMenu}
            aria-haspopup="menu"
          >
            <UserAvatar  user={userInfo} size={36} className="avatar" alt={getDisplayName(userInfo)} />
            <div className="user-meta">
              <div className="user-name"><span className="greets">Hi,</span> {getDisplayName(userInfo)}</div>
              {/* <div className="user-role">{userInfo?.role || "user"}</div> */}
            </div>
            <div className="user-caret">
              <ChevronDown />
            </div>
          </button>

          {showMenu ? (
            <div className="account-dropdown" role="menu">
              <div className="account-dropdown-header">
                <UserAvatar user={userInfo} size={44}  />
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
                  <strong>{userInfo?.role || "user"}</strong>
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
          ) : null}
        </div>
      </div>
    </header>
  );
}