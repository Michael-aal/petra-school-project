import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, DollarSign, FileText, Users } from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import { admissionApi } from "../../../../services/admissionApi";
import { financeApi } from "../../../../services/financeApi";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import "../page-styles/OverviewPage.css";

const getIsoDate = (date) => date.toISOString().slice(0, 10);

export default function DailyReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [attendancePagination, setAttendancePagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [cashflow, setCashflow] = useState({ recentTransactions: [], recentExpenses: [] });
  const [applicantCounts, setApplicantCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const today = new Date();
  const defaultDate = getIsoDate(today);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const loadDailyReport = async (date) => {
    setLoading(true);
    setError("");

    try {
      const [attendanceResponse, cashflowResponse, pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
        academicApi.attendance({ date, page: 1, limit: 50 }),
        financeApi.cashflow({ startDate: date, endDate: date }),
        admissionApi.list({ page: 1, limit: 1, status: "pending" }),
        admissionApi.list({ page: 1, limit: 1, status: "approved" }),
        admissionApi.list({ page: 1, limit: 1, status: "rejected" }),
      ]);

      setAttendance(attendanceResponse.attendance || []);
      setAttendancePagination(attendanceResponse.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      setCashflow(cashflowResponse || {});
      setApplicantCounts({
        pending: pendingResponse.pagination?.total || 0,
        approved: approvedResponse.pagination?.total || 0,
        rejected: rejectedResponse.pagination?.total || 0,
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to load daily reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyReport(selectedDate);
  }, [selectedDate]);

  const reportSummary = useMemo(() => {
    const sameDay = (value) => {
      if (!value) return false;
      const date = new Date(value);
      return getIsoDate(date) === selectedDate;
    };

    const payments = (cashflow.recentTransactions || []).filter((item) => sameDay(item.paidAt));
    const expenses = (cashflow.recentExpenses || []).filter((item) => sameDay(item.occurredAt));

    return {
      paymentCount: payments.length,
      expenseCount: expenses.length,
      paymentTotal: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      expenseTotal: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      netTotal: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0) - expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      paymentItems: payments,
      expenseItems: expenses,
    };
  }, [cashflow.recentTransactions, cashflow.recentExpenses, selectedDate]);

  return (
    <div className="dashboard-page overview-page">
      <DashboardHeader
        eyebrow="Overview"
        title="Daily school report"
        subtitle={`A daily snapshot for ${new Date(selectedDate).toLocaleDateString()}.`}
        badge="Daily"
      />

      {error ? <div className="overview-error">{error}</div> : null}

      <section className="overview-page-toolbar">
        <label className="overview-date-picker">
          Report date
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </section>

      <section className="overview-card-grid">
        <StatCard label="Attendance" value={attendancePagination.total || 0} icon={CalendarDays} tone="blue" description="Attendance entries recorded" />
        <StatCard label="Payments" value={`₦${reportSummary.paymentTotal.toLocaleString()}`} icon={DollarSign} tone="teal" description={`${reportSummary.paymentCount} payment${reportSummary.paymentCount === 1 ? "" : "s"}`} />
        <StatCard label="Expenses" value={`₦${reportSummary.expenseTotal.toLocaleString()}`} icon={Clock3} tone="rose" description={`${reportSummary.expenseCount} expense${reportSummary.expenseCount === 1 ? "" : "s"}`} />
        <StatCard label="Pending applicants" value={applicantCounts.pending} icon={FileText} tone="blue" description="Applications waiting for review" />
      </section>

      <section className="overview-section overview-flex-grid">
        <DashboardWidget title="Report attendance" subtitle={`Latest records for ${new Date(selectedDate).toLocaleDateString()}`}>
          <div className="overview-list">
            {loading ? (
              <div className="overview-empty">Loading attendance…</div>
            ) : attendance.length ? (
              attendance.map((item) => (
                <div key={item.id} className="overview-list-item">
                  <strong>{item.student?.name || "Unnamed student"}</strong>
                  <p>{item.status} • {item.className || "No class"}</p>
                  <span>{new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))
            ) : (
              <div className="overview-empty">No attendance recorded for this date.</div>
            )}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Transactions" subtitle={`Payments and expenses for ${new Date(selectedDate).toLocaleDateString()}`}>
          <div className="overview-list">
            {loading ? (
              <div className="overview-empty">Loading financial data…</div>
            ) : reportSummary.paymentItems.length || reportSummary.expenseItems.length ? (
              <>
                {reportSummary.paymentItems.map((item) => (
                  <div key={`p-${item.id}`} className="overview-list-item">
                    <strong>Payment</strong>
                    <p>{item.student?.name || item.reference || "Unknown"}</p>
                    <span>₦{Number(item.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
                {reportSummary.expenseItems.map((item) => (
                  <div key={`e-${item.id}`} className="overview-list-item">
                    <strong>Expense</strong>
                    <p>{item.category?.name || item.description || "General expense"}</p>
                    <span>₦{Number(item.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="overview-empty">No transactions recorded for this date.</div>
            )}
          </div>
        </DashboardWidget>
      </section>
    </div>
  );
}
