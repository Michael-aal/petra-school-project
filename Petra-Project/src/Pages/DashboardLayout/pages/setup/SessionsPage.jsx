import { useEffect, useState } from "react";
import { 
  RefreshCcw, 
  Save, 
  Trash2, 
  Edit3, 
  Copy, 
  Calendar, 
  Clock, 
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  X
} from "lucide-react";
import { academicApi } from "../../../../services/academicApi";
import "../page-styles/SessionsPage.css";

const emptyForm = { 
  id: null,
  name: "", 
  term: "First Term", 
  startsAt: "", 
  endsAt: "", 
  isActive: false 
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await academicApi.sessions();
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      if (editMode && form.id) {
        await academicApi.updateSession(form.id, form);
        showSuccess("Session updated successfully!");
      } else {
        await academicApi.createSession(form);
        showSuccess("Session created successfully!");
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditMode(false);
      await load();
    } catch (e) {
      setError(e.message || "Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (session) => {
    setForm({
      id: session.id,
      name: session.name,
      term: session.term,
      startsAt: session.startsAt.split('T')[0],
      endsAt: session.endsAt.split('T')[0],
      isActive: session.isActive
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDuplicate = async (session) => {
    const duplicatedSession = {
      name: `${session.name} (Copy)`,
      term: session.term,
      startsAt: session.startsAt.split('T')[0],
      endsAt: session.endsAt.split('T')[0],
      isActive: false
    };
    
    try {
      await academicApi.createSession(duplicatedSession);
      showSuccess("Session duplicated successfully!");
      await load();
    } catch (e) {
      setError(e.message || "Failed to duplicate session");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
    
    try {
      await academicApi.deleteSession(id);
      showSuccess("Session deleted successfully!");
      await load();
    } catch (e) {
      setError(e.message || "Failed to delete session");
    }
  };

  const toggleActive = async (session) => {
    try {
      await academicApi.updateSession(session.id, {
        ...session,
        isActive: !session.isActive
      });
      showSuccess(`Session ${session.isActive ? 'deactivated' : 'activated'} successfully!`);
      await load();
    } catch (e) {
      setError(e.message || "Failed to update session status");
    }
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Filter and search sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.term.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTerm === "all" || 
                         (filterTerm === "active" && session.isActive) ||
                         (filterTerm === "inactive" && !session.isActive);
    return matchesSearch && matchesFilter;
  });

  // Statistics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.isActive).length;
  const inactiveSessions = totalSessions - activeSessions;

  return (
    <div className="sessions-page">
      {/* Header */}
      <div className="sessions-header">
        <div className="sessions-header-content">
          <div>
            <h1>Academic Sessions</h1>
            <p>Manage academic terms and sessions for your institution</p>
          </div>
          <div className="sessions-header-actions">
            <button 
              className="btn-secondary" 
              onClick={load} 
              type="button"
              disabled={loading}
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              className="btn-primary" 
              onClick={() => {
                setForm(emptyForm);
                setEditMode(false);
                setShowForm(!showForm);
              }}
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              <span>{showForm ? 'Cancel' : 'Add Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <XCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-total">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Sessions</p>
            <p className="stat-value">{totalSessions}</p>
          </div>
        </div>

        <div className="stat-card stat-card-active">
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Sessions</p>
            <p className="stat-value">{activeSessions}</p>
          </div>
        </div>

        <div className="stat-card stat-card-inactive">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Inactive Sessions</p>
            <p className="stat-value">{inactiveSessions}</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>{editMode ? 'Edit Session' : 'Create New Session'}</h2>
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
                setEditMode(false);
              }}
              className="form-close-btn"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="sessions-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Session Name</label>
                <div className="input-wrapper">
                  <Calendar size={18} />
                  <input
                    type="text"
                    placeholder="e.g., 2025/2026"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Term</label>
                <div className="input-wrapper">
                  <Filter size={18} />
                  <select 
                    value={form.term} 
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    required
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <div className="input-wrapper">
                  <Calendar size={18} />
                  <input 
                    type="date" 
                    value={form.startsAt} 
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>End Date</label>
                <div className="input-wrapper">
                  <Calendar size={18} />
                  <input 
                    type="date" 
                    value={form.endsAt} 
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span className="checkmark"></span>
                <span>Mark as active session</span>
              </label>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setEditMode(false);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary"
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : (editMode ? 'Update Session' : 'Create Session')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="sessions-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select 
            value={filterTerm} 
            onChange={(e) => setFilterTerm(e.target.value)}
          >
            <option value="all">All Sessions</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="sessions-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCcw size={32} className="animate-spin" />
            <p>Loading sessions...</p>
          </div>
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-card-header">
                <div className="session-info">
                  <h3 className="session-name">{session.name}</h3>
                  <div className="session-badges">
                    <span className={`badge ${session.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {session.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="badge badge-term">{session.term}</span>
                  </div>
                </div>
                <div className="session-actions">
                  <button 
                    onClick={() => toggleActive(session)}
                    className={`action-btn ${session.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                    title={session.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {session.isActive ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                  </button>
                  <button 
                    onClick={() => handleEdit(session)}
                    className="action-btn btn-edit"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDuplicate(session)}
                    className="action-btn btn-duplicate"
                    title="Duplicate"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => remove(session.id)}
                    className="action-btn btn-delete"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="session-card-body">
                <div className="session-details">
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>
                      {new Date(session.startsAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="detail-divider">→</div>
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>
                      {new Date(session.endsAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                <div className="session-meta">
                  <div className="meta-item">
                    <Clock size={14} />
                    <span>Duration: {calculateDuration(session.startsAt, session.endsAt)}</span>
                  </div>
                  {session.isActive && (
                    <div className="meta-item meta-highlight">
                      <Clock size={14} />
                      <span>{getDaysRemaining(session.endsAt)} days remaining</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No sessions found</h3>
            <p>
              {searchQuery || filterTerm !== "all" 
                ? "Try adjusting your search or filters" 
                : "Create your first academic session to get started"}
            </p>
            {!searchQuery && filterTerm === "all" && (
              <button 
                onClick={() => {
                  setForm(emptyForm);
                  setEditMode(false);
                  setShowForm(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} />
                <span>Create Session</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}