import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageSquare,
  School,
  Settings,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";
import { useContext } from "react";
import { default as DeleteAccountButton } from "../../../../components/DeleteAccountButton";
import UserAvatar from "../../../../components/UserAvatar";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import QuickActions from "../../../../components/dashboard/QuickActions";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import StatCard from "../../../../components/dashboard/StatCard";
import EmptyState from "../../../../components/dashboard/EmptyState";
import { UserContext } from "../../../../context/UserContext";
import { getDisplayName } from "../../../../utils/userProfile";
import "../page-styles/TeacherDashboard.css";
import "../../../../components/dashboard/dashboard.css";

const routeConfig = {
  dashboard: {
    title: "Staff Dashboard",
    description: "A modern teaching workspace that keeps classes, attendance, grading, and communication in one place.",
    summary: [
      { label: "My Classes", value: "5", icon: BookOpen, tone: "tone-blue" },
      { label: "Total Students", value: "184", icon: Users, tone: "tone-teal" },
      { label: "Today's Attendance", value: "91%", icon: ClipboardCheck, tone: "tone-rose" },
      { label: "Pending Assignments", value: "12", icon: ClipboardList, tone: "tone-blue" },
      { label: "Upcoming Lessons", value: "4", icon: CalendarDays, tone: "tone-teal" },
    ],
    toolbar: [
      { title: "Quick action", value: "Take Attendance" },
      { title: "Today", value: "4 lessons" },
      { title: "Priority", value: "2 submissions" },
    ],
    focusTitle: "Recent Activity",
    focusItems: [
      { title: "Attendance marked", meta: "SS2 English • 08:00", note: "Completed before first period" },
      { title: "Assignment submitted", meta: "JSS1 Mathematics • 09:45", note: "14 students uploaded work" },
      { title: "Lesson update", meta: "SS1 Biology • 12:30", note: "Shared a revision pack with parents" },
    ],
    sideTitle: "Quick Actions",
    sideItems: [
      { title: "Take Attendance", meta: "Open the roll for the next class" },
      { title: "Create Assignment", meta: "Publish a task for this week" },
      { title: "Enter Student Results", meta: "Save the latest assessment scores" },
      { title: "View Timetable", meta: "Review today’s teaching blocks" },
    ],
    bottomTitle: "Upcoming School Events",
    bottomItems: [
      { title: "Parent-Teacher Meeting", meta: "Thursday • 10:00" },
      { title: "Department Review", meta: "Friday • 14:00" },
      { title: "School Assembly", meta: "Monday • 07:30" },
    ],
  },
  classes: {
    title: "My Classes",
    description: "Track assigned classes, learners, and the topics you are covering this term.",
    summary: [
      { label: "Assigned Classes", value: "5", icon: BookOpen, tone: "tone-blue" },
      { label: "Active Topics", value: "6", icon: Sparkles, tone: "tone-teal" },
      { label: "Students", value: "184", icon: GraduationCap, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "View students", value: "Class list" },
      { title: "Attendance", value: "Roll call" },
      { title: "Assignments", value: "Weekly tasks" },
    ],
    focusTitle: "Class Overview",
    focusItems: [
      { title: "SS2 English", meta: "38 learners • 3 periods weekly", note: "Reading, grammar, and comprehension" },
      { title: "JSS1 Mathematics", meta: "42 learners • 5 periods weekly", note: "Fractions, algebra, and word problems" },
      { title: "SS1 Biology", meta: "40 learners • 4 periods weekly", note: "Human anatomy and practical revision" },
    ],
    sideTitle: "Upcoming Lessons",
    sideItems: [
      { title: "Grammar review", meta: "Tomorrow • 08:00" },
      { title: "Problem solving", meta: "Thursday • 10:00" },
      { title: "Practical lab", meta: "Friday • 12:30" },
    ],
    bottomTitle: "Class Notes",
    bottomItems: [
      { title: "Revision pack", meta: "Prepared for the next assessment" },
      { title: "Parent update", meta: "Shared with guardians this morning" },
    ],
  },
  students: {
    title: "Students",
    description: "Follow enrolled learners from your assigned classes and review their progress.",
    summary: [
      { label: "Enrolled", value: "184", icon: Users, tone: "tone-blue" },
      { label: "Present", value: "168", icon: ClipboardCheck, tone: "tone-teal" },
      { label: "Needs Review", value: "9", icon: FileText, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Search Student", value: "Find a learner" },
      { title: "Filter by Class", value: "All classes" },
      { title: "Student List", value: "184 learners" },
    ],
    focusTitle: "Student Highlights",
    focusItems: [
      { title: "Tunde Bello", meta: "SS2 English • Strong participation", note: "Excellent class discussion" },
      { title: "Kemi Bassey", meta: "JSS1 Mathematics • Improving steadily", note: "Needs extra practice" },
      { title: "Bola Akin", meta: "SS1 Biology • Excellent workbook", note: "Ready for the next topic" },
    ],
    sideTitle: "Performance Summary",
    sideItems: [
      { title: "Weekly attendance", meta: "94% average across classes" },
      { title: "Late arrivals", meta: "3 recorded this week" },
      { title: "Follow-up", meta: "2 parent reminders pending" },
    ],
    bottomTitle: "Student Activity",
    bottomItems: [
      { title: "Homework completion", meta: "85% completed this week" },
      { title: "Exam prep", meta: "7 students requested extra support" },
    ],
  },
  attendance: {
    title: "Attendance",
    description: "Select a class and date, then mark students as present, absent, late, or excused.",
    summary: [
      { label: "Today", value: "91%", icon: ClipboardCheck, tone: "tone-blue" },
      { label: "Absent", value: "9", icon: Users, tone: "tone-teal" },
      { label: "Late", value: "4", icon: CalendarDays, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Select Class", value: "SS2 English" },
      { title: "Select Date", value: "Today" },
      { title: "Marking", value: "Present / Absent / Late" },
    ],
    focusTitle: "Attendance Overview",
    focusItems: [
      { title: "SS2 English", meta: "36 present • 2 absent", note: "Marked before first period" },
      { title: "JSS1 Mathematics", meta: "40 present • 2 absent", note: "Adjusted after break" },
      { title: "SS1 Biology", meta: "38 present • 2 absent", note: "Reviewed with class captain" },
    ],
    sideTitle: "Attendance History",
    sideItems: [
      { title: "Parent message", meta: "One student was absent due to illness" },
      { title: "Reminder", meta: "Three students need attendance support" },
      { title: "Next step", meta: "Monitor the next two lessons" },
    ],
    bottomTitle: "Attendance Summary",
    bottomItems: [
      { title: "Weekly pattern", meta: "Attendance improved by 4%" },
      { title: "Improvement", meta: "Late arrivals reduced this week" },
    ],
  },
  assignments: {
    title: "Assignments",
    description: "Create, edit, publish, and track assignments from one place.",
    summary: [
      { label: "Pending", value: "12", icon: ClipboardList, tone: "tone-blue" },
      { label: "Submitted", value: "48", icon: FileText, tone: "tone-teal" },
      { label: "Needs Review", value: "5", icon: Sparkles, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Create Assignment", value: "New task" },
      { title: "Publish", value: "Ready" },
      { title: "Submission Status", value: "Live" },
    ],
    focusTitle: "Assignments to Grade",
    focusItems: [
      { title: "Essay draft", meta: "SS2 English • Due today", note: "7 submissions awaiting review" },
      { title: "Math worksheet", meta: "JSS1 Mathematics • Due tomorrow", note: "12 students submitted" },
      { title: "Lab report", meta: "SS1 Biology • Due Friday", note: "9 pending" },
    ],
    sideTitle: "Upcoming Deadlines",
    sideItems: [
      { title: "Project review", meta: "Thursday • 12:00" },
      { title: "Quiz feedback", meta: "Friday • 15:00" },
      { title: "Class discussion", meta: "Monday • 08:00" },
    ],
    bottomTitle: "Feedback",
    bottomItems: [
      { title: "Progress update", meta: "Students are responding well to weekly tasks" },
      { title: "Support", meta: "Two students requested extra guidance" },
    ],
  },
  results: {
    title: "Results",
    description: "Enter, edit, and save student results with simple class and subject filters.",
    summary: [
      { label: "Recent Tests", value: "3", icon: FileText, tone: "tone-blue" },
      { label: "Average", value: "78%", icon: Sparkles, tone: "tone-teal" },
      { label: "Needs Support", value: "6", icon: Users, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Filter by Class", value: "All classes" },
      { title: "Filter by Subject", value: "English" },
      { title: "Filter by Term", value: "First term" },
    ],
    focusTitle: "Assessment Snapshot",
    focusItems: [
      { title: "SS2 English", meta: "Average 81%", note: "Excellent comprehension performance" },
      { title: "JSS1 Mathematics", meta: "Average 74%", note: "Focus on word problems" },
      { title: "SS1 Biology", meta: "Average 79%", note: "Good practical understanding" },
    ],
    sideTitle: "Result Actions",
    sideItems: [
      { title: "Enter results", meta: "Create the next score entry" },
      { title: "Review gaps", meta: "Check recurring weak topics" },
      { title: "Share feedback", meta: "Create a brief progress note" },
    ],
    bottomTitle: "Student Grades",
    bottomItems: [
      { title: "Progress report", meta: "Prepared for guardian communication" },
      { title: "Celebrations", meta: "Three students earned top marks" },
    ],
  },
  lessonPlans: {
    title: "Lesson Plans",
    description: "Create and review weekly lessons, resources, and teaching notes.",
    summary: [
      { label: "Planned", value: "8", icon: BookOpen, tone: "tone-blue" },
      { label: "Reviewing", value: "2", icon: CalendarDays, tone: "tone-teal" },
      { label: "Ready", value: "6", icon: Sparkles, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Create Lesson Plan", value: "New plan" },
      { title: "Edit Lesson Plan", value: "Update" },
      { title: "Lesson Resources", value: "Slides and notes" },
    ],
    focusTitle: "Lesson Plan Focus",
    focusItems: [
      { title: "Reading comprehension", meta: "SS2 English • Ready to teach", note: "Learning objective prepared" },
      { title: "Fractions practice", meta: "JSS1 Mathematics • Planned", note: "Includes starter and exit quiz" },
      { title: "Lab demonstration", meta: "SS1 Biology • Review stage", note: "Needs a final checklist" },
    ],
    sideTitle: "Teaching Resources",
    sideItems: [
      { title: "Visual aids", meta: "Ready for class delivery" },
      { title: "Worksheets", meta: "Printed for the next lesson" },
      { title: "Assessment prompt", meta: "Prepared for the end of class" },
    ],
    bottomTitle: "Next Lesson",
    bottomItems: [
      { title: "Topic", meta: "Sentence structure and grammar" },
      { title: "Prep", meta: "Review three sample passages" },
    ],
  },
  timetable: {
    title: "Timetable",
    description: "Review your weekly schedule, today’s lessons, and the next class in line.",
    summary: [
      { label: "Periods", value: "6", icon: CalendarDays, tone: "tone-blue" },
      { label: "Free Slots", value: "2", icon: Sparkles, tone: "tone-teal" },
      { label: "Meetings", value: "1", icon: Bell, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Weekly Timetable", value: "Mon–Fri" },
      { title: "Today’s Classes", value: "4 lessons" },
      { title: "Next Class", value: "10:00 AM" },
    ],
    focusTitle: "This Week",
    focusItems: [
      { title: "Monday", meta: "08:00 SS2 English • 10:00 JSS1 Mathematics", note: "Two classes and one meeting" },
      { title: "Wednesday", meta: "12:30 SS1 Biology • 14:00 prep time", note: "Lab practical and planning" },
      { title: "Friday", meta: "09:00 parent feedback • 11:00 results review", note: "Administrative block" },
    ],
    sideTitle: "Upcoming Events",
    sideItems: [
      { title: "Classroom observation", meta: "Tuesday • 09:30" },
      { title: "Department meeting", meta: "Thursday • 14:00" },
      { title: "School assembly", meta: "Friday • 07:30" },
    ],
    bottomTitle: "Schedule Note",
    bottomItems: [
      { title: "Prep window", meta: "Available after lunch on Wednesday" },
      { title: "Flex time", meta: "Use to review homework and feedback" },
    ],
  },
  announcements: {
    title: "Announcements",
    description: "Stay current with school notices and class updates.",
    summary: [
      { label: "New", value: "3", icon: Bell, tone: "tone-blue" },
      { label: "Class", value: "2", icon: BookOpen, tone: "tone-teal" },
      { label: "Important", value: "1", icon: Sparkles, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "School Announcements", value: "Live" },
      { title: "Class Announcement", value: "Create" },
      { title: "Previous", value: "Archive" },
    ],
    focusTitle: "School Announcements",
    focusItems: [
      { title: "Parent seminar", meta: "Tomorrow • 10:00", note: "Attendance requested for all class teachers" },
      { title: "Exam schedule", meta: "Published today", note: "Review the term assessment calendar" },
      { title: "Staff update", meta: "Shared by administration", note: "New submission deadline" },
    ],
    sideTitle: "Class Updates",
    sideItems: [
      { title: "Reading club", meta: "New members this week" },
      { title: "Lab safety", meta: "Reminder for practical sessions" },
      { title: "Homework reminder", meta: "Please check student submissions" },
    ],
    bottomTitle: "Priority",
    bottomItems: [
      { title: "Today", meta: "Review the exam timeline" },
      { title: "Tomorrow", meta: "Share the parent guidance note" },
    ],
  },
  messages: {
    title: "Messages",
    description: "Keep communication flowing with parents, admins, and learners.",
    summary: [
      { label: "Inbox", value: "7", icon: MessageSquare, tone: "tone-blue" },
      { label: "Unread", value: "3", icon: Bell, tone: "tone-teal" },
      { label: "Pending", value: "2", icon: Sparkles, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Inbox", value: "Active" },
      { title: "Send Message", value: "Compose" },
      { title: "From", value: "Admin / Parents" },
    ],
    focusTitle: "Unread Messages",
    focusItems: [
      { title: "Parent enquiry", meta: "From Mrs. Adebayo", note: "Requesting a progress update" },
      { title: "Department note", meta: "From the HOD", note: "Changes to the exam review schedule" },
      { title: "Class reminder", meta: "From support team", note: "Homework submission reminder" },
    ],
    sideTitle: "Quick Replies",
    sideItems: [
      { title: "Acknowledge", meta: "Confirm the parent request" },
      { title: "Schedule", meta: "Arrange a feedback call" },
      { title: "Update", meta: "Share the latest progress note" },
    ],
    bottomTitle: "Communication Note",
    bottomItems: [
      { title: "Response time", meta: "Aim to reply within the same day" },
      { title: "Priority", meta: "Parent queries should be addressed first" },
    ],
  },
  resources: {
    title: "Resources",
    description: "View teaching materials, downloads, and uploaded files for your classes.",
    summary: [
      { label: "Teaching Materials", value: "18", icon: BookOpen, tone: "tone-blue" },
      { label: "Downloads", value: "6", icon: FileText, tone: "tone-teal" },
      { label: "Uploaded Files", value: "11", icon: Sparkles, tone: "tone-rose" },
    ],
    toolbar: [
      { title: "Teaching Materials", value: "Available" },
      { title: "Downloads", value: "Ready to share" },
      { title: "Uploaded Files", value: "Recent" },
    ],
    focusTitle: "Resource Library",
    focusItems: [
      { title: "Lesson notes", meta: "SS2 English • Download ready", note: "Prepared for the next topic" },
      { title: "Worksheet pack", meta: "JSS1 Mathematics • Shared", note: "Includes answer guide" },
      { title: "Lab guide", meta: "SS1 Biology • Updated", note: "Supports the practical lesson" },
    ],
    sideTitle: "Storage",
    sideItems: [
      { title: "Shared folders", meta: "Organized by class and subject" },
      { title: "Recent uploads", meta: "Updated this week" },
      { title: "Access", meta: "Available to your classes" },
    ],
    bottomTitle: "Next Step",
    bottomItems: [
      { title: "Upload material", meta: "Share a new resource with your class" },
      { title: "Download pack", meta: "Prepare for tomorrow's lesson" },
    ],
  },
  profile: {
    title: "Profile",
    description: "Keep your personal information, contact details, and password current.",
    summary: [
      { label: "Role", value: "Teacher", icon: UserCircle2, tone: "tone-blue" },
      { label: "Classes", value: "5", icon: BookOpen, tone: "tone-teal" },
      { label: "Contact", value: "Active", icon: MessageSquare, tone: "tone-rose" },
    ],
    focusTitle: "Profile Snapshot",
    focusItems: [
      { title: "Name", meta: "Grace Okafor", note: "Senior English Teacher" },
      { title: "Phone", meta: "0803 123 4567", note: "Preferred for urgent school contact" },
      { title: "Office", meta: "Block B • Room 12", note: "Available during prep periods" },
    ],
    sideTitle: "Preferences",
    sideItems: [
      { title: "Notifications", meta: "Class updates enabled" },
      { title: "Parent updates", meta: "Daily summary on" },
      { title: "Availability", meta: "Visible after school" },
    ],
    bottomTitle: "Next Step",
    bottomItems: [
      { title: "Update details", meta: "Refresh your profile before the term opens" },
      { title: "Contact preference", meta: "Keep your mobile number current" },
    ],
  },
  settings: {
    title: "Settings",
    description: "Adjust teacher preferences while keeping the wider school administration tools untouched.",
    summary: [
      { label: "Theme", value: "System", icon: Settings, tone: "tone-blue" },
      { label: "Alerts", value: "On", icon: Bell, tone: "tone-teal" },
      { label: "Layout", value: "Compact", icon: Sparkles, tone: "tone-rose" },
    ],
    focusTitle: "Workspace Preferences",
    focusItems: [
      { title: "Theme", meta: "Matches the platform theme", note: "Light and dark mode are supported" },
      { title: "Notifications", meta: "Attendance and assignment reminders", note: "Enabled for daily planning" },
      { title: "View", meta: "Compact card layout", note: "Optimized for classroom routines" },
    ],
    sideTitle: "Quick Settings",
    sideItems: [
      { title: "Update reminder", meta: "Manage class updates" },
      { title: "Message visibility", meta: "Choose what appears first" },
      { title: "Planner layout", meta: "Switch to a wider calendar view" },
    ],
    bottomTitle: "Ready",
    bottomItems: [
      { title: "Workspace", meta: "Your daily tools are in place" },
      { title: "Next step", meta: "Open your classes or assignments" },
    ],
  },
};

export default function TeacherSectionPage({ route = "dashboard" }) {
  const { userInfo } = useContext(UserContext);
  const content = routeConfig[route] || routeConfig.dashboard;
  const teacherName = getDisplayName(userInfo) || userInfo.fullName || "Teacher";
  const teacherRole = userInfo.staffRole || (userInfo.role ? `${userInfo.role}` : "Teacher");
  const teacherDepartment = userInfo.staffDepartment || userInfo.institution || "Department";
  const teacherClass = userInfo.staffClassAssigned || "Not assigned";
  const teacherSubjects = userInfo.staffSubjectsAssigned || [];
  const teacherStatus = userInfo.accountStatus || "active";
  const joinedAt = userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : "";

  return (
    <div className="teacher-page dashboard-home">
      <DashboardHeader
        eyebrow="Staff workspace"
        title={`Welcome back, ${teacherName}`}
        subtitle={`${teacherRole} • ${teacherDepartment}`}
        badge="Teacher Workspace"
        actionLabel="Open planner"
        actionHref="#"
      >
        <UserAvatar user={userInfo} size={44} alt={teacherName} />
      </DashboardHeader>

      {route === "dashboard" ? (
        <section className="teacher-toolbar">
          <div className="teacher-toolbar-item">
            <span>Assigned Class</span>
            <strong>{teacherClass}</strong>
          </div>
          <div className="teacher-toolbar-item">
            <span>Subjects</span>
            <strong>{teacherSubjects.length ? teacherSubjects.join(", ") : "Not assigned"}</strong>
          </div>
          <div className="teacher-toolbar-item">
            <span>Status</span>
            <strong>{teacherStatus}</strong>
          </div>
        </section>
      ) : content.toolbar ? (
        <section className="teacher-toolbar">
          {content.toolbar.map((item) => (
            <div key={item.title} className="teacher-toolbar-item">
              <span>{item.title}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>
      ) : null}

      {route === "dashboard" ? (
        <section className="dashboard-home-summary">
          <StatCard label="Role" value={teacherRole} icon={UserCircle2} tone="blue" description="Current staff position" trend="Active" />
          <StatCard label="Assigned Class" value={teacherClass} icon={BookOpen} tone="teal" description="Current learning group" trend="Live" />
          <StatCard label="Status" value={teacherStatus} icon={ClipboardCheck} tone="rose" description="Account activity" trend="Updated" />
        </section>
      ) : (
        <section className="dashboard-home-summary">
          {content.summary.map((item) => {
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
                <div className={`dashboard-home-summary-action ${item.tone}`}>
                  <span>Live view</span>
                  <ArrowRight size={14} />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {route === "dashboard" ? (
        <section className="teacher-grid">
          <QuickActions
            title="Staff shortcuts"
            items={[
              { label: "Mark Attendance", meta: "Open the class roll", icon: ClipboardCheck },
              { label: "Upload Results", meta: "Save assessment data", icon: FileText },
              { label: "View Classes", meta: "Review your assigned groups", icon: BookOpen },
              { label: "Manage Students", meta: "Watch progress and submissions", icon: Users },
            ]}
          />

          <DashboardWidget title="Profile snapshot" subtitle="Staff details" actionLabel="Open profile">
            <div className="teacher-stack">
              <div className="teacher-item compact">
                <div>
                  <strong>Department</strong>
                  <p>{teacherDepartment}</p>
                </div>
              </div>
              <div className="teacher-item compact">
                <div>
                  <strong>Assigned Class</strong>
                  <p>{teacherClass}</p>
                </div>
              </div>
              <div className="teacher-item compact">
                <div>
                  <strong>Role</strong>
                  <p>{teacherRole}</p>
                </div>
              </div>
              <div className="teacher-item compact">
                <div>
                  <strong>Account Status</strong>
                  <p>{teacherStatus}</p>
                </div>
              </div>
            </div>
          </DashboardWidget>
        </section>
      ) : (
        <>
          <section className="teacher-grid">
            <article className="dashboard-home-panel teacher-panel">
              <h2>{content.focusTitle}</h2>
              <div className="teacher-stack">
                {content.focusItems.map((item) => (
                  <div key={item.title} className="teacher-item">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.meta}</p>
                    </div>
                    <span>{item.note}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-home-panel teacher-panel">
              <h2>{content.sideTitle}</h2>
              <div className="teacher-stack">
                {content.sideItems.map((item) => (
                  <div key={item.title} className="teacher-item compact">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="dashboard-home-panel teacher-panel teacher-bottom-panel">
            <h2>{content.bottomTitle}</h2>
            <div className="teacher-stack">
              {content.bottomItems.map((item) => (
                <div key={item.title} className="teacher-item compact">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {(route === "profile" || route === "settings") ? (
        <section className="dashboard-home-panel teacher-panel">
          <DeleteAccountButton />
        </section>
      ) : null}
    </div>
  );
}
