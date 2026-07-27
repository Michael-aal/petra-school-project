import { ArrowRight, BookOpen, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import "../page-styles/SubjectsPage.css";

const subjects = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "Civic Education"];

export default function SubjectsPage() {
  return (
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Subjects</h1>
          <p>Maintain the curriculum catalog and align it with the school structure.</p>
        </div>
        <div className="dashboard-home-session-pill">Setup</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Subjects</span>
              <strong>{subjects.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <ClipboardList size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Curriculum</span>
              <strong>Active</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <BookOpen size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel">
        <h2>Available subjects</h2>
        <div className="parent-list">
          {subjects.map((subject) => (
            <div key={subject} className="parent-list-item">
              <div>
                <strong>{subject}</strong>
                <p>Linked to class schedules, results, and teacher assignments.</p>
              </div>
              <div className="parent-pill">Ready</div>
            </div>
          ))}
        </div>
        <Link
          to="/dashboard/academics/timetable"
          className="dashboard-home-summary-action tone-blue"
          style={{ marginTop: 16 }}
        >
          <span>Review timetable usage</span>
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
