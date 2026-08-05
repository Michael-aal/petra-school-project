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
  const [viewModal, setViewModal] = useState({ isOpen: false, item: null });
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
    setViewModal({ isOpen: false, item: null });
    setOpenDropdownId(null);
  };

  const openViewModal = (item) => {
    setViewModal({ isOpen: true, item });
    setEditModal({ isOpen: false, item: null });
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
    setViewModal({ isOpen: false, item: null });
    setFormData({});
  };

  const IconComponent = config.icon;
  const EmptyIcon = config.emptyState?.icon;

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
        {config.toolbarActions?.length ? (
          <div className="toolbar-actions">
            {config.toolbarActions.map((action, idx) => {
              const ButtonIcon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className={action.variant === "primary" ? "btn-primary" : "btn-secondary"}
                  onClick={action.onClick || (() => {})}
                  disabled={action.disabled}
                >
                  {ButtonIcon ? <ButtonIcon size={16} /> : null}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <button className="btn-secondary">
            <FilterIcon size={18} /> Filter
          </button>
        )}
      </div>

      {/* 4. Data Table */}
      <div className="table-container">
        {filteredData.length > 0 ? (
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
              {filteredData.map((item) => (
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
                        <span className={`status-badge status-${String(item[col.key]).toLowerCase().replace(/\s+/g, "-")}`}>
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

                                if (action.type === "sendLink") {
                                  return (
                                    <button 
                                      key={aIdx} 
                                      className="dropdown-item" 
                                      onClick={() => {
                                        const loginUrl = `${window.location.origin}/signin`;
                                        const subject = `Your Parent Portal Access for ${item.name || item.parentName || item.fullName || "Your Child"}`;
                                        const body = `Hello,\n\nYour school has activated your parent portal. You can now view your children's results, attendance, and fees.\n\nPlease go to: ${loginUrl}\nand log in using this email address: ${item.email}\n\nIf you have any issues, please contact the school admin.`;
                                        window.location.href = `mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                      }}
                                    >
                                      <ActionIcon size={16} />
                                      <span>{action.label}</span>
                                    </button>
                                  );
                                }

                                if (action.type === "delete") {
                                  return (
                                    <button key={aIdx} className="dropdown-item dropdown-item-danger" onClick={() => handleDelete(item)}>
                                      <ActionIcon size={16} /><span>{action.label}</span>
                                    </button>
                                  );
                                }

                                if (action.type === "view" || action.type === "viewChildren") {
                                  return (
                                    <button key={aIdx} className="dropdown-item" onClick={() => openViewModal(item)}>
                                      <ActionIcon size={16} /><span>{action.label}</span>
                                    </button>
                                  );
                                }

                                if (action.type === "resetPassword") {
                                  return (
                                    <button
                                      key={aIdx}
                                      className="dropdown-item"
                                      onClick={() => window.alert("Reset password flow is available in the live admin console.")}
                                    >
                                      <ActionIcon size={16} /><span>{action.label}</span>
                                    </button>
                                  );
                                }

                                if (action.type === "disable") {
                                  return (
                                    <button
                                      key={aIdx}
                                      className="dropdown-item"
                                      onClick={() => window.alert("Account status can be managed from the parent profile page.")}
                                    >
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
              ))}
            </tbody>
          </table>
        ) : config.emptyState ? (
          <div className="empty-state-panel">
            {EmptyIcon ? <EmptyIcon size={56} className="empty-state-icon" /> : null}
            <div className="empty-state-copy">
              <h3>{config.emptyState.title}</h3>
              <p>{config.emptyState.description}</p>
            </div>
            {config.emptyState.action && (
              <button className="btn-primary" type="button" onClick={config.emptyState.action.onClick}>
                {config.emptyState.action.label}
              </button>
            )}
          </div>
        ) : (
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
              <tr>
                <td colSpan={config.columns.length} className="empty-state">
                  No {config.title.toLowerCase()} found matching "{searchQuery}"
                </td>
              </tr>
            </tbody>
          </table>
        )}
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

      {/* 6. View Modal */}
      {viewModal.isOpen && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>View {config.singularName}</h2>
              <button className="modal-close" onClick={closeModals}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-label">Full Name</span>
                  <span className="view-value">{viewModal.item.name || viewModal.item.fullName}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Email</span>
                  <span className="view-value">{viewModal.item.email || "—"}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Phone</span>
                  <span className="view-value">{viewModal.item.phoneNumber || "—"}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Status</span>
                  <span className={`status-badge status-${String(viewModal.item.status || "unknown").toLowerCase().replace(/\s+/g, "-")}`}>
                    {viewModal.item.status || "Unknown"}
                  </span>
                </div>
                <div className="view-item full-width">
                  <span className="view-label">Address</span>
                  <span className="view-value">{viewModal.item.address || "No address provided."}</span>
                </div>
              </div>
              <div className="linked-children-section">
                <div className="view-section-header">
                  <h3>Linked Children</h3>
                  <span>{viewModal.item.children?.length || 0} linked learner{viewModal.item.children?.length === 1 ? "" : "s"}</span>
                </div>
                {viewModal.item.children?.length > 0 ? (
                  <div className="linked-children-grid">
                    {viewModal.item.children.map((child) => (
                      <div className="child-card" key={child.id}>
                        <div className="child-avatar">{getInitials(child.name)}</div>
                        <div className="child-content">
                          <strong>{child.name}</strong>
                          <span>{child.admissionNumber}</span>
                          <span>{child.className}</span>
                          <span className={`status-badge status-${String(child.status || "active").toLowerCase()}`}>{child.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-children-copy">No linked children are available for this parent.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModals}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}