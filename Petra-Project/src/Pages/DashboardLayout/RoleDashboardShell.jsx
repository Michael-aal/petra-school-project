import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  School,
  Users,
  BookOpen,
  Bell,
} from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { getFirstName } from "../../utils/userProfile";
import { getDashboardConfigForRole, getDashboardPageConfig, getDashboardRoleBase } from "../../utils/dashboardRoles";
import "../../Styles/DashBoardLayout/homeDahboard.css";

const quickStatsByRole = {
  staff: [
    { icon: School, label: "Classes", value: "4" },
    { icon: Users, label: "Students", value: "128" },
    { icon: ClipboardList, label: "Tasks", value: "6" },
  ],
  portal: [
    { icon: Users, label: "Children", value: "2" },
    { icon: BookOpen, label: "Subjects", value: "8" },
    { icon: CheckCircle2, label: "Attendance", value: "98%" },
  ],
};

const roleHighlights = {
  staff: [
    "Today's Classes",
    "Class Schedule",
    "Student Statistics",
    "Attendance Summary",
    "Upcoming Lessons",
    "Recent Announcements",
    "Quick Actions",
  ],
  portal: [
    "Attendance Summary",
    "Current GPA or Average",
    "Recent Results",
    "Upcoming Assignments",
    "Fee Status",
    "School Announcements",
    "Notifications",
    "Upcoming Events",
  ],
};

export default function RoleDashboardShell({ role }) {
  const { userInfo } = useContext(UserContext);
  const location = useLocation();
  const roleBase = getDashboardRoleBase(location.pathname) || role;
  const config = getDashboardConfigForRole(roleBase);
  const pageConfig = getDashboardPageConfig(roleBase, location.pathname);
  const firstName = getFirstName(userInfo) || "User";
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const summary = quickStatsByRole[roleBase] || quickStatsByRole.portal;
  const highlights = roleHighlights[roleBase] || roleHighlights.portal;
  const title = pageConfig?.title || config.title;
  const description = pageConfig?.description || config.subtitle;

  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Welcome Back, {firstName}</h1>
          <p>{description}</p>
        </div>
        <div className="dashboard-home-session-pill">{title}</div>
      </section>

      <section className="dashboard-home-summary">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="dashboard-home-summary-card">
              <div className="dashboard-home-summary-top">
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="dashboard-home-summary-icon tone-blue">
                  <Icon size={18} />
                </div>
              </div>
              <div className="dashboard-home-summary-action tone-blue">
                <span>Overview</span>
                <ArrowRight size={14} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-home-content">
        <article className="dashboard-home-panel dashboard-home-account-panel">
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="dashboard-home-account-row">
            <div className="dashboard-home-account-icon">
              <FileText size={16} />
            </div>
            <div className="dashboard-home-account-text">
              <strong>Signed in as</strong>
              <span>{userInfo?.email || "No email available"}</span>
            </div>
          </div>
          <div className="dashboard-home-account-badge">{today}</div>
        </article>

        <article className="dashboard-home-panel dashboard-home-summary-panel">
          <h2>Quick Highlights</h2>
          <div className="dashboard-home-stats-grid">
            {highlights.map((item) => (
              <div key={item} className="dashboard-home-stat stat-green">
                <div className="dashboard-home-stat-icon">
                  <Bell size={16} />
                </div>
                <div>
                  <span>{item}</span>
                  <strong>Open</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-home-content">
        <article className="dashboard-home-panel">
          <h2>Page Content</h2>
          <div className="dashboard-home-stats-grid">
            {(pageConfig?.sections || [
              { title: "Overview", items: ["No additional data"] },
            ]).map((section) => (
              <div key={section.title} className="dashboard-home-stat stat-green">
                <div className="dashboard-home-stat-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <span>{section.title}</span>
                  <strong>{section.items.join(", ")}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
