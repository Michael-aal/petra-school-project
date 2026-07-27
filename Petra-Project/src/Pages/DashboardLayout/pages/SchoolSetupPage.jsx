import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, ArrowRight, School } from "lucide-react";
import "./page-styles/DashboardHomePage.css";

const sections = [
  {
    title: "School Profile",
    description: "Keep identity and contact details in one place.",
    link: "/dashboard/setup/profile",
  },
  {
    title: "Academic Sessions",
    description: "Prepare terms, sessions, and calendar windows.",
    link: "/dashboard/setup/sessions",
  },
  {
    title: "Classes",
    description: "Organize class structure and class arms.",
    link: "/dashboard/setup/classes",
  },
  {
    title: "Subjects",
    description: "Maintain the curriculum and subject catalog.",
    link: "/dashboard/setup/subjects",
  },
];

export default function SchoolSetupPage() {
  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>School Setup</h1>
          <p>Configure the foundation of the school before daily operations begin.</p>
        </div>
        <div className="dashboard-home-session-pill">Admin Workspace</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Setup Areas</span>
              <strong>{sections.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <School size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Ready to configure</span>
              <strong>Yes</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <CalendarDays size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Curriculum tools</span>
              <strong>Available</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-rose">
              <BookOpen size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel">
        <div className="dashboard-home-content" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {sections.map((section) => (
            <article key={section.title} className="dashboard-home-panel" style={{ marginBottom: 0 }}>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <Link to={section.link} className="dashboard-home-summary-action tone-blue" style={{ marginTop: 16 }}>
                <span>Open</span>
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
