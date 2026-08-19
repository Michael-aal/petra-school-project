import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/ResultsPage.css";

const formatDateTime = (value) => {
  if (!value) return "Not dated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not dated";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : "N/A";
};

const ResultCard = ({ item }) => {
  const isPending = item?.resultState === "pending" || item?.passStatus === "pending";
  const isPass = !isPending && item?.passStatus === "pass";
  const isFail = !isPending && item?.passStatus === "fail";
  const statusLabel = isPending
    ? "Result Pending"
    : isPass
      ? "Passed"
      : isFail
        ? "Failed"
        : item?.grade || "Recorded";
  const statusClass = isPending ? "pending" : isPass ? "pass" : isFail ? "fail" : "neutral";

  return (
    <article className="results-card">
      <div className="results-card-top">
        <div>
          <p className="results-card-label">Student</p>
          <strong>{item.studentName || "Unknown Student"}</strong>
        </div>
        <span className={`results-pill ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="results-grid">
        <div>
          <span>Exam Title</span>
          <strong>{item.examTitle || "Untitled Exam"}</strong>
        </div>
        <div>
          <span>Subject</span>
          <strong>{item.subject || "Unknown Subject"}</strong>
        </div>
        <div>
          <span>Marks Obtained</span>
          <strong>{formatNumber(item.score ?? item.marks)}</strong>
        </div>
        <div>
          <span>Total Marks</span>
          <strong>{formatNumber(item.totalMarks)}</strong>
        </div>
        <div>
          <span>Percentage</span>
          <strong>{item.percentage != null ? `${Number(item.percentage).toFixed(2)}%` : "N/A"}</strong>
        </div>
        <div>
          <span>Grade</span>
          <strong>{item.grade || "N/A"}</strong>
        </div>
        <div>
          <span>Pass / Fail</span>
          <strong>{isPending ? "Pending" : isPass ? "Pass" : isFail ? "Fail" : "Not assessed"}</strong>
        </div>
        <div>
          <span>Attempt Status</span>
          <strong>{item.attemptStatus || "Completed"}</strong>
        </div>
        <div>
          <span>Result State</span>
          <strong>{isPending ? "Attempt recorded; final result pending" : "Final result available"}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{formatDateTime(item.completedAt)}</strong>
        </div>
        <div>
          <span>Admission / School Code</span>
          <strong>{item.schoolCode || item.admissionCode || item.applicationCode || "Not available"}</strong>
        </div>
        <div>
          <span>Admission Status</span>
          <strong>{item.admissionStatus || "Not available"}</strong>
        </div>
        <div>
          <span>Application Code</span>
          <strong>{item.applicationCode || "Not available"}</strong>
        </div>
        <div>
          <span>Applicant</span>
          <strong>{item.applicantName || item.studentName || "Unknown Student"}</strong>
        </div>
        <div>
          <span>Applicant ID</span>
          <strong>{item.applicantId || "Not available"}</strong>
        </div>
        <div>
          <span>Exam Reference</span>
          <strong>{item.examReference || "Not available"}</strong>
        </div>
        <div>
          <span>Attempt ID</span>
          <strong>{item.attemptId || "Not available"}</strong>
        </div>
        <div>
          <span>Result ID</span>
          <strong>{item.resultId || "Pending"}</strong>
        </div>
      </div>
    </article>
  );
};

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalCount = useMemo(
    () => pagination?.total ?? results.length,
    [pagination, results.length]
  );

  useEffect(() => {
    let mounted = true;

    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminApi.results({
          page: pagination.page,
          limit: pagination.limit,
        });

        if (!mounted) return;

        const data = response?.data || {};
        setResults(Array.isArray(data.results) ? data.results : []);
        setPagination((current) => ({
          ...current,
          ...(data.pagination || {}),
        }));
      } catch (err) {
        if (!mounted) return;

        setError(err?.message || "Unable to load results.");
        setResults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadResults();

    return () => {
      mounted = false;
    };
  }, [pagination.page, pagination.limit]);

  const goToPage = (nextPage) => {
    setPagination((current) => ({
      ...current,
      page: Math.min(Math.max(1, nextPage), current.totalPages || 1),
    }));
  };

  return (
    <div className="dashboard-page results-page">
      <section className="results-hero">
        <div>
          <p className="results-kicker">Examination</p>
          <h1>Results</h1>
          <p>Review synced assessment outcomes and admission-ready records.</p>
        </div>

        <div className="results-hero-chip">
          {totalCount} {totalCount === 1 ? "record" : "records"}
        </div>
      </section>

      {loading && (
        <div className="results-state">Loading results...</div>
      )}

      {!loading && error && (
        <div className="results-state results-state-error">
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="results-state">
          No assessment attempts or results are available yet.
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="results-list">
          {results.map((item) => (
            <ResultCard key={item.resultId || item.attemptId || item.id} item={item} />
          ))}
        </div>
      )}

      {!loading && !error && pagination.totalPages > 1 && (
        <div className="results-pagination">
          <button
            type="button"
            className="results-page-button"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            className="results-page-button"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
