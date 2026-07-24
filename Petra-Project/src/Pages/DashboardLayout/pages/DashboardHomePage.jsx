import { useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Banknote, Bell, BookOpen, CalendarDays, CheckCircle2,
  CreditCard, Download, Send, ShieldAlert, Wallet,
} from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { getFirstName } from "../../../utils/userProfile";
import "./page-styles/DashboardHomePage.css";

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
      <section className="dashboard-home-header">
        <div>
          <h1>Welcome Back, {firstName}</h1>
          <p>Here&apos;s what&apos;s happening in your school today.</p>
        </div>
        <div className="dashboard-home-session-pill">{sessionLabel}</div>
      </section>

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
            <article key={item.id} className="dashboard-home-summary-card">
              <div className="dashboard-home-summary-top">
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className={`dashboard-home-summary-icon tone-${item.accent}`}>
                  <Icon size={18} />
                </div>
              </div>
              <Link to={item.link} className={`dashboard-home-summary-action tone-${item.accent}`}>
                <span>{item.action}</span>
                <ArrowRight size={14} />
              </Link>
            </article>
          );
        })}
      </section>

      <section className="dashboard-home-tiles">
        {actionTiles.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.link} className="dashboard-home-tile">
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </section>

      <section className="dashboard-home-content">
        <article className="dashboard-home-panel dashboard-home-account-panel">
          <h2>Account Details</h2>
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
        </article>

        <article className="dashboard-home-panel dashboard-home-summary-panel">
          <h2>Transaction Summary</h2>
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
        </article>
      </section>

      <footer className="dashboard-home-footer">
        <span>© {new Date().getFullYear()} All rights reserved by Acceede.com</span>
        <span>{formattedDate}</span>
      </footer>
    </div>
  );
}