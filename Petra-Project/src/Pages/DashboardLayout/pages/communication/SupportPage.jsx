import "../page-styles/SupportPage.css";
import { useContext, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, LifeBuoy, MessageSquare, Send } from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { supportApi } from "../../../../services/supportApi";

const statuses = ["Open", "In Progress", "Resolved", "Closed"];
const categories = ["General", "Technical", "Billing", "Feature", "Account", "Other"];
const priorities = ["Low", "Medium", "High", "Urgent"];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function SupportPage() {
  const { userInfo } = useContext(UserContext);
  const isPlatform = ["super_admin", "developer"].includes(String(userInfo?.role || "").toLowerCase().replace(/\s+/g, "_"));
  const isSchoolAdmin = ["admin", "principal"].includes(String(userInfo?.role || "").toLowerCase());
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ subject: "", category: "General", priority: "Medium", description: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await supportApi.list({ limit: 50 });
      setTickets(response.data?.tickets || []);
    } catch (e) { setError(e.data?.message || e.message || "Unable to load support tickets"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (id) => {
    try {
      const response = await supportApi.get(id);
      setSelected(response.data);
    } catch (e) { setError(e.data?.message || e.message || "Unable to open ticket"); }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await supportApi.create(form);
      setForm({ subject: "", category: "General", priority: "Medium", description: "" });
      await load();
    } catch (e) { setError(e.data?.message || e.message || "Unable to submit ticket"); }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected?.ticket?.id || !reply.trim()) return;
    try {
      const response = await supportApi.reply(selected.ticket.id, { body: reply.trim() });
      setSelected(response.data); setReply(""); await load();
    } catch (e) { setError(e.data?.message || e.message || "Unable to send reply"); }
  };

  const update = async (payload) => {
    if (!selected?.ticket?.id) return;
    try {
      const response = await supportApi.update(selected.ticket.id, payload);
      setSelected(response.data); await load();
    } catch (e) { setError(e.data?.message || e.message || "Unable to update ticket"); }
  };

  return (
    <div className="support-page">
      <div className="support-header">
        <div className="support-header-left">
          <div className="support-icon-box"><LifeBuoy size={24} /></div>
          <div>
            <h2>{isPlatform ? "Support Center" : "Help & Support"}</h2>
            <p>{isPlatform ? "Platform-wide support requests from schools, staff and parents." : "Report a problem or ask the Petra support team for help."}</p>
          </div>
        </div>
      </div>

      {error ? <div className="success-banner"><AlertCircle size={16} /> {error}</div> : null}

      {!isPlatform && (
        <section className="support-card">
          <div className="card-header"><h3><MessageSquare size={18} /> Submit a Support Ticket</h3></div>
          <form className="ticket-form" onSubmit={submit}>
            <div className="form-row">
              <div className="form-group"><label>Subject</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What do you need help with?" required /></div>
              <div className="form-group"><label>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((x) => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorities.map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="form-group" style={{ flex: 2 }}><label>Describe the issue</label><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Include the page, action and what went wrong..." required /></div>
            </div>
            <button type="submit" className="submit-ticket-btn"><Send size={16} /> Submit Ticket</button>
          </form>
        </section>
      )}

      <div className="support-grid">
        <section className="support-card tickets-card">
          <div className="card-header"><h3><Clock size={18} /> {isPlatform ? "All Platform Tickets" : "My Support Requests"}</h3></div>
          {loading ? <p>Loading tickets…</p> : tickets.length === 0 ? <div className="empty-tickets"><HelpCircle size={20} /><p>No support tickets yet.</p></div> : (
            <div className="tickets-list">
              {tickets.map((ticket) => (
                <button key={ticket.id} type="button" className="ticket-item" onClick={() => openTicket(ticket.id)}>
                  <div className="ticket-top"><span className="ticket-subject">{ticket.subject}</span><span>{ticket.status}</span></div>
                  <div className="ticket-bottom"><span className="ticket-meta">{ticket.category} • {ticket.priority}{isPlatform && ticket.createdBy ? ` • ${ticket.createdBy.fullName}` : ""}</span><span className="ticket-date">{formatDate(ticket.updatedAt)}</span></div>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <section className="support-card">
            <div className="card-header">
              <div><h3>{selected.ticket.subject}</h3><p>{selected.ticket.category} • {selected.ticket.priority} • {selected.ticket.status}</p></div>
              {isPlatform || isSchoolAdmin ? <div style={{ display: "flex", gap: 8 }}><select value={selected.ticket.status} onChange={(e) => update({ status: e.target.value })}>{statuses.map((x) => <option key={x}>{x}</option>)}</select><select value={selected.ticket.priority} onChange={(e) => update({ priority: e.target.value })}>{priorities.map((x) => <option key={x}>{x}</option>)}</select></div> : null}
            </div>
            <p><strong>{selected.ticket.createdBy?.fullName || "User"}</strong>{selected.ticket.createdBy?.email ? ` • ${selected.ticket.createdBy.email}` : ""}</p>
            <p>{selected.ticket.description}</p>
            <div className="tickets-list">
              {(selected.messages || []).map((message) => <div key={message.id} className="ticket-item"><strong>{message.authorName || "User"}</strong><p>{message.body}</p><small>{formatDate(message.createdAt)}{message.isInternal ? " • Internal note" : ""}</small></div>)}
            </div>
            <form className="ticket-form" onSubmit={sendReply}>
              <div className="form-group"><label>{isPlatform ? "Developer response" : "Reply"}</label><textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a response..." required /></div>
              <button type="submit" className="submit-ticket-btn"><Send size={16} /> Send Reply</button>
            </form>
          </section>
        )}
      </div>

      {isPlatform && <div className="success-banner"><CheckCircle2 size={16} /> AI support is intentionally not enabled yet. Developers remain in control of escalation and responses.</div>}
    </div>
  );
}
