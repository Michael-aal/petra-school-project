import { useEffect, useState } from "react";
import {
  Download,
  FileText,
  GraduationCap,
  Send,
  RefreshCcw,
} from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/ReportCardsPage.css";

const formatDate = (value) => {
  if (!value) return "Not dated";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not dated"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const AssessmentResultRow = ({ result }) => {
  const passed = result.passStatus === "pass";
  const failed = result.passStatus === "fail";

  return (
    <article className="report-result-row">
      <div>
        <strong>{result.studentName || "Unknown student"}</strong>
        <span>{result.admissionCode || result.applicationCode || "No student code"}</span>
      </div>
      <div>
        <strong>{result.examTitle || "Assessment"}</strong>
        <span>{formatDate(result.assessmentDate)}</span>
      </div>
      <div className="report-result-score">
        <strong>{result.score ?? result.marks ?? "N/A"} / {result.totalMarks ?? "N/A"}</strong>
        <span>{result.percentage != null ? `${Number(result.percentage).toFixed(2)}%` : "No percentage"}</span>
      </div>
      <span className={`report-result-status ${passed ? "pass" : failed ? "fail" : "pending"}`}>
        {passed ? "Pass" : failed ? "Fail" : result.resultState || "Pending"}
      </span>
    </article>
  );
};

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportResponse, resultResponse] = await Promise.all([
        adminApi.reportCards(),
        adminApi.results({ page: 1, limit: 200 }),
      ]);
      setReportCards(reportResponse.data || []);
      setAssessmentResults(resultResponse.data?.results || []);
    } catch (err) {
      setError(err.message || "Unable to load report cards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async (reportCard) => {
    const fileUrl = window.prompt(
      "Enter the report card file URL",
      reportCard.fileUrl || "",
    );
    if (!fileUrl) return;
    try {
      const response = await adminApi.publishReportCard(reportCard.id, fileUrl);
      setReportCards((current) =>
        current.map((item) =>
          item.id === reportCard.id
            ? { ...item, ...response.reportCard }
            : item,
        ),
      );
    } catch (err) {
      setError(err.message || "Unable to publish report card.");
    }
  };

  const publishedCount = reportCards.filter((item) => item.fileUrl).length;
  return (
    <div className="dashboard-page reportcards-page">
      <header className="reportcards-hero">
        <div>
          <p className="dashboard-page-label">Examination / Reporting</p>
          <h1>Report cards</h1>
          <p>
            Prepare clear academic summaries for families and keep each term’s
            record in one place.
          </p>
        </div>
        <button
          type="button"
          className="reportcards-primary-action"
          onClick={load}
        >
          <RefreshCcw size={17} /> Refresh reports
        </button>
      </header>
      <section className="reportcards-stat-grid">
        <article>
          <GraduationCap size={19} />
          <strong>{reportCards.length}</strong>
          <span>Students ready</span>
        </article>
        <article>
          <FileText size={19} />
          <strong>{reportCards.length - publishedCount}</strong>
          <span>Draft reports</span>
        </article>
        <article>
          <Send size={19} />
          <strong>{publishedCount}</strong>
          <span>Published to families</span>
        </article>
      </section>
      {error ? (
        <div className="reportcards-state reportcards-state-error">{error}</div>
      ) : null}
      {!loading && !error ? (
        <section className="reportcards-results-panel">
          <div className="reportcards-results-heading">
            <div>
              <p className="dashboard-page-label">Assessment outcomes</p>
              <h2>Student assessment results</h2>
            </div>
            <span>{assessmentResults.length} {assessmentResults.length === 1 ? "result" : "results"}</span>
          </div>
          {assessmentResults.length > 0 ? (
            <div className="report-results-list">
              {assessmentResults.map((result) => (
                <AssessmentResultRow
                  key={result.resultId || result.attemptId || result.id}
                  result={result}
                />
              ))}
            </div>
          ) : (
            <p className="reportcards-results-empty">
              No assessment attempts or results are available yet.
            </p>
          )}
        </section>
      ) : null}
      {loading ? (
        <div className="reportcards-state">Loading report cards...</div>
      ) : null}
      {!loading && !error && reportCards.length > 0 ? (
        <section className="reportcards-list">
          {reportCards.map((reportCard) => (
            <article className="reportcard-row" key={reportCard.id}>
              <div className="reportcards-icon">
                <FileText size={20} />
              </div>
              <div>
                <strong>
                  {reportCard.student?.name ||
                    reportCard.student?.admissionNumber ||
                    "Student report"}
                </strong>
                <span>{reportCard.student?.className || "No class"}</span>
              </div>
              <span
                className={`reportcard-status ${reportCard.fileUrl ? "published" : "draft"}`}
              >
                {reportCard.fileUrl ? "Published" : "Draft"}
              </span>
              <button
                type="button"
                className="reportcards-secondary-action"
                onClick={() => publish(reportCard)}
              >
                {reportCard.fileUrl ? "Update link" : "Publish"}
              </button>
            </article>
          ))}
        </section>
      ) : null}
      {!loading && !error && reportCards.length === 0 ? (
        <section className="reportcards-panel">
          <div className="reportcards-icon">
            <FileText size={25} />
          </div>
          <h2>No report batches yet</h2>
          <p>
            Once results are finalized, create a report batch to review,
            download, and publish report cards.
          </p>
          <div className="reportcards-actions">
            <button type="button" className="reportcards-secondary-action">
              Create report batch
            </button>
            <button type="button" className="reportcards-ghost-action">
              <Download size={16} /> Export template
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
