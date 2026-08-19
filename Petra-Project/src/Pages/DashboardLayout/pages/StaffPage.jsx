import { ArrowRight, BookCheck, ShieldCheck, Sparkles, UserCog } from "lucide-react";
import "./page-styles/StaffPage.css";

const highlights = [
  { label: "Active staff", value: "42", icon: UserCog, tone: "tone-blue" },
  { label: "Attendance synced", value: "98%", icon: BookCheck, tone: "tone-teal" },
  { label: "Secure access", value: "24/7", icon: ShieldCheck, tone: "tone-rose" },
];

export default function StaffPage() {
  return (
    <div className="dashboard-home staff-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Staff</h1>
          <p>Manage teachers, administrators, and attendance workflows from one polished operations hub.</p>
        </div>
        <div className="dashboard-home-session-pill">People operations</div>
      </section>

      <section className="dashboard-home-summary">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="dashboard-home-summary-card">
              <div className="dashboard-home-summary-top">
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className={`dashboard-home-summary-icon ${item.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-home-content">
        <article className="dashboard-home-panel">
          <h2>Staff coverage</h2>
          <div className="staff-page-card">
            <div className="staff-page-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <strong>Balanced staffing visibility</strong>
              <p>Keep departments, class assignments, and attendance expectations in sync without breaking the flow.</p>
            </div>
          </div>
        </article>
        <article className="dashboard-home-panel">
          <h2>Need attention</h2>
          <ul className="staff-page-list">
            <li>Review 3 pending staff profile updates.</li>
            <li>Confirm 2 class assignments for the next term.</li>
            <li>Share attendance reminders with the faculty team.</li>
          </ul>
          <button className="dashboard-home-summary-action tone-blue" type="button">
            <span>Open staff workspace</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>
    </div>
  );
}
