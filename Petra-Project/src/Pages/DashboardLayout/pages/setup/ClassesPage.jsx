import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import "../page-styles/ClassesPage.css";

const classArms = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

export default function ClassesPage() {
  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Classes</h1>
          <p>Define class groups, arms, and how learners are organized.</p>
        </div>
        <div className="dashboard-home-session-pill">Setup</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Class arms</span>
              <strong>{classArms.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Users size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Structure</span>
              <strong>Primary + Secondary</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <BookOpen size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel">
        <h2>Configured class groups</h2>
        <div className="parent-list">
          {classArms.map((className) => (
            <div key={className} className="parent-list-item">
              <div>
                <strong>{className}</strong>
                <p>Use this as a base class group for enrollment and results.</p>
              </div>
              <div className="parent-pill">Ready</div>
            </div>
          ))}
        </div>
        <Link to="/dashboard/students/enrollment" className="dashboard-home-summary-action tone-blue" style={{ marginTop: 16 }}>
          <span>Manage enrollments</span>
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
