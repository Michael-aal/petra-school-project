import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { teacherApi } from "../../../../services/teacherApi";
import { admissionApi } from "../../../../services/admissionApi";
import { request } from "../../../../services/apiClient";
import "../page-styles/CbtPage.css";

export default function CbtPage() {
  const [assessmentId, setAssessmentId] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicantId, setApplicantId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const applicantParam = params.get("applicantId") || params.get("studentId");
    const assessmentParam = params.get("assessmentId") || params.get("assessmentRef");
    if (applicantParam) setApplicantId(applicantParam);
    if (assessmentParam) setAssessmentId(assessmentParam);

    (async () => {
      try {
        const [assessmentRes, applicantRes] = await Promise.allSettled([
          teacherApi.assessments(),
          admissionApi.list({ limit: 200 }),
        ]);
        if (assessmentRes.status === "fulfilled") setAssessments(assessmentRes.value.assessments || []);
        if (applicantRes.status === "fulfilled") setApplicants(applicantRes.value.admissions || []);
      } catch (e) {
        // keep the page usable even if one list fails
      }
    })();
  }, []);

  const handleCreateRemoteExam = async () => {
    setError(null);
    if (!assessmentId) return setError("Please select an assessment");
    if (!applicantId) return setError("Please select an applicant");
    setLoading(true);
    try {
      const json = await request("/api/assessments/start", {
        method: "POST",
        body: JSON.stringify({ applicantId, assessmentId }),
      });
      const quizUrl = json.quizUrl || json.url || json.data?.url;
      if (!quizUrl) throw new Error("Assessment started but no QuizLab launch URL returned");
      window.location.href = quizUrl;
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page cbt-page simple">
      <section className="cbt-card">
        <h1>Create Assessment</h1>
        <p>Select an applicant and an assessment to launch the configured QuizLab examination.</p>

        <label className="cbt-input-label">Applicant</label>
        {applicants.length ? (
          <select className="cbt-input" value={applicantId} onChange={(e) => setApplicantId(e.target.value)}>
            <option value="">-- Select applicant --</option>
            {applicants.map((applicant) => {
              const value = applicant.applicantId || applicant.admissionCode || applicant.applicationCode || applicant.id;
              const label = applicant.applicantName ? `${applicant.applicantName} — ${value}` : value;
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
        ) : (
          <input className="cbt-input" value={applicantId} onChange={(e) => setApplicantId(e.target.value)} placeholder="Applicant ID" />
        )}

        <label className="cbt-input-label">Assessment</label>
        {assessments.length ? (
          <select className="cbt-input" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)}>
            <option value="">-- Select assessment --</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>{assessment.title || assessment.id}</option>
            ))}
          </select>
        ) : (
          <input className="cbt-input" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} placeholder="Assessment ID" />
        )}

        <button className="cbt-primary-btn" onClick={handleCreateRemoteExam} disabled={loading}>
          {loading ? <Loader2 className="spinner" /> : <Plus size={14} />}
          <span>{loading ? "Creating..." : "Create Assessment"}</span>
        </button>

        {error ? <div className="cbt-error">{error}</div> : null}
      </section>
    </div>
  );
}
