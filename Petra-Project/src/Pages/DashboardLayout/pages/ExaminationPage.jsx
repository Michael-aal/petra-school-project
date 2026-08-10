import { ArrowRight, ClipboardCheck, FileCheck2, MonitorPlay, ShieldCheck } from "lucide-react";
import "./page-styles/ExaminationPage.css";

const highlights = [
  { label: "Active CBT exams", value: "4", icon: MonitorPlay, tone: "tone-blue" },
  { label: "Results ready", value: "92%", icon: ClipboardCheck, tone: "tone-teal" },
  { label: "Report cards", value: "11", icon: FileCheck2, tone: "tone-rose" },
];

export default function ExaminationPage() {
  return (
    <div className="dashboard-home examination-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Examination</h1>
          <p>Manage CBT exams, results, and report cards with a more focused, premium admin experience.</p>
        </div>
        <div className="dashboard-home-session-pill">Assessment center</div>
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
          <h2>Assessment readiness</h2>
          <div className="examination-page-card">
            <div className="examination-page-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Secure and structured</strong>
              <p>Keep exam schedules, result processing, and report delivery consistent across every academic cycle.</p>
            </div>
          </div>
        </article>
        <article className="dashboard-home-panel">
          <h2>Upcoming handoff</h2>
          <ul className="examination-page-list">
            <li>Publish 2 exam timetables for the next round.</li>
            <li>Review result exceptions before release.</li>
            <li>Finalize report card templates for the term.</li>
          </ul>
          <button className="dashboard-home-summary-action tone-blue" type="button">
            <span>Open examination hub</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>
    </div>
  );
}
