import { useEffect, useMemo, useState } from "react";
import { Download, Filter, Plus, RefreshCcw, Search, ReceiptText, Pencil, Trash2, Eye } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import { studentApi } from "../../../../services/studentApi";
import { useToasts } from "../../../../context/ToastContext";
import "../page-styles/PaymentsPage.css";

const emptyForm = {
  studentId: "",
  method: "Cash",
  status: "Paid",
  amount: "",
  paidAt: new Date().toISOString().slice(0, 10),
  note: "",
  reference: "",
  invoiceId: "",
};

const methodOptions = ["Cash", "Bank Transfer", "POS", "Paystack", "Wallet"];
const statusOptions = ["Paid", "Partially Paid", "Pending", "Failed", "Refunded"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value || 0);

export default function PaymentsPage() {
  const { success, error: showError, warning } = useToasts();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [className, setClassName] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [activeModal, setActiveModal] = useState({ type: null, payment: null });
  const [form, setForm] = useState(emptyForm);

  const loadStudents = async () => {
    try {
      const data = await studentApi.list({ limit: 100 });
      setStudents(data.students || []);
    } catch {
      setStudents([]);
    }
  };

  const loadPayments = async (page = pagination.page) => {
    setLoading(true);
    setError("");
    try {
      const data = await financeApi.payments({
        search,
        studentId,
        className,
        method,
        status,
        date,
        page,
        limit: pagination.limit,
      });
      setPayments(data.payments || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message || "Failed to load payments");
      warning("Payments", requestError.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadPayments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setActiveModal({ type: "create", payment: null });
  };

  const openEdit = (payment) => {
    setForm({
      studentId: payment.studentId || "",
      method: payment.method || "Cash",
      status: payment.status || "Paid",
      amount: payment.amount || "",
      paidAt: payment.paidAt ? String(payment.paidAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
      note: payment.note || "",
      reference: payment.reference || "",
      invoiceId: payment.invoiceId || "",
    });
    setActiveModal({ type: "edit", payment });
  };

  const openDetails = (payment) => setActiveModal({ type: "view", payment });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        paidAt: form.paidAt,
      };
      if (activeModal.type === "create") {
        await financeApi.createPayment(payload);
        setMessage("Payment recorded successfully.");
        success("Payment saved", "The payment record was created.");
      } else if (activeModal.type === "edit" && activeModal.payment?.id) {
        await financeApi.updatePayment(activeModal.payment.id, payload);
        setMessage("Payment updated successfully.");
        success("Payment updated", "The payment record was updated.");
      }
      setActiveModal({ type: null, payment: null });
      setForm(emptyForm);
      await loadPayments(1);
    } catch (requestError) {
      setError(requestError.message || "Unable to save payment");
      showError("Payment error", requestError.message || "Unable to save payment");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (payment) => {
    if (!window.confirm(`Delete payment ${payment.reference}?`)) return;
    setError("");
    try {
      await financeApi.deletePayment(payment.id);
      setMessage("Payment deleted successfully.");
      success("Payment deleted", `Reference ${payment.reference} was removed.`);
      await loadPayments(pagination.page);
    } catch (requestError) {
      setError(requestError.message || "Unable to delete payment");
      showError("Delete failed", requestError.message || "Unable to delete payment");
    }
  };

  const clearFilters = async () => {
    setSearch("");
    setStudentId("");
    setClassName("");
    setMethod("");
    setStatus("");
    setDate("");
    await loadPayments(1);
  };

  const recordCount = pagination.total || 0;

  const filteredStudents = useMemo(() => students.filter((student) => !className || student.className === className), [students, className]);

  return (
    <div className="dashboard-page payments-page">
      <section className="payments-header">
        <div>
          <p className="dashboard-page-label">Finance</p>
          <h1>Payments</h1>
          <p className="dashboard-page-copy">View, record, edit, and review student payment transactions in a single fintech-ready workspace.</p>
        </div>
        <div className="payments-header-actions">
          <button type="button" className="payments-action-button tone-blue" onClick={() => loadPayments(pagination.page)} disabled={loading}>
            <RefreshCcw size={18} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button type="button" className="payments-action-button tone-teal" onClick={() => window.print()}>
            <Download size={18} />
            <span>Export</span>
          </button>
          <button type="button" className="payments-action-button" onClick={openCreate}>
            <Plus size={18} />
            <span>Record Payment</span>
          </button>
        </div>
      </section>

      <section className="payments-summary-grid">
        <article className="payments-summary-card">
          <div>
            <span>Total payments</span>
            <strong>{recordCount}</strong>
          </div>
          <ReceiptText size={24} />
        </article>
        <article className="payments-summary-card">
          <div>
            <span>Paid records</span>
            <strong>{payments.filter((payment) => payment.status === "Paid").length}</strong>
          </div>
          <ReceiptText size={24} />
        </article>
        <article className="payments-summary-card">
          <div>
            <span>Pending / Failed</span>
            <strong>{payments.filter((payment) => ["Pending", "Failed"].includes(payment.status)).length}</strong>
          </div>
          <ReceiptText size={24} />
        </article>
      </section>

      {error && <div className="payments-alert payments-alert-error">{error}</div>}
      {message && <div className="payments-alert payments-alert-success">{message}</div>}

      <section className="payments-panel">
        <div className="payments-filters">
          <div className="payments-filter-grid">
            <label className="payments-filter-group">
              <span>Search</span>
              <div className="payments-search-field">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPayments(1)}
                  placeholder="Search reference, note, or student"
                />
              </div>
            </label>
            <label className="payments-filter-group">
              <span>Student</span>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">All students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </label>
            <label className="payments-filter-group">
              <span>Class</span>
              <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Filter by class" />
            </label>
            <label className="payments-filter-group">
              <span>Method</span>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">All methods</option>
                {methodOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="payments-filter-group">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="payments-filter-group">
              <span>Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <div className="payments-filter-actions">
            <button type="button" className="payments-action-button tone-blue" disabled={loading} onClick={() => loadPayments(1)}>
              <Filter size={16} />
              <span>{loading ? "Applying..." : "Apply filters"}</span>
            </button>
            <button type="button" className="payments-action-button" onClick={clearFilters} disabled={loading}>
              Clear
            </button>
            <span className="payments-filter-count">
              Showing {pagination.total} record{pagination.total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="payments-table-panel">
          <div className="payments-table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="payments-empty-copy">Loading payments...</td>
                  </tr>
                ) : payments.length ? (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>{payment.student?.name || "Student"}</strong>
                        <div className="payments-table-note">{payment.student?.className || "No class"}</div>
                      </td>
                      <td>{payment.reference}</td>
                      <td>{payment.method}</td>
                      <td>{payment.status}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{new Date(payment.paidAt).toLocaleDateString()}</td>
                      <td>
                        <div className="payments-table-actions">
                          <button type="button" className="btn-secondary" onClick={() => openDetails(payment)}>
                            <Eye size={14} /> View
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => openEdit(payment)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => remove(payment)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="payments-empty-copy">No payments found for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="payments-pagination">
            <button className="btn-secondary" disabled={pagination.page <= 1 || loading} onClick={() => loadPayments(pagination.page - 1)}>
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="btn-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => loadPayments(pagination.page + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>

      {activeModal.type ? (
        <div className="modal-overlay" onClick={() => setActiveModal({ type: null, payment: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{activeModal.type === "create" ? "Record Payment" : activeModal.type === "edit" ? "Edit Payment" : "Payment Details"}</h2>
              <button type="button" className="modal-close" onClick={() => setActiveModal({ type: null, payment: null })}>×</button>
            </div>

            <div className="modal-body">
              {activeModal.type === "view" && activeModal.payment ? (
                <div className="payments-details-grid">
                  <div className="payments-detail-row">
                    <span>Student</span>
                    <strong>{activeModal.payment.student?.name || "-"}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Reference</span>
                    <strong>{activeModal.payment.reference}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Amount</span>
                    <strong>{formatCurrency(activeModal.payment.amount)}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Status</span>
                    <strong>{activeModal.payment.status}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Method</span>
                    <strong>{activeModal.payment.method}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Paid On</span>
                    <strong>{new Date(activeModal.payment.paidAt).toLocaleString()}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Receipt</span>
                    <strong>{activeModal.payment.receipt?.receiptNumber || "Pending"}</strong>
                  </div>
                  <div className="payments-detail-row">
                    <span>Note</span>
                    <strong>{activeModal.payment.note || "-"}</strong>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="form-grid">
                  <label className="form-group full-width">
                    <span className="form-label">Student</span>
                    <select className="form-select" name="studentId" value={form.studentId} onChange={handleChange}>
                      <option value="">Select a student</option>
                      {filteredStudents.map((student) => (
                        <option key={student.id} value={student.id}>{student.name} - {student.className || "No class"}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-group">
                    <span className="form-label">Method</span>
                    <select className="form-select" name="method" value={form.method} onChange={handleChange}>
                      {methodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="form-group">
                    <span className="form-label">Status</span>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="form-group">
                    <span className="form-label">Amount</span>
                    <input className="form-input" type="number" min="0" step="0.01" name="amount" value={form.amount} onChange={handleChange} />
                  </label>
                  <label className="form-group">
                    <span className="form-label">Paid Date</span>
                    <input className="form-input" type="date" name="paidAt" value={form.paidAt} onChange={handleChange} />
                  </label>
                  <label className="form-group full-width">
                    <span className="form-label">Invoice ID</span>
                    <input className="form-input" name="invoiceId" value={form.invoiceId} onChange={handleChange} placeholder="Optional invoice link" />
                  </label>
                  <label className="form-group full-width">
                    <span className="form-label">Reference</span>
                    <input className="form-input" name="reference" value={form.reference} onChange={handleChange} placeholder="Leave blank to auto-generate" />
                  </label>
                  <label className="form-group full-width">
                    <span className="form-label">Note</span>
                    <textarea className="form-input" name="note" value={form.note} onChange={handleChange} />
                  </label>
                  <div className="form-group full-width form-actions">
                    <button type="button" className="btn-ghost" onClick={() => setActiveModal({ type: null, payment: null })}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Payment"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
