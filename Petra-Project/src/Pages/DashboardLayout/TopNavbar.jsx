import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Settings, Sparkles, User as UserIcon, X } from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, getFirstName, normalizeUser } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";
import { useToasts } from "../../context/ToastContext";
import "../../Styles/DashBoardLayout/TopNavbar.css";

const POLL_MS = 3000;
const getTime = (item) => { const value = Date.parse(item?.createdAt || item?.created_at || item?.sentAt || item?.publishedAt || ""); return Number.isFinite(value) ? value : 0; };

export default function TopNavbar({ onToggle }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const { info } = useToasts();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const initializedRef = useRef(false);
  const latestKeyRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNuvoraClick = () => {
    if (location.pathname.startsWith("/staff")) navigate("/staff/ask-nuvora");
    else if (location.pathname.startsWith("/portal")) navigate("/portal/ask-nuvora");
    else navigate("/dashboard/ask-nuvora");
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const dismissIncoming = () => setIncoming(null);

  const isForCurrentUser = (notification) => {
    const recipientId = notification?.recipientUserId || notification?.recipientId || notification?.userId;
    if (!recipientId) return true;
    return String(recipientId) === String(userInfo?.id);
  };

  const showIncoming = (notification) => {
    if (!isForCurrentUser(notification)) return;
    if (!notification?.id && !notification?.tag) return;
    const key = String(notification.id || notification.tag);
    if (key === latestKeyRef.current) return;
    latestKeyRef.current = key;
    setIncoming(notification);
    setShowNotifications(true);
    info(notification.title || "New notification", notification.body || "You have a new notification.");
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "PETRA_GET_CURRENT_USER") {
        event.ports?.[0]?.postMessage({ userId: userInfo?.id ? String(userInfo.id) : null });
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
        const list = Array.isArray(result?.notifications) ? result.notifications.filter(isForCurrentUser) : [];
        if (!list.length) { initializedRef.current = true; return; }
        const latest = [...list].sort((a, b) => getTime(b) - getTime(a))[0];
        if (!latest?.id) return;
        if (!initializedRef.current) {
          initializedRef.current = true;
          latestKeyRef.current = String(latest.id);
          return;
        }
        if (String(latest.id) !== latestKeyRef.current) showIncoming(latest);
      } catch {
        // Notification polling is non-blocking.
      }
    };
    checkNotifications();
    const timer = window.setInterval(checkNotifications, POLL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, [info, userInfo?.id]);

  useEffect(() => {
    if (!incoming) return undefined;
    const handleNuvoraClick = () => dismissIncoming();
    document.addEventListener("click", handleNuvoraClick, true);
    return () => document.removeEventListener("click", handleNuvoraClick, true);
  }, [incoming]);

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      try { window.sessionStorage.removeItem("petra_user_info"); } catch {}
      try { window.localStorage.removeItem("petra_user_info"); } catch {}
      try { window.localStorage.removeItem("petra_selected_school_id"); } catch {}
      try { setUserInfo(normalizeUser({})); } catch {}
      navigate("/signin", { replace: true });
    }
  };

  const unreadCount = Number(userInfo?.unreadNotifications || userInfo?.notificationCount || 0);

  return (
    <header className="top-navbar">
      {incoming ? (
        <div role="alert" aria-live="polite" style={{ position: "fixed", top: 18, right: 18, zIndex: 100000, width: "min(390px, calc(100vw - 36px))", padding: "16px 18px", borderRadius: 14, background: "#0f172a", color: "#fff", boxShadow: "0 18px 45px rgba(0,0,0,.3)", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }} onClick={dismissIncoming}>
          <Bell size={21} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{incoming.title || "New notification"}</div>
            <div style={{ fontSize: 14, lineHeight: 1.45, opacity: .9 }}>{incoming.body || "You have a new notification."}</div>
          </div>
          <button type="button" aria-label="Close notification" onClick={(event) => { event.stopPropagation(); dismissIncoming(); }} style={{ border: 0, background: "transparent", color: "#fff", cursor: "pointer", padding: 2 }}><X size={18} /></button>
        </div>
      ) : null}

      <div className="top-left">
        <button className="menu-btn" onClick={() => onToggle?.()} aria-label="Toggle menu"><Menu size={20} /></button>
        <div className="top-welcome">Welcome, {getFirstName(userInfo)}</div>
      </div>

      <div className="top-right">
        <button type="button" className="ask-nuvora-btn icon-btn" onClick={handleNuvoraClick} title="Nuvora AI" aria-label="Nuvora"><span className="ask-nuvora-icon-wrap"><Sparkles size={14} /></span></button>
        <div className="notification-menu" ref={notifRef}>
          <button className="icon-btn" aria-label="Notifications" onClick={() => setShowNotifications((current) => !current)} aria-expanded={showNotifications} aria-haspopup="menu">
            <Bell size={20} />{unreadCount > 0 ? <span className="nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
          </button>
          {showNotifications ? (
            <div className="notification-dropdown" role="menu">
              <div className="notification-header"><strong>Notifications</strong><button type="button" className="notification-close" onClick={() => setShowNotifications(false)} aria-label="Close notifications">×</button></div>
              <div className="notification-body">
                {incoming ? <><strong>{incoming.title || "New notification"}</strong><p>{incoming.body || "You have a new notification."}</p></> : <p className="notification-empty">No new notifications</p>}
              </div>
              <button type="button" className="notification-action" onClick={() => { setShowNotifications(false); navigate("/dashboard/communication/notifications"); }}>See all Notifications</button>
            </div>
          ) : null}
        </div>

        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-info" onClick={() => setShowMenu((current) => !current)} aria-expanded={showMenu} aria-haspopup="menu">
            <UserAvatar user={userInfo} size={36} className="avatar" alt={getDisplayName(userInfo)} />
            <div className="user-meta"><div className="user-name"><span className="greets">Hi,</span> {getDisplayName(userInfo)}</div></div>
            <div className="user-caret"><ChevronDown size={16} /></div>
          </button>
          {showMenu ? (
            <div className="account-dropdown" role="menu">
              <div className="account-dropdown-header"><UserAvatar user={userInfo} size={44} /><div><strong>{getDisplayName(userInfo)}</strong><span>{userInfo?.email || "No email available"}</span></div></div>
              <div className="account-dropdown-body"><div><span>Username</span><strong>{userInfo?.username || "—"}</strong></div><div><span>Role</span><strong>{userInfo?.role || "User"}</strong></div></div>
              <div className="account-dropdown-actions">
                <button type="button" onClick={() => navigate("/dashboard/setup/profile")}><UserIcon size={16} /> Profile</button>
                <button type="button" onClick={() => navigate("/dashboard/settings")}><Settings size={16} /> Settings</button>
                <button type="button" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
