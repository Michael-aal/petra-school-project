import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ArrowUpRight, ArrowDownRight, Plus, X } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import "../page-styles/CashflowPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value || 0);

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export default function CashflowPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ title: "", category: "", amount: "", occurredAt: today(), note: "" });

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

  const expenseCount = useMemo(() => (data?.recentExpenses || []).length, [data]);

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.title.trim()) return setFormError("Expense name is required.");
    if (!form.category.trim()) return setFormError("Expense category is required.");
    if (!form.amount || Number(form.amount) <= 0) return setFormError("Enter an expense amount greater than zero.");
    if (!form.occurredAt) return setFormError("Expense date is required.");

    setSaving(true);
    try {
      await financeApi.createExpense({
        title: form.title.trim(),
        category: form.category.trim(),
        amount: Number(form.amount),
        occurredAt: form.occurredAt,
        note: form.note.trim() || null,
      });
      setForm({ title: "", category: "", amount: "", occurredAt: today(), note: "" });
      setShowExpenseForm(false);
      await load();
    } catch (err) {
      setFormError(err.data?.message || err.message || "Unable to record expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page finance-module-page">
      <div className="module-header">
        <div>
          <p className="dashboard-page-label">Finance</p>
          <h1>Cashflow & Expenses</h1>
          <p className="dashboard-page-copy">Track money coming into the school and every expense going out.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="module-button" onClick={() => setShowExpenseForm((value) => !value)}>
            {showExpenseForm ? <X size={16} /> : <Plus size={16} />}
            {showExpenseForm ? "Close" : "Add Expense"}
          </button>
          <button type="button" className="module-button" onClick={load} disabled={loading || saving}>
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="module-alert module-alert-error">{error}</div>}

      {showExpenseForm && (
        <section className="finance-cashflow-panel" style={{ marginBottom: 16 }}>
          <h3>Record School Expense</h3>
          <p className="dashboard-page-copy">Record what the school spent, why it was spent, and when it happened.</p>
          {formError && <div className="module-alert module-alert-error">{formError}</div>}
          <form onSubmit={handleExpenseSubmit} style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              <span>Expense name *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Generator Fuel" required />
            </label>
            <label>
              <span>Category *</span>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Utilities" required />
            </label>
            <label>
              <span>Amount (NGN) *</span>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="85000" required />
            </label>
            <label>
              <span>Date *</span>
              <input type="date" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} required />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span>Purpose / description</span>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Explain what the money was used for" rows="3" />
            </label>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="module-button" disabled={saving}>{saving ? "Saving..." : "Save Expense"}</button>
            </div>
          </form>
        </section>
      )}

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
            <article><span>Recorded Expenses</span><strong>{expenseCount}</strong></article>
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
                        <strong>{item.title || item.id}</strong>
                        <p>{item.expenseCategory?.name || "Uncategorized"}{item.note ? ` • ${item.note}` : ""}</p>
                      </div>
                      <span className="finance-cashflow-amount finance-cashflow-amount-negative"><ArrowDownRight size={14} /> {formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="finance-cashflow-panel">
            <h3>Expense Breakdown</h3>
            {(data?.expensesByCategory || []).length === 0 ? (
              <div className="module-empty">No expense categories recorded yet.</div>
            ) : (
              <div className="finance-cashflow-list">
                {data.expensesByCategory.map((item) => (
                  <div key={item.categoryId || item.category} className="finance-cashflow-item">
                    <div><strong>{item.category}</strong><p>School expenditure</p></div>
                    <strong>{formatCurrency(item.amount)}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
