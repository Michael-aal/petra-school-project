import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { admissionApi } from "../../../../services/admissionApi";
import "../../../../Styles/DashBoardLayout/studentListStyle.css";
import "../page-styles/StudentsListPage.css";

const statusOptions = ["pending", "approved", "admission_offered", "enrolled", "rejected", "failed"];
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
  const [actionBusy, setActionBusy] = useState(false);

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

  const handleApprove = async (applicantId) => {
    const confirm = window.confirm(
      "Are you sure you want to approve this applicant for the entrance examination?"
    );
    if (!confirm) return;

    setActionBusy(true);
    setError("");
    try {
      await admissionApi.approve(applicantId);
      await loadApplicants(page);
    } catch (err) {
      setError(err.message || "Failed to approve the applicant");
    } finally {
      setActionBusy(false);
    }
  };

  const handleEnroll = async (applicant) => {
    const confirm = window.confirm(`Enroll ${applicant.applicantName || "this applicant"} as a student?`);
    if (!confirm) return;

    setActionBusy(true);
    setError("");
    try {
      await admissionApi.enroll(applicant.id, {});
      await loadApplicants(page);
    } catch (err) {
      setError(err.message || "Failed to enroll the applicant");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (applicantId) => {
    const reason = window.prompt(
      "Enter a rejection reason (optional):",
      ""
    );
    const confirm = window.confirm(
      "Are you sure you want to reject this application?"
    );
    if (!confirm) return;

    setActionBusy(true);
    setError("");
    try {
      await admissionApi.reject(applicantId, reason || "");
      await loadApplicants(page);
    } catch (err) {
      setError(err.message || "Failed to reject the applicant");
    } finally {
      setActionBusy(false);
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
                <td colSpan={7} className="students-empty-state">Loading applicants...</td>
              </tr>
            ) : applicants.length ? (
              applicants.map((applicant) => (
                <tr key={applicant.id}>
                  <td>{applicant.applicantName || "—"}</td>
                  <td>{applicant.applicationCode || "—"}</td>
                  <td>{applicant.intendedClass || "—"}</td>
                  <td>{applicant.status || "pending"}</td>
                  <td>{applicant.parentEmail || "—"}</td>
                  <td>{new Date(applicant.createdAt).toLocaleDateString()}</td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => window.alert("View applicant details is not implemented yet")}
                    >
                      View
                    </button>
                    {applicant.status === "admission_offered" ? (
                      <button
                        type="button"
                        className="btn-success"
                        onClick={() => handleEnroll(applicant)}
                        disabled={actionBusy}
                      >
                        Enroll Student
                      </button>
                    ) : null}
                    {applicant.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="btn-success"
                          onClick={() => handleApprove(applicant.id)}
                          disabled={actionBusy}
                        >
                          Approve for Entrance Exam
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleReject(applicant.id)}
                          disabled={actionBusy}
                        >
                          Reject Application
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="students-empty-state">No applicants found.</td>
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
