import { useEffect, useState } from "react";
import { teacherApi } from "../../../../services/teacherApi";
import "../page-styles/ResultsPage.css";

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
    <div className="dashboard-page">
      <h1>Results</h1>
      <p>Review student results and performance records.</p>

      {loading ? <p>Loading results...</p> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !error && results.length === 0 ? <p>No published results are available yet.</p> : null}

      {!loading && !error && results.length > 0 ? (
        <div className="dashboard-card">
          {results.map((item) => (
            <div key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <strong>{item.studentName || "Unnamed student"}</strong>
              <div style={{ opacity: 0.85, marginTop: 4 }}>
                {item.subject}{item.className ? ` • ${item.className}` : ""}
              </div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>
                {item.score} / {item.maxScore}{item.published ? " • Published" : ""}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
