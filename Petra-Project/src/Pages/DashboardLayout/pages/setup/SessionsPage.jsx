import { useEffect, useState } from "react";
import { RefreshCcw, Save, Trash2 } from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import "../page-styles/SessionsPage.css";

const emptyForm = { name: "", term: "First Term", startsAt: "", endsAt: "", isActive: false };

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await academicApi.sessions();
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await academicApi.createSession(form);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e.message || "Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    await academicApi.deleteSession(id);
    await load();
  };

  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Academic Session</h1>
          <p>Set and manage academic terms and sessions.</p>
        </div>
        <button className="dashboard-home-summary-action tone-blue" onClick={load} type="button">
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </section>

      {error ? <div className="students-inline-alert">{error}</div> : null}

      <section className="dashboard-home-panel">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Session name e.g. 2025/2026"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
            <option>First Term</option>
            <option>Second Term</option>
            <option>Third Term</option>
          </select>
          <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active session
          </label>
          <button disabled={saving} className="dashboard-home-summary-action tone-blue" type="submit">
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Session"}</span>
          </button>
        </form>
      </section>

      <section className="dashboard-home-panel">
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length ? (
          sessions.map((session) => (
            <div key={session.id} className="parent-list-item">
              <div>
                <strong>{session.name}</strong>
                <p>
                  {session.term} · {new Date(session.startsAt).toLocaleDateString()} to{" "}
                  {new Date(session.endsAt).toLocaleDateString()}
                </p>
              </div>
              <button type="button" onClick={() => remove(session.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <p>No sessions yet.</p>
        )}
      </section>
    </div>
  );
}
