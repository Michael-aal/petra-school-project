import '../page-styles/GatePage.css';
import { useState, useEffect } from "react";
import { 
  LogIn, LogOut, ShieldCheck, Clock, Users, Search, 
  AlertTriangle, PlusCircle, ArrowRight 
} from "lucide-react";

// Mock initial data for the live feed
const generateInitialEvents = () => [
  { id: 1, studentName: "Ogunleye Kayode", studentClass: "SS2", time: "07:45 AM", direction: "Entry", gate: "Main Gate" },
  { id: 2, studentName: "Adebayo Vitor", studentClass: "SS2", time: "07:48 AM", direction: "Entry", gate: "Main Gate" },
  { id: 3, studentName: "Feyishikemi Ifekorode", studentClass: "SS2", time: "07:52 AM", direction: "Entry", gate: "Main Gate" },
  { id: 4, studentName: "John Doe", studentClass: "JSS1", time: "08:15 AM", direction: "Exit", gate: "Back Gate" },
  { id: 5, studentName: "Sarah Smith", studentClass: "SS1", time: "08:30 AM", direction: "Entry", gate: "Main Gate" },
];

export default function GatePage() {
  const [events, setEvents] = useState(generateInitialEvents());
  const [searchQuery, setSearchQuery] = useState("");
  const [manualLog, setManualLog] = useState({ studentName: "", direction: "Entry", gate: "Main Gate" });

  // Calculate live stats
  const totalEntries = events.filter(e => e.direction === "Entry").length;
  const totalExits = events.filter(e => e.direction === "Exit").length;
  const currentlyOnCampus = totalEntries - totalExits;

  // Filter events based on search
  const filteredEvents = events.filter(e => 
    e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.studentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle manual logging by security
  const handleManualLog = (e) => {
    e.preventDefault();
    if (!manualLog.studentName.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newEvent = {
      id: Date.now(),
      studentName: manualLog.studentName,
      studentClass: "Manual", // Or let them select a class
      time: timeString,
      direction: manualLog.direction,
      gate: manualLog.gate,
    };

    // Add to the top of the list
    setEvents(prev => [newEvent, ...prev]);
    setManualLog({ studentName: "", direction: manualLog.direction, gate: manualLog.gate });
  };

  return (
    <div className="gate-monitoring-page">
      {/* Header */}
      <div className="gate-header">
        <div className="gate-header-left">
          <div className="gate-title-group">
            <ShieldCheck size={24} />
            <div>
              <h2>Gate Monitoring</h2>
              <p>Real-time student entry and exit tracking</p>
            </div>
          </div>
          <div className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
        </div>
        
        <div className="gate-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search student or class..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gate-stats">
        <div className="gate-stat-card">
          <div className="gate-stat-icon entry-icon"><LogIn size={20} /></div>
          <div>
            <span className="gate-stat-value">{totalEntries}</span>
            <span className="gate-stat-label">Total Entries</span>
          </div>
        </div>
        <div className="gate-stat-card">
          <div className="gate-stat-icon exit-icon"><LogOut size={20} /></div>
          <div>
            <span className="gate-stat-value">{totalExits}</span>
            <span className="gate-stat-label">Total Exits</span>
          </div>
        </div>
        <div className="gate-stat-card">
          <div className="gate-stat-icon campus-icon"><Users size={20} /></div>
          <div>
            <span className="gate-stat-value">{currentlyOnCampus}</span>
            <span className="gate-stat-label">Currently On Campus</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="gate-content-grid">
        
        {/* Left: Live Feed */}
        <div className="gate-feed-panel">
          <div className="panel-header">
            <h3><Clock size={18} /> Recent Activity</h3>
            <span className="feed-count">{filteredEvents.length} events</span>
          </div>

          <div className="gate-feed-list">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event.id} className={`gate-event-item ${event.direction === "Entry" ? "event-entry" : "event-exit"}`}>
                  <div className={`event-direction-icon ${event.direction === "Entry" ? "icon-entry" : "icon-exit"}`}>
                    {event.direction === "Entry" ? <LogIn size={16} /> : <LogOut size={16} />}
                  </div>
                  <div className="event-details">
                    <div className="event-student-info">
                      <span className="event-student-name">{event.studentName}</span>
                      <span className="event-student-class">{event.studentClass}</span>
                    </div>
                    <div className="event-meta">
                      <span className="event-time">{event.time}</span>
                      <span className="event-gate">{event.gate}</span>
                    </div>
                  </div>
                  <div className={`event-status-badge ${event.direction === "Entry" ? "badge-entry" : "badge-exit"}`}>
                    {event.direction}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-feed">
                <AlertTriangle size={24} />
                <p>No matching gate events found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Manual Log Panel */}
        <div className="gate-manual-panel">
          <div className="panel-header">
            <h3><PlusCircle size={18} /> Manual Override</h3>
          </div>
          <p className="manual-description">
            Use this form to manually log a student if the automated gate system fails to scan their ID.
          </p>

          <form className="manual-log-form" onSubmit={handleManualLog}>
            <div className="form-group">
              <label>Student Name</label>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={manualLog.studentName}
                onChange={(e) => setManualLog({...manualLog, studentName: e.target.value})}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Direction</label>
                <select 
                  value={manualLog.direction}
                  onChange={(e) => setManualLog({...manualLog, direction: e.target.value})}
                >
                  <option value="Entry">Entry (Coming In)</option>
                  <option value="Exit">Exit (Going Out)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gate</label>
                <select 
                  value={manualLog.gate}
                  onChange={(e) => setManualLog({...manualLog, gate: e.target.value})}
                >
                  <option value="Main Gate">Main Gate</option>
                  <option value="Back Gate">Back Gate</option>
                  <option value="Boarding Gate">Boarding Gate</option>
                </select>
              </div>
            </div>

            <button type="submit" className="manual-submit-btn">
              Log Movement <ArrowRight size={16} />
            </button>
          </form>

          <div className="security-notice">
            <AlertTriangle size={14} />
            <span>All manual logs are recorded in the security audit trail.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
