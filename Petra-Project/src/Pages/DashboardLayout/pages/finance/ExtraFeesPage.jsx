import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { financeApi } from "../../../../services/financeApi";
import "../page-styles/ExtraFeesPage.css";

const emptyForm = {
  feeCategoryId: "",
  className: "",
  session: "",
  term: "",
  amount: "",
  dueDate: "",
  isActive: true,
};

export default function ExtraFeesPage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [assignment, setAssignment] = useState({ feeStructureId: "", level: "", className: "", studentId: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await financeApi.fees();
      setFees(response.feeStructures || []);
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to load fee structures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeCount = useMemo(() => fees.filter((fee) => fee.isActive !== false).length, [fees]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        dueDate: form.dueDate || null,
        isActive: Boolean(form.isActive),
      };
      if (editingId) await financeApi.updateFee(editingId, payload);
      else await financeApi.createFee(payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to save fee structure.");
    } finally {
      setSaving(false);
    }
  };

  const editFee = (fee) => {
    setEditingId(fee.id);
    setForm({
      feeCategoryId: fee.feeCategoryId || "",
      className: fee.className || "",
      session: fee.session || "",
      term: fee.term || "",
      amount: fee.amount || "",
      dueDate: fee.dueDate ? String(fee.dueDate).slice(0, 10) : "",
      isActive: fee.isActive !== false,
    });
  };

  const toggleFee = async (fee) => {
    try {
      await financeApi.updateFee(fee.id, { isActive: !(fee.isActive !== false) });
      await load();
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to update fee status.");
    }
  };

  const removeFee = async (fee) => {
    if (!window.confirm(`Delete ${fee.className || "this fee"}?`)) return;
    try {
      await financeApi.deleteFee(fee.id);
      await load();
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to delete fee.");
    }
  };

  const assignFee = async (event) => {
    event.preventDefault();
    if (!assignment.feeStructureId) return;
    try {
      await financeApi.assignFee(assignment);
      setAssignment({ feeStructureId: "", level: "", className: "", studentId: "" });
      await load();
    } catch (err) {
      setError(err.data?.message || err.message || "Unable to assign fee.");
    }
  };

  return (
    <div className="dashboard-page finance-module-page extrafees-page">
      <div className="module-header">
        <div>
          <p className="dashboard-page-label">Finance</p>
          <h1>School Fees Management</h1>
          <p className="dashboard-page-copy">Create fee structures, activate or deactivate them, and assign them to levels, classes, or individual students.</p>
        </div>
        <button type="button" className="module-button" onClick={load} disabled={loading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error ? <div className="module-alert module-alert-error">{error}</div> : null}

      <section className="module-grid">
        <article className="module-card">
          <div className="module-card-title"><Plus size={18} /><strong>{editingId ? "Edit fee structure" : "Create fee structure"}</strong></div>
          <form className="fees-form" onSubmit={submit}>
            <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="Class name or scope" />
            <input value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} placeholder="Session" />
            <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="Term" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" type="number" min="0" />
            <input value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} type="date" />
            <label className="fees-switch"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            <div className="fees-actions">
              <button type="submit" className="module-button" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Fee" : "Create Fee"}</button>
              {editingId ? <button type="button" className="module-button ghost" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button> : null}
            </div>
          </form>
        </article>

        <article className="module-card">
          <div className="module-card-title"><CheckCircle2 size={18} /><strong>Assign fee</strong></div>
          <form className="fees-form" onSubmit={assignFee}>
            <select value={assignment.feeStructureId} onChange={(e) => setAssignment({ ...assignment, feeStructureId: e.target.value })}>
              <option value="">Select fee structure</option>
              {fees.map((fee) => <option key={fee.id} value={fee.id}>{fee.className || fee.feeCategory?.name || "Fee"}</option>)}
            </select>
            <input value={assignment.level} onChange={(e) => setAssignment({ ...assignment, level: e.target.value })} placeholder="Level: Nursery, Primary, JSS, SSS" />
            <input value={assignment.className} onChange={(e) => setAssignment({ ...assignment, className: e.target.value })} placeholder="Class name" />
            <input value={assignment.studentId} onChange={(e) => setAssignment({ ...assignment, studentId: e.target.value })} placeholder="Student reference" />
            <button type="submit" className="module-button">Assign</button>
          </form>
        </article>
      </section>

      <div className="module-summary-strip">
        <span>Total fee structures: {fees.length}</span>
        <span>Active: {activeCount}</span>
        <span>Inactive: {fees.length - activeCount}</span>
      </div>

      {loading ? (
        <div className="module-empty">Loading fee structures...</div>
      ) : fees.length === 0 ? (
        <div className="module-empty">No fee structures found.</div>
      ) : (
        <div className="module-grid">
          {fees.map((fee) => (
            <article key={fee.id} className="module-card fee-item">
              <div className="module-card-title">
                <strong>{fee.feeCategory?.name || fee.className || "School fee"}</strong>
                <span>{fee.isActive === false ? "Inactive" : "Active"}</span>
              </div>
              <p>{fee.session || "Any session"} {fee.term ? `• ${fee.term}` : ""}</p>
              <div className="module-meta">
                <span>{fee.className || "All classes"}</span>
                <span>{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(fee.amount || 0))}</span>
              </div>
              <div className="fees-actions">
                <button type="button" className="module-button ghost" onClick={() => editFee(fee)}><Edit3 size={14} /> Edit</button>
                <button type="button" className="module-button ghost" onClick={() => toggleFee(fee)}>{fee.isActive === false ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}{fee.isActive === false ? "Activate" : "Deactivate"}</button>
                <button type="button" className="module-button ghost danger" onClick={() => removeFee(fee)}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
