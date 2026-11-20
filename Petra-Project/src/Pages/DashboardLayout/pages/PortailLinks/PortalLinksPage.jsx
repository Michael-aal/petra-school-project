import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, GraduationCap, BriefcaseBusiness, Link2, RefreshCw, ShieldCheck } from "lucide-react";
import { teacherApplicationApi } from "../../../../services/teacherApplicationApi";
import "./PortalLinksPage.css";

export default function PortalLinksPage() {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

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
    </main>
  );
}
