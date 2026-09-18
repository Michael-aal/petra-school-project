import { useEffect, useState } from "react";
import { Search, RefreshCcw, Users, Copy } from "lucide-react";
import { request } from "../../../../services/apiClient";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/TeachersPage.css";

const getTeacherName = (teacher) => teacher.fullName || [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || teacher.email || "Teacher";

const teacherDirectoryApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/teachers/directory${suffix}`, { method: "GET" });
  },
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignment, setAssignment] = useState({});
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [teacherResponse, optionResponse] = await Promise.all([teacherDirectoryApi.list({ search, limit: 50 }), adminApi.teacherAssignmentOptions()]);
      setTeachers(teacherResponse.teachers || []);
      setClasses(optionResponse.data?.classes || optionResponse.classes || []);
      setSubjects(optionResponse.data?.subjects || optionResponse.subjects || []);
    } catch (err) { setError(err.message || "Unable to load teachers"); }
    finally { setLoading(false); }
  };

  const assign = async (teacherId, type) => {
    const value = assignment[`${teacherId}-${type}`]; if (!value) return;
    setAssignmentMessage("");
    try {
      if (type === "class") await adminApi.assignTeacherClass({ teacherId, classId: value });
      if (type === "subject") await adminApi.assignTeacherSubject({ teacherId, subjectId: value });
      setAssignment((current) => ({ ...current, [`${teacherId}-${type}`]: "" }));
      setAssignmentMessage("Assignment saved. The staff workspace will use it on the next refresh.");
    } catch (err) { setError(err.message || "Unable to save assignment."); }
  };

  const copyCode = async (code) => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setAssignmentMessage("Teacher registration code copied to clipboard."); }
    catch { setError("Unable to copy the teacher registration code. Copy it manually instead."); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="dashboard-home teachers-page">
      <section className="dashboard-home-header"><div><h1>Teachers</h1><p>Manage teaching staff, subject assignments, profile details, and teacher registration codes from one dashboard.</p></div><div className="dashboard-home-session-pill">People operations</div></section>
      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card"><div className="dashboard-home-summary-top"><div><span>Total teachers</span><strong>{teachers.length}</strong></div><div className="dashboard-home-summary-icon tone-blue"><Users size={18} /></div></div></article>
        <article className="dashboard-home-summary-card"><div className="dashboard-home-summary-top"><div><span>Registration codes</span><strong>{teachers.filter((teacher) => teacher.registrationCode).length}</strong></div><div className="dashboard-home-summary-icon tone-teal"><Copy size={18} /></div></div></article>
      </section>
      <section className="dashboard-home-panel admins-actions-panel">
        <div className="admins-toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers or registration codes..." /></div><button className="dashboard-home-summary-action tone-blue" type="button" onClick={load}><RefreshCcw size={14} /><span>Reload</span></button></div>
        {error ? <div className="students-inline-alert">{error}</div> : null}{assignmentMessage ? <div className="students-inline-alert">{assignmentMessage}</div> : null}
        {loading ? <div className="module-empty">Loading teachers...</div> : teachers.length ? <div className="admin-list">{teachers.map((teacher) => <article key={teacher.id} className="admin-row"><div style={{ minWidth: 190 }}><strong>{getTeacherName(teacher)}</strong><p>{teacher.staffDepartment || teacher.email}</p><p style={{ marginTop: 6, fontWeight: 700 }}>Teacher code: {teacher.registrationCode || "No code"}</p></div><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span className="dashboard-home-session-pill">{teacher.role || "teacher"}</span>{teacher.registrationCode ? <button type="button" onClick={() => copyCode(teacher.registrationCode)} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px 10px", color: "var(--app-text)", cursor: "pointer" }}><Copy size={15} /><span>Copy code</span></button> : null}</div><div className="teacher-assignment-controls"><select value={assignment[`${teacher.id}-class`] || ""} onChange={(event) => setAssignment((current) => ({ ...current, [`${teacher.id}-class`]: event.target.value }))} aria-label={`Assign class to ${getTeacherName(teacher)}`}><option value="">Assign class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => assign(teacher.id, "class")}>Save</button><select value={assignment[`${teacher.id}-subject`] || ""} onChange={(event) => setAssignment((current) => ({ ...current, [`${teacher.id}-subject`]: event.target.value }))} aria-label={`Assign subject to ${getTeacherName(teacher)}`}><option value="">Assign subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => assign(teacher.id, "subject")}>Save</button></div></article>)}</div> : <div className="module-empty">No teachers found.</div>}
      </section>
    </div>
  );
}
