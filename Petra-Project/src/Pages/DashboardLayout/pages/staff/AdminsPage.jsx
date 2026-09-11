import { useEffect, useState } from "react";
import { Shield, Search, RefreshCcw } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/AdminsPage.css";

const getAdminName = (admin) =>
  admin.fullName || [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.username || admin.email || "Admin";

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
    <div className="dashboard-home admins-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Admins</h1>
          <p>Manage administrative staff and access roles from one secure admin workspace.</p>
        </div>
        <div className="dashboard-home-session-pill">Admin operations</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Total admins</span>
              <strong>{admins.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Shield size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Search ready</span>
              <strong>Yes</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <RefreshCcw size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel admins-actions-panel">
        <div className="admins-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admins..."
            />
          </div>
          <button className="dashboard-home-summary-action tone-blue" onClick={load} type="button">
            <RefreshCcw size={14} />
            <span>Reload</span>
          </button>
        </div>

        {error ? <div className="students-inline-alert">{error}</div> : null}

        {loading ? (
          <div className="module-empty">Loading admins...</div>
        ) : admins.length ? (
          <div className="admin-list">
            {admins.map((admin) => (
              <article key={admin.id} className="admin-row">
                <div>
                  <strong>{getAdminName(admin)}</strong>
                  <p>{admin.username || admin.email}</p>
                </div>
                <span className="dashboard-home-session-pill">{admin.role}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="module-empty">No admins found.</div>
        )}
      </section>
    </div>
  );
}
