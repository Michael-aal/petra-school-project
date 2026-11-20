import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, GraduationCap, BriefcaseBusiness, Link2, RefreshCw, ShieldCheck, Users, CheckCircle2, Clock, Link as LinkIcon, Mail } from "lucide-react";
import GenericListPage from "../../GenericListPage/GenericListPage";
import { studentApi } from "../../../../services/studentApi";
import { teacherApplicationApi } from "../../../../services/teacherApplicationApi";
import "./PortalLinksPage.css";

export default function PortalLinksPage() {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [parents, setParents] = useState([]);
  const [copiedParentId, setCopiedParentId] = useState(null);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await teacherApplicationApi.getLinks();
      setPortal(response);
    } catch (requestError) {
      setError(requestError?.data?.message || requestError?.message || "Unable to load your school's application links.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { loadLinks(); }, [loadLinks]);

  useEffect(() => {
    let active = true;
    studentApi.list({ limit: 200 }).then((response) => {
      const parentMap = new Map();
      (response.students || []).filter((student) => Boolean(student.parentId)).forEach((student) => {
        const key = student.parentId;
        const parent = parentMap.get(key) || {
          id: key,
          name: student.guardianName || student.parentEmail || "Guardian",
          email: student.parentEmail || "",
          linkedStudents: 0,
          inviteStatus: student.parentAccessCodeUsed ? "Active" : "Pending",
          lastInvited: student.parentAccessCodeUsed ? "Linked" : "Pending",
        };
        parent.linkedStudents += 1;
        if (student.parentAccessCodeUsed) {
          parent.inviteStatus = "Active";
          parent.lastInvited = "Linked";
        }
        parentMap.set(key, parent);
      });
      if (active) setParents(Array.from(parentMap.values()));
    }).catch(() => { if (active) setParents([]); });
    return () => { active = false; };
  }, []);

  const copyParentLink = async (parent) => {
    const url = window.location.origin + "/signin?email=" + encodeURIComponent(parent.email);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedParentId(parent.id);
      window.setTimeout(() => setCopiedParentId(null), 1800);
    } catch {
      setError("Clipboard access was blocked while copying the parent portal link.");
    }
  };

  const parentsConfig = {
    title: "Parent Portal Access",
    singularName: "Parent",
    description: "Existing parent access links remain available here.",
    icon: ShieldCheck,
    stats: [
      { label: "Total Parents", value: (data) => data.length, icon: Users, color: "blue" },
      { label: "Active Accounts", value: (data) => data.filter((parent) => parent.inviteStatus === "Active").length, icon: CheckCircle2, color: "green" },
      { label: "Pending Invites", value: (data) => data.filter((parent) => parent.inviteStatus === "Pending").length, icon: Clock, color: "yellow" },
    ],
    columns: [
      { key: "avatar", label: "Parent" },
      { key: "email", label: "Email", render: (item) => <span className="parent-email">{item.email || "—"}</span> },
      { key: "linkedStudents", label: "Linked Wards", render: (item) => <span>{item.linkedStudents || 0} Wards</span> },
      { key: "inviteStatus", label: "Status", render: (item) => <span className={"status-badge status-" + String(item.inviteStatus || "unknown").toLowerCase()}>{item.inviteStatus}</span> },
      { key: "lastInvited", label: "Last Invited", render: (item) => <span>{item.lastInvited || "—"}</span> },
      { key: "actions", label: "Actions", align: "right" },
    ],
    actions: [
      { label: copiedParentId ? "Copied!" : "Copy Link", icon: LinkIcon, onClick: copyParentLink },
      { label: "Send Email", icon: Mail, type: "sendLink" },
      { label: "Delete", icon: CheckCircle2, type: "delete" },
    ],
    emptyState: {
      icon: Users,
      title: "No parents found",
      description: "Parent portal access links will appear here when parent records are linked to students.",
    },
  };

  const makeUrl = (type) => {
    const token = portal?.links?.[type];
    if (!token) return "";
    const path = type === "student" ? "/admission_form" : "/teacher-application";
    return `${window.location.origin}${path}?token=${encodeURIComponent(token)}`;
  };

  const copyLink = async (type) => {
    const url = makeUrl(type);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Clipboard access was blocked. Open the link and copy it from your browser address bar.");
    }
  };

  const cards = [
    { type: "student", title: "Student applicant page", description: "Share this link with parents or guardians who want to apply for student admission.", icon: GraduationCap, accent: "student" },
    { type: "teacher", title: "Teacher applicant page", description: "Share this link with teachers applying to join your school's staff.", icon: BriefcaseBusiness, accent: "teacher" },
  ];

  return (
    <main className="portal-links-page">
      <header className="applicant-links-header">
        <div className="applicant-links-heading-icon"><Link2 size={24} /></div>
        <div>
          <p className="applicant-links-eyebrow">SCHOOL RESOURCES</p>
          <h1>Links Portal</h1>
          <p>Share your school's official application pages. Every submission is routed to this school's admin workspace.</p>
        </div>
        <button type="button" className="applicant-links-refresh" onClick={loadLinks} disabled={loading} aria-label="Refresh links">
          <RefreshCw size={17} className={loading ? "is-spinning" : ""} />
          <span>Refresh</span>
        </button>
      </header>

      {portal?.school ? (
        <section className="applicant-school-context">
          {portal.school.logo ? <img src={portal.school.logo} alt="" /> : <span className="applicant-school-placeholder"><ShieldCheck size={20} /></span>}
          <div><small>LINKS BELONG TO</small><strong>{portal.school.name}</strong></div>
          <span className="applicant-school-secure"><ShieldCheck size={15} /> School-specific</span>
        </section>
      ) : null}

      {error ? <div className="applicant-links-error" role="alert">{error}</div> : null}
      {loading ? <div className="applicant-links-loading">Loading your application links…</div> : null}

      {!loading && !error && portal?.links ? (
        <section className="applicant-links-grid">
          {cards.map(({ type, title, description, icon: Icon, accent }) => {
            const url = makeUrl(type);
            return (
              <article className={`applicant-link-card applicant-link-card-${accent}`} key={type}>
                <div className="applicant-link-card-top">
                  <span className="applicant-link-icon"><Icon size={23} /></span>
                  <span className="applicant-link-type">PUBLIC APPLICATION</span>
                </div>
                <h2>{title}</h2>
                <p>{description}</p>
                <div className="applicant-link-url" title={url}>{url}</div>
                <div className="applicant-link-actions">
                  <button type="button" onClick={() => copyLink(type)} className="applicant-copy-button">
                    <Copy size={16} /> {copied === type ? "Copied!" : "Copy link"}
                  </button>
                  <a href={url} target="_blank" rel="noreferrer" className="applicant-preview-link">
                    Preview <ExternalLink size={15} />
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <aside className="applicant-links-note">
        <ShieldCheck size={19} />
        <div><strong>Private to your school</strong><p>These signed links identify your school without exposing an admin account ID. Applicants do not need to sign in. Keep your links within your school's recruitment and admission channels.</p></div>
      </aside>

      <section className="applicant-parent-links">
        <div className="applicant-parent-links-heading">
          <h2>Parent Portal Access</h2>
          <p>Existing parent sign-in links are still available and have been kept intact.</p>
        </div>
        <GenericListPage config={parentsConfig} initialData={parents} />
      </section>
    </main>
  );
}
