import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/SubjectsPage.css";

const initialForm = {
  name: "",
  code: "",
  category: "",
};

const seedSubjects = [
  "Mathematics",
  "English Language",
  "Basic Science",
  "Civic Education",
  "Computer Studies",
  "Creative Arts",
  "Social Studies",
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedClass, setSelectedClass] = useState({});
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectResponse, classResponse] = await Promise.all([
        academicApi.subjects(),
        academicApi.classes(),
      ]);
      setSubjects(subjectResponse.subjects || []);
      setClasses(classResponse.classes || []);
    } catch (err) {
      setError(err.message || "Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const assignToClass = async (subjectId) => {
    const classId = selectedClass[subjectId];
    if (!classId) return;
    setAssignmentMessage("");
    try {
      await adminApi.assignClassSubject({ classId, subjectId });
      setAssignmentMessage("Subject assigned to class successfully.");
    } catch (err) {
      setError(err.message || "Unable to assign subject to class.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(
    () => ({
      total: subjects.length,
      active: subjects.length,
    }),
    [subjects],
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: String(form.name).trim(),
        code: String(form.code).trim() || undefined,
        category: String(form.category).trim() || undefined,
      };
      if (editingId) {
        await academicApi.updateSubject(editingId, payload);
      } else {
        await academicApi.createSubject(payload);
      }
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "Unable to save subject.");
    } finally {
      setSaving(false);
    }
  };

  const editSubject = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      code: item.code || "",
      category: item.category || "",
    });
  };

  const deleteSubject = async (item) => {
    if (
      !window.confirm(
        `Delete ${item.name}? This will affect schedules and results that use it.`,
      )
    )
      return;
    try {
      await academicApi.deleteSubject(item.id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to remove subject.");
    }
  };

  return (
    <div className="dashboard-home subjects-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Subjects</h1>
          <p>Manage the subject catalog from one DB-backed setup screen.</p>
        </div>
        <button
          className="dashboard-home-summary-action tone-blue"
          onClick={load}
          type="button"
        >
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Total Subjects</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <ClipboardList size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Catalog State</span>
              <strong>Live</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <BookOpen size={18} />
            </div>
          </div>
        </article>
      </section>

      {error ? (
        <div className="students-inline-alert subjects-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}
      {assignmentMessage ? (
        <div className="students-inline-alert subjects-alert">
          {assignmentMessage}
        </div>
      ) : null}

      <section className="dashboard-home-panel subjects-layout">
        <article className="subjects-form-card">
          <div className="subjects-card-title">
            <Plus size={18} />
            <strong>{editingId ? "Edit subject" : "Add new subject"}</strong>
          </div>
          <form onSubmit={submit} className="subjects-form">
            <label>
              <span>Subject name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mathematics"
                required
              />
            </label>
            <label>
              <span>Subject code</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. MTH"
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Core">Core</option>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
                <option value="Commercial">Commercial</option>
                <option value="Vocational">Vocational</option>
              </select>
            </label>
            <div className="subjects-form-actions full-width">
              <button
                type="submit"
                className="dashboard-home-summary-action tone-blue"
                disabled={saving}
              >
                <Save size={14} />
                <span>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Subject"
                      : "Save Subject"}
                </span>
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
          <div className="subjects-seed">
            <BookOpen size={14} />
            <span>Common subjects: {seedSubjects.join(", ")}</span>
          </div>
        </article>

        <article className="subjects-list-card">
          <div className="subjects-card-title">
            <ClipboardList size={18} />
            <strong>Current subjects</strong>
          </div>
          {loading ? (
            <div className="module-empty">Loading subjects...</div>
          ) : subjects.length ? (
            <div className="subjects-list">
              {subjects.map((item) => (
                <div key={item.id} className="subjects-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.code || "No code"}{" "}
                      {item.category ? `• ${item.category}` : ""}
                    </p>
                  </div>
                  <div className="subjects-item-actions">
                    <select
                      value={selectedClass[item.id] || ""}
                      onChange={(event) =>
                        setSelectedClass((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      aria-label={`Assign ${item.name} to a class`}
                    >
                      <option value="">Assign to class</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="subjects-mini-btn"
                      onClick={() => assignToClass(item.id)}
                    >
                      Assign
                    </button>
                    <button
                      type="button"
                      className="subjects-mini-btn"
                      onClick={() => editSubject(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="subjects-mini-btn danger"
                      onClick={() => deleteSubject(item)}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="module-empty">No subjects created yet.</div>
          )}
        </article>
      </section>
    </div>
  );
}
