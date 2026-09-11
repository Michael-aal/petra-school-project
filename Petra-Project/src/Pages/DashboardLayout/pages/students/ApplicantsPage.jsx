import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users, Clock3, CheckCircle2 } from "lucide-react";
import { admissionApi } from "../../../../services/admissionApi";
import "../page-styles/ApplicantsPage.css";

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await admissionApi.list({ limit: 200 });
        if (mounted) setApplicants(response.admissions || []);
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load applicants.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateApplicant = async (applicant, action) => {
    setSavingId(applicant.id);
    setError("");
    try {
      const response =
        action === "approve"
          ? await admissionApi.approve(applicant.id)
          : action === "reject"
            ? await admissionApi.reject(
                applicant.id,
                "Rejected by school administrator",
              )
            : await admissionApi.enroll(applicant.id, {
                className: applicant.intendedClass,
              });
      const updated = response.admission;
      setApplicants((current) =>
        current.map((item) =>
          item.id === applicant.id ? { ...item, ...updated } : item,
        ),
      );
    } catch (err) {
      setError(err.message || "Unable to update applicant.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredApplicants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return applicants;
    return applicants.filter((applicant) => {
      const values = [
        applicant.applicantName,
        applicant.applicantId,
        applicant.admissionCode,
        applicant.applicationCode,
        applicant.parentEmail,
      ];
      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedQuery),
      );
    });
  }, [applicants, query]);

  return (
    <div className="dashboard-page applicants-page">
      <header className="applicants-hero">
        <div>
          <p className="dashboard-page-label">Students / Admissions</p>
          <h1>Applicants</h1>
          <p>
            Review submitted admission records and prepare the next enrollment
            step.
          </p>
        </div>
        <button type="button" className="applicants-primary-action">
          <UserPlus size={17} /> New applicant
        </button>
      </header>

      <section className="applicants-stats" aria-label="Applicant summary">
        <article>
          <Users size={18} />
          <div>
            <strong>{applicants.length}</strong>
            <span>Total applicants</span>
          </div>
        </article>
        <article>
          <Clock3 size={18} />
          <div>
            <strong>{applicants.length}</strong>
            <span>Awaiting review</span>
          </div>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <div>
            <strong>0</strong>
            <span>Approved this cycle</span>
          </div>
        </article>
      </section>

      <section className="applicants-panel">
        <div className="applicants-toolbar">
          <div>
            <h2>Admission records</h2>
            <p>Permanent applicant IDs remain attached to each submission.</p>
          </div>
          <label className="applicants-search">
            <Search size={16} />
            <span className="sr-only">Search applicants</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, ID or email"
            />
          </label>
        </div>

        {loading ? (
          <div className="applicants-state">Loading applicants...</div>
        ) : null}
        {error ? (
          <div className="applicants-state applicants-state-error">{error}</div>
        ) : null}

        {!loading && !error && applicants.length === 0 ? (
          <div className="applicants-state">
            No applicants have been submitted yet.
          </div>
        ) : null}

        {!loading &&
        !error &&
        applicants.length > 0 &&
        filteredApplicants.length === 0 ? (
          <div className="applicants-state">No applicants match “{query}”.</div>
        ) : null}

        {!loading && !error && filteredApplicants.length > 0 ? (
          <div className="applicants-list">
            {filteredApplicants.map((applicant) => {
              const machineId =
                applicant.applicantId ||
                applicant.admissionCode ||
                applicant.applicationCode ||
                applicant.id;
              return (
                <article className="applicant-row" key={applicant.id}>
                  <div className="applicant-avatar">
                    {(applicant.applicantName || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="applicant-main">
                    <strong>
                      {applicant.applicantName || "Unnamed applicant"}
                    </strong>
                    <span>
                      {applicant.parentEmail || "No parent email provided"}
                    </span>
                  </div>
                  <div className="applicant-id">
                    <small>Applicant ID</small>
                    <strong>{machineId}</strong>
                  </div>
                  <span
                    className={`applicant-status applicant-status-${applicant.status || "pending"}`}
                  >
                    {applicant.status || "Pending"}
                  </span>
                  <div className="applicant-actions">
                    {applicant.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="applicant-more applicant-approve"
                          disabled={savingId === applicant.id}
                          onClick={() => updateApplicant(applicant, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="applicant-more applicant-reject"
                          disabled={savingId === applicant.id}
                          onClick={() => updateApplicant(applicant, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {applicant.status === "approved" ||
                    applicant.admissionCode ? (
                      <button
                        type="button"
                        className="applicant-more"
                        disabled={savingId === applicant.id}
                        onClick={() => updateApplicant(applicant, "enroll")}
                      >
                        Enroll
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
