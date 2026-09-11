import { useState } from "react";
import { 
  Wallet, PlusCircle, Search, Edit3, Trash2, Eye, X, 
  CheckCircle2, AlertTriangle, TrendingUp, ToggleLeft, ToggleRight
} from "lucide-react";
import "./AdminPaymentSettings.css";

// ==========================================
// MOCK DATA (Will be replaced by Backend API)
// ==========================================
const initialItems = [
  { id: 1, name: "School Fees", amount: 95000, description: "Tuition for the current term", status: "Active" },
  { id: 2, name: "Registration Fee", amount: 20000, description: "One-time enrollment fee", status: "Active" },
  { id: 3, name: "New Student Package", amount: 15000, description: "Starter kit and materials", status: "Active" },
  { id: 4, name: "Old Exam Fee", amount: 5000, description: "Legacy exam fee", status: "Inactive" },
];

export default function AdminPaymentSettings() {
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", amount: "", description: "", status: "Active"
  });

  const formatNaira = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const activeItems = items.filter(i => i.status === "Active");
  const totalPotentialRevenue = activeItems.reduce((sum, i) => sum + i.amount, 0);

  // Open Modal for Add or Edit
  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, amount: item.amount, description: item.description, status: item.status });
    } else {
      setEditingItem(null);
      setFormData({ name: "", amount: "", description: "", status: "Active" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Save Item (Add or Update)
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (editingItem) {
      // Update existing
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData, amount: Number(formData.amount) } : i));
    } else {
      // Add new
      const newItem = { id: Date.now(), ...formData, amount: Number(formData.amount) };
      setItems([...items, newItem]);
    }
    closeModal();
  };

  // Toggle Status (Step 17)
  const toggleStatus = (id) => {
    setItems(items.map(i => {
      if (i.id === id) {
        return { ...i, status: i.status === "Active" ? "Inactive" : "Active" };
      }
      return i;
    }));
  };

  // Delete Item (Step 13)
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this payment item?")) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  // Preview Public Page (Step 16)
  const handlePreview = () => {
    window.open("/payment", "_blank");
  };

  return (
    <div className="admin-pay-page">
      {/* Header */}
      <div className="admin-pay-header">
        <div className="admin-pay-title">
          <div className="admin-pay-icon-box"><Wallet size={24} /></div>
          <div>
            <h2>Payment Settings</h2>
            <p>Manage the payment items available to students and parents.</p>
          </div>
        </div>
        <div className="admin-pay-actions">
          <button className="btn-outline" onClick={handlePreview}>
            <Eye size={16} /> Preview Public Page
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <PlusCircle size={18} /> Add Payment Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-pay-stats">
        <div className="admin-stat-card">
          <span className="stat-label">Total Items</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Active Items</span>
          <span className="stat-value green">{activeItems.length}</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Inactive Items</span>
          <span className="stat-value muted">{items.length - activeItems.length}</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Total Potential Revenue</span>
          <span className="stat-value purple">{formatNaira(totalPotentialRevenue)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-pay-controls">
        <div className="admin-search-wrap">
          <Search size={18} className="admin-search-icon" />
          <input 
            type="text" 
            placeholder="Search payment items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-pay-table-container">
        <table className="admin-pay-table">
          <thead>
            <tr>
              <th>Payment Name</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.name}</td>
                  <td className="font-mono">{formatNaira(item.amount)}</td>
                  <td className="text-muted">{item.description}</td>
                  <td>
                    {/* Custom Toggle Switch */}
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={item.status === "Active"} 
                        onChange={() => toggleStatus(item.id)} 
                      />
                      <span className="slider"></span>
                    </label>
                    <span className={`status-text ${item.status === "Active" ? "text-green" : "text-muted"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="table-actions">
                      <button className="icon-btn edit" onClick={() => openModal(item)} title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDelete(item.id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  <AlertTriangle size={24} />
                  <p>No payment items found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Payment Item" : "Add New Payment Item"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveItem} className="modal-body">
              <div className="form-group">
                <label>Payment Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleFormChange} 
                  placeholder="e.g., School Fees" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Amount (₦) *</label>
                <input 
                  type="number" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleFormChange} 
                  placeholder="e.g., 95000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleFormChange} 
                  placeholder="Brief description for parents..." 
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <CheckCircle2 size={16} /> {editingItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}