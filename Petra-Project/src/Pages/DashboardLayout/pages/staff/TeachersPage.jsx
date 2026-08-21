import { useEffect, useState } from "react";
import { Search, RefreshCcw, Users } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import { academicApi } from "../../../../services/academicApi";
import "../page-styles/TeachersPage.css";

const getTeacherName = (teacher) =>
  teacher.fullName ||
  [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
  teacher.email ||
  "Teacher";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignment, setAssignment] = useState({});
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [teacherResponse, classResponse, subjectResponse] =
        await Promise.all([
          adminApi.teachers({ search, limit: 20 }),
          academicApi.classes(),
          academicApi.subjects(),
        ]);
      setTeachers(teacherResponse.data?.users || []);
      setClasses(classResponse.classes || []);
      setSubjects(subjectResponse.subjects || []);
    } catch (err) {
      setError(err.message || "Unable to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const assign = async (teacherId, type) => {
    const value = assignment[`${teacherId}-${type}`];
    if (!value) return;
    setAssignmentMessage("");
    try {
      if (type === "class")
        await adminApi.assignTeacherClass({ teacherId, classId: value });
      if (type === "subject")
        await adminApi.assignTeacherSubject({ teacherId, subjectId: value });
      setAssignment((current) => ({
        ...current,
        [`${teacherId}-${type}`]: "",
      }));
      setAssignmentMessage(
        "Assignment saved. The staff workspace will use it on the next refresh.",
      );
    } catch (err) {
      setError(err.message || "Unable to save assignment.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="dashboard-home teachers-page">
      <section className="dashboard-home-header">
        <div>
          <h1>Teachers</h1>
          <p>
            Manage teaching staff, subject assignments, and profile details from
            one polished dashboard.
          </p>
        </div>
        <div className="dashboard-home-session-pill">People operations</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Total teachers</span>
              <strong>{teachers.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Users size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Search available</span>
              <strong>Yes</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <Search size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel admins-actions-panel">
        <div className="admins-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers..."
            />
          </div>
          <button
            className="dashboard-home-summary-action tone-blue"
            type="button"
            onClick={load}
          >
            <RefreshCcw size={14} />
            <span>Reload</span>
          </button>
        </div>

        {error ? <div className="students-inline-alert">{error}</div> : null}
        {assignmentMessage ? (
          <div className="students-inline-alert">{assignmentMessage}</div>
        ) : null}

        {loading ? (
          <div className="module-empty">Loading teachers...</div>
        ) : teachers.length ? (
          <div className="admin-list">
            {teachers.map((teacher) => (
              <article key={teacher.id} className="admin-row">
                <div>
                  <strong>{getTeacherName(teacher)}</strong>
                  <p>{teacher.staffDepartment || teacher.email}</p>
                </div>
                <span className="dashboard-home-session-pill">
                  {teacher.role}
                </span>
                <div className="teacher-assignment-controls">
                  <select
                    value={assignment[`${teacher.id}-class`] || ""}
                    onChange={(event) =>
                      setAssignment((current) => ({
                        ...current,
                        [`${teacher.id}-class`]: event.target.value,
                      }))
                    }
                    aria-label={`Assign class to ${getTeacherName(teacher)}`}
                  >
                    <option value="">Assign class</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assign(teacher.id, "class")}
                  >
                    Save
                  </button>
                  <select
                    value={assignment[`${teacher.id}-subject`] || ""}
                    onChange={(event) =>
                      setAssignment((current) => ({
                        ...current,
                        [`${teacher.id}-subject`]: event.target.value,
                      }))
                    }
                    aria-label={`Assign subject to ${getTeacherName(teacher)}`}
                  >
                    <option value="">Assign subject</option>
                    {subjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assign(teacher.id, "subject")}
                  >
                    Save
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="module-empty">No teachers found.</div>
        )}
      </section>
    </div>
  );
}
