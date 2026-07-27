import { useEffect, useState } from "react";
import { RefreshCcw, Percent, Layers3 } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import "../page-styles/ExtraFeesPage.css";

export default function ExtraFeesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await financeApi.fees();
      setData(response.feeStructures || []);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load extra fees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="dashboard-page finance-module-page">
      <div className="module-header">
        <div>
          <p className="dashboard-page-label">Finance</p>
          <h1>Extra Fees</h1>
          <p className="dashboard-page-copy">Manage special charges assigned to classes and sessions.</p>
        </div>
        <button type="button" className="module-button" onClick={load} disabled={loading}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="module-alert module-alert-error">{error}</div>}
      {loading ? (
        <div className="module-empty">Loading extra fee structures...</div>
      ) : data.length === 0 ? (
        <div className="module-empty">No extra fee structures found.</div>
      ) : (
        <div className="module-grid">
          {data.map((fee) => (
            <article key={fee.id} className="module-card">
              <div className="module-card-title">
                <Percent size={18} />
                <strong>{fee.name || fee.feeName || "Fee"}</strong>
              </div>
              <p>{fee.description || fee.feeCategory?.name || "Assigned fee"}</p>
              <div className="module-meta">
                <span><Layers3 size={14} /> {fee.className || "All classes"}</span>
                <span>{fee.isActive === false ? "Disabled" : "Enabled"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
