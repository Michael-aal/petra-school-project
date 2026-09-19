import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Copy, RotateCw, Ban, UserCog, UserX, UserCheck, Filter, ClipboardList, ExternalLink } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../../../services/authApi";
import { teacherApplicationApi } from "../../../../services/teacherApplicationApi";
import TeacherApplicationsPage from "./TeacherApplicationsPage";
import "../page-styles/DashboardHomePage.css";

const initialForm = { staffName: "", role: "Teacher", department: "", assignedClass: "", assignedSubjects: "", employmentStatus: "active" };
const splitSubjects = (value = "") => String(value).split(",").map((item) => item.trim()).filter(Boolean);

export default function StaffManagementPage() {
  const location = useLocation();
  const isApplicationsView = new URLSearchParams(location.search).get("view") === "applications";
  return isApplicationsView ? <TeacherApplicationsPage /> : <StaffManagementWorkspace />;
}

function StaffManagementWorkspace() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [invitations, setInvitations] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedLoading, setApprovedLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTeacherId, setUpdatingTeacherId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [generatedInvitation, setGeneratedInvitation] = useState(null);

  const loadInvitations = async () => { setLoading(true); try { const response = await authApi.staffInvitations(); setInvitations(response.invitations || []); } catch (err) { setError(err.data?.message || err.message || "Failed to load teacher invitations"); } finally { setLoading(false); } };
  const loadApprovedApplications = async () => { setApprovedLoading(true); try { const response = await teacherApplicationApi.list({ status: "approved", limit: 200 }); setApprovedApplications(response.applications || []); } catch (err) { setError(err.data?.message || err.message || "Failed to load approved teacher applicants"); } finally { setApprovedLoading(false); } };
  const loadTeachers = async () => { setTeachersLoading(true); try { const response = await authApi.managedTeachers(); setTeachers(response.teachers || []); } catch (err) { setError(err.data?.message || err.message || "Failed to load active teachers"); } finally { setTeachersLoading(false); } };

  useEffect(() => { loadInvitations(); loadApprovedApplications(); loadTeachers(); }, []);

  const filteredInvitations = useMemo(() => invitations.filter((item) => `${item.staffName} ${item.role} ${item.department} ${item.registrationCode}`.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || item.status === filter)), [filter, invitations, query]);
  const filteredApprovedApplications = useMemo(() => approvedApplications.filter((item) => `${item.firstName || ""} ${item.middleName || ""} ${item.lastName || ""} ${item.email || ""} ${item.positionApplied || ""} ${item.majorSubject || ""} ${item.registrationCode || ""}`.toLowerCase().includes(query.toLowerCase())), [approvedApplications, query]);
  const filteredTeachers = useMemo(() => teachers.filter((teacher) => `${teacher.fullName} ${teacher.email} ${teacher.designation} ${teacher.department} ${teacher.registrationCode || ""}`.toLowerCase().includes(query.toLowerCase())), [teachers, query]);
  const summary = useMemo(() => ({ total: invitations.length, used: invitations.filter((item) => item.status === "used").length, revoked: invitations.filter((item) => item.status === "revoked").length }), [invitations]);

  const handleChange = (event) => { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })); };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await authApi.createStaffInvitation({
        ...form,
        role: "Teacher",
        assignedSubjects: splitSubjects(form.assignedSubjects),
      });
      const invitation = response?.invitation || null;
      setGeneratedInvitation(invitation);
      setMessage("Teacher invitation created successfully. Give the registration code to the teacher.");
      setForm(initialForm);
      setShowForm(false);
      await loadInvitations();
    } catch (err) {
      setError(err.data?.message || err.message || "Failed to create teacher invitation");
    } finally {
      setSubmitting(false);
    }
  };
  const copyCode = async (code) => { try { await navigator.clipboard.writeText(code); setMessage("Registration code copied to clipboard."); } catch { setError("Unable to copy the registration code. Copy it manually instead."); } };
  const regenerateCode = async (registrationCode) => { try { await authApi.regenerateStaffInvitationCode({ registrationCode }); setMessage("Registration code regenerated."); await loadInvitations(); await loadApprovedApplications(); } catch (err) { setError(err.data?.message || err.message || "Failed to regenerate code"); } };
  const revokeCode = async (registrationCode) => { try { await authApi.revokeStaffInvitation({ registrationCode }); setMessage("Registration code revoked."); await loadInvitations(); await loadApprovedApplications(); } catch (err) { setError(err.data?.message || err.message || "Failed to revoke code"); } };
  const toggleTeacherStatus = async (teacher) => { const action = teacher.isActive ? "deactivate" : "reactivate"; if (!window.confirm(teacher.isActive ? `Deactivate ${teacher.fullName}? Their historical school records will be preserved.` : `Reactivate ${teacher.fullName}?`)) return; setUpdatingTeacherId(teacher.userId); try { if (action === "deactivate") await authApi.deactivateTeacher(teacher.userId); else await authApi.reactivateTeacher(teacher.userId); setMessage(`${teacher.fullName} was ${action}d successfully.`); await loadTeachers(); } catch (err) { setError(err.data?.message || err.message || `Failed to ${action} teacher`); } finally { setUpdatingTeacherId(""); } };

  return <div className="dashboard-home">
    <section className="dashboard-home-header"><div><h1>Teacher Management</h1><p>Add teachers, manage registration codes, review approved applicants, and manage existing teacher accounts.</p></div><div className="dashboard-home-session-pill">Admin Workspace</div></section>
    <section className="dashboard-home-summary"><article className="dashboard-home-summary-card"><div className="dashboard-home-summary-top"><div><span>Total Invitations</span><strong>{summary.total}</strong></div><div className="dashboard-home-summary-icon tone-blue"><UserCog size={18} /></div></div></article><article className="dashboard-home-summary-card"><div className="dashboard-home-summary-top"><div><span>Used</span><strong>{summary.used}</strong></div><div className="dashboard-home-summary-icon tone-teal"><UserCog size={18} /></div></div></article><article className="dashboard-home-summary-card"><div className="dashboard-home-summary-top"><div><span>Revoked</span><strong>{summary.revoked}</strong></div><div className="dashboard-home-summary-icon tone-rose"><UserCog size={18} /></div></div></article></section>
    <section className="dashboard-home-panel" style={{ marginBottom: 18 }}><div className="dashboard-home-content" style={{ marginBottom: 0, gridTemplateColumns: "1.1fr 0.9fr" }}><div className="dashboard-home-account-row" style={{ marginBottom: 0 }}><div className="dashboard-home-account-icon"><Search size={16} /></div><div className="dashboard-home-account-text"><strong>Search teachers</strong><span>Find by name, role, department, class, subject, or registration code.</span></div></div><div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}><button type="button" className="dashboard-home-summary-action tone-teal" style={{ border: "1px solid currentColor", cursor: "pointer", padding: "0 14px" }} onClick={() => navigate("/dashboard/staff/management?view=applications")}><ClipboardList size={14} /><span>Teacher Applications</span></button><label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}><Filter size={16} /><select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ border: 0, outline: 0, background: "transparent", color: "var(--app-text)" }}><option value="all">All</option><option value="unused">Unused</option><option value="used">Used</option><option value="revoked">Revoked</option></select></label><button className="dashboard-home-summary-action tone-blue" type="button" style={{ border: "1px solid currentColor", cursor: "pointer", padding: "0 14px" }} onClick={() => setShowForm((current) => !current)}><Plus size={14} /><span>Add Teacher</span></button></div></div>{showForm && <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16, padding: 16, border: "1px solid var(--app-border)", borderRadius: 16, background: "var(--app-surface)" }}><div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}><input name="staffName" placeholder="Teacher Full Name" value={form.staffName} onChange={handleChange} required /><input name="role" value="Teacher" readOnly /><input name="department" placeholder="Department (Optional)" value={form.department} onChange={handleChange} /><input name="assignedClass" placeholder="Class Assigned (Optional)" value={form.assignedClass} onChange={handleChange} /><input name="assignedSubjects" placeholder="Subjects Assigned, comma separated (Optional)" value={form.assignedSubjects} onChange={handleChange} /><select name="employmentStatus" value={form.employmentStatus} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" disabled={submitting}>{submitting ? "Generating..." : "Generate Teacher Code"}</button></div></form>}<div style={{ marginTop: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers or registration codes..." style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "var(--app-text)" }} /></div></div></section>
    {error && <div className="auth-alert" style={{ marginBottom: 16 }}>{error}</div>}
    {message && <div className="auth-alert" style={{ marginBottom: 16 }}>{message}</div>}
    {generatedInvitation?.registrationCode ? <section className="dashboard-home-panel" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: "var(--app-text)" }}>Teacher registration code</strong>
          <p style={{ margin: "5px 0 0", color: "var(--app-text-muted)" }}>Give this one-time code to the teacher so they can complete registration.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <code style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--app-border)", background: "var(--app-surface)", color: "var(--app-text)", fontWeight: 800, letterSpacing: ".04em" }}>{generatedInvitation.registrationCode}</code>
          <button type="button" onClick={() => copyCode(generatedInvitation.registrationCode)}><Copy size={15} /> Copy code</button>
          <button type="button" onClick={() => window.open(`/register/staff?token=${encodeURIComponent(generatedInvitation.registrationCode)}`, "_blank", "noopener,noreferrer")}><ExternalLink size={15} /> Open registration</button>
        </div>
      </div>
    </section> : null}
    <section className="dashboard-home-panel" style={{ marginBottom: 18 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, color: "var(--app-text)" }}>Approved Teacher Applicants</h2><p style={{ margin: "5px 0 0", color: "var(--app-text-muted)" }}>This is the stored application record. The generated code is shown here and can be copied directly for registration.</p></div><span className="dashboard-home-session-pill" style={{ marginTop: 0 }}>{approvedApplications.length} approved</span></div>{approvedLoading ? <p>Loading approved teacher applicants...</p> : filteredApprovedApplications.length === 0 ? <p style={{ color: "var(--app-text-muted)" }}>No approved teacher applicants found.</p> : <div style={{ display: "grid", gap: 10 }}>{filteredApprovedApplications.map((application) => { const fullName = [application.firstName, application.middleName, application.lastName].filter(Boolean).join(" "); const invitation = invitations.find((item) => item.registrationCode === application.registrationCode); const registrationPath = application.registrationPath || (application.registrationCode ? `/register/staff?token=${encodeURIComponent(application.registrationCode)}` : ""); return <article key={application.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}><div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, color: "var(--app-text)" }}>{fullName || "Teacher Applicant"}</div><div style={{ fontSize: ".84rem", color: "var(--app-text-muted)" }}>{application.positionApplied || "Teacher"}{application.majorSubject ? ` • ${application.majorSubject}` : ""}</div><div style={{ fontSize: ".82rem", color: "var(--app-text-muted)" }}>{application.email || "No email"}{application.applicationNumber ? ` • ${application.applicationNumber}` : ""}</div><div style={{ marginTop: 7, fontSize: ".86rem", fontWeight: 800, letterSpacing: ".03em", color: "var(--app-text)" }}>Registration code: {application.registrationCode || "Not generated"}</div><div style={{ fontSize: ".78rem", color: "var(--app-text-muted)" }}>{invitation?.status === "used" ? "Registration completed" : "Waiting for teacher registration"}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}><span className="dashboard-home-session-pill" style={{ marginTop: 0 }}>{invitation?.status || "unused"}</span>{application.registrationCode ? <button type="button" onClick={() => copyCode(application.registrationCode)} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px 11px", color: "var(--app-text)", cursor: "pointer" }}><Copy size={16} /><span>Copy code</span></button> : null}{application.registrationCode ? <button type="button" onClick={() => window.open(registrationPath, "_blank", "noopener,noreferrer")} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px 11px", color: "var(--app-text)", cursor: "pointer" }}><ExternalLink size={16} /><span>Open registration</span></button> : null}</div></article>; })}</div>}</section>
    <section className="dashboard-home-panel" style={{ marginBottom: 18 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, color: "var(--app-text)" }}>Existing Teachers</h2><p style={{ margin: "5px 0 0", color: "var(--app-text-muted)" }}>Deactivate a particular teacher without deleting their academic history.</p></div><span className="dashboard-home-session-pill" style={{ marginTop: 0 }}>{teachers.filter((teacher) => teacher.isActive).length} active</span></div>{teachersLoading ? <p>Loading existing teachers...</p> : filteredTeachers.length === 0 ? <p style={{ color: "var(--app-text-muted)" }}>No teacher accounts found.</p> : <div style={{ display: "grid", gap: 10 }}>{filteredTeachers.map((teacher) => <article key={teacher.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}><div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, color: "var(--app-text)" }}>{teacher.fullName}</div><div style={{ fontSize: ".84rem", color: "var(--app-text-muted)" }}>{teacher.designation || "Teacher"}{teacher.department ? ` • ${teacher.department}` : ""}</div><div style={{ fontSize: ".82rem", color: "var(--app-text-muted)" }}>{teacher.email || "No email"}</div><div style={{ marginTop: 7, fontSize: ".86rem", fontWeight: 800, letterSpacing: ".03em", color: "var(--app-text)" }}>Teacher code: {teacher.registrationCode || "No code"}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}><span className="dashboard-home-session-pill" style={{ marginTop: 0 }}>{teacher.isActive ? "active" : "inactive"}</span>{teacher.registrationCode ? <button type="button" onClick={() => copyCode(teacher.registrationCode)} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px 11px", color: "var(--app-text)", cursor: "pointer" }}><Copy size={16} /><span>Copy code</span></button> : null}<button type="button" onClick={() => toggleTeacherStatus(teacher)} disabled={updatingTeacherId === teacher.userId} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid currentColor", background: "transparent", borderRadius: 10, padding: "8px 11px", color: teacher.isActive ? "#ef4444" : "#16a34a", cursor: "pointer" }}>{teacher.isActive ? <UserX size={16} /> : <UserCheck size={16} />}{updatingTeacherId === teacher.userId ? "Updating..." : teacher.isActive ? "Deactivate" : "Reactivate"}</button></div></article>)}</div>}</section>
  </div>;
}
