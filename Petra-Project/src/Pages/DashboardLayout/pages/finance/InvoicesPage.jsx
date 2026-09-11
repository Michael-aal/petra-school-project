import { useEffect, useState } from "react";
import { RefreshCcw, FileText, CalendarDays, ReceiptText } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import "../page-styles/InvoicesPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value || 0);

export default function InvoicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await financeApi.invoices();
      setData(response.invoices || []);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load invoices.");
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
          <h1>Invoices</h1>
          <p className="dashboard-page-copy">Review invoice totals, balances, and payment history.</p>
        </div>
        <button type="button" className="module-button" onClick={load} disabled={loading}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="module-alert module-alert-error">{error}</div>}
      {loading ? (
        <div className="module-empty">Loading invoices...</div>
      ) : data.length === 0 ? (
        <div className="module-empty">No invoices found.</div>
      ) : (
        <div className="module-grid">
          {data.map((invoice) => (
            <article key={invoice.id} className="module-card">
              <div className="module-card-title">
                <FileText size={18} />
                <strong>{invoice.invoiceNumber || invoice.id}</strong>
              </div>
              <p>{invoice.student?.name || "Unknown student"}</p>
              <div className="module-meta">
                <span><CalendarDays size={14} /> Due {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</span>
                <span><ReceiptText size={14} /> {invoice.status || "Unpaid"}</span>
              </div>
              <div className="module-values">
                <div><span>Total</span><strong>{formatCurrency(invoice.totalAmount || invoice.amount)}</strong></div>
                <div><span>Paid</span><strong>{formatCurrency(invoice.amountPaid || 0)}</strong></div>
                <div><span>Balance</span><strong>{formatCurrency(invoice.balance || 0)}</strong></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
