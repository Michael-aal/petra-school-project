import { useEffect, useState } from "react";
import { Bell, Plus, Search, Sparkles, Clock, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/AnnouncementsPage.css";

const audienceOptions = [
  { value: "TEACHERS_AND_PARENTS", label: "All staff & parents" },
  { value: "TEACHERS", label: "Teachers only" },
  { value: "PARENTS", label: "Parents only" },
];

const priorityOptions = [
  { value: "NORMAL", label: "Normal" },
  { value: "IMPORTANT", label: "Important" },
  { value: "URGENT", label: "Urgent" },
];

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "TEACHERS_AND_PARENTS",
    priority: "NORMAL",
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.announcements();
      setAnnouncements(response.announcements || []);
    } catch (err) {
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await adminApi.createAnnouncement({
        title: form.title,
        body: form.body,
        audience: form.audience,
        priority: form.priority,
      });
      setForm({ title: "", body: "", audience: "TEACHERS_AND_PARENTS", priority: "NORMAL" });
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to send announcement.");
    } finally {
      setSaving(false);
    }
  };

  const filteredAnnouncements = announcements.filter((item) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return [item.title, item.body, item.audience, item.priority].some((value) =>
      String(value || "").toLowerCase().includes(needle),
    );
  });

  return (
    <div className="announcements-page dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Announcements</h1>
          <p>Publish school updates, events, and reminders to staff and parents.</p>
        </div>
        <div className="dashboard-home-session-pill">Communication hub</div>
      </section>

      <section className="dashboard-home-summary announcements-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Total announcements</span>
              <strong>{announcements.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Bell size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Visible today</span>
              <strong>{announcements.filter((item) => !item.isDraft).length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <Clock size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Urgent notices</span>
              <strong>{announcements.filter((item) => item.priority === "URGENT").length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-rose">
              <AlertTriangle size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-grid announcements-grid">
        <article className="dashboard-home-panel announcements-panel announcements-form-panel">
          <div className="announcements-panel-header">
            <div>
              <h2>Create announcement</h2>
              <p>Send a new announcement to teachers, parents, or both groups.</p>
            </div>
            <div className="announcement-badge">
              <Sparkles size={16} />
              <span>New release</span>
            </div>
          </div>

          <form className="announcement-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Announcement title"
              />
            </label>
            <label>
              Body
              <textarea
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="Write the announcement details here"
                rows={5}
              />
            </label>
            <div className="announcement-form-row">
              <label>
                Audience
                <select
                  value={form.audience}
                  onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
                >
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {error ? <div className="announcement-error">{error}</div> : null}
            <button type="submit" className="dashboard-home-summary-action tone-blue" disabled={saving}>
              <Send size={14} />
              <span>{saving ? "Publishing..." : "Publish announcement"}</span>
            </button>
          </form>
        </article>

        <article className="dashboard-home-panel announcements-panel announcements-list-panel">
          <div className="announcements-panel-header">
            <div>
              <h2>Recent announcements</h2>
              <p>Review and search announcements published across your school.</p>
            </div>
            <div className="search-field">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search announcements"
              />
            </div>
          </div>

          {loading ? (
            <div className="module-empty">Loading announcements...</div>
          ) : filteredAnnouncements.length ? (
            <div className="announcement-list">
              {filteredAnnouncements.map((announcement) => (
                <article key={announcement.id} className="announcement-card">
                  <div className="announcement-card-header">
                    <h3>{announcement.title}</h3>
                    <span className={`announcement-tag tag-${announcement.priority.toLowerCase()}`}>
                      {announcement.priority.toLowerCase()}
                    </span>
                  </div>
                  <p>{announcement.body}</p>
                  <div className="announcement-card-meta">
                    <span>{announcement.audience.replace(/_/g, " ")}</span>
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="module-empty">No announcements match your search.</div>
          )}
        </article>
      </section>
    </div>
  );
}
