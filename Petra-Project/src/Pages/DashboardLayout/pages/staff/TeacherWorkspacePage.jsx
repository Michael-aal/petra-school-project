import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  RefreshCw,
  UserCircle2,
  Users,
} from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { getDisplayName } from "../../../../utils/userProfile";
import { getStudentDisplayName } from "../../../../utils/studentDisplay";
import { teacherApi } from "../../../../services/teacherApi";
import "../page-styles/TeacherDashboard.css";
import SettingsPage from "../SettingsPage";

const initialAssessmentForm = {
  title: "",
  subject: "",
  className: "",
  maxScore: 100,
  date: "",
  description: "",
};

const initialAttendanceForm = {
  studentId: "",
  className: "",
  date: new Date().toISOString().slice(0, 10),
  status: "Present",
};

const initialResultForm = {
  studentId: "",
  subject: "",
  className: "",
  score: "",
  maxScore: 100,
  published: false,
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTeacherRoleLabel = (role) => (role === "staff" ? "Teacher" : role || "Teacher");

export default function TeacherWorkspacePage({ activeView = "dashboard" }) {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const params = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [classDetails, setClassDetails] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState(initialAssessmentForm);
  const [attendanceForm, setAttendanceForm] = useState(initialAttendanceForm);
  const [resultForm, setResultForm] = useState(initialResultForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [attendanceFilter, setAttendanceFilter] = useState("All");
  const [academicFilter, setAcademicFilter] = useState("All");

  const teacherName = useMemo(() => getDisplayName(userInfo) || profile?.fullName || dashboard?.teacherName || "Teacher", [userInfo, profile, dashboard]);
  const teacherRole = useMemo(() => getTeacherRoleLabel(dashboard?.role || profile?.role || userInfo?.role), [dashboard, profile, userInfo]);
  const teacherDepartment = useMemo(() => dashboard?.department || profile?.department || userInfo?.staffDepartment || userInfo?.institution || "Department", [dashboard, profile, userInfo]);
  const assignedSubjects = useMemo(() => (dashboard?.assignedSubjects?.length ? dashboard.assignedSubjects : profile?.subjectsAssigned || []), [dashboard, profile]);
  const assignedClasses = useMemo(() => (dashboard?.assignedClasses?.length ? dashboard.assignedClasses : profile?.classAssigned ? [profile.classAssigned] : []), [dashboard, profile]);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);

    try {
      const [dashboardResponse, classesResponse, studentsResponse, attendanceResponse, assessmentsResponse, resultsResponse, announcementsResponse, profileResponse] = await Promise.all([
        teacherApi.dashboard(),
        teacherApi.classes(),
        teacherApi.students(),
        teacherApi.attendance({ className: selectedClass || "", date: new Date().toISOString().slice(0, 10) }),
        teacherApi.assessments(),
        teacherApi.results(),
        teacherApi.announcements(),
        teacherApi.profile(),
      ]);

      setDashboard(dashboardResponse);
      setClasses(classesResponse.classes || []);
      setStudents(studentsResponse.students || []);
      setAttendance(attendanceResponse.attendance || []);
      setAssessments(assessmentsResponse.assessments || []);
      setResults(resultsResponse.results || []);
      setAnnouncements(announcementsResponse.announcements || []);
      setProfile(profileResponse.profile || null);
      setError(null);

      if (!selectedClass && (classesResponse.classes || []).length) {
        setSelectedClass(classesResponse.classes[0].name);
      }
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) {
        navigate("/signin");
        return;
      }
      setError(requestError.message || "Unable to load your teacher dashboard right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [navigate]);

  useEffect(() => {
    if (!selectedClass && classes.length) {
      setSelectedClass(classes[0].name);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    const classId = params.classId;
    if (!classId || !classes.length) {
      setClassDetails(null);
      return;
    }

    const foundClass = classes.find((item) => item.name === decodeURIComponent(classId));
    if (!foundClass) {
      setClassDetails(null);
      return;
    }

    const studentsInClass = students.filter((student) => student.className === foundClass.name);
    setClassDetails({
      id: foundClass.id,
      name: foundClass.name,
      studentCount: studentsInClass.length,
      subjects: foundClass.subjectsTaught,
      students: studentsInClass,
      room: foundClass.room || "TBA",
      academicSession: foundClass.academicSession || "Current session",
      teacherName: foundClass.teacherName || teacherName,
      status: foundClass.teacherStatus || "Assigned",
      recentAttendance: attendance.filter((record) => record.className === foundClass.name).slice(0, 5),
      upcomingAssessments: assessments.filter((assessment) => assessment.className === foundClass.name).slice(0, 5),
    });
    setSearchQuery("");
    setGenderFilter("All");
    setAttendanceFilter("All");
    setAcademicFilter("All");
  }, [params.classId, classes, students, attendance, assessments, teacherName]);

  const studentAttendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach((record) => {
      if (record.studentName) {
        map[record.studentName] = record.status;
      }
    });
    return map;
  }, [attendance]);

  const handleAssessmentSubmit = async (event) => {
    event.preventDefault();
    try {
      await teacherApi.createAssessment(assessmentForm);
      const response = await teacherApi.assessments();
      setAssessments(response.assessments || []);
      setAssessmentForm(initialAssessmentForm);
    } catch (requestError) {
      setError(requestError.message || "Unable to save the assessment.");
    }
  };

  const handleAttendanceSubmit = async (event) => {
    event.preventDefault();
    try {
      await teacherApi.createAttendance(attendanceForm);
      const response = await teacherApi.attendance({ className: attendanceForm.className || selectedClass, date: attendanceForm.date });
      setAttendance(response.attendance || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to save attendance.");
    }
  };

  const handleResultSubmit = async (event) => {
    event.preventDefault();
    try {
      await teacherApi.createResult(resultForm);
      const response = await teacherApi.results();
      setResults(response.results || []);
      setResultForm(initialResultForm);
    } catch (requestError) {
      setError(requestError.message || "Unable to save the result.");
    }
  };

  const renderSkeleton = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Loading teacher dashboard…</h1>
          <p>Please wait while your data is being loaded.</p>
        </div>
      </section>
      <section className="teacher-toolbar">
        {[1, 2, 3].map((item) => (
          <div key={item} className="teacher-toolbar-item teacher-skeleton" />
        ))}
      </section>
      <section className="teacher-grid">
        {[1, 2].map((item) => (
          <article key={item} className="dashboard-home-panel teacher-panel teacher-skeleton-card" />
        ))}
      </section>
    </div>
  );

  const renderErrorState = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>We could not load your teacher dashboard</h1>
          <p>{error}</p>
        </div>
      </section>
      <section className="dashboard-home-panel teacher-panel teacher-empty-state">
        <AlertCircle size={18} />
        <p>Your data could not be fetched. Please retry in a moment.</p>
        <button type="button" className="teacher-action-button" onClick={() => loadData(false)}>
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      </section>
    </div>
  );

  const renderDashboard = () => {
    if (!dashboard) return null;

    const stats = [
      {
        label: "Assigned Classes",
        value: assignedClasses.length || classes.length || 0,
        icon: BookOpen,
      },
      {
        label: "Assigned Subjects",
        value: assignedSubjects.length || dashboard?.stats?.assignedSubjects || 0,
        icon: FileText,
      },
      {
        label: "Total Students",
        value: students.length || dashboard?.stats?.assignedStudents || 0,
        icon: Users,
      },
      {
        label: "Today's Attendance",
        value: attendance.length || 0,
        icon: ClipboardCheck,
      },
      {
        label: "Pending Assessments",
        value: assessments.length || dashboard?.stats?.pendingAssessments || 0,
        icon: FileText,
      },
      {
        label: "Upcoming Classes",
        value: Math.max(classes.length, dashboard?.stats?.upcomingClasses || 0),
        icon: CalendarDays,
      },
    ];

    return (
      <div className="teacher-page dashboard-home">
        <section className="dashboard-home-header">
          <div>
            <h1>Welcome back, {teacherName}</h1>
            <p>{teacherRole} • {teacherDepartment}</p>
            <div className="teacher-header-meta">
              <span>Account Status: {profile?.accountStatus || dashboard?.accountStatus || "Active"}</span>
            </div>
          </div>
          <div className="dashboard-home-session-pill">Teacher Workspace</div>
        </section>

        <section className="teacher-grid teacher-grid-hero">
          <article className="dashboard-home-panel teacher-panel teacher-profile-card">
            <div className="teacher-profile-photo">
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt={teacherName} />
              ) : (
                <UserCircle2 size={44} />
              )}
            </div>
            <div className="teacher-profile-info">
              <h2>{teacherName}</h2>
              <p>{teacherRole}</p>
              <div className="teacher-profile-details">
                <span>{profile?.email || userInfo?.email || "Email unavailable"}</span>
                <span>{profile?.phone || "Phone not provided"}</span>
                <span>{teacherDepartment}</span>
              </div>
            </div>
          </article>
          <article className="dashboard-home-panel teacher-panel teacher-profile-card compact">
            <h2>Profile Snapshot</h2>
            <div className="teacher-stack">
              <div className="teacher-item compact">
                <div>
                  <strong>Employment Status</strong>
                  <p>{profile?.accountStatus || "Active"}</p>
                </div>
              </div>
              <div className="teacher-item compact">
                <div>
                  <strong>Assigned Classes</strong>
                  <p>{assignedClasses.join(", ") || "Not assigned"}</p>
                </div>
              </div>
              <div className="teacher-item compact">
                <div>
                  <strong>Assigned Subjects</strong>
                  <p>{assignedSubjects.join(", ") || "Not assigned"}</p>
                </div>
              </div>
              <div className="teacher-item compact">
                <div>
                  <strong>Date Joined</strong>
                  <p>{formatDate(profile?.createdAt || dashboard?.createdAt)}</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="teacher-stats-grid">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="dashboard-home-summary-card">
                <div className="dashboard-home-summary-top">
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="dashboard-home-summary-icon tone-blue">
                    <Icon size={18} />
                  </div>
                </div>
                <div className="dashboard-home-summary-action tone-blue">
                  <span>Live teacher data</span>
                  <ArrowRight size={14} />
                </div>
              </article>
            );
          })}
        </section>

        <section className="teacher-grid">
          <article className="dashboard-home-panel teacher-panel">
            <div className="teacher-section-header">
              <h2>My Classes</h2>
              <button type="button" className="teacher-link-button" onClick={() => navigate("/staff/classes")}>
                View all
              </button>
            </div>
            <div className="teacher-stack">
              {classes.length ? classes.map((classItem) => (
                <div key={classItem.id} className="teacher-item compact">
                  <div>
                    <strong>{classItem.name}</strong>
                    <p>{classItem.studentCount} students • {classItem.subjectsTaught.join(", ")}</p>
                  </div>
                  <div className="teacher-item-right">
                    <span>{classItem.academicSession || "Current session"}</span>
                    <button type="button" className="teacher-action-button" onClick={() => navigate(`/staff/classes/${encodeURIComponent(classItem.name)}`)}>
                      <span>View Class</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )) : <p className="teacher-empty-copy">No classes are assigned to you yet.</p>}
            </div>
          </article>
          <article className="dashboard-home-panel teacher-panel">
            <div className="teacher-section-header">
              <h2>My Subjects</h2>
            </div>
            <div className="teacher-badges">
              {assignedSubjects.length ? assignedSubjects.map((subject) => (
                <span key={subject} className="teacher-badge">{subject}</span>
              )) : <p className="teacher-empty-copy">No subjects assigned.</p>}
            </div>
          </article>
        </section>

        <section className="teacher-grid">
          <article className="dashboard-home-panel teacher-panel">
            <div className="teacher-section-header">
              <h2>Recent Students</h2>
              <button type="button" className="teacher-link-button" onClick={() => navigate("/staff/students")}>
                View all
              </button>
            </div>
            <div className="teacher-stack">
              {students.length ? students.slice(0, 5).map((student) => {
                const studentDisplayName = getStudentDisplayName(student);
                const attendanceStatus = studentAttendanceMap[student.id] || studentAttendanceMap[student.name] || studentAttendanceMap[studentDisplayName] || "No record";
                return (
                  <div key={student.id} className="teacher-item compact">
                    <div className="teacher-student-row">
                      <div className="teacher-student-avatar">
                        {student.profileImage ? <img src={student.profileImage} alt={studentDisplayName} /> : <span>{studentDisplayName?.charAt(0) || "S"}</span>}
                      </div>
                      <div>
                        <strong>{studentDisplayName}</strong>
                        <p>{student.className || "No class assigned"}</p>
                      </div>
                    </div>
                    <div className="teacher-item-right">
                      <span>{attendanceStatus}</span>
                      <button type="button" className="teacher-link-button">View Profile</button>
                    </div>
                  </div>
                );
              }) : <p className="teacher-empty-copy">No students are available in your assigned classes.</p>}
            </div>
          </article>
          <article className="dashboard-home-panel teacher-panel">
            <div className="teacher-section-header">
              <h2>Today&apos;s Schedule</h2>
            </div>
            <div className="teacher-stack">
              {(dashboard.todaySchedule || []).length ? (dashboard.todaySchedule || []).map((item, index) => (
                <div key={`${item.subject}-${index}`} className="teacher-item compact">
                  <div>
                    <strong>{item.subject}</strong>
                    <p>{item.className}</p>
                  </div>
                  <div className="teacher-item-right">
                    <span>{item.time}</span>
                    <span>{item.room || "Room TBD"}</span>
                  </div>
                </div>
              )) : <p className="teacher-empty-copy">No class sessions are scheduled for today.</p>}
            </div>
          </article>
        </section>

        <section className="teacher-grid">
          <article className="dashboard-home-panel teacher-panel">
            <div className="teacher-section-header">
              <h2>Recent Announcements</h2>
            </div>
            <div className="teacher-stack">
              {(announcements || []).length ? announcements.map((item, index) => (
                <div key={`${item.title}-${index}`} className="teacher-item compact">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              )) : <p className="teacher-empty-copy">No announcements are available right now.</p>}
            </div>
          </article>
          <article className="dashboard-home-panel teacher-panel">
            <div className="teacher-section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="teacher-actions-grid">
              <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/attendance")}>
                <ClipboardCheck size={16} />
                <span>Take Attendance</span>
              </button>
              <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/students")}>
                <GraduationCap size={16} />
                <span>View Students</span>
              </button>
              <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/assessments")}>
                <FileText size={16} />
                <span>Enter Assessment</span>
              </button>
              <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/results")}>
                <Bell size={16} />
                <span>View Results</span>
              </button>
            </div>
          </article>
        </section>
      </div>
    );
  };

  const renderClasses = () => {
    const totalStudents = classes.reduce((sum, classItem) => sum + (classItem.studentCount || 0), 0);
    const totalSubjects = new Set(classes.flatMap((classItem) => classItem.subjectsTaught || [])).size;
    const todayClasses = Math.max(classes.length, dashboard?.todaySchedule?.length || 0);

    return (
      <div className="teacher-page dashboard-home">
        <section className="dashboard-home-header">
          <div>
            <h1>My Classes</h1>
            <p>View and manage the classes assigned to you.</p>
          </div>
        </section>

        <section className="teacher-stats-grid">
          <article className="dashboard-home-summary-card">
            <div className="dashboard-home-summary-top">
              <div><span>Total Assigned Classes</span><strong>{classes.length}</strong></div>
              <div className="dashboard-home-summary-icon tone-blue"><BookOpen size={18} /></div>
            </div>
          </article>
          <article className="dashboard-home-summary-card">
            <div className="dashboard-home-summary-top">
              <div><span>Total Students</span><strong>{totalStudents}</strong></div>
              <div className="dashboard-home-summary-icon tone-teal"><Users size={18} /></div>
            </div>
          </article>
          <article className="dashboard-home-summary-card">
            <div className="dashboard-home-summary-top">
              <div><span>Total Subjects</span><strong>{totalSubjects}</strong></div>
              <div className="dashboard-home-summary-icon tone-rose"><FileText size={18} /></div>
            </div>
          </article>
          <article className="dashboard-home-summary-card">
            <div className="dashboard-home-summary-top">
              <div><span>Today's Classes</span><strong>{todayClasses}</strong></div>
              <div className="dashboard-home-summary-icon tone-blue"><CalendarDays size={18} /></div>
            </div>
          </article>
        </section>

        {classes.length ? (
          <section className="teacher-grid teacher-grid-classes">
            {classes.map((classItem) => (
              <article key={classItem.id} className="dashboard-home-panel teacher-panel teacher-class-card">
                <div className="teacher-section-header">
                  <h2>{classItem.name}</h2>
                  <span className="teacher-badge teacher-badge-status">{classItem.teacherStatus || "Assigned"}</span>
                </div>
                <div className="teacher-stack">
                  <div className="teacher-item compact"><div><strong>Academic Session</strong><p>{classItem.academicSession || "Current session"}</p></div></div>
                  <div className="teacher-item compact"><div><strong>Number of Students</strong><p>{classItem.studentCount} students</p></div></div>
                  <div className="teacher-item compact"><div><strong>Class Teacher</strong><p>{teacherName}</p></div></div>
                  <div className="teacher-item compact"><div><strong>Assigned Subjects</strong><p>{(classItem.subjectsTaught || []).join(", ") || "Not assigned"}</p></div></div>
                  <div className="teacher-item compact"><div><strong>Room</strong><p>{classItem.room || "TBA"}</p></div></div>
                  <div className="teacher-item compact"><div><strong>Status</strong><p>{classItem.teacherStatus || "Assigned"}</p></div></div>
                </div>
                <div className="teacher-actions-grid teacher-actions-grid-card">
                  <button type="button" className="teacher-action-button" onClick={() => navigate(`/staff/classes/${encodeURIComponent(classItem.name)}`)}>
                    <span>View Students</span>
                  </button>
                  <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/attendance")}>
                    <span>Take Attendance</span>
                  </button>
                  <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/results")}>
                    <span>Enter Results</span>
                  </button>
                  <button type="button" className="teacher-action-button" onClick={() => navigate("/staff/assessments")}>
                    <span>View Assessments</span>
                  </button>
                  <button type="button" className="teacher-action-button" onClick={() => navigate("/dashboard/academics/timetable")}>
                    <span>View Timetable</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="dashboard-home-panel teacher-panel teacher-empty-state">
            <BookOpen size={18} />
            <p>No classes have been assigned to you yet.</p>
            <button type="button" className="teacher-action-button" onClick={() => loadData(false)}>
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </section>
        )}
      </div>
    );
  };

  const renderClassDetails = () => {
    if (!classDetails) return null;

    const studentRows = (classDetails.students || []).filter((student) => {
      const query = searchQuery.trim().toLowerCase();
      const studentDisplayName = getStudentDisplayName(student);
      const attendanceStatus = studentAttendanceMap[student.id] || studentAttendanceMap[student.name] || studentAttendanceMap[studentDisplayName] || "No record";
      const academicStatus = student.academicStatus || student.status || "Active";
      return !query || studentDisplayName.toLowerCase().includes(query) || student.className?.toLowerCase().includes(query);
    });

    const presentCount = classDetails.students.filter((student) => (studentAttendanceMap[student.name] || "No record") === "Present").length;
    const attendanceRate = classDetails.studentCount ? Math.round((presentCount / classDetails.studentCount) * 100) : 0;

    return (
      <div className="teacher-page dashboard-home">
        <section className="dashboard-home-header">
          <div>
            <h1>{classDetails.name}</h1>
            <p>Class information, subjects, students, and recent assessment activity.</p>
          </div>
        </section>

        <section className="teacher-grid teacher-grid-hero">
          <article className="dashboard-home-panel teacher-panel">
            <h2>Class Information</h2>
            <div className="teacher-stack">
              <div className="teacher-item compact"><div><strong>Class Name</strong><p>{classDetails.name}</p></div></div>
              <div className="teacher-item compact"><div><strong>Academic Session</strong><p>{classDetails.academicSession || "Current session"}</p></div></div>
              <div className="teacher-item compact"><div><strong>Students</strong><p>{classDetails.studentCount} students</p></div></div>
              <div className="teacher-item compact"><div><strong>Teacher</strong><p>{classDetails.teacherName || teacherName}</p></div></div>
              <div className="teacher-item compact"><div><strong>Room</strong><p>{classDetails.room || "TBA"}</p></div></div>
              <div className="teacher-item compact"><div><strong>Status</strong><p>{classDetails.status || "Assigned"}</p></div></div>
            </div>
          </article>
          <article className="dashboard-home-panel teacher-panel">
            <h2>Subjects</h2>
            <div className="teacher-badges">
              {(classDetails.subjects || []).length ? classDetails.subjects.map((subject) => (
                <span key={subject} className="teacher-badge">{subject}</span>
              )) : <p className="teacher-empty-copy">No subjects have been assigned.</p>}
            </div>
          </article>
        </section>

        <section className="teacher-grid">
          <article className="dashboard-home-panel teacher-panel">
            <h2>Performance Summary</h2>
            <div className="teacher-stack">
              <div className="teacher-item compact"><div><strong>Present Today</strong><p>{presentCount} students</p></div></div>
              <div className="teacher-item compact"><div><strong>Attendance Rate</strong><p>{attendanceRate}%</p></div></div>
              <div className="teacher-item compact"><div><strong>Recent Attendance</strong><p>{classDetails.recentAttendance?.length || 0} records</p></div></div>
              <div className="teacher-item compact"><div><strong>Recent Assessments</strong><p>{classDetails.upcomingAssessments?.length || 0} entries</p></div></div>
            </div>
          </article>
          <article className="dashboard-home-panel teacher-panel">
            <h2>Recent Attendance</h2>
            <div className="teacher-stack">
              {(classDetails.recentAttendance || []).length ? classDetails.recentAttendance.map((item) => (
                <div key={item.id} className="teacher-item compact">
                  <div><strong>{item.studentName}</strong><p>{item.className}</p></div>
                  <span>{item.status}</span>
                </div>
              )) : <p className="teacher-empty-copy">No attendance records for this class yet.</p>}
            </div>
          </article>
        </section>

        <section className="dashboard-home-panel teacher-panel">
          <div className="teacher-section-header">
            <h2>Student List</h2>
            <span className="teacher-empty-copy">Teachers can view student information only.</span>
          </div>
          <div className="teacher-filter-bar">
            <input
              type="text"
              placeholder="Search student name or class"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)}>
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select value={attendanceFilter} onChange={(event) => setAttendanceFilter(event.target.value)}>
              <option value="All">All Attendance</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
              <option value="No record">No record</option>
            </select>
            <select value={academicFilter} onChange={(event) => setAcademicFilter(event.target.value)}>
              <option value="All">All Academic Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Promoted">Promoted</option>
            </select>
          </div>
          <table className="teacher-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Gender</th>
                <th>Attendance Status</th>
                <th>Academic Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.length ? studentRows.map((student) => {
                const studentDisplayName = getStudentDisplayName(student);
                const attendanceStatus = studentAttendanceMap[student.id] || studentAttendanceMap[student.name] || studentAttendanceMap[studentDisplayName] || "No record";
                const academicStatus = student.academicStatus || student.status || "Active";
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="teacher-student-row">
                        <div className="teacher-student-avatar">
                          {student.profileImage ? <img src={student.profileImage} alt={studentDisplayName} /> : <span>{studentDisplayName?.charAt(0) || "S"}</span>}
                        </div>
                        <div>
                          <strong>{studentDisplayName}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{student.gender || "—"}</td>
                    <td>{attendanceStatus}</td>
                    <td>{academicStatus}</td>
                    <td>
                      <button type="button" className="teacher-link-button" onClick={() => navigate("/staff/students")}>View</button>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="6" className="teacher-empty-copy">No students match the selected search or filters.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  const renderStudents = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Students</h1><p>Only students from your assigned classes are shown.</p></div>
      </section>
      <section className="dashboard-home-panel teacher-panel">
        <table className="teacher-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {students.length ? students.map((student) => {
              const studentDisplayName = getStudentDisplayName(student);
              const attendanceStatus = studentAttendanceMap[student.id] || studentAttendanceMap[student.name] || studentAttendanceMap[studentDisplayName] || "No record";
              return (
                <tr key={student.id}>
                  <td>{studentDisplayName}</td>
                  <td>{student.className}</td>
                  <td>{attendanceStatus}</td>
                </tr>
              );
            }) : <tr><td colSpan="4" className="teacher-empty-copy">No students available.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );

  const renderAttendance = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Attendance</h1><p>Select a class and mark attendance for today.</p></div>
      </section>
      <section className="teacher-grid">
        <article className="dashboard-home-panel teacher-panel">
          <h2>Mark Attendance</h2>
          <form className="teacher-stack" onSubmit={handleAttendanceSubmit}>
            <select value={attendanceForm.className || selectedClass || ""} onChange={(event) => setAttendanceForm((current) => ({ ...current, className: event.target.value }))}>
              {classes.map((classItem) => <option key={classItem.id} value={classItem.name}>{classItem.name}</option>)}
            </select>
            <input type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm((current) => ({ ...current, date: event.target.value }))} />
            <input placeholder="Student reference" value={attendanceForm.studentId} onChange={(event) => setAttendanceForm((current) => ({ ...current, studentId: event.target.value }))} />
            <select value={attendanceForm.status} onChange={(event) => setAttendanceForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
            </select>
            <button type="submit" className="teacher-action-button teacher-action-full">
              <span>Save Attendance</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </article>
        <article className="dashboard-home-panel teacher-panel">
          <h2>Today&apos;s Attendance</h2>
          <div className="teacher-stack">
            {attendance.length ? attendance.map((item) => (
              <div key={item.id} className="teacher-item compact">
                <div>
                  <strong>{item.studentName}</strong>
                  <p>{item.className}</p>
                </div>
                <span>{item.status}</span>
              </div>
            )) : <p className="teacher-empty-copy">No attendance records yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );

  const renderAssessments = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Assessments</h1><p>Create and manage assessment tasks for your classes.</p></div>
      </section>
      <section className="teacher-grid">
        <article className="dashboard-home-panel teacher-panel">
          <h2>Create Assessment</h2>
          <form className="teacher-stack" onSubmit={handleAssessmentSubmit}>
            <input placeholder="Title" value={assessmentForm.title} onChange={(event) => setAssessmentForm((current) => ({ ...current, title: event.target.value }))} />
            <input placeholder="Subject" value={assessmentForm.subject} onChange={(event) => setAssessmentForm((current) => ({ ...current, subject: event.target.value }))} />
            <input placeholder="Class" value={assessmentForm.className} onChange={(event) => setAssessmentForm((current) => ({ ...current, className: event.target.value }))} />
            <input type="number" placeholder="Max Score" value={assessmentForm.maxScore} onChange={(event) => setAssessmentForm((current) => ({ ...current, maxScore: Number(event.target.value) }))} />
            <input type="date" value={assessmentForm.date} onChange={(event) => setAssessmentForm((current) => ({ ...current, date: event.target.value }))} />
            <textarea placeholder="Description" value={assessmentForm.description} onChange={(event) => setAssessmentForm((current) => ({ ...current, description: event.target.value }))} />
            <button type="submit" className="teacher-action-button teacher-action-full">
              <span>Create Assessment</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </article>
        <article className="dashboard-home-panel teacher-panel">
          <h2>Existing Assessments</h2>
          <div className="teacher-stack">
            {assessments.length ? assessments.map((item) => (
              <div key={item.id} className="teacher-item compact">
                <div><strong>{item.title}</strong><p>{item.subject} • {item.className}</p></div>
                <span>{item.maxScore} pts</span>
              </div>
            )) : <p className="teacher-empty-copy">No assessments have been created yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );

  const renderResults = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Results</h1><p>Enter and view scores for your students.</p></div>
      </section>
      <section className="teacher-grid">
        <article className="dashboard-home-panel teacher-panel">
          <h2>Input Score</h2>
          <form className="teacher-stack" onSubmit={handleResultSubmit}>
            <input placeholder="Student reference" value={resultForm.studentId} onChange={(event) => setResultForm((current) => ({ ...current, studentId: event.target.value }))} />
            <input placeholder="Subject" value={resultForm.subject} onChange={(event) => setResultForm((current) => ({ ...current, subject: event.target.value }))} />
            <input placeholder="Class" value={resultForm.className} onChange={(event) => setResultForm((current) => ({ ...current, className: event.target.value }))} />
            <input type="number" placeholder="Score" value={resultForm.score} onChange={(event) => setResultForm((current) => ({ ...current, score: event.target.value }))} />
            <input type="number" placeholder="Max Score" value={resultForm.maxScore} onChange={(event) => setResultForm((current) => ({ ...current, maxScore: Number(event.target.value) }))} />
            <label className="teacher-checkbox"><input type="checkbox" checked={resultForm.published} onChange={(event) => setResultForm((current) => ({ ...current, published: event.target.checked }))} /> Publish</label>
            <button type="submit" className="teacher-action-button teacher-action-full">
              <span>Save Result</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </article>
        <article className="dashboard-home-panel teacher-panel">
          <h2>Results Overview</h2>
          <div className="teacher-stack">
            {results.length ? results.map((item) => (
              <div key={item.id} className="teacher-item compact">
                <div><strong>{item.studentName}</strong><p>{item.subject} • {item.className}</p></div>
                <span>{item.score}/{item.maxScore}</span>
              </div>
            )) : <p className="teacher-empty-copy">No results have been entered yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Announcements</h1><p>Announcements visible to your assigned classes.</p></div>
      </section>
      <section className="dashboard-home-panel teacher-panel">
        <div className="teacher-stack">
          {announcements.length ? announcements.map((item, index) => (
            <div key={`${item.title}-${index}`} className="teacher-item compact">
              <div><strong>{item.title}</strong><p>{item.description}</p></div>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          )) : <p className="teacher-empty-copy">No announcements available.</p>}
        </div>
      </section>
    </div>
  );

  const renderProfile = () => (
    <div className="teacher-page dashboard-home">
      <section className="dashboard-home-header">
        <div><h1>Profile</h1><p>Your profile details and assigned teaching scope.</p></div>
      </section>
      <section className="teacher-grid">
        <article className="dashboard-home-panel teacher-panel">
          <h2>Teacher Information</h2>
          <div className="teacher-stack">
            <div className="teacher-item compact"><div><strong>Full Name</strong><p>{profile?.fullName || teacherName}</p></div></div>
            <div className="teacher-item compact"><div><strong>Email</strong><p>{profile?.email || userInfo.email}</p></div></div>
            <div className="teacher-item compact"><div><strong>Department</strong><p>{profile?.department || teacherDepartment}</p></div></div>
            <div className="teacher-item compact"><div><strong>Role</strong><p>{teacherRole}</p></div></div>
            <div className="teacher-item compact"><div><strong>Phone</strong><p>{profile?.phone || "Not provided"}</p></div></div>
          </div>
        </article>
        <article className="dashboard-home-panel teacher-panel">
          <h2>Assigned Scope</h2>
          <div className="teacher-stack">
            <div className="teacher-item compact"><div><strong>Classes</strong><p>{assignedClasses.join(", ") || "Not assigned"}</p></div></div>
            <div className="teacher-item compact"><div><strong>Subjects</strong><p>{assignedSubjects.join(", ") || "Not assigned"}</p></div></div>
            <div className="teacher-item compact"><div><strong>Status</strong><p>{profile?.accountStatus || "active"}</p></div></div>
            <div className="teacher-item compact"><div><strong>Date Joined</strong><p>{formatDate(profile?.createdAt || dashboard?.createdAt)}</p></div></div>
          </div>
        </article>
      </section>
    </div>
  );

  const renderSettings = () => <SettingsPage role="teacher" />;

  const renderView = () => {
    switch (activeView) {
      case "classes": return renderClasses();
      case "classDetails": return renderClassDetails();
      case "students": return renderStudents();
      case "attendance": return renderAttendance();
      case "assessments": return renderAssessments();
      case "results": return renderResults();
      case "announcements": return renderAnnouncements();
      case "profile": return renderProfile();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  if (loading) return renderSkeleton();
  if (error) return renderErrorState();

  return renderView();
}
