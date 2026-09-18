import "../page-styles/SupportPage.css";
import { useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, LifeBuoy, MessageSquare, Search, Send, UserRound } from "lucide-react";
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

const normalizeRole = (role) => String(role || "").trim().toLowerCase().replace(/\s+/g, "_");
const isPlatformRole = (role) => ["super_admin", "superadmin", "developer"].includes(normalizeRole(role));

const requesterGroup = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "parent") return "Parents";
  if (["staff", "teacher", "non_teaching_staff"].includes(normalized)) return "Staff";
  if (["admin", "principal", "school_admin"].includes(normalized)) return "Admins";
  return "Staff";
};

const groupTickets = (tickets) => ({
  Parents: tickets.filter((ticket) => requesterGroup(ticket.createdBy?.role) === "Parents"),
  Staff: tickets.filter((ticket) => requesterGroup(ticket.createdBy?.role) === "Staff"),
  Admins: tickets.filter((ticket) => requesterGroup(ticket.createdBy?.role) === "Admins"),
});

const statusClass = (status) => `support-status support-status-${normalizeRole(status)}`;
const priorityClass = (priority) => `support-priority support-priority-${normalizeRole(priority)}`;

export default function SupportPage() {
  const { userInfo } = useContext(UserContext);
  const isPlatform = isPlatformRole(userInfo?.role);
  const isSchoolAdmin = ["admin", "principal"].includes(normalizeRole(userInfo?.role));
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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
      setError("");
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

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return [ticket.subject, ticket.category, ticket.createdBy?.fullName, ticket.createdBy?.email, ticket.createdBy?.role]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
    });
  }, [tickets, search, statusFilter]);

  const groupedTickets = useMemo(() => groupTickets(filteredTickets), [filteredTickets]);

  const renderTicket = (ticket) => (
    <button key={ticket.id} type="button" className={`ticket-item support-requester-item ${selected?.ticket?.id === ticket.id ? "is-selected" : ""}`} onClick={() => openTicket(ticket.id)}>
      <div className="ticket-person-row">
        <div className="support-person-avatar">{String(ticket.createdBy?.fullName || "U").trim().charAt(0).toUpperCase()}</div>
        <div className="support-person-info">
          <strong>{ticket.createdBy?.fullName || "Unknown user"}</strong>
          <span>{ticket.createdBy?.role || "User"}{ticket.createdBy?.email ? ` • ${ticket.createdBy.email}` : ""}</span>
        </div>
        <span className={statusClass(ticket.status)}>{ticket.status}</span>
      </div>
      <div className="ticket-subject-line">{ticket.subject}</div>
      <div className="ticket-bottom"><span>{ticket.category} · <span className={priorityClass(ticket.priority)}>{ticket.priority}</span></span><span>{formatDate(ticket.updatedAt)}</span></div>
    </button>
  );

  const renderGroup = (label, items) => (
    <section className="support-role-group" key={label}>
      <div className="support-role-heading"><div><h4>{label}</h4><span>{items.length} request{items.length === 1 ? "" : "s"}</span></div></div>
      {items.length ? <div className="tickets-list">{items.map(renderTicket)}</div> : <div className="support-role-empty">No {label.toLowerCase()} support requests.</div>}
    </section>
  );

  return (
    <div className="support-page">
      <div className="support-header">
        <div className="support-header-left">
          <div className="support-icon-box"><LifeBuoy size={23} /></div>
          <div><h2>{isPlatform ? "Support Center" : "Help & Support"}</h2><p>{isPlatform ? "Review requests, talk to users, and manage support cases in one place." : "Report a problem or ask the Nuvora support team for help."}</p></div>
        </div>
        {isPlatform && <div className="support-header-note"><UserRound size={16} /> Human support</div>}
      </div>

      {error ? <div className="support-alert"><AlertCircle size={17} /> <span>{error}</span></div> : null}

      {!isPlatform && (
        <section className="support-card submit-card">
          <div className="card-header"><div><h3><MessageSquare size={18} /> Submit a Support Ticket</h3><p>Tell the support team what happened and where it happened.</p></div></div>
          <form className="ticket-form" onSubmit={submit}>
            <div className="form-row"><div className="form-group"><label>Subject</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. I cannot open my results" required /></div><div className="form-group"><label>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((x) => <option key={x}>{x}</option>)}</select></div></div>
            <div className="form-row"><div className="form-group"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorities.map((x) => <option key={x}>{x}</option>)}</select></div><div className="form-group" style={{ flex: 2 }}><label>Describe the issue</label><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Include the page, action you took, and what went wrong..." required /></div></div>
            <button type="submit" className="submit-ticket-btn"><Send size={16} /> Submit Ticket</button>
          </form>
        </section>
      )}

      <div className={`support-workspace ${isPlatform ? "developer-workspace" : ""}`}>
        <section className="support-card inbox-card">
          <div className="inbox-header">
            <div><h3><Clock size={18} /> {isPlatform ? "Support Inbox" : "My Support Requests"}</h3><span>{filteredTickets.length} of {tickets.length} request{tickets.length === 1 ? "" : "s"}</span></div>
            <button type="button" className="refresh-support-btn" onClick={load} title="Refresh">↻</button>
          </div>
          <div className="support-filters">
            <div className="support-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isPlatform ? "Search people or requests..." : "Search requests..."} /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"><option>All</option>{statuses.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          {loading ? <div className="support-loading">Loading support requests…</div> : filteredTickets.length === 0 ? <div className="empty-tickets"><HelpCircle size={24} /><strong>{tickets.length ? "No matching requests" : "No support tickets yet"}</strong><p>{tickets.length ? "Try another search or status filter." : "New requests will appear here."}</p></div> : isPlatform ? <div className="support-role-groups">{renderGroup("Parents", groupedTickets.Parents)}{renderGroup("Staff", groupedTickets.Staff)}{renderGroup("Admins", groupedTickets.Admins)}</div> : <div className="tickets-list">{filteredTickets.map(renderTicket)}</div>}
        </section>

        <section className="support-card conversation-card">
          {!selected ? (
            <div className="conversation-empty"><div className="conversation-empty-icon"><MessageSquare size={26} /></div><h3>Select a support request</h3><p>Choose a request from the inbox to read the conversation and reply.</p></div>
          ) : (
            <>
              <div className="conversation-header">
                <div className="conversation-title"><div className="support-person-avatar large">{String(selected.ticket.createdBy?.fullName || "U").trim().charAt(0).toUpperCase()}</div><div><div className="conversation-kicker">{selected.ticket.createdBy?.role || "User"} · {selected.ticket.category}</div><h3>{selected.ticket.subject}</h3><p>{selected.ticket.createdBy?.fullName || "User"}{selected.ticket.createdBy?.email ? ` · ${selected.ticket.createdBy.email}` : ""}</p></div></div>
                <div className="conversation-controls">{isPlatform || isSchoolAdmin ? <><select value={selected.ticket.status} onChange={(e) => update({ status: e.target.value })} aria-label="Ticket status">{statuses.map((x) => <option key={x}>{x}</option>)}</select><select value={selected.ticket.priority} onChange={(e) => update({ priority: e.target.value })} aria-label="Ticket priority">{priorities.map((x) => <option key={x}>{x}</option>)}</select></> : <span className={statusClass(selected.ticket.status)}>{selected.ticket.status}</span>}</div>
              </div>
              <div className="conversation-body"><div className="original-request"><span className="message-label">Original request</span><p>{selected.ticket.description}</p><small>Submitted {formatDate(selected.ticket.createdAt)}</small></div>{(selected.messages || []).map((message) => <div key={message.id} className={`conversation-message ${message.isInternal ? "internal-message" : ""}`}><div className="message-meta"><strong>{message.authorName || "User"}</strong><span>{message.authorRole || ""} · {formatDate(message.createdAt)}</span></div><p>{message.body}</p>{message.isInternal && <small>Internal note</small>}</div>)}</div>
              <form className="reply-box" onSubmit={sendReply}><textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={isPlatform ? "Write a clear response to this user..." : "Write a reply..."} required /><div className="reply-actions"><span>Replies are saved to this support conversation.</span><button type="submit" className="submit-ticket-btn"><Send size={16} /> Send Reply</button></div></form>
            </>
          )}
        </section>
      </div>

      {isPlatform && <div className="support-footer-note"><CheckCircle2 size={16} /> Support is handled by the Nuvora team. Each request stays attached to the person who submitted it.</div>}
    </div>
  );
}
