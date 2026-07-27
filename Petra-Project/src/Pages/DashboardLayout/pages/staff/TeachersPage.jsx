import { useEffect, useState } from "react";
import { Search, RefreshCcw, Users } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import "../page-styles/TeachersPage.css";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.teachers({ search, limit: 20 });
      setTeachers(response.data?.users || []);
    } catch (err) {
      setError(err.message || "Unable to load teachers");
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
          <div className="title-icon-box"><Users size={24} /></div>
          <div>
            <h3>Teachers</h3>
            <h4>Manage teaching staff and their profiles</h4>
          </div>
        </div>
        <button className="btn-primary" onClick={load} type="button">
          <RefreshCcw size={16} /> Refresh
        </button>
      </section>

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers..." />
        </div>
        <button className="btn-primary" type="button" onClick={load}>Search</button>
      </div>

      {error ? <div className="students-inline-alert">{error}</div> : null}
      {loading ? (
        <p>Loading teachers...</p>
      ) : teachers.length ? (
        <div className="admin-list">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="admin-row">
              <div>
                <strong>{teacher.fullName || [teacher.firstName, teacher.lastName].filter(Boolean).join(" ")}</strong>
                <p>{teacher.staffDepartment || teacher.email}</p>
              </div>
              <span className="dashboard-home-session-pill">{teacher.role}</span>
            </article>
          ))}
        </div>
      ) : (
        <p>No teachers found.</p>
      )}
    </div>
  );
}
