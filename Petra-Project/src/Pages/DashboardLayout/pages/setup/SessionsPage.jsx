<<<<<<< HEAD
import '../page-styles/SessionsPage.css';
 import { CalendarDays, CheckCircle2, Clock, AlertCircle, Eye, Trash2, Edit } from "lucide-react";
 import GenericListPage from "../../GenericListPage/GenericListPage" // Adjust path as needed
 
 // 1. Initial Mock Data
 const initialSessions = [
   { id: 1, sessionName: "2023/2024", term: "Third Term", startDate: "2024-01-08", endDate: "2024-04-12", status: "Completed" },
   { id: 2, sessionName: "2024/2025", term: "First Term", startDate: "2024-09-09", endDate: "2024-12-20", status: "Completed" },
   { id: 3, sessionName: "2024/2025", term: "Second Term", startDate: "2025-01-06", endDate: "2025-04-04", status: "Current" },
   { id: 4, sessionName: "2024/2025", term: "Third Term", startDate: "2025-04-28", endDate: "2025-07-25", status: "Upcoming" },
 ];
 
 // 2. The Configuration
 const sessionsConfig = {
   title: "Academic Sessions",
   singularName: "Session",
   description: "Manage academic years, terms, and important school dates.",
   icon: CalendarDays,
   
   stats: [
     { 
       label: "Total Sessions", 
       value: (data) => data.length, 
       icon: CalendarDays, 
       color: "blue" 
     },
     { 
       label: "Current Session", 
       // Finds the one marked as "Current"
       value: (data) => {
         const current = data.find(s => s.status === "Current");
         return current ? `${current.sessionName} - ${current.term}` : "None Set";
       }, 
       icon: CheckCircle2, 
       color: "green" 
     },
   ],
 
   columns: [
     { key: "sessionName", label: "Session Year" },
     { key: "term", label: "Term" },
     { 
       key: "startDate", 
       label: "Start Date",
       // Custom render to format the date nicely
       render: (item) => (
         <span style={{ fontSize: "0.85rem", color: "oklch(0.85 0.05 264)" }}>
           {new Date(item.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
         </span>
       )
     },
     { 
       key: "endDate", 
       label: "End Date",
       render: (item) => (
         <span style={{ fontSize: "0.85rem", color: "oklch(0.85 0.05 264)" }}>
           {new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
         </span>
       )
     },
     { 
       key: "status", 
       label: "Status",
       // Custom render for beautiful status pills
       render: (item) => {
         const colors = {
           Current: { bg: "oklch(0.7 0.18 140 / 15%)", text: "oklch(0.7 0.18 140)", icon: CheckCircle2 },
           Upcoming: { bg: "oklch(0.72 0.18 60 / 15%)", text: "oklch(0.72 0.18 60)", icon: Clock },
           Completed: { bg: "oklch(0.25 0.04 260)", text: "oklch(0.6 0.02 250)", icon: AlertCircle },
         };
         const style = colors[item.status] || colors.Completed;
         const Icon = style.icon;
         
         return (
           <span style={{
             display: "inline-flex", alignItems: "center", gap: "6px",
             padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600",
             background: style.bg, color: style.text
           }}>
             <Icon size={12} /> {item.status}
           </span>
         );
       }
     },
     { key: "actions", label: "Actions", align: "right" },
   ],
 
   formFields: [
     { name: "sessionName", label: "Session Year", type: "text", placeholder: "e.g., 2025/2026", fullWidth: true },
     { 
       name: "term", 
       label: "Term", 
       type: "select", 
       options: ["First Term", "Second Term", "Third Term"] 
     },
     { name: "startDate", label: "Start Date", type: "date" },
     { name: "endDate", label: "End Date", type: "date" },
     { 
       name: "status", 
       label: "Status", 
       type: "select", 
       options: ["Current", "Upcoming", "Completed"] 
     },
   ],
 
   actions: [
     { label: "View Details", icon: Eye, type: "view" },
     { label: "Edit Session", icon: Edit, type: "edit" },
     { label: "Delete Session", icon: Trash2, type: "delete" },
   ],
 };
 
 // 3. The Component
 export default function  SessionsPage() {
   return (
     <GenericListPage 
       config={sessionsConfig} 
       initialData={initialSessions} 
     />
   );
 }
 
=======
import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
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
    setLoading(true); setError("");
    try { const data = await academicApi.sessions(); setSessions(data.sessions || []); } catch (e) { setError(e.message || "Failed to load sessions"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await academicApi.createSession(form); setForm(emptyForm); await load(); } catch (e) { setError(e.message || "Failed to save session"); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!window.confirm("Delete this session?")) return; await academicApi.deleteSession(id); await load(); };

  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Academic Session</h1><p>Set and manage academic terms and sessions.</p></div>
        <button className="dashboard-home-summary-action tone-blue" onClick={load}><RefreshCcw size={14} /><span>Refresh</span></button>
      </section>
      {error ? <div className="students-inline-alert">{error}</div> : null}
      <section className="dashboard-home-panel">
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input placeholder="Session name e.g. 2025/2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
            <option>First Term</option><option>Second Term</option><option>Third Term</option>
          </select>
          <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          <label><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active session</label>
          <button disabled={saving} className="dashboard-home-summary-action tone-blue"><Save size={14} /><span>{saving ? "Saving..." : "Save Session"}</span></button>
        </form>
      </section>
      <section className="dashboard-home-panel">
        {loading ? <p>Loading sessions...</p> : sessions.length ? sessions.map((session) => (
          <div key={session.id} className="parent-list-item">
            <div><strong>{session.name}</strong><p>{session.term} · {new Date(session.startsAt).toLocaleDateString()} to {new Date(session.endsAt).toLocaleDateString()}</p></div>
            <button type="button" onClick={() => remove(session.id)}><Trash2 size={14} /></button>
          </div>
        )) : <p>No sessions yet.</p>}
      </section>
    </div>
  );
}
>>>>>>> feature/authenticated-theme-pages
