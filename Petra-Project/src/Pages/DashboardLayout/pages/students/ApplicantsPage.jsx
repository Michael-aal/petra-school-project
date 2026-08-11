import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { admissionApi } from "../../../../services/admissionApi";
import "../../../../Styles/DashBoardLayout/studentListStyle.css";
import "../page-styles/StudentsListPage.css";

const statusOptions = ["pending", "approved", "rejected"];
const classOptions = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const loadApplicants = async (requestedPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await admissionApi.list({
        page: requestedPage,
        limit,
        search: searchQuery,
        status: statusFilter,
        className: classFilter,
      });
      setApplicants(response.admissions || []);
      setPagination(response.pagination || { total: 0, totalPages: 1 });
      setPage(response.pagination?.page || requestedPage);
    } catch (err) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="students-page">
      <div className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box">
            <span className="applicant-icon">A</span>
          </div>
          <div>
            <h3>Applicants</h3>
            <h4>Track submitted admission applications</h4>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search applicants..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadApplicants(1);
            }}
          />
        </div>
        <select className="form-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classOptions.map((className) => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button className="btn-secondary" onClick={() => loadApplicants(1)}>
          <Filter size={18} />
          Filter
        </button>
      </div>

      {error ? <div className="students-inline-alert">{error}</div> : null}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Application Code</th>
              <th>Class</th>
              <th>Status</th>
              <th>Parent Email</th>
              <th className="text-right">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="students-empty-state">Loading applicants...</td>
              </tr>
            ) : applicants.length ? (
              applicants.map((applicant) => (
                <tr key={applicant.id}>
                  <td>{applicant.applicantName || "—"}</td>
                  <td>{applicant.applicationCode || "—"}</td>
                  <td>{applicant.intendedClass || "—"}</td>
                  <td>{applicant.status || "pending"}</td>
                  <td>{applicant.parentEmail || "—"}</td>
                  <td className="text-right">{new Date(applicant.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="students-empty-state">No applicants found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="students-pagination">
        <button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => loadApplicants(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {pagination.totalPages}
        </span>
        <button className="btn-secondary" disabled={page >= pagination.totalPages || loading} onClick={() => loadApplicants(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
