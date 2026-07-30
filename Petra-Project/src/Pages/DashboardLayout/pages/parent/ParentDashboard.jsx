import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MessageSquare,
  UserCircle2,
  Wallet,
} from "lucide-react";
import "../page-styles/ParentDashboard.css";

const children = [
  {
    name: "Ayo Ogunleye",
    className: "SS2A",
    teacher: "Mrs. Adeyemi",
    status: "On Track",
  },
  {
    name: "Tolu Ogunleye",
    className: "JSS1B",
    teacher: "Mr. Yusuf",
    status: "Needs Support",
  },
];

const attendance = [
  { label: "Present", value: "92%", note: "This term so far" },
  { label: "Absent", value: "3", note: "Recorded this month" },
  { label: "Late", value: "2", note: "This week" },
];

const results = [
  { title: "English", value: "81%", note: "Excellent comprehension" },
  { title: "Mathematics", value: "74%", note: "Needs extra revision" },
  { title: "Biology", value: "79%", note: "Strong practical work" },
];

const assignments = [
  { title: "Science Homework", meta: "Due tomorrow • 08:00" },
  { title: "Reading Log", meta: "Due Friday • 15:00" },
  { title: "Math Practice", meta: "Due Monday • 12:00" },
];

const fees = [
  { title: "School Fees", value: "₦48,000", note: "Outstanding balance" },
  { title: "Transport", value: "₦7,500", note: "Pending this term" },
];

const announcements = [
  { title: "Parent-Teacher Meeting", meta: "Thursday • 10:00" },
  { title: "Mid-Term Revision", meta: "Friday • 14:00" },
];

const messages = [
  { title: "Mrs. Adeyemi", meta: "Your child improved in reading" },
  { title: "School Admin", meta: "Fee reminder for the next installment" },
];

const quickActions = [
  { title: "View Child Profile", icon: UserCircle2, meta: "Open the latest school summary" },
  { title: "Pay School Fees", icon: Wallet, meta: "Settle pending fees securely" },
  { title: "Download Report Card", icon: FileText, meta: "Save the latest academic report" },
  { title: "Contact Teacher", icon: MessageSquare, meta: "Send a note to the class teacher" },
];

export default function ParentDashboard() {
  return (
    <div className="parent-dashboard dashboard-home">
      <section className="parent-hero">
        <article className="parent-hero-card">
          <h3>Welcome back, Mrs. Ogunleye</h3>
          <p>Your children’s progress, school updates, and fee reminders are gathered here in one calm parent workspace.</p>
          <div className="parent-chip-row">
            <span className="parent-chip">2 children enrolled</span>
            <span className="parent-chip">Attendance healthy</span>
            <span className="parent-chip">1 fee reminder</span>
          </div>
        </article>
        <article className="parent-hero-card accent">
          <h3>Today’s priority</h3>
          <p>Review Ayo’s latest assignment and pay the transport fee before Friday.</p>
        </article>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Children Overview</span>
              <strong>2</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="dashboard-home-summary-action tone-blue">
            <span>Active learners</span>
            <ArrowRight size={14} />
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Attendance Summary</span>
              <strong>92%</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="dashboard-home-summary-action tone-teal">
            <span>Excellent</span>
            <ArrowRight size={14} />
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Recent Results</span>
              <strong>3 tasks</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-rose">
              <FileText size={18} />
            </div>
          </div>
          <div className="dashboard-home-summary-action tone-rose">
            <span>Updated today</span>
            <ArrowRight size={14} />
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Upcoming Assignments</span>
              <strong>3</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="dashboard-home-summary-action tone-blue">
            <span>Due soon</span>
            <ArrowRight size={14} />
          </div>
        </article>
      </section>

      <section className="parent-grid">
        <article className="dashboard-home-panel">
          <h2>Children Overview</h2>
          <div className="parent-list">
            {children.map((child) => (
              <div key={child.name} className="parent-list-item">
                <div>
                  <strong>{child.name}</strong>
                  <p>{child.className} • {child.teacher}</p>
                </div>
                <div className="parent-pill">{child.status}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Attendance Summary</h2>
          <div className="parent-list">
            {attendance.map((item) => (
              <div key={item.label} className="parent-list-item">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.note}</p>
                </div>
                <div className="parent-pill">{item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Recent Results</h2>
          <div className="parent-list">
            {results.map((item) => (
              <div key={item.title} className="parent-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.note}</p>
                </div>
                <div className="parent-pill">{item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Upcoming Assignments</h2>
          <div className="parent-list">
            {assignments.map((item) => (
              <div key={item.title} className="parent-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Outstanding School Fees</h2>
          <div className="parent-list">
            {fees.map((item) => (
              <div key={item.title} className="parent-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.note}</p>
                </div>
                <div className="parent-pill">{item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Recent Announcements</h2>
          <div className="parent-list">
            {announcements.map((item) => (
              <div key={item.title} className="parent-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Messages from Teachers</h2>
          <div className="parent-list">
            {messages.map((item) => (
              <div key={item.title} className="parent-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-home-panel">
          <h2>Quick Actions</h2>
          <div className="parent-actions">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} type="button" className="parent-action-btn">
                  <div className="dashboard-home-account-row">
                    <div className="dashboard-home-account-icon">
                      <Icon size={16} />
                    </div>
                    <div className="dashboard-home-account-text">
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
