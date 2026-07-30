import { useEffect, useState } from "react";
import { RefreshCcw, Save, Trash2 } from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import "../page-styles/TimetablePage.css";

const emptyForm = {
  className: "",
  subjectName: "",
  dayOfWeek: "Monday",
  startTime: "08:00",
  endTime: "08:40",
  room: "",
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await academicApi.timetable();
      setTimetable(data.timetable || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load timetable");
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
      await academicApi.createTimetable(form);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Failed to save timetable entry");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this timetable entry?")) return;
    try {
      await academicApi.deleteTimetable(id);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Failed to delete timetable entry");
    }
  };

  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Timetable</h1>
          <p>Create and manage class timetables.</p>
        </div>
        <button className="dashboard-home-summary-action tone-blue" type="button" onClick={load}>
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </section>

      {error ? <div className="students-inline-alert">{error}</div> : null}

      <section className="dashboard-home-panel" style={{ marginBottom: 18 }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <input placeholder="Class name" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
            <input placeholder="Subject name" value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {days.map((day) => <option key={day}>{day}</option>)}
            </select>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <input placeholder="Room (optional)" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
          <button disabled={saving} className="dashboard-home-summary-action tone-blue" type="submit">
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Timetable Entry"}</span>
          </button>
        </form>
      </section>

      <section className="dashboard-home-panel">
        {loading ? (
          <p>Loading timetable...</p>
        ) : timetable.length ? (
          <div className="parent-list">
            {timetable.map((entry) => (
              <div key={entry.id} className="parent-list-item">
                <div>
                  <strong>{entry.className} - {entry.subjectName}</strong>
                  <p>{entry.dayOfWeek} · {entry.startTime} to {entry.endTime}{entry.room ? ` · ${entry.room}` : ""}</p>
                </div>
                <button type="button" onClick={() => remove(entry.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No timetable entries yet.</p>
        )}
      </section>
    </div>
  );
}
