import { useState } from "react";
import { 
  Link as LinkIcon, Copy, Mail, CheckCircle2, Clock, 
  Users, Search, ShieldCheck, AlertCircle 
} from "lucide-react";
import "./PortalLinksPage.css";

// Mock Data (Replace with API data later)
const initialParents = [
  { id: 1, parentName: "Mr. Ogunleye Kayode", email: "ogunleye.k@gmail.com", linkedStudents: 2, inviteStatus: "Active", lastInvited: "2 days ago" },
  { id: 2, parentName: "Mrs. Adebayo Vitor", email: "vitor.adebayo@yahoo.com", linkedStudents: 1, inviteStatus: "Pending", lastInvited: "5 hours ago" },
  { id: 3, parentName: "Chif Fakorade", email: "fakorade.chief@outlook.com", linkedStudents: 3, inviteStatus: "Active", lastInvited: "1 week ago" },
  { id: 4, parentName: "Alhaji Ibrahim", email: "ibrahim.a@gmail.com", linkedStudents: 2, inviteStatus: "Pending", lastInvited: "Just now" },
];

export default function PortalLinksPage() {
  const [parents, setParents] = useState(initialParents);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Filter parents based on search
  const filteredParents = parents.filter(parent => 
    parent.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalParents = parents.length;
  const activeAccounts = parents.filter(p => p.inviteStatus === "Active").length;
  const pendingInvites = parents.filter(p => p.inviteStatus === "Pending").length;

  // Handle Copy Link
  const handleCopyLink = (parent) => {
    const loginUrl = `${window.location.origin}/signin?email=${encodeURIComponent(parent.email)}`;
    navigator.clipboard.writeText(loginUrl);
    
    setCopiedId(parent.id);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  // Handle Send Email
  const handleSendEmail = (parent) => {
    const loginUrl = `${window.location.origin}/signin`;
    const subject = `Your Parent Portal Access for ${parent.parentName}`;
    const body = `Hello ${parent.parentName},\n\nYour school has activated your parent portal. You can now view your children's results, attendance, and fees.\n\nPlease go to: ${loginUrl}\nand log in using this email address: ${parent.email}\n\nIf you have any issues, please contact the school admin.`;
    
    window.location.href = `mailto:${parent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="portal-links-page">
      {/* Header */}
      <div className="pl-header">
        <div className="pl-header-left">
          <div className="pl-icon-box">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2>Parent Portal Access</h2>
            <p>Manage invitations and distribute secure login links to parents.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="pl-stats">
        <div className="pl-stat-card">
          <div className="pl-stat-icon blue">
            <Users size={20} />
          </div>
          <div>
            <span className="pl-stat-value">{totalParents}</span>
            <span className="pl-stat-label">Total Parents</span>
          </div>
        </div>
        <div className="pl-stat-card">
          <div className="pl-stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="pl-stat-value">{activeAccounts}</span>
            <span className="pl-stat-label">Active Accounts</span>
          </div>
        </div>
        <div className="pl-stat-card">
          <div className="pl-stat-icon orange">
            <Clock size={20} />
          </div>
          <div>
            <span className="pl-stat-value">{pendingInvites}</span>
            <span className="pl-stat-label">Pending Invites</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="pl-controls">
        <div className="pl-search-wrapper">
          <Search size={18} className="pl-search-icon" />
          <input 
            type="text" 
            placeholder="Search parent by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-search-input"
          />
        </div>
      </div>

      {/* Parent List */}
      <div className="pl-list-container">
        {filteredParents.length > 0 ? (
          <div className="pl-list">
            {filteredParents.map((parent) => (
              <div key={parent.id} className="pl-list-item">
                {/* Left: Avatar & Info */}
                <div className="pl-item-left">
                  <div className="pl-avatar">
                    {parent.parentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="pl-info">
                    <h4>{parent.parentName}</h4>
                    <p>{parent.email}</p>
                    <span className="pl-wards-badge">
                      <Users size={12} /> {parent.linkedStudents} Ward{parent.linkedStudents !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Center: Status & Last Invited */}
                <div className="pl-item-center">
                  <span className={`pl-status-badge ${parent.inviteStatus.toLowerCase()}`}>
                    {parent.inviteStatus === "Active" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {parent.inviteStatus}
                  </span>
                  <span className="pl-last-invited">
                    {parent.inviteStatus === "Pending" ? "Invited " : "Activated "} {parent.lastInvited}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="pl-item-right">
                  <button 
                    className="pl-btn pl-btn-copy" 
                    onClick={() => handleCopyLink(parent)}
                    title="Copy Login Link"
                  >
                    {copiedId === parent.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    <span>{copiedId === parent.id ? "Copied!" : "Copy Link"}</span>
                  </button>
                  
                  <button 
                    className="pl-btn pl-btn-primary" 
                    onClick={() => handleSendEmail(parent)}
                  >
                    <Mail size={16} />
                    <span>Send Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pl-empty-state">
            <AlertCircle size={32} />
            <h3>No parents found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}