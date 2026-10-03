import { useCallback, useEffect, useState } from "react";
import {
  Activity, ArrowUpRight, BookOpen, GraduationCap, RefreshCw,
  ShieldCheck, Users, UserRound, Wallet, AlertCircle, Clock3,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { adminApi } from "../../../services/adminApi";
import "./page-styles/DashboardHomePage.css";

const numberFormat = new Intl.NumberFormat("en-NG");
const dateFormat = new Intl.DateTimeFormat("en-NG", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-NG", {
  day: "numeric", month: "short", year: "numeric",
  hour: "numeric", minute: "2-digit",
});

const statDefinitions = [
  { key: "students", label: "Students", icon: GraduationCap, description: "Registered learners" },
  { key: "teachers", label: "Teachers", icon: BookOpen, description: "Teacher accounts" },
  { key: "staff", label: "Staff", icon: UserRound, description: "Non-teaching staff" },
  { key: "users", label: "Total users", icon: Users, description: "School user accounts" },
  { key: "roles", label: "Access roles", icon: ShieldCheck, description: "Configured role types" },
];

const defaultActions = [
  { label: "Manage users", href: "/dashboard/staff/management", icon: Users },
  { label: "View students", href: "/dashboard/students", icon: GraduationCap },
  { label: "Open finance", href: "/dashboard/finance", icon: Wallet },
  { label: "Review activity", href: "/dashboard/communication/notifications", icon: Activity },
];

function formatActivityDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateTimeFormat.format(date);
}

export default function DashboardHomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.dashboard();
      if (response?.success === false) {
        throw new Error(response.message || "The dashboard could not be loaded.");
      }
      setDashboard(response?.data || null);
    } catch (loadError) {
      setError(loadError?.message || "Unable to load school data. Please try again.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats || {};
  const activities = Array.isArray(dashboard?.recentActivities) ? dashboard.recentActivities : [];
  const actions = Array.isArray(dashboard?.quickActions) && dashboard.quickActions.length
    ? dashboard.quickActions
    : defaultActions;

  return (
    <main className="petra-dashboard-page" aria-labelledby="admin-dashboard-title">
      <header className="petra-dash-header">
        <div className="petra-dash-header-copy">
          <span className="petra-dash-eyebrow"><span className="petra-dash-live-dot" /> ADMINISTRATION</span>
          <h1 id="admin-dashboard-title">School overview</h1>
          <p>Your school's people, access and recent administrative activity in one place.</p>
          <span className="petra-dash-date">{dateFormat.format(new Date())}</span>
        </div>
        <button type="button" className="petra-dash-refresh" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={16} className={loading ? "is-spinning" : ""} />
          {loading ? "Refreshing…" : "Refresh data"}
        </button>
      </header>

      {error ? (
        <section className="petra-dash-state petra-dash-error" role="alert">
          <AlertCircle size={20} />
          <div><strong>Dashboard unavailable</strong><p>{error}</p></div>
          <button type="button" onClick={loadDashboard}>Try again</button>
        </section>
      ) : null}

      <section className="petra-stats-grid" aria-label="School statistics" aria-busy={loading}>
        {statDefinitions.map(({ key, label, icon: Icon, description }) => (
          <article className="petra-stat-card" key={key}>
            <div className="petra-stat-card-head">
              <span className="petra-stat-label">{label}</span>
              <span className="petra-stat-icon-wrap"><Icon size={19} aria-hidden="true" /></span>
            </div>
            <strong className="petra-stat-value">
              {loading ? <span className="petra-skeleton" aria-label="Loading" /> : numberFormat.format(Number(stats[key] || 0))}
            </strong>
            <span className="petra-stat-period">{description}</span>
          </article>
        ))}
      </section>

      <div className="petra-dashboard-grid">
        <section className="petra-card petra-activity-card">
          <div className="petra-card-header">
            <div>
              <span className="petra-card-eyebrow">AUDIT TRAIL</span>
              <h2>Recent activity</h2>
              <p>Latest recorded actions in your school workspace.</p>
            </div>
            <span className="petra-card-header-icon"><Clock3 size={18} /></span>
          </div>

          {loading ? (
            <div className="petra-activity-loading" aria-live="polite">Loading recent activity…</div>
          ) : error ? (
            <div className="petra-dash-inline-state">Activity could not be loaded.</div>
          ) : activities.length ? (
            <ul className="petra-activity-list">
              {activities.map((item, index) => (
                <li className="petra-activity-item" key={item.id || `${item.action}-${index}`}>
                  <span className="petra-activity-marker"><Activity size={15} /></span>
                  <div className="petra-activity-copy">
                    <strong>{item.action || "Activity recorded"}</strong>
                    <p>{[item.entity, item.details].filter(Boolean).join(" · ") || "No additional details provided."}</p>
                    <span>{item.user?.fullName || item.user?.email || "School user"} · {formatActivityDate(item.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="petra-dash-empty">
              <span><Activity size={22} /></span>
              <strong>No recent activity</strong>
              <p>Administrative actions will appear here when they are recorded.</p>
            </div>
          )}
        </section>

        <aside className="petra-card petra-actions-card">
          <div className="petra-card-header">
            <div>
              <span className="petra-card-eyebrow">WORKSPACE</span>
              <h2>Quick actions</h2>
              <p>Shortcuts to common administration tasks.</p>
            </div>
          </div>
          <nav className="petra-quicklinks-grid" aria-label="Admin quick actions">
            {actions.map((action, index) => {
              const fallback = defaultActions.find((item) => item.label.toLowerCase() === String(action.label || "").toLowerCase());
              const Icon = fallback?.icon || [Users, GraduationCap, Wallet, Activity][index % 4];
              return (
                <NavLink to={action.href || "/dashboard"} className="petra-quicklink-item" key={action.href || action.label}>
                  <span className="petra-quicklink-icon"><Icon size={18} /></span>
                  <span>{action.label}</span>
                  <ArrowUpRight size={15} className="petra-quicklink-arrow" />
                </NavLink>
              );
            })}
          </nav>
        </aside>
      </div>
    </main>
  );
}
