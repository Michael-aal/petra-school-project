import { useEffect, useState } from "react";
import { RefreshCcw, CalendarRange, Wallet } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import "../page-styles/FlexpayPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value || 0);

export default function FlexpayPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await financeApi.flexpay();
      setData(response.installmentPlans || []);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load flexpay plans.");
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
          <h1>FlexPay</h1>
          <p className="dashboard-page-copy">Track installment plans and remaining balances.</p>
        </div>
        <button type="button" className="module-button" onClick={load} disabled={loading}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="module-alert module-alert-error">{error}</div>}
      {loading ? (
        <div className="module-empty">Loading installment plans...</div>
      ) : data.length === 0 ? (
        <div className="module-empty">No installment plans found.</div>
      ) : (
        <div className="module-grid">
          {data.map((plan) => {
            const total = plan.totalAmount || 0;
            const paid = plan.paidAmount || 0;
            const remaining = Math.max(total - paid, 0);
            return (
              <article key={plan.id} className="module-card">
                <div className="module-card-title">
                  <Wallet size={18} />
                  <strong>{plan.title || `Plan ${plan.id}`}</strong>
                </div>
                <p>{plan.student?.name || "Student plan"}</p>
                <div className="module-meta">
                  <span><CalendarRange size={14} /> {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "No start date"}</span>
                  <span>{plan.status || "Active"}</span>
                </div>
                <div className="module-values">
                  <div><span>Total</span><strong>{formatCurrency(total)}</strong></div>
                  <div><span>Paid</span><strong>{formatCurrency(paid)}</strong></div>
                  <div><span>Remaining</span><strong>{formatCurrency(remaining)}</strong></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
