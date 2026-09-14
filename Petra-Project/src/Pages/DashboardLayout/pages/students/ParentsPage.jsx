import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, RefreshCcw, UserCheck, Users } from "lucide-react";
import { studentApi } from "../../../../services/studentApi";
import "../page-styles/ParentsPage.css";

const buildParents = (students) => {
  const map = new Map();

  students.forEach((student) => {
    const key = String(student.parentId || student.parentEmail || student.parentPhone || student.guardianName || "").trim().toLowerCase();
    if (!key) return;

    const existing = map.get(key) || {
      id: key,
      name: student.guardianName || "Parent / Guardian",
      email: student.parentEmail || "",
      phoneNumber: student.parentPhone || "",
      children: [],
    };

    if (!existing.email && student.parentEmail) existing.email = student.parentEmail;
    if (!existing.phoneNumber && student.parentPhone) existing.phoneNumber = student.parentPhone;
    if (!existing.name || existing.name === "Parent / Guardian") {
      existing.name = student.guardianName || existing.name;
    }

    if (!existing.children.some((child) => child.id === student.id)) {
      existing.children.push({
        id: student.id,
        name: student.name || student.admissionNumber || "Student",
        admissionNumber: student.admissionNumber || "",
        className: student.className || "",
        status: student.status || "",
      });
    }

    map.set(key, existing);
  });

  return Array.from(map.values()).map((parent) => ({
    ...parent,
    linkedStudents: parent.children.length,
    status: parent.children.some((child) => String(child.status).toLowerCase() === "active") ? "Active" : "Inactive",
  }));
};

export default function ParentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await studentApi.list({ page: 1, limit: 100 });
      setStudents(Array.isArray(response?.students) ? response.students : []);
    } catch (err) {
      setStudents([]);
      setError(err?.data?.message || err?.message || "Unable to load parent-linked students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const parents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const all = buildParents(students);
    if (!query) return all;
    return all.filter((parent) => [parent.name, parent.email, parent.phoneNumber, ...parent.children.map((child) => child.name)].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [students, search]);

  const totalWards = parents.reduce((sum, parent) => sum + parent.linkedStudents, 0);
  const activeParents = parents.filter((parent) => parent.status === "Active").length;

  return (
    <div className="parents-page">
      <div className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box"><Users size={24} /></div>
          <div>
            <h3>Parents & Guardians</h3>
            <h4>Live parent/guardian links derived from enrolled student records.</h4>
          </div>
        </div>
        <button type="button" className="btn-secondary" onClick={loadStudents} disabled={loading}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="stats-bar">
        {[
          ["Parents / Guardians", parents.length, Users, "blue"],
          ["Linked Wards", totalWards, UserCheck, "green"],
          ["Active Contacts", activeParents, UserCheck, "blue"],
        ].map(([label, value, Icon, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon stat-icon-${color}`}><Icon size={18} /></div>
            <div><span className="stat-number">{loading ? "—" : value}</span><span className="stat-label">{label}</span></div>
          </div>
        ))}
      </div>

      <div className="page-controls">
        <div className="search-wrapper">
          <input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parents, guardians, or children..." />
        </div>
      </div>

      {error ? <div className="dashboard-alert error">{error}</div> : null}

      <div className="table-container">
        {loading ? <div className="dashboard-page-copy">Loading parent links...</div> : null}
        {!loading && !parents.length ? <div className="dashboard-page-copy">No parent/guardian links found.</div> : null}
        {!loading && parents.length ? (
          <table>
            <thead>
              <tr><th>Parent / Guardian</th><th>Email</th><th>Phone</th><th>Linked Wards</th><th>Status</th></tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr key={parent.id}>
                  <td>{parent.name || "—"}</td>
                  <td><span className="parent-email"><Mail size={14} /> {parent.email || "—"}</span></td>
                  <td><span className="parent-phone"><Phone size={14} /> {parent.phoneNumber || "—"}</span></td>
                  <td>
                    <div className="parent-linked-wards"><UserCheck size={14} /> {parent.linkedStudents}</div>
                    <small>{parent.children.map((child) => child.name).join(", ")}</small>
                  </td>
                  <td><span className={`status-badge status-${parent.status.toLowerCase()}`}>{parent.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
