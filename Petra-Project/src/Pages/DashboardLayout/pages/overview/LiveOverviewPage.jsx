import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flag,
  Users,
  Wallet,
} from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import { academicApi } from "../../../../services/academicApi";
import { admissionApi } from "../../../../services/admissionApi";
import { enrollmentApi } from "../../../../services/enrollmentApi";
import { financeApi } from "../../../../services/financeApi";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import "../page-styles/OverviewPage.css";

export default function LiveOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendancePagination, setAttendancePagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [cashflow, setCashflow] = useState({ totalRevenue: 0, totalExpenses: 0, netIncome: 0, recentTransactions: [], recentExpenses: [] });
  const [admissionCounts, setAdmissionCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [enrollmentStats, setEnrollmentStats] = useState({ totalEnrollments: 0, activeEnrollments: 0, pendingEnrollments: 0, totalStudents: 0 });
  const [teacherAttendanceCount, setTeacherAttendanceCount] = useState(0);

  const loadOverview = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardResponse, attendanceResponse, cashflowResponse, pendingResponse, approvedResponse, rejectedResponse, enrollmentResponse, staffAttendanceResponse] =
        await Promise.all([
          adminApi.dashboard(),
          academicApi.attendance({ page: 1, limit: 50 }),
          financeApi.cashflow(),
          admissionApi.list({ page: 1, limit: 1, status: "pending" }),
          admissionApi.list({ page: 1, limit: 1, status: "approved" }),
          admissionApi.list({ page: 1, limit: 1, status: "rejected" }),
          enrollmentApi.stats(),
          adminApi.staffAttendance({ page: 1, limit: 1 }),
        ]);

      setDashboard(dashboardResponse.data || dashboardResponse);
      setAttendance(attendanceResponse.attendance || []);
      setAttendancePagination(attendanceResponse.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      setCashflow(cashflowResponse || {});
      setAdmissionCounts({
        pending: pendingResponse.pagination?.total || 0,
        approved: approvedResponse.pagination?.total || 0,
        rejected: rejectedResponse.pagination?.total || 0,
      });
      setEnrollmentStats(enrollmentResponse.data || enrollmentResponse);
      setTeacherAttendanceCount(staffAttendanceResponse.data?.pagination?.total || 0);
    } catch (requestError) {
      setError(requestError.message || "Unable to load overview data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const attendanceStats = useMemo(() => {
    const present = attendance.filter((item) => String(item.status).toLowerCase() === "present").length;
    const absent = attendance.filter((item) => String(item.status).toLowerCase() === "absent").length;
    return {
      total: attendancePagination.total || 0,
      present,
      absent,
    };
  }, [attendance, attendancePagination.total]);

  const summaryCards = [
    {
      label: "Students",
      value: dashboard?.stats?.students ?? 0,
      icon: Users,
      tone: "blue",
      description: "Total enrolled students",
    },
    {
      label: "Teachers",
      value: dashboard?.stats?.teachers ?? 0,
      icon: Flag,
      tone: "teal",
      description: "Active teaching staff",
    },
    {
      label: "Active enrollments",
      value: enrollmentStats.activeEnrollments ?? 0,
      icon: CheckCircle2,
      tone: "blue",
      description: "Current student enrollment records",
    },
    {
      label: "Pending applicants",
      value: admissionCounts.pending,
      icon: FileText,
      tone: "rose",
      description: "Applications awaiting review",
    },
    {
      label: "Net income",
      value: `₦${Number(cashflow.netIncome || 0).toLocaleString()}`,
      icon: Wallet,
      tone: "blue",
      description: "Total revenue minus expenses",
    },
    {
      label: "Teacher attendance",
      value: teacherAttendanceCount,
      icon: BarChart3,
      tone: "teal",
      description: "Recent teacher attendance records",
    },
  ];

  const recentAttendance = attendance.slice(0, 5);
  const recentActivity = dashboard?.recentActivities || [];

  return (
    <div className="dashboard-page overview-page">
      <DashboardHeader
        eyebrow="Overview"
        title="Live school operations"
        subtitle="Track admissions, finance, attendance, and activity across your school in one view."
        badge="Live"
      />

      {error ? <div className="overview-error">{error}</div> : null}

      <section className="overview-card-grid">
        {summaryCards.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            tone={item.tone}
            description={item.description}
            trend={item.label === "Net income" ? "Updated" : undefined}
          />
        ))}
      </section>

      <section className="overview-section overview-flex-grid">
        <DashboardWidget title="Recent activity" subtitle="Administration" actionLabel="Refresh" onClick={loadOverview}>
          <div className="overview-list">
            {loading ? (
              <div className="overview-empty">Loading recent activity…</div>
            ) : recentActivity.length ? (
              recentActivity.map((item) => (
                <div key={item.id} className="overview-list-item">
                  <strong>{item.action}</strong>
                  <p>{item.entity ? `${item.entity} • ` : ""}{item.details}</p>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="overview-empty">No recent activity found.</div>
            )}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Latest attendance" subtitle="Recent records">
          <div className="overview-list">
            {loading ? (
              <div className="overview-empty">Loading attendance…</div>
            ) : recentAttendance.length ? (
              recentAttendance.map((item) => (
                <div key={item.id} className="overview-list-item">
                  <strong>{item.student?.name || "Unknown student"}</strong>
                  <p>{item.status} • {item.className || "No class"}</p>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div className="overview-empty">No attendance records available.</div>
            )}
          </div>
        </DashboardWidget>
      </section>
    </div>
  );
}
