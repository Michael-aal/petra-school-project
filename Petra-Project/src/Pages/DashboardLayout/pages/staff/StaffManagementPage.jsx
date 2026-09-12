import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Copy, RotateCw, Ban, UserCog, Filter } from "lucide-react";
import { authApi } from "../../../../services/authApi";
import "../page-styles/DashboardHomePage.css";

const initialForm = {
  staffName: "",
  role: "Teacher",
  department: "",
  assignedClass: "",
  assignedSubjects: "",
  employmentStatus: "active",
};

const splitSubjects = (value = "") =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function StaffManagementPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authApi.staffInvitations();
      setInvitations(response.invitations || []);
    } catch (err) {
      setError(err.data?.message || err.message || "Failed to load teacher invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const filteredInvitations = useMemo(() => {
    return invitations.filter((item) => {
      const matchesQuery = `${item.staffName} ${item.role} ${item.department} ${item.registrationCode}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFilter = filter === "all" || item.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, invitations, query]);

  const summary = useMemo(() => {
    const total = invitations.length;
    const used = invitations.filter((item) => item.status === "used").length;
    const revoked = invitations.filter((item) => item.status === "revoked").length;
    return { total, used, revoked };
  }, [invitations]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await authApi.createStaffInvitation({
        ...form,
        assignedSubjects: splitSubjects(form.assignedSubjects),
      });
      setMessage("Teacher invitation created. Give the generated registration code to the teacher.");
      setForm(initialForm);
      setShowForm(false);
      await loadInvitations();
    } catch (err) {
      setError(err.data?.message || err.message || "Failed to create teacher invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setMessage("Registration code copied to clipboard.");
  };

  const regenerateCode = async (registrationCode) => {
    setError("");
    try {
      await authApi.regenerateStaffInvitationCode({ registrationCode });
      setMessage("Registration code regenerated.");
      await loadInvitations();
    } catch (err) {
      setError(err.data?.message || err.message || "Failed to regenerate code");
    }
  };

  const revokeCode = async (registrationCode) => {
    setError("");
    try {
      await authApi.revokeStaffInvitation({ registrationCode });
      setMessage("Registration code revoked.");
      await loadInvitations();
    } catch (err) {
      setError(err.data?.message || err.message || "Failed to revoke code");
    }
  };

  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Teacher Management</h1>
          <p>Add teachers with basic school details and generate a registration code for account setup.</p>
        </div>
        <div className="dashboard-home-session-pill">Admin Workspace</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div><span>Total Invitations</span><strong>{summary.total}</strong></div>
            <div className="dashboard-home-summary-icon tone-blue"><UserCog size={18} /></div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div><span>Used</span><strong>{summary.used}</strong></div>
            <div className="dashboard-home-summary-icon tone-teal"><UserCog size={18} /></div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div><span>Revoked</span><strong>{summary.revoked}</strong></div>
            <div className="dashboard-home-summary-icon tone-rose"><UserCog size={18} /></div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel" style={{ marginBottom: 18 }}>
        <div className="dashboard-home-content" style={{ marginBottom: 0, gridTemplateColumns: "1.1fr 0.9fr" }}>
          <div className="dashboard-home-account-row" style={{ marginBottom: 0 }}>
            <div className="dashboard-home-account-icon"><Search size={16} /></div>
            <div className="dashboard-home-account-text">
              <strong>Search teachers</strong>
              <span>Find by name, role, department, class, or registration code.</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
              <Filter size={16} />
              <select value={filter} onChange={(event) => setFilter(event.target.value)} style={{ border: 0, outline: 0, background: "transparent", color: "var(--app-text)" }}>
                <option value="all">All</option>
                <option value="unused">Unused</option>
                <option value="used">Used</option>
                <option value="revoked">Revoked</option>
              </select>
            </label>
            <button className="dashboard-home-summary-action tone-blue" type="button" style={{ border: "1px solid currentColor", cursor: "pointer", padding: "0 14px" }} onClick={() => setShowForm((current) => !current)}>
              <Plus size={14} />
              <span>Add Teacher</span>
            </button>
          </div>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16, padding: 16, border: "1px solid var(--app-border)", borderRadius: 16, background: "var(--app-surface)" }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <input name="staffName" placeholder="Teacher Full Name" value={form.staffName} onChange={handleChange} required />
              <input name="role" placeholder="Position / Role" value={form.role} onChange={handleChange} />
              <input name="department" placeholder="Department (Optional)" value={form.department} onChange={handleChange} />
              <input name="assignedClass" placeholder="Class Assigned (Optional)" value={form.assignedClass} onChange={handleChange} />
              <input name="assignedSubjects" placeholder="Subjects Assigned, comma separated (Optional)" value={form.assignedSubjects} onChange={handleChange} />
              <select name="employmentStatus" value={form.employmentStatus} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={submitting}>{submitting ? "Generating..." : "Generate Teacher Code"}</button>
            </div>
          </form>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers" style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "var(--app-text)" }} />
          </div>
        </div>
      </section>

      {error ? <div className="auth-alert" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="auth-alert" style={{ marginBottom: 16 }}>{message}</div> : null}

      <section className="dashboard-home-panel">
        {loading ? (
          <p>Loading teacher invitations...</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredInvitations.map((invitation) => (
              <article key={invitation.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "var(--app-text)" }}>{invitation.staffName}</div>
                  <div style={{ fontSize: "0.84rem", color: "var(--app-text-muted)" }}>{invitation.role || "Teacher"} • {invitation.department || "No department"}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--app-text-muted)" }}>{invitation.assignedClass || "No class assigned"}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--app-text)" }}>{invitation.registrationCode}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="dashboard-home-session-pill" style={{ marginTop: 0 }}>{invitation.status}</span>
                  <button type="button" onClick={() => copyCode(invitation.registrationCode)} style={{ border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px", color: "var(--app-text)" }}><Copy size={16} /></button>
                  <button type="button" onClick={() => regenerateCode(invitation.registrationCode)} disabled={invitation.status === "used"} style={{ border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px", color: "var(--app-text)" }}><RotateCw size={16} /></button>
                  <button type="button" onClick={() => revokeCode(invitation.registrationCode)} disabled={invitation.status === "used"} style={{ border: "1px solid var(--app-border)", background: "transparent", borderRadius: 10, padding: "8px", color: "#ef4444" }}><Ban size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
