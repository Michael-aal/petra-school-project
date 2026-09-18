import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, GraduationCap, Users2 } from "lucide-react";
import { studentApi } from "../../../services/studentApi";
import "./page-styles/StudentsPage.css";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    studentApi
      .list({ page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        setStudents(Array.isArray(response?.students) ? response.students : []);
      })
      .catch((err) => {
        if (!active) return;
        setStudents([]);
        setError(err?.data?.message || err?.message || "Unable to load students.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeCount = students.filter((student) => String(student.status).toLowerCase() === "active").length;
    const guardians = new Set(
      students
        .map((student) => String(student.parentId || student.parentEmail || student.guardianName || "").trim().toLowerCase())
        .filter(Boolean),
    ).size;

    return [
      { label: "Registered learners", value: students.length, icon: Users2, tone: "tone-blue" },
      { label: "Active students", value: activeCount, icon: CheckCircle2, tone: "tone-teal" },
      { label: "Linked guardians", value: guardians, icon: Users2, tone: "tone-rose" },
    ];
  }, [students]);

  const recentStudents = students.slice(0, 5);

  return (
    <div className="dashboard-home students-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Students</h1>
          <p>Live student records, enrollment status, classes, and guardian links from your school database.</p>
        </div>
        <div className="dashboard-home-session-pill">Live records</div>
      </section>

      {error ? <div className="dashboard-alert error">{error}</div> : null}

      <section className="dashboard-home-summary">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="dashboard-home-summary-card">
              <div className="dashboard-home-summary-top">
                <div>
                  <span>{item.label}</span>
                  <strong>{loading ? "—" : item.value}</strong>
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
          <h2>Student records</h2>
          {loading ? <p>Loading students...</p> : null}
          {!loading && !recentStudents.length ? <p>No students have been enrolled yet.</p> : null}
          {!loading && recentStudents.length ? (
            <div className="students-page-stack">
              {recentStudents.map((student) => (
                <div className="students-page-stack-item" key={student.id}>
                  <span>{student.className || "Class not assigned"}</span>
                  <strong>{student.name || student.admissionNumber || "Student"}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="dashboard-home-panel">
          <h2>Student workspace</h2>
          <div className="students-page-hero-card">
            <div className="students-page-hero-icon">
              <GraduationCap size={18} />
            </div>
            <div>
              <strong>One source of truth</strong>
              <p>Student information shown here is loaded from the authenticated school account instead of demo records.</p>
            </div>
          </div>
          <button
            className="dashboard-home-summary-action tone-blue"
            type="button"
            onClick={() => navigate("/dashboard/students")}
          >
            <span>Open student list</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>
    </div>
  );
}
