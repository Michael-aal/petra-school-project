import { useState } from "react";
import {
  Users,
  GraduationCap,
  Wallet,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Download,
  BookOpen,
  UserCheck,
  ShieldCheck,
  School
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "./page-styles/DashboardHomePage.css";

const schoolStats = [
  {
    title: "Total Students",
    value: "1,248",
    delta: "+6.4%",
    positive: true,
    period: "vs last term",
    icon: GraduationCap,
    tone: "blue"
  },
  {
    title: "Today's Attendance",
    value: "94.2%",
    delta: "+2.1%",
    positive: true,
    period: "1,175 present",
    icon: UserCheck,
    tone: "green"
  },
  {
    title: "Term Fees Collected",
    value: "₦48.2M",
    delta: "82% settled",
    positive: true,
    period: "₦10.5M outstanding",
    icon: Wallet,
    tone: "blue"
  },
  {
    title: "Active Staff & Faculty",
    value: "84",
    delta: "100%",
    positive: true,
    period: "All classes covered",
    icon: Users,
    tone: "navy"
  }
];

const attendanceWeekly = [
  { day: "Mon", attendance: 96, fees: 84 },
  { day: "Tue", attendance: 95, fees: 90 },
  { day: "Wed", attendance: 93, fees: 88 },
  { day: "Thu", attendance: 97, fees: 92 },
  { day: "Fri", attendance: 91, fees: 85 }
];

const recentTransactions = [
  { id: "TX-9042", student: "Adebayo Ogunleye", class: "SS 3 Alpha", fee: "Tuition - Second Term", amount: "₦95,000", status: "Paid", date: "Today, 09:42 AM" },
  { id: "TX-9041", student: "Fatima Abdullahi", class: "JSS 2 Gold", fee: "Science Lab & Library", amount: "₦25,000", status: "Paid", date: "Today, 08:30 AM" },
  { id: "TX-9040", student: "Chinedu Okeke", class: "Primary 5 Diamond", fee: "Bus Route - Lekki", amount: "₦40,000", status: "Pending", date: "Yesterday, 04:15 PM" },
  { id: "TX-9039", student: "Zainab Ibrahim", class: "SS 1 Silver", fee: "Uniform & Books Pack", amount: "₦35,000", status: "Paid", date: "Yesterday, 02:20 PM" },
  { id: "TX-9038", student: "Emeka Nwosu", class: "JSS 1 Blue", fee: "Tuition - Second Term", amount: "₦90,000", status: "Overdue", date: "18 Sep 2026" }
];

const quickAnnouncements = [
  { title: "Mid-Term Assessment Schedule", time: "2 hrs ago", author: "Academic Board", badge: "Academics" },
  { title: "Parent-Teacher Association Meeting", time: "Yesterday", author: "Principal's Office", badge: "Notice" },
  { title: "Inter-House Sports Competition Prep", time: "2 days ago", author: "Sports Dept", badge: "Event" }
];

export default function DashboardHomePage() {
  const [selectedTerm, setSelectedTerm] = useState("2026/2027 • Second Term");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = recentTransactions.filter((tx) =>
    tx.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.fee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="petra-dashboard-page">
      {/* Header Banner */}
      <header className="petra-dash-header">
        <div className="petra-dash-header-copy">
          <div className="petra-dash-pill">
            <span className="live-dot" />
            <School size={14} />
            <span>Academic Command Center • {selectedTerm}</span>
          </div>
          <h1>School Overview & Operations</h1>
          <p>Real-time telemetry across academic progress, daily attendance, fee settlements, and campus workflows.</p>
        </div>

        <div className="petra-dash-header-actions">
          <NavLink to="/dashboard/students/enrollment/create" className="btn-dash-primary">
            <PlusCircle size={16} /> Enroll Learner
          </NavLink>
          <NavLink to="/dashboard/finance/payments" className="btn-dash-secondary">
            <Wallet size={16} /> Collect Fees
          </NavLink>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="petra-stats-grid">
        {schoolStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className={`petra-stat-card tone-${stat.tone}`} key={stat.title}>
              <div className="petra-stat-card-head">
                <span className="petra-stat-label">{stat.title}</span>
                <div className="petra-stat-icon-wrap">
                  <Icon size={18} />
                </div>
              </div>
              <strong className="petra-stat-value">{stat.value}</strong>
              <div className="petra-stat-foot">
                <span className={`petra-stat-pill ${stat.positive ? "is-pos" : "is-neg"}`}>
                  {stat.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.delta}
                </span>
                <span className="petra-stat-period">{stat.period}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* Main Grid: Charts & Panels */}
      <div className="petra-dashboard-grid">
        {/* Left Column (2fr): Attendance & Transactions */}
        <div className="petra-grid-main">
          {/* Weekly Attendance & Fee Trend Card */}
          <section className="petra-card petra-trend-card">
            <div className="petra-card-header">
              <div>
                <span className="petra-card-eyebrow">Weekly Telemetry</span>
                <h2>Daily Attendance & Engagement</h2>
              </div>
              <div className="petra-chart-legend">
                <span><i className="legend-dot blue" /> Attendance Rate</span>
                <span><i className="legend-dot navy" /> Target (95%)</span>
              </div>
            </div>

            {/* Custom SVG Responsive Chart */}
            <div className="petra-svg-chart-wrap">
              <svg viewBox="0 0 500 160" className="petra-svg-chart" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeDasharray="4 4" />
                
                {/* Area and Line for Attendance */}
                <polygon points="0,150 0,40 100,50 200,65 300,35 400,80 500,60 500,150" fill="url(#attendanceGradient)" />
                <polyline points="0,40 100,50 200,65 300,35 400,80 500,60" fill="none" stroke="#2563eb" strokeWidth="3" />
                {/* Target Line (95%) */}
                <line x1="0" y1="42" x2="500" y2="42" stroke="#0f2747" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />

                {/* Data Points */}
                <circle cx="0" cy="40" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="100" cy="50" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="200" cy="65" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="300" cy="35" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx="400" cy="80" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="500" cy="60" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>
              <div className="petra-chart-x-labels">
                {attendanceWeekly.map((item) => (
                  <div key={item.day} className="chart-day-col">
                    <strong>{item.attendance}%</strong>
                    <span>{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics Bar below chart */}
            <div className="petra-metric-bar">
              <div className="metric-col">
                <span>Classrooms Active</span>
                <strong>38 / 38</strong>
              </div>
              <div className="metric-col">
                <span>Late Check-ins</span>
                <strong>14</strong>
              </div>
              <div className="metric-col">
                <span>Excused Absences</span>
                <strong>12</strong>
              </div>
              <div className="metric-col">
                <span>Unexcused</span>
                <strong className="text-danger">3</strong>
              </div>
            </div>
          </section>

          {/* Recent Collections & Transactions Table */}
          <section className="petra-card petra-table-card">
            <div className="petra-card-header">
              <div>
                <span className="petra-card-eyebrow">Financial Flow</span>
                <h2>Recent Student Payments</h2>
              </div>
              <div className="petra-table-search-wrap">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Filter student or fee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="petra-table-responsive">
              <table className="petra-data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="font-mono text-muted">{tx.id}</td>
                      <td><strong>{tx.student}</strong></td>
                      <td><span className="class-tag">{tx.class}</span></td>
                      <td className="text-muted">{tx.fee}</td>
                      <td><strong>{tx.amount}</strong></td>
                      <td>
                        <span className={`status-pill ${tx.status.toLowerCase()}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="text-muted">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (1fr): Quick Actions, Announcements, Ask Nuvora */}
        <div className="petra-grid-sidebar">
          {/* Ask Nuvora AI Assistant Widget */}
          <section className="petra-card petra-ai-widget">
            <div className="ai-widget-header">
              <div className="ai-badge">
                <Sparkles size={14} />
                <span>Nuvora Intelligence</span>
              </div>
              <h3>Ask School OS</h3>
            </div>
            <p className="ai-widget-desc">
              Get instant analytical queries, student academic reports, fee reconciliation, and timetable lookups.
            </p>
            <div className="ai-prompt-suggestions">
              <button type="button" onClick={() => {}}>“Show outstanding fees for SS3”</button>
              <button type="button" onClick={() => {}}>“Compare attendance with last term”</button>
            </div>
            <NavLink to="/dashboard/ask-nuvora" className="btn-ai-launch">
              Launch Nuvora AI <ChevronRight size={15} />
            </NavLink>
          </section>

          {/* School Announcements */}
          <section className="petra-card petra-notice-card">
            <div className="petra-card-header compact">
              <div>
                <span className="petra-card-eyebrow">Campus Broadcast</span>
                <h2>Announcements</h2>
              </div>
              <NavLink to="/dashboard/communication/announcements" className="link-view-all">
                View All
              </NavLink>
            </div>

            <div className="petra-notices-list">
              {quickAnnouncements.map((notice) => (
                <article className="petra-notice-item" key={notice.title}>
                  <div className="notice-head">
                    <span className="notice-badge">{notice.badge}</span>
                    <span className="notice-time"><Clock size={12} /> {notice.time}</span>
                  </div>
                  <h4>{notice.title}</h4>
                  <span className="notice-author">By {notice.author}</span>
                </article>
              ))}
            </div>
          </section>

          {/* Quick Hub Links */}
          <section className="petra-card petra-quicklinks-card">
            <h3>Operational Modules</h3>
            <div className="quicklinks-grid">
              <NavLink to="/dashboard/academics/attendance" className="quicklink-item">
                <CalendarCheck size={17} />
                <span>Attendance Log</span>
              </NavLink>
              <NavLink to="/dashboard/examination/cbt" className="quicklink-item">
                <BookOpen size={17} />
                <span>CBT Engine</span>
              </NavLink>
              <NavLink to="/dashboard/students/gate" className="quicklink-item">
                <ShieldCheck size={17} />
                <span>Gate Pass</span>
              </NavLink>
              <NavLink to="/dashboard/finance/invoices" className="quicklink-item">
                <Wallet size={17} />
                <span>Invoicing</span>
              </NavLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
