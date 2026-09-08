import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, X } from "lucide-react";
import { teacherApi } from "../../../../services/teacherApi";
import { admissionApi } from "../../../../services/admissionApi";
import { request } from "../../../../services/apiClient";
import "../page-styles/CbtPage.css";

const examSyncSignals = new Set([
  "exam_complete",
  "exam-complete",
  "portal_complete",
  "portal-complete",
  "testportal_result",
  "testportal-result",
  "result_sync",
  "result-sync",
  "portal_result",
  "portal-result",
  "cbt_result",
  "cbt-result",
]);

export default function CbtPage() {
  const [assessmentId, setAssessmentId] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applicantId, setApplicantId] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");
  const [syncStatus, setSyncStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const applicantParam = params.get("applicantId") || params.get("studentId");
    const assessmentParam = params.get("assessmentId");
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

  useEffect(() => {
    if (!assessmentId) return undefined;

    const onMessage = (event) => {
      const payload = event?.data;
      if (!payload || typeof payload !== "object") return;

      const eventType = String(payload.type || payload.event || payload.status || "").toLowerCase();
      const shouldSync =
        examSyncSignals.has(eventType) ||
        payload.completed === true ||
        payload.status === "completed" ||
        payload.passed !== undefined ||
        payload.score !== undefined ||
        payload.percentage !== undefined;

      if (!shouldSync) return;

      setSyncStatus("Synchronizing latest TestPortal results...");

      request(`/api/classmarker/exams/${assessmentId}/sync-results`, {
        method: "POST",
      })
        .then(() => {
          setSyncStatus("Result synchronization completed.");
        })
        .catch((syncErr) => {
          const msg = syncErr?.message || "Unable to sync TestPortal results.";
          setSyncStatus(msg);
        });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [assessmentId]);

  const handleCreateRemoteExam = async () => {
    setError(null);
    setSyncStatus("");
    if (!assessmentId) return setError("Please select an assessment");
    if (!applicantId) return setError("Please select an applicant");
    if (assessments.length && !assessments.some((assessment) => String(assessment.id) === String(assessmentId))) {
      return setError("No valid assessment is configured for the selected value. Please choose an assessment from the list.");
    }
    setLoading(true);
    try {
      const json = await request("/api/assessments/start", {
        method: "POST",
        body: JSON.stringify({ applicantId, assessmentId }),
      });
      const quizUrl = json.quizUrl || json.url || json.data?.url;
      if (!quizUrl) throw new Error("Assessment started but no QuizLab launch URL returned");
      setLaunchUrl(quizUrl);
      setSyncStatus("TestPortal is open in the iframe below.");
    } catch (err) {
      const step = err?.data?.step ? ` (${err.data.step})` : "";
      setError(`${err.message || String(err)}${step}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncResults = async () => {
    if (!assessmentId) return;
    setSyncStatus("Synchronizing latest TestPortal results...");
    try {
      await request(`/api/classmarker/exams/${assessmentId}/sync-results`, { method: "POST" });
      setSyncStatus("Result synchronization completed.");
    } catch (err) {
      const step = err?.data?.step ? ` (${err.data.step})` : "";
      setSyncStatus(`${err.message || String(err)}${step}`);
    }
  };

  return (
    <div className="dashboard-page cbt-page simple">
      <section className="cbt-card">
        <div className="cbt-header-row">
          <div>
            <h1>Create Assessment</h1>
            <p>Select an applicant and an assessment to launch the configured TestPortal examination inside Petra.</p>
          </div>
          {assessmentId ? (
            <button type="button" className="cbt-secondary-btn" onClick={handleSyncResults}>
              <RefreshCw size={14} />
              <span>Sync Results</span>
            </button>
          ) : null}
        </div>

        {!launchUrl ? (
          <>
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
              <div className="cbt-empty-state">No applicants available. Submit an admission form first.</div>
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
              <div className="cbt-empty-state">No assessments available.</div>
            )}

            <button className="cbt-primary-btn" onClick={handleCreateRemoteExam} disabled={loading}>
              {loading ? <Loader2 className="spinner" /> : <Plus size={14} />}
              <span>{loading ? "Creating..." : "Launch in Portal"}</span>
            </button>
          </>
        ) : (
          <div className="cbt-exam-shell">
            <div className="cbt-portal-toolbar">
              <strong>Online exam</strong>
              <button type="button" className="cbt-close-btn" onClick={() => setLaunchUrl("")}>
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
            <iframe
              title="TestPortal examination"
              className="cbt-iframe"
              src={launchUrl}
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        {syncStatus ? <div className="cbt-sync-status">{syncStatus}</div> : null}
        {error ? <div className="cbt-error">{error}</div> : null}
      </section>
    </div>
  );
}
