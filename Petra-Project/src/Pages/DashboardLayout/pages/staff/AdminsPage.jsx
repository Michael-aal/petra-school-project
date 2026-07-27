import { useEffect, useState } from "react";
import { Shield, Search, RefreshCcw } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/AdminsPage.css";

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.users({ role: "principal", search, limit: 20 });
      setAdmins(response.data?.users || []);
    } catch (err) {
      setError(err.message || "Unable to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="dashboard-page">
      <section className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box"><Shield size={24} /></div>
          <div>
            <h3>Admins</h3>
            <h4>Manage administrative staff and access roles</h4>
          </div>
        </div>
        <button className="btn-primary" onClick={load} type="button">
          <RefreshCcw size={16} /> Refresh
        </button>
      </section>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search admins..." />
        </div>
        <button className="btn-primary" type="button" onClick={load}>Search</button>
      </div>

      {error ? <div className="students-inline-alert">{error}</div> : null}
      {loading ? (
        <p>Loading admins...</p>
      ) : admins.length ? (
        <div className="admin-list">
          {admins.map((admin) => (
            <article key={admin.id} className="admin-row">
              <div>
                <strong>{admin.fullName || [admin.firstName, admin.lastName].filter(Boolean).join(" ")}</strong>
                <p>{admin.username || admin.email}</p>
              </div>
              <span className="dashboard-home-session-pill">{admin.role}</span>
            </article>
          ))}
        </div>
      ) : (
        <p>No admins found.</p>
      )}
    </div>
  );
}
