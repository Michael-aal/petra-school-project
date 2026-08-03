import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Filter, RefreshCcw, Search } from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import "../page-styles/AttendancePage.css";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ search: "", className: "", status: "", date: "" });

  const load = async (page = pagination.page) => {
    setLoading(true);
    setError("");
    try {
      const data = await academicApi.attendance({
        search,
        className,
        status,
        date,
        page,
        limit: pagination.limit,
      });
      setAttendance(data.attendance || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      setAppliedFilters({ search, className, status, date });
    } catch (requestError) {
      setError(requestError.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = pagination.total || 0;
    const present = attendance.filter((item) => String(item.status).toLowerCase() === "present").length;
    const absent = attendance.filter((item) => String(item.status).toLowerCase() === "absent").length;
    return { total, present, absent };
  }, [attendance, pagination.total]);

  const hasFilters = Boolean(appliedFilters.search || appliedFilters.className || appliedFilters.status || appliedFilters.date);

  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Attendance</h1>
          <p>View attendance history, apply filters, and review records across classes.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="dashboard-home-summary-action tone-blue" type="button" onClick={() => load(pagination.page)}>
            <RefreshCcw size={14} />
            <span>Refresh</span>
          </button>
          <button className="dashboard-home-summary-action tone-teal" type="button" onClick={() => window.print()}>
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Total records</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <CalendarDays size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Present</span>
              <strong>{stats.present}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <CalendarDays size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Absent</span>
              <strong>{stats.absent}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-rose">
              <CalendarDays size={18} />
            </div>
          </div>
        </article>
      </section>

      {error ? <div className="students-inline-alert">{error}</div> : null}

      <section className="dashboard-home-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", alignItems: "end" }}>
          <label className="settings-field" style={{ marginBottom: 0 }}>
            <span>Search</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={16} />
              <input
                placeholder="Search student or class"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load(1);
                }}
              />
            </div>
          </label>

          <label className="settings-field" style={{ marginBottom: 0 }}>
            <span>Class</span>
            <input placeholder="Filter by class" value={className} onChange={(e) => setClassName(e.target.value)} />
          </label>

          <label className="settings-field" style={{ marginBottom: 0 }}>
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
            </select>
          </label>

          <label className="settings-field" style={{ marginBottom: 0 }}>
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button type="button" className="dashboard-home-summary-action tone-blue" disabled={loading} onClick={() => load(1)}>
            <Filter size={14} />
            <span>{loading ? "Applying..." : "Apply Filters"}</span>
          </button>
          <button
            type="button"
            className="dashboard-home-summary-action"
            onClick={() => {
              setSearch("");
              setClassName("");
              setStatus("");
              setDate("");
              setAppliedFilters({ search: "", className: "", status: "", date: "" });
              setTimeout(() => load(1), 0);
            }}
            disabled={loading && attendance.length === 0}
          >
            <span>Clear</span>
          </button>
        </div>
        <p style={{ marginTop: 12, color: "var(--app-text-muted)" }}>
          {hasFilters
            ? `Showing ${pagination.total} record${pagination.total === 1 ? "" : "s"} for the selected filters.`
            : `Showing ${pagination.total} attendance record${pagination.total === 1 ? "" : "s"}.`}
        </p>
      </section>

      <section className="dashboard-home-panel">
        <div style={{ overflowX: "auto" }}>
          <table className="teacher-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Status</th>
                <th>Date</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="teacher-empty-copy">Loading attendance...</td>
                </tr>
              ) : attendance.length ? (
                attendance.map((item) => (
                  <tr key={item.id}>
                    <td>{item.student?.name || "Student"}</td>
                    <td>{item.className}</td>
                    <td>{item.status}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.teacher?.fullName || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="teacher-empty-copy">
                    {hasFilters
                      ? "No records match the selected filters."
                      : "No attendance records found. This database currently has no attendance rows to display."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="students-pagination" style={{ marginTop: 16 }}>
          <button className="btn-secondary" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)}>
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => load(pagination.page + 1)}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
