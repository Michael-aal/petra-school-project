import { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../../../../context/UserContext";
import {
  FilterIcon, GraduationCap, Search, X, MoreHorizontal,
  Eye, ArrowRightLeft, CreditCard, Trash2, Users
} from "lucide-react";
import "../../../../Styles/DashBoardLayout/studentListStyle.css";

export default function StudentsListPage() {
  // 1. Get global students and setters from Context
  const { students, setStudents, userInfo, setUserInfo } = useContext(UserContext);
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // 2. SEARCH FUNCTIONALITY ADDED HERE
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredStudents = students.filter((student) =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, type: '', student: null });
  const [editValue, setEditValue] = useState('');

  // Add Student Form State
  const [newStudent, setNewStudent] = useState({
    studentName: '', studentClass: 'SS1', studentParentName: '', 
    studentFeeStatus: 'Unpaid', studentGender: 'Male'
  });

  // Live Stats (calculated from the global students array)
  const totalStudents = students.length;
  const paidCount = students.filter(s => s.studentFeeStatus === "Paid").length;
  const unpaidCount = students.filter(s => s.studentFeeStatus === "Unpaid").length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleAddStudent = () => {
    if (!newStudent.studentName || !newStudent.studentParentName) {
      alert("Please fill in Student Name and Parent Name");
      return;
    }
    const initials = newStudent.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const addedStudent = {
      id: Date.now(),
      ...newStudent,
      studentNameLogo: initials,
      studentStatus: 'Active'
    };
    
    const updatedStudents = [...students, addedStudent];
    setStudents(updatedStudents);
    setUserInfo(prev => ({ ...prev, totalStudent: updatedStudents.length })); // Sync context
    
    setNewStudent({ studentName: '', studentClass: 'SS1', studentParentName: '', studentFeeStatus: 'Unpaid', studentGender: 'Male' });
    setIsAddModalOpen(false);
  };

  const handleRemove = (student) => {
    if (window.confirm(`Are you sure you want to remove ${student.studentName}?`)) {
      const updatedStudents = students.filter(s => s.id !== student.id);
      setStudents(updatedStudents);
      setUserInfo(prev => ({ ...prev, totalStudent: updatedStudents.length })); // Sync context
    }
    setOpenDropdown(null);
  };

  const handleOpenEdit = (type, student) => {
    const val = type === 'class' ? student.studentClass : student.studentFeeStatus;
    setEditValue(val);
    setEditModal({ isOpen: true, type, student });
    setOpenDropdown(null);
  };

  const handleSaveEdit = () => {
    const key = editModal.type === 'class' ? 'studentClass' : 'studentFeeStatus';
    const updatedStudents = students.map(s => 
      s.id === editModal.student.id ? { ...s, [key]: editValue } : s
    );
    setStudents(updatedStudents);
    setEditModal({ isOpen: false, type: '', student: null });
  };

  const closeEditModal = () => setEditModal({ isOpen: false, type: '', student: null });

  return (
    <div className="students-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box"><GraduationCap size={24} /></div>
          <div>
            <h3>Students</h3>
            <h4>Manage all registered students</h4>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Student</button>
      </div>

      {/* Live Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Users size={18} /></div>
          <div>
            <span className="stat-number">{totalStudents}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><CreditCard size={18} /></div>
          <div>
            <span className="stat-number">{paidCount}</span>
            <span className="stat-label">Fees Paid</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-red"><CreditCard size={18} /></div>
          <div>
            <span className="stat-number">{unpaidCount}</span>
            <span className="stat-label">Fees Unpaid</span>
          </div>
        </div>
      </div>

      {/* Controls (SEARCH IS NOW WIRED UP) */}
      <div className="page-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search student by name or class..." 
            className="search-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-secondary"><FilterIcon size={18} /> Filter</button>
      </div>

      {/* Data Table (Maps over filteredStudents) */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th><th>Class</th><th>Parent</th><th>Fee Status</th><th>Status</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar">{item.studentNameLogo}</div>
                      <span className="student-name">{item.studentName}</span>
                    </div>
                  </td>
                  <td>{item.studentClass}</td>
                  <td>{item.studentParentName}</td>
                  <td><span className={`status-badge status-${item.studentFeeStatus.toLowerCase()}`}>{item.studentFeeStatus}</span></td>
                  <td><span className="status-badge status-active">{item.studentStatus}</span></td>
                  <td className="text-right action-cell">
                    <div className="dropdown-wrapper" ref={openDropdown === item.id ? dropdownRef : null}>
                      <button className="action-btn" onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}>
                        <MoreHorizontal size={18} />
                      </button>
                      {openDropdown === item.id && (
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={() => handleOpenEdit('profile', item)}>
                            <Eye size={16} /><span>View Profile</span>
                          </button>
                          <button className="dropdown-item" onClick={() => handleOpenEdit('class', item)}>
                            <ArrowRightLeft size={16} /><span>Change Class</span>
                          </button>
                          <button className="dropdown-item" onClick={() => handleOpenEdit('feeStatus', item)}>
                            <CreditCard size={16} /><span>Change Fee Status</span>
                          </button>
                          <div className="dropdown-divider"></div>
                          <button className="dropdown-item dropdown-item-danger" onClick={() => handleRemove(item)}>
                            <Trash2 size={16} /><span>Remove Student</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "oklch(0.6 0.02 250)" }}>
                  No students found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Student</h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Full Name</label>
                  <input type="text" placeholder="e.g. John Doe" className="form-input" value={newStudent.studentName} onChange={e => setNewStudent({...newStudent, studentName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={newStudent.studentClass} onChange={e => setNewStudent({...newStudent, studentClass: e.target.value})}>
                    <option value="JSS1">JSS1</option><option value="JSS2">JSS2</option><option value="JSS3">JSS3</option>
                    <option value="SS1">SS1</option><option value="SS2">SS2</option><option value="SS3">SS3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={newStudent.studentGender} onChange={e => setNewStudent({...newStudent, studentGender: e.target.value})}>
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Parent/Guardian Name</label>
                  <input type="text" placeholder="e.g. Mr. Ogunleye" className="form-input" value={newStudent.studentParentName} onChange={e => setNewStudent({...newStudent, studentParentName: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Fee Status</label>
                  <select className="form-select" value={newStudent.studentFeeStatus} onChange={e => setNewStudent({...newStudent, studentFeeStatus: e.target.value})}>
                    <option value="Unpaid">Unpaid</option><option value="Paid">Paid</option><option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddStudent}>Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / VIEW PROFILE MODAL */}
      {editModal.isOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editModal.type === 'class' ? 'Change Class' : editModal.type === 'feeStatus' ? 'Change Fee Status' : 'Student Profile'}
              </h2>
              <button className="modal-close" onClick={closeEditModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {editModal.type === 'profile' ? (
                <div className="profile-view">
                  <div className="profile-header">
                    <div className="student-avatar large">{editModal.student.studentNameLogo}</div>
                    <h3>{editModal.student.studentName}</h3>
                    <p>{editModal.student.studentClass} • {editModal.student.studentGender}</p>
                  </div>
                  <div className="profile-info-grid">
                    <div className="info-item">
                      <span className="info-label">Parent/Guardian</span>
                      <span className="info-value">{editModal.student.studentParentName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Fee Status</span>
                      <span className={`status-badge status-${editModal.student.studentFeeStatus.toLowerCase()}`}>{editModal.student.studentFeeStatus}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Enrollment Status</span>
                      <span className="status-badge status-active">{editModal.student.studentStatus}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">
                    {editModal.type === 'class' ? 'Select New Class' : 'Select New Fee Status'}
                  </label>
                  <select className="form-select" value={editValue} onChange={e => setEditValue(e.target.value)}>
                    {editModal.type === 'class' ? (
                      <>
                        <option value="JSS1">JSS1</option><option value="JSS2">JSS2</option><option value="JSS3">JSS3</option>
                        <option value="SS1">SS1</option><option value="SS2">SS2</option><option value="SS3">SS3</option>
                      </>
                    ) : (
                      <>
                        <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option><option value="Partial">Partial</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeEditModal}>
                {editModal.type === 'profile' ? 'Close' : 'Cancel'}
              </button>
              {editModal.type !== 'profile' && (
                <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}