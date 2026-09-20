import { useContext, useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, User as UserIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, normalizeUser } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";
import "../../Styles/DashBoardLayout/TopNavbar.css";
import "../../Styles/DashBoardLayout/NuvoraShellPolish.css";

export default function TopNavbar({ onToggle }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("shopeers-theme") === "dark"; } catch { return false; } });
  const [unread, setUnread] = useState(Number(userInfo?.unreadNotifications || userInfo?.notificationCount || 0));
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
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
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotificationsOpen(false);
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

  return <header className="top-navbar">
    <div className="top-left">
      <button type="button" className="menu-btn" onClick={() => onToggle?.()} aria-label="Toggle sidebar"><Menu size={18} strokeWidth={2} /></button>
      <div className="top-search"><Search size={17} /><input ref={searchRef} placeholder="Search anything..." aria-label="Search anything" /><kbd>⌘K</kbd></div>
    </div>
    <div className="top-right">
      <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      <div className="notification-menu" ref={notificationRef}>
        <button type="button" className="icon-btn notification-button" onClick={() => setNotificationsOpen((value) => !value)} aria-expanded={notificationsOpen} aria-haspopup="menu" aria-label="Notifications"><Bell size={18} />{unread > 0 && <span className="nav-badge">{unread > 9 ? "9+" : unread}</span>}</button>
        {notificationsOpen && <div className="notification-dropdown" role="menu"><div className="notification-header"><strong>Notifications</strong><span>{unread} new</span></div><p>{unread ? "You have recent store updates to review." : "No new notifications."}</p><button type="button" className="notification-action" onClick={() => { setNotificationsOpen(false); navigate("/dashboard/communication/notifications"); }}>See all Notifications</button></div>}
      </div>
      <div className="user-menu" ref={menuRef}>
        <button type="button" className="user-info" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-haspopup="menu"><UserAvatar user={userInfo} size={36} className="avatar" alt={getDisplayName(userInfo)} /><div className="user-meta"><strong>{getDisplayName(userInfo)}</strong><span>{userInfo?.role || "Admin"}</span></div><ChevronDown size={15} /></button>
        {menuOpen && <div className="account-dropdown" role="menu"><div className="account-dropdown-header"><UserAvatar user={userInfo} size={44} /><div><strong>{getDisplayName(userInfo)}</strong><span>{userInfo?.email || "No email available"}</span></div></div><div className="account-dropdown-actions"><button type="button" onClick={() => navigate("/dashboard/setup/profile")}><UserIcon size={16} />Profile</button><button type="button" onClick={() => navigate("/dashboard/settings")}><Settings size={16} />Settings</button><button type="button" onClick={logout}><LogOut size={16} />Logout</button></div></div>}
      </div>
    </div>
  </header>;
}
