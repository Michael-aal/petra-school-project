import { useEffect, useState } from "react";
import { teacherApi } from "../../../../services/teacherApi";
import "../page-styles/ResultsPage.css";

const formatDate = (value) => {
  if (!value) return "Not dated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not dated";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await teacherApi.results();
        if (mounted) setResults(response.results || []);
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load results.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-page results-page">
      <section className="results-hero">
        <div>
          <h1>Results</h1>
          <p>Review synced assessment outcomes and performance records.</p>
        </div>
        <div className="results-hero-chip">
          {results.length} record{results.length === 1 ? "" : "s"}
        </div>
      </section>

      {loading ? <p>Loading results...</p> : null}
      {error ? <p className="results-error">{error}</p> : null}
      {!loading && !error && results.length === 0 ? (
        <p className="results-empty">No published results are available yet.</p>
      ) : null}

      {!loading && !error && results.length > 0 ? (
        <div className="results-list">
          {results.map((item) => (
            <article key={item.id} className="results-card">
              <div className="results-card-top">
                <strong>{item.studentName || "Unnamed student"}</strong>
                {item.published ? <span className="results-pill">Published</span> : <span className="results-pill muted">Draft</span>}
              </div>
              <div className="results-meta">
                <span>{item.assessmentTitle || "Assessment"}</span>
                <span>
                  {item.subject}
                  {item.className ? ` - ${item.className}` : ""}
                </span>
              </div>
              <div className="results-score">
                <span>{item.score}</span>
                <span>/ {item.maxScore}</span>
              </div>
              <div className="results-footer">
                <span>{item.percentage != null ? `${item.percentage}%` : "No percentage"}</span>
                <span>{item.assessmentId ? `Assessment ID: ${item.assessmentId}` : "Assessment ID unavailable"}</span>
              </div>
              <div className="results-subtle">
                {item.assessmentDate ? `Assessment date: ${formatDate(item.assessmentDate)} | ` : ""}
                Updated {formatDate(item.updatedAt)} | Created {formatDate(item.createdAt)}
              </div>
              <div className="results-footer">
                <span>{item.examStatus ? `Attempt: ${item.examStatus}` : "Attempt: unavailable"}</span>
                <span>{item.examAttemptNumber ? `Run #${item.examAttemptNumber}` : "Run: unavailable"}</span>
              </div>
              <div className="results-subtle">
                {item.examCompletedAt ? `Completed: ${formatDate(item.examCompletedAt)} | ` : ""}
                {item.examCompletionTimeSeconds != null ? `Time: ${item.examCompletionTimeSeconds}s | ` : ""}
                {item.examExternalResultId ? `External ID: ${item.examExternalResultId}` : "External ID unavailable"}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
