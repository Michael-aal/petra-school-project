import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, GraduationCap, RefreshCcw, Users } from "lucide-react";
import "../../../../Styles/DashBoardLayout/studentListStyle.css";
import "../page-styles/StudentsListPage.css";
import { studentApi } from "../../../../services/studentApi";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

export default function StudentsListPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await studentApi.list({ page: 1, limit: 100, search, status });
      setStudents(Array.isArray(response?.students) ? response.students : []);
    } catch (err) {
      setStudents([]);
      setError(err?.data?.message || err?.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadStudents, 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((student) => String(student.status).toLowerCase() === "active").length,
    male: students.filter((student) => String(student.gender).toLowerCase() === "male").length,
    female: students.filter((student) => String(student.gender).toLowerCase() === "female").length,
  }), [students]);

  return (
    <div className="students-page">
      <div className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box"><GraduationCap size={24} /></div>
          <div>
            <h3>Students</h3>
            <h4>Live student records for the authenticated school.</h4>
          </div>
        </div>
        <button type="button" className="btn-secondary" onClick={loadStudents} disabled={loading}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="stats-bar">
        {[
          ["Total Students", stats.total, Users, "blue"],
          ["Active Students", stats.active, CheckCircle2, "green"],
          ["Male", stats.male, Users, "blue"],
          ["Female", stats.female, Users, "red"],
        ].map(([label, value, Icon, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon stat-icon-${color}`}><Icon size={18} /></div>
            <div><span className="stat-number">{loading ? "—" : value}</span><span className="stat-label">{label}</span></div>
          </div>
        ))}
      </div>

      <div className="page-controls">
        <div className="search-wrapper">
          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students, admission numbers, or guardians..."
          />
        </div>
        <select className="btn-secondary" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error ? <div className="dashboard-alert error">{error}</div> : null}

      <div className="table-container">
        {loading ? <div className="dashboard-page-copy">Loading students...</div> : null}
        {!loading && !students.length ? <div className="dashboard-page-copy">No students found.</div> : null}
        {!loading && students.length ? (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Class</th>
                <th>Guardian</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name || "—"}</td>
                  <td>{student.admissionNumber || "—"}</td>
                  <td>{student.className || "Not assigned"}</td>
                  <td>{student.guardianName || student.parentEmail || student.parentPhone || "—"}</td>
                  <td>{student.gender || "—"}</td>
                  <td><span className={`status-badge status-${String(student.status || "unknown").toLowerCase()}`}>{student.status || "Unknown"}</span></td>
                  <td>{formatDate(student.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
