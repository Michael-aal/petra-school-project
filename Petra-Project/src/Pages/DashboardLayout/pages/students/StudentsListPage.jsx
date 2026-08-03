import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  FilterIcon,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import "../../../../Styles/DashBoardLayout/studentListStyle.css";
import "../page-styles/StudentsListPage.css";
import { studentApi } from "../../../../services/studentApi";
import { getStudentDisplayName } from "../../../../utils/studentDisplay";

const emptyForm = {
  name: "",
  gender: "Male",
  className: "SS1",
  sessionId: "",
  dob: "",
  status: "active",
  parentName: "",
  parentRelationship: "Mother",
  parentEmail: "",
  parentPhone: "",
  parentAltPhone: "",
  parentAddress: "",
  passportPhoto: "",
  bloodGroup: "",
  house: "",
  nationality: "",
  religion: "",
  medicalNotes: "",
  previousSchool: "",
  studentAddress: "",
  address: "",
};

const toForm = (student) => ({
  name: getStudentDisplayName(student) || "",
  gender: student?.gender || "Male",
  className: student?.className || "SS1",
  sessionId: student?.sessionId || "",
  dob: student?.dob ? String(student.dob).slice(0, 10) : "",
  status: student?.status || "active",
  parentName: student?.guardianName || "",
  parentEmail: student?.parentEmail || "",
  parentPhone: student?.parentPhone || "",
  parentAltPhone: student?.parentAltPhone || "",
  parentAddress: student?.parentAddress || "",
  passportPhoto: student?.passportPhoto || "",
  bloodGroup: student?.bloodGroup || "",
  house: student?.house || "",
  nationality: student?.nationality || "",
  religion: student?.religion || "",
  medicalNotes: student?.medicalNotes || "",
  previousSchool: student?.previousSchool || "",
  studentAddress: student?.address || "",
  address: student?.address || "",
});

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "ST";

export default function StudentsListPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeModal, setActiveModal] = useState({ type: null, student: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);

  const loadStudents = async (page = pagination.page) => {
    setLoading(true);
    setError("");
    try {
      const data = await studentApi.list({
        page,
        limit: pagination.limit,
        search: searchQuery,
        className: classFilter,
        gender: genderFilter,
        status: statusFilter,
      });
      setStudents(data.students || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const stats = useMemo(() => {
    const total = pagination.total || students.length;
    const active = students.filter((item) => item.status === "active").length;
    const male = students.filter((item) => String(item.gender).toLowerCase() === "male").length;
    const female = students.filter((item) => String(item.gender).toLowerCase() === "female").length;
    return { total, active, male, female };
  }, [pagination.total, students]);

  const submitStudent = async () => {
    setSaving(true);
    try {
      if (activeModal.type === "create") {
        await studentApi.create({ ...form, admissionNumber: "" });
      } else if (activeModal.type === "edit" && activeModal.student?.id) {
        await studentApi.update(activeModal.student.id, form);
      }
      setActiveModal({ type: null, student: null });
      setForm(emptyForm);
      await loadStudents(pagination.page);
    } catch (err) {
      setError(err.message || "Unable to save student");
    } finally {
      setSaving(false);
    }
  };

  const removeStudent = async (student) => {
    if (!window.confirm(`Remove ${getStudentDisplayName(student)}?`)) return;
    try {
      await studentApi.remove(student.id);
      await loadStudents(pagination.page);
    } catch (err) {
      setError(err.message || "Unable to remove student");
    }
  };

  const regenerateCode = async (student) => {
    try {
      await studentApi.regenerateAccessCode(student.id);
      await loadStudents(pagination.page);
    } catch (err) {
      setError(err.message || "Unable to regenerate access code");
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setActiveModal({ type: "create", student: null });
  };

  const openEditModal = (student) => {
    setForm(toForm(student));
    setActiveModal({ type: "edit", student });
    setOpenDropdown(null);
  };

  const openViewModal = (student) => {
    setActiveModal({ type: "view", student });
    setOpenDropdown(null);
  };

  const applyFilters = async () => {
    await loadStudents(1);
  };

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.totalPages;

  return (
    <div className="students-page">
      <div className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3>Students</h3>
            <h4>Manage all registered students</h4>
          </div>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <Users size={18} />
          </div>
          <div>
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="stat-number">{stats.active}</span>
            <span className="stat-label">Active Students</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <ArrowRightLeft size={18} />
          </div>
          <div>
            <span className="stat-number">{stats.male}</span>
            <span className="stat-label">Male Students</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red">
            <ArrowRightLeft size={18} />
          </div>
          <div>
            <span className="stat-number">{stats.female}</span>
            <span className="stat-label">Female Students</span>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search student by name, class, or parent..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
        </div>
        <select className="form-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          <option value="JSS1">JSS1</option>
          <option value="JSS2">JSS2</option>
          <option value="JSS3">JSS3</option>
          <option value="SS1">SS1</option>
          <option value="SS2">SS2</option>
          <option value="SS3">SS3</option>
        </select>
        <select className="form-select" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="btn-secondary" onClick={applyFilters}>
          <FilterIcon size={18} />
          Filter
        </button>
        <button className="btn-secondary" onClick={() => loadStudents(pagination.page)}>
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {error ? <div className="students-inline-alert">{error}</div> : null}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Parent</th>
              <th>Gender</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>


            
            {loading ? (
              <tr>
                <td colSpan={6} className="students-empty-state">
                  Loading students...
                </td>
              </tr>
            ) : students.length ? (
              students.map((student) => {
                
                const studentDisplayName = getStudentDisplayName(student);
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          {initials(studentDisplayName)}
                        </div>
                        <div>
                          <div className="student-name">{studentDisplayName}</div>
                          <div className="student-subtitle">
                            {student.guardianName ? `Guardian: ${student.guardianName}` : student.className || student.gender || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                  <td>{student.className || "-"}</td>
                  <td>{student.guardianName || "-"}</td>
                  <td>{student.gender || "-"}</td>
                  <td>
                    <span className={`status-badge status-${student.status || "active"}`}>{student.status || "active"}</span>
                  </td>
                  <td className="text-right action-cell">
                    <div className="dropdown-wrapper" ref={openDropdown === student.id ? dropdownRef : null}>
                      <button className="action-btn" onClick={() => setOpenDropdown(openDropdown === student.id ? null : student.id)}>
                        <MoreHorizontal size={18} />
                      </button>
                      {openDropdown === student.id ? (
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={() => openViewModal(student)}>
                            <CheckCircle2 size={16} />
                            <span>View Profile</span>
                          </button>
                          <button className="dropdown-item" onClick={() => openEditModal(student)}>
                            <Pencil size={16} />
                            <span>Edit Student</span>
                          </button>
                          <button className="dropdown-item" onClick={() => regenerateCode(student)}>
                            <ArrowRightLeft size={16} />
                            <span>Regenerate Code</span>
                          </button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item dropdown-item-danger" onClick={() => removeStudent(student)}>
                            <Trash2 size={16} />
                            <span>Remove Student</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="students-empty-state">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="students-pagination">
        <button className="btn-secondary" disabled={!canPrev} onClick={() => loadStudents(pagination.page - 1)}>
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button className="btn-secondary" disabled={!canNext} onClick={() => loadStudents(pagination.page + 1)}>
          Next
        </button>
      </div>

      {activeModal.type === "create" || activeModal.type === "edit" ? (
        <div className="modal-overlay" onClick={() => setActiveModal({ type: null, student: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{activeModal.type === "create" ? "Add New Student" : "Edit Student"}</h2>
              <button className="modal-close" onClick={() => setActiveModal({ type: null, student: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}>
                    <option value="JSS1">JSS1</option>
                    <option value="JSS2">JSS2</option>
                    <option value="JSS3">JSS3</option>
                    <option value="SS1">SS1</option>
                    <option value="SS2">SS2</option>
                    <option value="SS3">SS3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Parent / Guardian Full Name</label>
                  <input className="form-input" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <select className="form-select" value={form.parentRelationship} onChange={(e) => setForm({ ...form, parentRelationship: e.target.value })}>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-input" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Alternative Phone</label>
                  <input className="form-input" value={form.parentAltPhone} onChange={(e) => setForm({ ...form, parentAltPhone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Email</label>
                  <input className="form-input" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Parent Address</label>
                  <input className="form-input" value={form.parentAddress} onChange={(e) => setForm({ ...form, parentAddress: e.target.value })} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Student Address</label>
                  <input className="form-input" value={form.studentAddress} onChange={(e) => setForm({ ...form, studentAddress: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setActiveModal({ type: null, student: null })}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submitStudent} disabled={saving}>
                {saving ? "Saving..." : "Save Student"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeModal.type === "view" && activeModal.student ? (
        <div className="modal-overlay" onClick={() => setActiveModal({ type: null, student: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Profile</h2>
              <button className="modal-close" onClick={() => setActiveModal({ type: null, student: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="profile-view">
                <div className="profile-header">
                  <div className="student-avatar large">{initials(getStudentDisplayName(activeModal.student))}</div>
                  <h3>{getStudentDisplayName(activeModal.student)}</h3>
                  <p>
                    {activeModal.student.className || "-"} • {activeModal.student.gender || "-"}
                  </p>
                </div>
                <div className="profile-info-grid">
                  <div className="info-item">
                    <span className="info-label">Class</span>
                    <span className="info-value">{activeModal.student.className || "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className={`status-badge status-${activeModal.student.status || "active"}`}>
                      {activeModal.student.status || "active"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Parent / Guardian</span>
                    <span className="info-value">{activeModal.student.guardianName || "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Access Code</span>
                    <span className="info-value">{activeModal.student.parentAccessCode || "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Parent Email</span>
                    <span className="info-value">{activeModal.student.parentEmail || "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Parent Phone</span>
                    <span className="info-value">{activeModal.student.parentPhone || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setActiveModal({ type: null, student: null })}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

