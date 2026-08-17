import { useEffect, useState } from "react";
import { admissionApi } from "../../../../services/admissionApi";

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="dashboard-page">
      <h1>Applicants</h1>
      <p>Submitted admission records appear here with their permanent applicant IDs.</p>

      {loading ? <p>Loading applicants...</p> : null}
      {error ? <p>{error}</p> : null}

      {!loading && !error && applicants.length === 0 ? <p>No applicants have been submitted yet.</p> : null}

      {!loading && !error && applicants.length > 0 ? (
        <div className="dashboard-card">
          {applicants.map((applicant) => {
            const machineId = applicant.applicantId || applicant.admissionCode || applicant.applicationCode || applicant.id;
            return (
              <div key={applicant.id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <strong>{applicant.applicantName || "Unnamed applicant"}</strong>
                <div style={{ opacity: 0.8, marginTop: 4 }}>{machineId}</div>
                {applicant.parentEmail ? <div style={{ opacity: 0.7, marginTop: 4 }}>{applicant.parentEmail}</div> : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
