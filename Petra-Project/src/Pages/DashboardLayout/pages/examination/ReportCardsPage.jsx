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

export default function ReportCardsPage() {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.reportCards();
      setReportCards(response.data || []);
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
