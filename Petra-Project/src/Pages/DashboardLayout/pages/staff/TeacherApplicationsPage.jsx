import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  GraduationCap,
  Search,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { teacherApplicationApi } from "../../../../services/teacherApplicationApi";
import "./TeacherApplicationsPage.css";

const STATUS_LABELS = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  approved: "Approved",
  rejected: "Rejected",
};

export default function TeacherApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await teacherApplicationApi.list({ limit: 200 });
      setApplications(response.applications || []);
    } catch (requestError) {
      setError(requestError?.data?.message || requestError?.message || "Unable to load teacher applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((item) => item.status === "pending").length,
    shortlisted: applications.filter((item) => item.status === "shortlisted").length,
    approved: applications.filter((item) => item.status === "approved").length,
  }), [applications]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return applications.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      if (!statusMatch) return false;
      if (!term) return true;
      return [
        item.firstName,
        item.middleName,
        item.lastName,
        item.email,
        item.phone,
        item.applicationNumber,
        item.positionApplied,
        item.majorSubject,
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [applications, query, statusFilter]);

  const updateStatus = async (application, nextStatus) => {
    setSavingId(application.id);
    setError("");
    setCopiedCode(false);
    try {
      const response = await teacherApplicationApi.updateStatus(application.id, nextStatus);
      const updated = response.application;
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, ...updated } : item));
      setSelected((current) => current?.id === application.id ? { ...current, ...updated } : current);
    } catch (requestError) {
      setError(requestError?.data?.message || requestError?.message || "Unable to update application.");
    } finally {
      setSavingId(null);
    }
  };

  const copyRegistrationCode = async () => {
    if (!selected?.registrationCode) return;
    try {
      await navigator.clipboard.writeText(selected.registrationCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      setError("Unable to copy the registration code. Copy it manually instead.");
    }
  };

  return (
    <div className="dashboard-page teacher-applications-page">
      <header className="teacher-applications-hero">
        <div>
          <p className="dashboard-page-label">Staff / Recruitment</p>
          <h1>Teacher Applications</h1>
          <p>Review teacher applications submitted to your school and move each candidate through the recruitment process.</p>
        </div>
        <button type="button" className="teacher-applications-refresh" onClick={load} disabled={loading}>Refresh</button>
      </header>

      <section className="teacher-application-stats">
        <Stat icon={Users} label="Total applications" value={counts.total} />
        <Stat icon={Clock3} label="Awaiting review" value={counts.pending} />
        <Stat icon={BriefcaseBusiness} label="Shortlisted" value={counts.shortlisted} />
        <Stat icon={CheckCircle2} label="Approved" value={counts.approved} />
      </section>

      {error ? <div className="teacher-applications-alert">{error}</div> : null}

      <section className="teacher-applications-panel">
        <div className="teacher-applications-toolbar">
          <div className="teacher-applications-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, application number, subject..." />
          </div>
          <div className="teacher-application-filters">
            {[["all", "All"], ["pending", "Pending"], ["shortlisted", "Shortlisted"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([value, label]) => (
              <button key={value} type="button" className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? <div className="teacher-applications-empty">Loading applications...</div> : null}
        {!loading && filtered.length === 0 ? <div className="teacher-applications-empty"><UserRound size={28} /><strong>No applications found</strong><span>Try another search or status filter.</span></div> : null}

        {!loading && filtered.length > 0 ? (
          <div className="teacher-application-list">
            {filtered.map((application) => (
              <article className="teacher-application-row" key={application.id}>
                <div className="teacher-app-avatar">{`${application.firstName || ""}${application.lastName || ""}`.trim().slice(0, 1).toUpperCase() || "T"}</div>
                <div className="teacher-app-main">
                  <strong>{[application.firstName, application.middleName, application.lastName].filter(Boolean).join(" ")}</strong>
                  <span>{application.positionApplied || "Teaching position"} · {application.majorSubject || "Subject not specified"}</span>
                  <small>{application.applicationNumber} · {application.email}</small>
                </div>
                <div className="teacher-app-qualification"><GraduationCap size={16} /><span>{application.qualification || "Qualification not provided"}</span></div>
                <span className={`teacher-app-status status-${application.status || "pending"}`}>{STATUS_LABELS[application.status] || application.status}</span>
                <button type="button" className="teacher-app-view" onClick={() => { setSelected(application); setCopiedCode(false); }}><Eye size={16} /> View</button>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {selected ? (
        <div className="teacher-application-drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="teacher-application-drawer" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p className="dashboard-page-label">{selected.applicationNumber}</p>
                <h2>{[selected.firstName, selected.middleName, selected.lastName].filter(Boolean).join(" ")}</h2>
                <span>{selected.positionApplied || "Teacher application"}</span>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close"><XCircle size={22} /></button>
            </header>

            <div className="teacher-drawer-actions">
              {selected.status === "pending" ? <button disabled={savingId === selected.id} onClick={() => updateStatus(selected, "shortlisted")} className="secondary">Shortlist</button> : null}
              {selected.status !== "approved" ? <button disabled={savingId === selected.id} onClick={() => updateStatus(selected, "approved")} className="primary">Approve</button> : null}
              {selected.status !== "rejected" ? <button disabled={savingId === selected.id} onClick={() => updateStatus(selected, "rejected")} className="danger">Reject</button> : null}
            </div>

            {selected.status === "approved" && selected.registrationCode ? (
              <section className="teacher-registration-code-card">
                <div>
                  <span>Teacher Registration Code</span>
                  <strong>{selected.registrationCode}</strong>
                  <small>Give this code to the approved teacher. It activates the existing Teacher record and can only be used once.</small>
                </div>
                <button type="button" onClick={copyRegistrationCode} title="Copy registration code"><Copy size={17} />{copiedCode ? "Copied" : "Copy"}</button>
                <small className="teacher-registration-link">Registration: {window.location.origin}/register/staff?token={encodeURIComponent(selected.registrationCode)}</small>
              </section>
            ) : null}

            <DetailSection title="Personal Information" items={[
              ["Email", selected.email], ["Phone", selected.phone], ["Gender", selected.gender], ["Date of birth", formatDate(selected.dateOfBirth)],
              ["Nationality", selected.nationality], ["State of origin", selected.stateOfOrigin], ["LGA", selected.lga], ["Marital status", selected.maritalStatus],
              ["NIN", selected.nin], ["Address", selected.address],
            ]} />
            <DetailSection title="Education" items={[
              ["Highest qualification", selected.qualification], ["Institution", selected.institution], ["Course / field", selected.course], ["Year obtained", selected.graduationYear],
              ["Teaching qualification", selected.teachingQualification], ["TRCN number", selected.trcnNumber], ["Specialization", selected.specialization],
            ]} />
            <DetailSection title="Teaching Experience" items={[
              ["Experience", selected.experienceYears != null ? `${selected.experienceYears} year(s)` : null], ["Main subject", selected.majorSubject], ["Other subject", selected.minorSubject],
              ["Subjects", selected.subjects], ["Classes / levels", selected.classLevels], ["Previous schools", selected.previousSchools],
            ]} />
            <DetailSection title="Employment" items={[
              ["Position", selected.positionApplied], ["Employment type", selected.employmentType], ["Available from", formatDate(selected.availableStartDate)], ["Expected salary", selected.expectedSalary],
            ]} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return <article><Icon size={18} /><div><strong>{value}</strong><span>{label}</span></div></article>;
}

function DetailSection({ title, items }) {
  return <section className="teacher-detail-section"><h3>{title}</h3><div className="teacher-detail-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "Not provided"}</strong></div>)}</div></section>;
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}
