import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  School,
  Users,
  GraduationCap,
  Wallet,
  CalendarCheck,
  BookOpen,
  Settings,
  UserPlus,
  PlusCircle,
  Megaphone,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  ShieldCheck,
  Clock,
  Layers,
  HelpCircle,
  Building2
} from "lucide-react";
import "./CommandPalette.css";

const commandItems = [
  // Quick Actions
  { id: "act-enroll", title: "Enroll New Learner", category: "Quick Actions", icon: UserPlus, path: "/dashboard/students/enrollment/create", shortcut: "E" },
  { id: "act-fees", title: "Collect School Fees", category: "Quick Actions", icon: Wallet, path: "/dashboard/finance/payments", shortcut: "F" },
  { id: "act-attendance", title: "Take Morning Attendance", category: "Quick Actions", icon: CalendarCheck, path: "/dashboard/academics/attendance", shortcut: "A" },
  { id: "act-announce", title: "Broadcast School Announcement", category: "Quick Actions", icon: Megaphone, path: "/dashboard/communication/announcements", shortcut: "N" },
  { id: "act-ai", title: "Ask Nuvora Intelligence", category: "Quick Actions", icon: Sparkles, path: "/dashboard/ask-nuvora", shortcut: "Q" },

  // Modules & Pages
  { id: "mod-overview", title: "Overview & Telemetry", category: "Navigation", icon: School, path: "/dashboard/overview" },
  { id: "mod-students", title: "Students Directory", category: "Navigation", icon: GraduationCap, path: "/dashboard/students" },
  { id: "mod-parents", title: "Parents & Guardians", category: "Navigation", icon: Users, path: "/dashboard/students/parents" },
  { id: "mod-staff", title: "Teachers & Staff Roster", category: "Navigation", icon: Users, path: "/dashboard/staff/teachers" },
  { id: "mod-academics", title: "Academic Sessions & Classes", category: "Navigation", icon: BookOpen, path: "/dashboard/academics" },
  { id: "mod-timetable", title: "School Timetable", category: "Navigation", icon: Clock, path: "/dashboard/academics/timetable" },
  { id: "mod-cbt", title: "CBT Examination Engine", category: "Navigation", icon: ShieldCheck, path: "/dashboard/examination/cbt" },
  { id: "mod-results", title: "Academic Results & Reports", category: "Navigation", icon: FileText, path: "/dashboard/examination/results" },
  { id: "mod-invoices", title: "Invoices & Billing", category: "Navigation", icon: Wallet, path: "/dashboard/finance/invoices" },
  { id: "mod-cashflow", title: "Cashflow & Financial Ledger", category: "Navigation", icon: Wallet, path: "/dashboard/finance/cashflow" },
  { id: "mod-gate", title: "Gate & Campus Pass Log", category: "Navigation", icon: ShieldCheck, path: "/dashboard/students/gate" },
  { id: "mod-settings", title: "System & School Settings", category: "Navigation", icon: Settings, path: "/dashboard/settings" },
  { id: "mod-profile", title: "Institutional Profile", category: "Navigation", icon: Building2, path: "/dashboard/setup/profile" },
  { id: "mod-support", title: "Help & Support Hub", category: "Navigation", icon: HelpCircle, path: "/dashboard/communication/support" },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const filteredItems = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group filtered items by category
  const categories = Array.from(new Set(filteredItems.map((item) => item.category)));

  return (
    <div className="petra-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Global Command Palette">
      <div className="petra-palette-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="petra-palette-header">
          <Search size={20} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Search modules, quick actions, or records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button type="button" className="palette-clear-btn" onClick={() => setQuery("")} aria-label="Clear query">
              <X size={16} />
            </button>
          )}
          <span className="palette-kbd">ESC</span>
        </div>

        {/* Results List */}
        <div className="petra-palette-body" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="palette-empty">
              <HelpCircle size={28} />
              <strong>No matching actions found</strong>
              <p>Try searching for "attendance", "fees", "cbt", or "enroll".</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="palette-group">
                <span className="palette-group-label">{cat}</span>
                <div className="palette-group-items">
                  {filteredItems
                    .filter((item) => item.category === cat)
                    .map((item) => {
                      const Icon = item.icon;
                      const globalIndex = filteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          className={`palette-item ${isSelected ? "is-selected" : ""}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <div className="palette-item-icon">
                            <Icon size={16} />
                          </div>
                          <div className="palette-item-content">
                            <strong>{item.title}</strong>
                            <span>{item.path}</span>
                          </div>
                          {item.shortcut && <span className="palette-shortcut-key">{item.shortcut}</span>}
                          <ArrowRight size={14} className="palette-item-arrow" />
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <footer className="petra-palette-footer">
          <div className="palette-footer-tips">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className="palette-footer-brand">Petra School OS</span>
        </footer>
      </div>
    </div>
  );
}
