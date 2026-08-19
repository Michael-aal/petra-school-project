import { ArrowRight, BellRing, MailOpen, MessagesSquare, LifeBuoy } from "lucide-react";
import "./page-styles/CommunicationPage.css";

const highlights = [
  { label: "Unread updates", value: "14", icon: BellRing, tone: "tone-blue" },
  { label: "Support tickets", value: "6", icon: LifeBuoy, tone: "tone-teal" },
  { label: "Sent today", value: "22", icon: MailOpen, tone: "tone-rose" },
];

export default function CommunicationPage() {
  return (
    <div className="dashboard-home communication-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Communication</h1>
          <p>Coordinate notifications, parent updates, and support conversations in a single calm workspace.</p>
        </div>
        <div className="dashboard-home-session-pill">School engagement</div>
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
          <h2>Current focus</h2>
          <div className="communication-page-card">
            <div className="communication-page-icon">
              <MessagesSquare size={18} />
            </div>
            <div>
              <strong>Communication stays organized</strong>
              <p>Use the channel to keep families, teachers, and support teams aligned around the right updates.</p>
            </div>
          </div>
        </article>
        <article className="dashboard-home-panel">
          <h2>Action queue</h2>
          <ul className="communication-page-list">
            <li>Approve 4 pending announcement drafts.</li>
            <li>Respond to 2 urgent support requests.</li>
            <li>Schedule the next parent update bulletin.</li>
          </ul>
          <button className="dashboard-home-summary-action tone-blue" type="button">
            <span>Open communication center</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>
    </div>
  );
}
