import { useEffect, useState } from "react";
import { RefreshCcw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import "../page-styles/CashflowPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value || 0);

export default function CashflowPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await financeApi.cashflow();
      setData(response);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load cashflow data.");
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
          <h1>Cashflow</h1>
          <p className="dashboard-page-copy">Review revenue, expenses, and current financial performance.</p>
        </div>
        <button type="button" className="module-button" onClick={load} disabled={loading}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="module-alert module-alert-error">{error}</div>}
      {loading ? (
        <div className="module-empty">Loading cashflow analytics...</div>
      ) : (
        <>
          <div className="finance-cashflow-summary">
            <article><span>Total Revenue</span><strong>{formatCurrency(data?.totalRevenue)}</strong></article>
            <article><span>Total Expenses</span><strong>{formatCurrency(data?.totalExpenses)}</strong></article>
            <article><span>Net Income</span><strong>{formatCurrency(data?.netIncome)}</strong></article>
            <article><span>Outstanding Fees</span><strong>{formatCurrency(data?.outstandingFees)}</strong></article>
            <article><span>Revenue Today</span><strong>{formatCurrency(data?.revenueToday)}</strong></article>
            <article><span>This Month</span><strong>{formatCurrency(data?.revenueThisMonth)}</strong></article>
          </div>

          <div className="finance-cashflow-grid">
            <section className="finance-cashflow-panel">
              <h3>Recent Transactions</h3>
              {(data?.recentTransactions || []).length === 0 ? (
                <div className="module-empty">No recent transactions.</div>
              ) : (
                <div className="finance-cashflow-list">
                  {(data?.recentTransactions || []).map((item) => (
                    <div key={item.id} className="finance-cashflow-item">
                      <div>
                        <strong>{item.student?.name || item.reference || item.id}</strong>
                        <p>{item.method || "Payment"}</p>
                      </div>
                      <span className="finance-cashflow-amount"><ArrowUpRight size={14} /> {formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="finance-cashflow-panel">
              <h3>Recent Expenses</h3>
              {(data?.recentExpenses || []).length === 0 ? (
                <div className="module-empty">No expenses recorded.</div>
              ) : (
                <div className="finance-cashflow-list">
                  {(data?.recentExpenses || []).map((item) => (
                    <div key={item.id} className="finance-cashflow-item">
                      <div>
                        <strong>{item.title || item.category?.name || item.id}</strong>
                        <p>{item.category?.name || "Expense"}</p>
                      </div>
                      <span className="finance-cashflow-amount finance-cashflow-amount-negative"><ArrowDownRight size={14} /> {formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="finance-cashflow-panel">
            <h3>Chart Data</h3>
            <div className="module-empty">
              {data?.monthlyRevenue?.length ? `Monthly analytics available for ${data.monthlyRevenue.length} periods.` : "No chart data yet."}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
