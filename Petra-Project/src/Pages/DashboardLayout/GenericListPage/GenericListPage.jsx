import { useState, useRef, useEffect } from "react";
import {
  Search, X, MoreHorizontal, Eye, Trash2, PlusCircle, FilterIcon
} from "lucide-react";
import "./GenericListPage.css";

// Helper to generate initials from a name
const getInitials = (name) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function GenericListPage({ config, initialData, onDataChange }) {
  const [data, setData] = useState(initialData || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, item: null });
  const [formData, setFormData] = useState({});

  // Sync with parent context if onDataChange is provided
  useEffect(() => {
    if (onDataChange) onDataChange(data);
  }, [data, onDataChange]);

  // Filter data based on search query
  const filteredData = data.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return Object.values(item).some(
      (val) => String(val).toLowerCase().includes(searchLower)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    const newItem = {
      id: Date.now(),
      ...formData,
      // Auto-generate initials if a name field exists
      avatarInitials: formData.fullName || formData.name || formData.studentName 
        ? getInitials(formData.fullName || formData.name || formData.studentName) 
        : "NA",
    };
    const updatedData = [...data, newItem];
    setData(updatedData);
    setFormData({});
    setIsAddModalOpen(false);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to remove ${item.fullName || item.name || item.studentName}?`)) {
      const updatedData = data.filter((d) => d.id !== item.id);
      setData(updatedData);
    }
    setOpenDropdownId(null);
  };

  const handleOpenEdit = (item) => {
    setFormData({ ...item });
    setEditModal({ isOpen: true, item });
    setOpenDropdownId(null);
  };

  const handleSaveEdit = () => {
    const updatedData = data.map((d) => (d.id === editModal.item.id ? { ...d, ...formData } : d));
    setData(updatedData);
    setEditModal({ isOpen: false, item: null });
    setFormData({});
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setEditModal({ isOpen: false, item: null });
    setFormData({});
  };

  const IconComponent = config.icon;

  return (
    <div className="generic-list-page">
      {/* 1. Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="title-icon-box">
            <IconComponent size={24} />
          </div>
          <div>
            <h3>{config.title}</h3>
            <h4>{config.description}</h4>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle size={18} /> Add {config.singularName}
        </button>
      </div>

      {/* 2. Stats Bar */}
      <div className="stats-bar">
        {config.stats.map((stat, idx) => {
          const StatIcon = stat.icon;
          const value = typeof stat.value === "function" ? stat.value(data) : stat.value;
          return (
            <div className="stat-card" key={idx}>
              <div className={`stat-icon stat-icon-${stat.color}`}>
                <StatIcon size={18} />
              </div>
              <div>
                <span className="stat-number">{value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Controls */}
      <div className="page-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-secondary">
          <FilterIcon size={18} /> Filter
        </button>
      </div>

      {/* 4. Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {config.columns.map((col, idx) => (
                <th key={idx} className={col.align === "right" ? "text-right" : ""}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id}>
                  {config.columns.map((col, idx) => (
                    <td key={idx} className={col.align === "right" ? "text-right action-cell" : ""}>
                      {col.render ? (
                        col.render(item)
                      ) : col.key === "avatar" ? (
                        <div className="student-cell">
                          <div className="student-avatar">{item.avatarInitials || getInitials(item.name || item.fullName)}</div>
                          <span className="student-name">{item.name || item.fullName || item.studentName}</span>
                        </div>
                      ) : col.key === "status" || col.key === "feeStatus" ? (
                        <span className={`status-badge status-${String(item[col.key]).toLowerCase()}`}>
                          {item[col.key]}
                        </span>
                      ) : col.key === "actions" ? (
                        <div className="dropdown-wrapper" ref={openDropdownId === item.id ? dropdownRef : null}>
                          <button className="action-btn" onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}>
                            <MoreHorizontal size={18} />
                          </button>
                          {openDropdownId === item.id && (
                            <div className="dropdown-menu">
                              {config.actions.map((action, aIdx) => {
                                const ActionIcon = action.icon;
                                if (action.type === "delete") {
                                  return (
                                    <button key={aIdx} className="dropdown-item dropdown-item-danger" onClick={() => handleDelete(item)}>
                                      <ActionIcon size={16} /><span>{action.label}</span>
                                    </button>
                                  );
                                }
                                return (
                                  <button key={aIdx} className="dropdown-item" onClick={() => handleOpenEdit(item)}>
                                    <ActionIcon size={16} /><span>{action.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        item[col.key] || "-"
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={config.columns.length} className="empty-state">
                  No {config.title.toLowerCase()} found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Add / Edit Modal */}
      {(isAddModalOpen || editModal.isOpen) && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editModal.isOpen ? `Edit ${config.singularName}` : `Add New ${config.singularName}`}</h2>
              <button className="modal-close" onClick={closeModals}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {config.formFields.map((field, idx) => (
                  <div key={idx} className={`form-group ${field.fullWidth ? "full-width" : ""}`}>
                    <label className="form-label">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        className="form-select"
                        value={formData[field.name] || ""}
                        onChange={handleFormChange}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        className="form-input"
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        value={formData[field.name] || ""}
                        onChange={handleFormChange}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeModals}>Cancel</button>
              <button className="btn-primary" onClick={editModal.isOpen ? handleSaveEdit : handleAdd}>
                {editModal.isOpen ? "Save Changes" : `Add ${config.singularName}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}