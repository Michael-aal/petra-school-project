import { ArrowRight, BadgeCheck, GraduationCap, UserRoundPlus, Users2 } from "lucide-react";
import "./page-styles/StudentsPage.css";

const highlights = [
  { label: "Registered learners", value: "320", icon: Users2, tone: "tone-blue" },
  { label: "Ready for enrollment", value: "18", icon: UserRoundPlus, tone: "tone-teal" },
  { label: "Active guardians", value: "280", icon: BadgeCheck, tone: "tone-rose" },
];

const focusAreas = [
  "Maintain student profiles, classes, and attendance in one place.",
  "Keep parent and guardian links synced for every learner.",
  "Track gate movement and admission progress without leaving the dashboard.",
];

export default function StudentsPage() {
  return (
    <div className="dashboard-home students-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Students</h1>
          <p>Track learner records, enrollment momentum, parent links, and gate movement from a unified admin workspace.</p>
        </div>
        <div className="dashboard-home-session-pill">Admissions & records</div>
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
          <h2>Enrollment flow</h2>
          <div className="students-page-hero-card">
            <div className="students-page-hero-icon">
              <GraduationCap size={18} />
            </div>
            <div>
              <strong>Student operations stay connected</strong>
              <p>From enrollment to daily classroom activity, the student workspace is designed for fast follow-up and clear visibility.</p>
            </div>
          </div>
          <ul className="students-page-list">
            {focusAreas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="dashboard-home-panel">
          <h2>Priority actions</h2>
          <div className="students-page-stack">
            <div className="students-page-stack-item">
              <span>Upcoming review</span>
              <strong>12 new student records</strong>
            </div>
            <div className="students-page-stack-item">
              <span>Parent sync</span>
              <strong>4 guardian profiles need review</strong>
            </div>
            <div className="students-page-stack-item">
              <span>Gate status</span>
              <strong>All movement logs synced</strong>
            </div>
          </div>
          <button className="dashboard-home-summary-action tone-blue" type="button">
            <span>Open student workspace</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>
    </div>
  );
}
