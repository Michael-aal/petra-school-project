import { useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Banknote, Bell, BookOpen, CheckCircle2,
  CreditCard, Download, Send, ShieldAlert, Wallet,
} from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { getFirstName } from "../../../utils/userProfile";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StatCard from "../../../components/dashboard/StatCard";
import QuickActions from "../../../components/dashboard/QuickActions";
import DashboardWidget from "../../../components/dashboard/DashboardWidget";
import EmptyState from "../../../components/dashboard/EmptyState";
import "./page-styles/DashboardHomePage.css";
import "../../../components/dashboard/dashboard.css";

const summaryCards = [
  {
    id: 1, label: "NGN Balance", value: "₦0.00", accent: "blue", icon: Wallet, action: "Withdraw Balance", link: "/dashboard/finance/wallet",
  },
  {
    id: 2, label: "Balance Payouts", value: "₦0.00", accent: "teal", icon: Download, action: "View History", link: "/dashboard/finance/cashflow",
  },
  {
    id: 3, label: "Cashflow", value: "₦0.00", accent: "rose", icon: Send, action: "Get Cashflow", link: "/dashboard/finance/cashflow",
  },
];

const actionTiles = [
  { id: 1, label: "Withdraw", icon: Banknote, link: "/dashboard/finance/wallet" },
  { id: 2, label: "Transfer", icon: Send, link: "/dashboard/finance/wallet" },
  { id: 3, label: "Statement", icon: CreditCard, link: "/dashboard/finance/wallet" },
  { id: 4, label: "Pay Bills (coming soon)", icon: Wallet, link: "/dashboard/finance/wallet" },
];

const accountSummary = [
  {
    id: 1,
    label: "Account Number",
    value: "N/A",
    note: "This account is an NDIC insured deposit account used for school payments and transfers.",
    icon: CreditCard,
  },
];

const transactionStats = [
  { id: 1, label: "Expected Income", value: "₦0", accent: "green", icon: CheckCircle2 },
  { id: 2, label: "Total Paid", value: "₦0", accent: "green", icon: BookOpen },
  { id: 3, label: "Current Debt", value: "₦0", accent: "red", icon: ShieldAlert },
  { id: 4, label: "Discount", value: "₦0", accent: "red", icon: Bell },
];

export default function DashboardHomePage() {
  const { userInfo } = useContext(UserContext);
  const firstName = getFirstName(userInfo) || "Admin";
  const today = new Date();
  
  // DYNAMIC: Uses user's active session or a generic fallback
  const sessionLabel = userInfo?.activeSession || "Current Term • 2025/2026";

  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="dashboard-home">
      <DashboardHeader
        eyebrow="Administration"
        title={`Welcome back, ${firstName}`}
        subtitle="A modern command center for finance, operations, and school oversight."
        badge={sessionLabel}
        actionLabel="Open reports"
        actionHref="#"
      />

      <div className="dashboard-home-alert">
        <div className="dashboard-home-alert-icon">
          <ShieldAlert size={14} />
        </div>
        <div>
          <strong>Heads up! The current term is ending soon.</strong>
          <p>
            The term is scheduled to end in 7 days. Please ensure all assessments,
            results, and reports are up to date before the term closes.
          </p>
        </div>
      </div>

      <section className="dashboard-home-summary">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <StatCard
              key={item.id}
              icon={Icon}
              label={item.label}
              value={item.value}
              tone={item.accent}
              description={item.action}
              trend="Live"
              footer={
                <Link to={item.link} className="dashboard-summary-link">
                  <span>{item.action}</span>
                  <ArrowRight size={14} />
                </Link>
              }
            />
          );
        })}
      </section>

      <section className="dashboard-home-grid">
        <QuickActions
          title="Admin shortcuts"
          items={[
            { label: "Add Student", meta: "Create a new learner profile", icon: BookOpen },
            { label: "Add Teacher", meta: "Invite a new staff member", icon: Wallet },
            { label: "Create CBT", meta: "Launch an assessment", icon: CalendarDays },
            { label: "Record Payment", meta: "Log fees or transfers", icon: CreditCard },
          ]}
        />

        <DashboardWidget title="Today’s overview" subtitle="Operations" actionLabel="View all">
          <div className="dashboard-home-stats-grid">
            {transactionStats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={`dashboard-home-stat stat-${item.accent}`}>
                  <div className="dashboard-home-stat-icon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardWidget>
      </section>

      <section className="dashboard-home-content">
        <DashboardWidget title="Account details" subtitle="Finance" actionLabel="Manage">
          <div className="dashboard-home-account-row">
            <div className="dashboard-home-account-icon">
              <CreditCard size={16} />
            </div>
            <div className="dashboard-home-account-text">
              <strong>{accountSummary[0].label}</strong>
              <span>{accountSummary[0].value}</span>
            </div>
          </div>
          <p>{accountSummary[0].note}</p>
          <div className="dashboard-home-account-badge">NDIC</div>
        </DashboardWidget>

        <DashboardWidget title="Recent activity" subtitle="Live feed" actionLabel="See more">
          <div className="dashboard-list-stack">
            {[
              { title: "New assessment published", meta: "CBT • 15 minutes ago" },
              { title: "Fee payment logged", meta: "Parent portal • 34 minutes ago" },
              { title: "Student profile updated", meta: "Admissions • 1 hour ago" },
            ].map((item) => (
              <div key={item.title} className="dashboard-list-item">
                <strong>{item.title}</strong>
                <p>{item.meta}</p>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </section>

      <footer className="dashboard-home-footer">
        <span>© {new Date().getFullYear()} All rights reserved by Acceede.com</span>
        <span>{formattedDate}</span>
      </footer>
    </div>
  );
}
