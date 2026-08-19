import { useEffect, useState } from "react";
import { BarChart3, FileText, Flag, Wallet } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import { admissionApi } from "../../../../services/admissionApi";
import { financeApi } from "../../../../services/financeApi";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import "../page-styles/OverviewPage.css";

export default function TermSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [cashflow, setCashflow] = useState({ totalRevenue: 0, totalExpenses: 0, netIncome: 0, recentTransactions: [], recentExpenses: [] });
  const [admissionCounts, setAdmissionCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const loadSummary = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardResponse, cashflowResponse, pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
        adminApi.dashboard(),
        financeApi.cashflow(),
        admissionApi.list({ page: 1, limit: 1, status: "pending" }),
        admissionApi.list({ page: 1, limit: 1, status: "approved" }),
        admissionApi.list({ page: 1, limit: 1, status: "rejected" }),
      ]);

      setDashboard(dashboardResponse.data || dashboardResponse);
      setCashflow(cashflowResponse || {});
      setAdmissionCounts({
        pending: pendingResponse.pagination?.total || 0,
        approved: approvedResponse.pagination?.total || 0,
        rejected: rejectedResponse.pagination?.total || 0,
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to load term summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="dashboard-page overview-page">
      <DashboardHeader
        eyebrow="Overview"
        title="Term summary"
        subtitle="A high-level term review of school operations and finance."
        badge="Term"
      />

      {error ? <div className="overview-error">{error}</div> : null}

      <section className="overview-card-grid">
        <StatCard
          label="Total students"
          value={dashboard?.stats?.students ?? 0}
          icon={Flag}
          tone="blue"
          description="Total active learners"
        />
        <StatCard
          label="Total teachers"
          value={dashboard?.stats?.teachers ?? 0}
          icon={BarChart3}
          tone="teal"
          description="Active teaching staff at term end"
        />
        <StatCard
          label="Approved applicants"
          value={admissionCounts.approved}
          icon={FileText}
          tone="teal"
          description="Offers issued this term"
        />
        <StatCard
          label="Net income"
          value={`₦${Number(cashflow.netIncome || 0).toLocaleString()}`}
          icon={Wallet}
          tone="rose"
          description="Period revenue minus expense"
        />
      </section>

      <section className="overview-flex-grid">
        <DashboardWidget title="Term admissions" subtitle="Application status">
          <div className="overview-list">
            <div className="overview-list-item">
              <strong>Pending applications</strong>
              <p>{admissionCounts.pending} application{admissionCounts.pending === 1 ? "" : "s"}</p>
            </div>
            <div className="overview-list-item">
              <strong>Approved applications</strong>
              <p>{admissionCounts.approved} application{admissionCounts.approved === 1 ? "" : "s"}</p>
            </div>
            <div className="overview-list-item">
              <strong>Rejected applications</strong>
              <p>{admissionCounts.rejected} application{admissionCounts.rejected === 1 ? "" : "s"}</p>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget title="Cashflow summary" subtitle="Recent activity">
          <div className="overview-list">
            <div className="overview-list-item">
              <strong>Total revenue</strong>
              <p>₦{Number(cashflow.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="overview-list-item">
              <strong>Total expenses</strong>
              <p>₦{Number(cashflow.totalExpenses || 0).toLocaleString()}</p>
            </div>
            <div className="overview-list-item">
              <strong>Net income</strong>
              <p>₦{Number(cashflow.netIncome || 0).toLocaleString()}</p>
            </div>
          </div>
        </DashboardWidget>
      </section>
    </div>
  );
}
