import { useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Landmark,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { getFirstName } from "../../../utils/userProfile";
import "./page-styles/DashboardHomePage.css";
import "../../../components/dashboard/dashboard.css";

const overviewMetrics = [
  { label: "Collected this term", value: "₦48.6m", delta: "+12.8%", tone: "coral" },
  { label: "Student attendance", value: "94.8%", delta: "+4.2%", tone: "mint" },
  { label: "Active learners", value: "2,841", delta: "+8.4%", tone: "blue" },
];

const summaryCards = [
  { id: 1, label: "School revenue", value: "₦4.2m", delta: "+15.1%", icon: WalletCards, tone: "coral", link: "/dashboard/finance" },
  { id: 2, label: "Fee collection", value: "86.4%", delta: "+9.8%", icon: CreditCard, tone: "blue", link: "/dashboard/finance/payments" },
  { id: 3, label: "Class attendance", value: "92.7%", delta: "+2.3%", icon: CalendarCheck2, tone: "mint", link: "/dashboard/academics/attendance" },
  { id: 4, label: "Staff active", value: "148", delta: "+6", icon: Users, tone: "blue", link: "/dashboard/staff/management" },
];

const quickActions = [
  { label: "Enroll student", meta: "Add a new learner", icon: GraduationCap, link: "/dashboard/students/enrollment/create" },
  { label: "Manage staff", meta: "Review roster", icon: UserRoundCheck, link: "/dashboard/staff/management" },
  { label: "Create report", meta: "Publish weekly summary", icon: BookOpen, link: "/dashboard/overview/daily" },
  { label: "Review fees", meta: "Track collections", icon: Landmark, link: "/dashboard/finance/payments" },
];

const liveFeed = [
  { title: "Assessment uploaded", meta: "Term 2 exam • 12 mins ago" },
  { title: "Fees were posted", meta: "5 parents just paid • 26 mins ago" },
  { title: "Attendance trend updated", meta: "Primary wing • 1 hour ago" },
];

export default function DashboardHomePage() {
  const { userInfo } = useContext(UserContext);
  const firstName = getFirstName(userInfo) || "Admin";
  const sessionLabel = userInfo?.activeSession || "2025/2026 Session";

  return (
    <div className="school-admin-dashboard">
      <header className="dashboard-shell-header dashboard-landing-header">
        <div className="dashboard-shell-header-copy">
          <p className="dashboard-shell-eyebrow">School administration</p>
          <h1>Good morning, {firstName}.</h1>
          <p>
            Keep the school moving with one calm view of finance, people, learning, and operations.
          </p>
        </div>
        <div className="dashboard-shell-header-actions">
          <span className="dashboard-shell-pill">{sessionLabel}</span>
          <Link to="/dashboard/overview/live" className="dashboard-shell-link">
            <span>Open overview</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <section className="dashboard-landing-hero">
        <div className="dashboard-landing-copy">
          <div className="dashboard-landing-kicker">
            <Sparkles size={14} />
            <span>School operations</span>
          </div>
          <h2>
            Give your school <span>room to grow.</span>
          </h2>
          <p>
            Admissions, attendance, finance, and academic progress come together in a single operating rhythm for the entire community.
          </p>
          <div className="dashboard-landing-actions">
            <Link to="/dashboard/students/enrollment" className="landing-button landing-button-primary">
              Review enrolments
              <ArrowRight size={17} />
            </Link>
            <Link to="/dashboard/overview/live" className="landing-button landing-button-quiet">
              <span className="play-icon"><TrendingUp size={13} /></span>
              View reports
            </Link>
          </div>
          <div className="landing-proof">
            <CheckCircle2 size={16} />
            <span>Built for school leaders</span>
            <i />
            <span>Priority updates are visible at a glance</span>
          </div>
        </div>

        <div className="dashboard-landing-preview" aria-label="School admin dashboard preview">
          <div className="landing-preview-topbar">
            <div className="preview-brand"><span />Nuvora OS</div>
            <div className="preview-top-actions"><span /> <span /> <b>AD</b></div>
          </div>

          <div className="landing-preview-body">
            <aside className="preview-sidebar">
              <div className="preview-sidebar-mark"><Sparkles size={15} /></div>
              <i />
              <i />
              <i />
              <i />
              <i />
            </aside>

            <div className="preview-content">
              <div className="preview-heading">
                <div>
                  <small>MONDAY, 10 FEBRUARY 2025</small>
                  <h3>Good morning, {firstName}.</h3>
                </div>
                <span>{sessionLabel}</span>
              </div>

              <div className="preview-stats">
                {overviewMetrics.map((metric) => (
                  <div key={metric.label} className={`preview-stat preview-stat-${metric.tone}`}>
                    <small>{metric.label}</small>
                    <strong>{metric.value}</strong>
                    <em>{metric.delta}</em>
                  </div>
                ))}
              </div>

              <div className="preview-lower">
                <div className="preview-chart">
                  <div className="preview-line" />
                  <div className="chart-labels">
                    <span>SEP</span>
                    <span>OCT</span>
                    <span>NOV</span>
                    <span>DEC</span>
                    <span>JAN</span>
                    <span>FEB</span>
                  </div>
                </div>

                <div className="preview-feed">
                  <strong>Recent status</strong>
                  <p><BellRing size={13} /> 42 fee reminders sent</p>
                  <p><CheckCircle2 size={13} /> 18 admissions approved</p>
                  <p><TrendingUp size={13} /> Weekly report ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-landing-summary">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.id} className={`dashboard-shell-stat tone-${card.tone}`}>
              <div className="dashboard-shell-stat-head">
                <div className="dashboard-shell-stat-icon">
                  <Icon size={16} />
                </div>
                <span className="dashboard-shell-stat-trend">{card.delta}</span>
              </div>
              <div className="dashboard-shell-stat-copy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
              <Link to={card.link} className="dashboard-shell-stat-link">
                <span>View</span>
                <ArrowRight size={14} />
              </Link>
            </article>
          );
        })}
      </section>

      <section className="dashboard-landing-lower">
        <div className="dashboard-widget dashboard-landing-widget">
          <div className="dashboard-widget-head">
            <div>
              <p className="dashboard-widget-kicker">Quick actions</p>
              <h3>Admin shortcuts</h3>
            </div>
          </div>

          <div className="dashboard-quick-actions-grid">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.label} to={item.link} className="dashboard-quick-action">
                  <div className="dashboard-quick-action-icon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.meta}</span>
                  </div>
                  <ArrowRight size={14} />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="dashboard-widget dashboard-landing-widget dashboard-landing-panel">
          <div className="dashboard-widget-head">
            <div>
              <p className="dashboard-widget-kicker">This week</p>
              <h3>Operational momentum</h3>
            </div>
          </div>

          <div className="dashboard-ops-list">
            <div className="dashboard-ops-item">
              <div className="dashboard-ops-icon"><BookOpen size={14} /></div>
              <div>
                <strong>Academic performance</strong>
                <p>Class averages are up 4.6% from last week.</p>
              </div>
            </div>

            <div className="dashboard-ops-item">
              <div className="dashboard-ops-icon"><BriefcaseBusiness size={14} /></div>
              <div>
                <strong>School operations</strong>
                <p>11 pending approvals are ready for review.</p>
              </div>
            </div>

            <div className="dashboard-ops-item">
              <div className="dashboard-ops-icon"><WalletCards size={14} /></div>
              <div>
                <strong>Finance health</strong>
                <p>Collections are trending ahead of budget plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-landing-feed">
        <div className="dashboard-widget dashboard-landing-widget">
          <div className="dashboard-widget-head">
            <div>
              <p className="dashboard-widget-kicker">Overview</p>
              <h3>School focus</h3>
            </div>
          </div>

          <div className="dashboard-home-stats-grid">
            <div className="dashboard-home-stat stat-green">
              <div className="dashboard-home-stat-icon"><TrendingUp size={16} /></div>
              <div>
                <span>Expected income</span>
                <strong>₦12.4m</strong>
              </div>
            </div>

            <div className="dashboard-home-stat stat-green">
              <div className="dashboard-home-stat-icon"><CheckCircle2 size={16} /></div>
              <div>
                <span>Paid so far</span>
                <strong>₦10.8m</strong>
              </div>
            </div>

            <div className="dashboard-home-stat stat-red">
              <div className="dashboard-home-stat-icon"><BriefcaseBusiness size={16} /></div>
              <div>
                <span>Current debt</span>
                <strong>₦1.6m</strong>
              </div>
            </div>

            <div className="dashboard-home-stat stat-red">
              <div className="dashboard-home-stat-icon"><BellRing size={16} /></div>
              <div>
                <span>Discounts</span>
                <strong>₦520k</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-widget dashboard-landing-widget">
          <div className="dashboard-widget-head">
            <div>
              <p className="dashboard-widget-kicker">Live feed</p>
              <h3>Recent activity</h3>
            </div>
          </div>

          <div className="dashboard-list-stack">
            {liveFeed.map((item) => (
              <div key={item.title} className="dashboard-list-item">
                <strong>{item.title}</strong>
                <p>{item.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
