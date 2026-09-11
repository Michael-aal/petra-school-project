import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, CalendarDays, Plus, RefreshCcw, Save, Trash2, Users } from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import "../page-styles/ClassesPage.css";

const initialForm = {
  name: "",
  level: "",
  capacity: "",
  teacherName: "",
};

const seedNames = ["Creche", "Kindergarten", "Nursery 1", "Nursery 2", "KG 1", "KG 2", "Basic 1", "Basic 2", "Basic 3", "JSS 1", "JSS 2", "JSS 3"];

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await academicApi.classes();
      setClasses(response.classes || []);
    } catch (err) {
      setError(err.message || "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: classes.length,
      grouped: classes.filter((item) => item.level || item.name).length,
    };
  }, [classes]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: String(form.name).trim(),
        level: String(form.level).trim() || undefined,
        capacity: form.capacity === "" ? undefined : Number(form.capacity),
        teacherName: String(form.teacherName).trim() || undefined,
      };
      if (editingId) {
        await academicApi.updateClass(editingId, payload);
      } else {
        await academicApi.createClass(payload);
      }
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "Unable to save class.");
    } finally {
      setSaving(false);
    }
  };

  const editClass = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      level: item.level || "",
      capacity: item.capacity ?? "",
      teacherName: item.teacherName || "",
    });
  };

  const deleteClass = async (item) => {
    if (!window.confirm(`Delete ${item.name}? This will affect dashboards that use this class.`)) return;
    try {
      await academicApi.deleteClass(item.id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to remove class.");
    }
  };

  return (
    <div className="dashboard-home classes-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Classes</h1>
          <p>Create, edit, and remove school classes so the rest of the dashboards stay in sync.</p>
        </div>
        <button className="dashboard-home-summary-action tone-blue" onClick={load} type="button">
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Total Classes</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Users size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Configured Levels</span>
              <strong>{summary.grouped}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <BookOpen size={18} />
            </div>
          </div>
        </article>
      </section>

      {error ? (
        <div className="students-inline-alert classes-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="dashboard-home-panel classes-layout">
        <article className="classes-form-card">
          <div className="classes-card-title">
            <Plus size={18} />
            <strong>{editingId ? "Edit class" : "Add new class"}</strong>
          </div>
          <form onSubmit={submit} className="classes-form">
            <label>
              <span>Class name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basic 1" required />
            </label>
            <label>
              <span>Level</span>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="">Select level</option>
                <option value="Creche">Creche</option>
                <option value="Kindergarten">Kindergarten</option>
                <option value="Nursery">Nursery</option>
                <option value="KG">KG</option>
                <option value="Primary">Primary</option>
                <option value="JSS">JSS</option>
                <option value="SSS">SSS</option>
              </select>
            </label>
            <label>
              <span>Capacity</span>
              <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} type="number" min="0" placeholder="Optional" />
            </label>
            <label className="full-width">
              <span>Class teacher</span>
              <input value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} placeholder="Optional" />
            </label>
            <div className="classes-form-actions full-width">
              <button type="submit" className="dashboard-home-summary-action tone-blue" disabled={saving}>
                <Save size={14} />
                <span>{saving ? "Saving..." : editingId ? "Update Class" : "Save Class"}</span>
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="dashboard-home-summary-action tone-rose"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <div className="classes-seed">
            <CalendarDays size={14} />
            <span>Common examples: {seedNames.join(", ")}</span>
          </div>
        </article>

        <article className="classes-list-card">
          <div className="classes-card-title">
            <BookOpen size={18} />
            <strong>Current classes</strong>
          </div>
          {loading ? (
            <div className="module-empty">Loading classes...</div>
          ) : classes.length ? (
            <div className="classes-list">
              {classes.map((item) => (
                <div key={item.id} className="classes-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.level || "No level"} {item.capacity ? `• Capacity ${item.capacity}` : ""} {item.teacherName ? `• ${item.teacherName}` : ""}
                    </p>
                  </div>
                  <div className="classes-item-actions">
                    <button type="button" className="classes-mini-btn" onClick={() => editClass(item)}>
                      Edit
                    </button>
                    <button type="button" className="classes-mini-btn danger" onClick={() => deleteClass(item)}>
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="module-empty">No classes created yet.</div>
          )}
        </article>
      </section>
    </div>
  );
}
