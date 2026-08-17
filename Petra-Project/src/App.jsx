import { useContext, useState } from "react";
import Footer from "./Pages/components/Footer";
import ForSchool from "./Pages/Forschool";
import ForStudents from "./Pages/Forstusents";
import Solution from "./Pages/Solution";
import { SidebarNav } from "./Pages/DashboardLayout/SidebarNav";
import Company from "./Pages/Company";
import Navbar from "./Pages/components/Navbar";
import Forparents from "./Pages/Forparents";
import About from "./Pages/About";
import LandingPage from "./Pages/LandingPage";
import SignIn from "./Pages/Sigin/SignIn";
import Register from "./Pages/Sigin/Register";
import RegistrationEntry from "./Pages/Sigin/RegistrationEntry";
import StaffRegister from "./Pages/Sigin/StaffRegister";
import ParentRegister from "./Pages/Sigin/ParentRegister";
import AdminRegister from "./Pages/Sigin/AdminRegister";
import DashboardHomePage from "./Pages/DashboardLayout/pages/DashboardHomePage";
import GetStarted from "./Pages/DashboardLayout/pages/GetStarted";
import ParentDashboard from "./Pages/DashboardLayout/pages/parent/ParentDashboard";
import ParentSectionPage from "./Pages/DashboardLayout/pages/parent/ParentSectionPage";
import DeleteAccountButton from "./components/DeleteAccountButton";
import StaffManagementPage from "./Pages/DashboardLayout/pages/staff/StaffManagementPage";
import TeacherWorkspacePage from "./Pages/DashboardLayout/pages/staff/TeacherWorkspacePage";
import SchoolSetupPage from "./Pages/DashboardLayout/pages/SchoolSetupPage";
import StudentsListPage from "./Pages/DashboardLayout/pages/students/StudentsListPage";
import AcademicsPage from "./Pages/DashboardLayout/pages/AcademicsPage";
import ExaminationPage from "./Pages/DashboardLayout/pages/ExaminationPage";
import StaffPage from "./Pages/DashboardLayout/pages/StaffPage";
import FinancePage from "./Pages/DashboardLayout/pages/FinancePage";
import CommunicationPage from "./Pages/DashboardLayout/pages/CommunicationPage";
import SettingsPage from "./Pages/DashboardLayout/pages/SettingsPage";
import ProfilePage from "./Pages/DashboardLayout/pages/setup/ProfilePage";
import SessionsPage from "./Pages/DashboardLayout/pages/setup/SessionsPage";
import ClassesPage from "./Pages/DashboardLayout/pages/setup/ClassesPage";
import SubjectsPage from "./Pages/DashboardLayout/pages/setup/SubjectsPage";
import EnrollmentPage from "./Pages/DashboardLayout/pages/students/EnrollmentPage";
import EnrollmentCreatePage from "./Pages/DashboardLayout/pages/students/EnrollmentCreatePage";
import ParentsPage from "./Pages/DashboardLayout/pages/students/ParentsPage";
import ApplicantsPage from "./Pages/DashboardLayout/pages/students/ApplicantsPage";
import GatePage from "./Pages/DashboardLayout/pages/students/GatePage";
import LiveOverviewPage from "./Pages/DashboardLayout/pages/overview/LiveOverviewPage";
import DailyReportsPage from "./Pages/DashboardLayout/pages/overview/DailyReportsPage";
import TermSummaryPage from "./Pages/DashboardLayout/pages/overview/TermSummaryPage";
import TimetablePage from "./Pages/DashboardLayout/pages/academics/TimetablePage";
import BusPage from "./Pages/DashboardLayout/pages/academics/BusPage";
import AttendancePage from "./Pages/DashboardLayout/pages/academics/AttendancePage";
import CbtPage from "./Pages/DashboardLayout/pages/examination/CbtPage";
import ResultsPage from "./Pages/DashboardLayout/pages/examination/ResultsPage";
import ReportsPage from "./Pages/DashboardLayout/pages/examination/ReportCardsPage";
import TeachersPage from "./Pages/DashboardLayout/pages/staff/TeachersPage";
import StaffAdminsPage from "./Pages/DashboardLayout/pages/staff/AdminsPage";
import StaffAttendancePage from "./Pages/DashboardLayout/pages/staff/StaffAttendancePage";
import PaymentsPage from "./Pages/DashboardLayout/pages/finance/PaymentsPage";
import InvoicesPage from "./Pages/DashboardLayout/pages/finance/InvoicesPage";
import ExtraFeesPage from "./Pages/DashboardLayout/pages/finance/ExtraFeesPage";
import FlexpayPage from "./Pages/DashboardLayout/pages/finance/FlexpayPage";
import CashflowPage from "./Pages/DashboardLayout/pages/finance/CashflowPage";
import WalletPage from "./Pages/DashboardLayout/pages/finance/WalletPage";
import NotificationsPage from "./Pages/DashboardLayout/pages/communication/NotificationsPage";
import SupportPage from "./Pages/DashboardLayout/pages/communication/SupportPage";
import AnnouncementsPage from "./Pages/DashboardLayout/pages/communication/AnnouncementsPage";
import MessagesPage from "./Pages/DashboardLayout/pages/communication/MessagesPage";
import ParentFeesPage from "./Pages/DashboardLayout/pages/parent/ParentFeesPage";
import Contact from "./Pages/Contact";
import TopNavbar from "./Pages/DashboardLayout/TopNavbar";
import { UserContext } from "./context/UserContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  MessageSquare,
  School,
  UserCircle2,
  Wallet,
} from "lucide-react";
import "./Styles/DashBoardLayout/SidebarNav.css";
import "../src/utils/theme";
import SchoolOS from "./Pages/solutions/SchoolOS";
import FinancialManagement from "./Pages/solutions/FinancialManagement";
import CBTEngine from "./Pages/solutions/CBTEngine";
import PetraPay from "./Pages/solutions/PetraPay";
import FlexPay from "./Pages/solutions/FlexPay";
import Performance from "./Pages/solutions/Performance";
import AIStudyApp from "./Pages/solutions/AIStudyApp";
import LearningHub from "./Pages/solutions/LearningHub";
import DigitalLibrary from "./Pages/solutions/DigitalLibrary";
import TeacherWorkspace from "./Pages/solutions/TeacherWorkspace";
import LessonPlanner from "./Pages/solutions/LessonPlanner";
import AssessmentTools from "./Pages/solutions/AssessmentTools";
import SchoolAnalytics from "./Pages/solutions/SchoolAnalytics";
import Admissions from "./Pages/solutions/Admissions";
import CommunicationHub from "./Pages/solutions/CommunicationHub";
import PortalLinksPage from "./Pages/DashboardLayout/pages/PortailLinks/PortalLinksPage";
import SuperAdminDashboard from "./Pages/DashboardLayout/pages/dev/SuperAdminDashboard";


import AdmissionForm from "./Pages/DashboardLayout/AdmissionForm/AdmissionForm";
import SchoolFeesPaymentPage from "./Pages/DashboardLayout/SchoolFeesPaymentPage/SchoolFeesPaymentPage";
import AdmissionPassScreen from "./Pages/DashboardLayout/AdmissionPassScreen/AdmissionPassScreen";
import ApplicationStatusPage from "./Pages/DashboardLayout/ApplicationStatusPage/ApplicationStatusPage";

import Payment from "./Payment";
import StudentPaymentPage from "./Pages/DashboardLayout/StudentPaymentPage/StudentPaymentPage";
import AdminPaymentSettings from "./Pages/DashboardLayout/AdminPaymentSettings/AdminPaymentSettings";


function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function DashboardLay() {
  const { userInfo, authReady } = useContext(UserContext);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((c) => !c);
    }
  };

  const closeSidebar = () => setMobileOpen(false);

  // Wait for session restoration, then require a signed-in user.
  if (!authReady) {
    return null;
  }
  if (!userInfo?.email) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="dashboard-shell">
      <div className={`dashboard-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <SidebarNav collapsed={collapsed} onNavigate={closeSidebar} />
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}
      <div className="dashboard-main">
        <TopNavbar onToggle={toggle} />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function DynamicParentSection(props) {
  const { userInfo } = useContext(UserContext);
  const myChildren = userInfo?.children || [];

  // Dynamically build the data based on the real user
  const dynamicSummaryCards = [
    { icon: props.icons?.children || School, label: "Children", value: myChildren.length.toString(), meta: "Active learners", tone: "tone-blue" },
    // Add more dynamic cards here
  ];

  const dynamicSections = [
    {
      title: "Current learner status",
      items: myChildren.map(child => ({
        title: child.name,
        meta: [child.className || child.class, child.teacher || "Assigned Teacher"].filter(Boolean).join(" • "),
        value: child.status || "On Track"
      }))
    }
  ];

  // Pass the dynamic data into your existing ParentSectionPage
  return (
    <ParentSectionPage 
      {...props} 
      summaryCards={dynamicSummaryCards}
      sections={dynamicSections}
    />
  );
}

function App() {
  const parentSection = (props) => <ParentSectionPage {...props} />;

  return (
    <Router>
      <Routes>
        <Route path="/admission_form" element={<AdmissionForm />} />
<Route path="/school_Fees" element={<SchoolFeesPaymentPage />} />
<Route path="/student_Payment" element={<StudentPaymentPage />} />
    <Route path="/Payment" element={<Payment />} ></Route>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dev/*" element={<SuperAdminDashboard />} />
        <Route path="/register" element={<RegistrationEntry />} />
        <Route path="/register/select" element={<RegistrationEntry />} />
        <Route path="/register/admin" element={<AdminRegister />} />
        <Route path="/register/parent" element={<ParentRegister />} />
        <Route path="/register/staff" element={<StaffRegister />} />
        <Route path="/register/teacher" element={<Register rolePreset="teacher" />} />
        <Route path="/get-started" element={<RegistrationEntry />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/solution" element={<Solution />} />
          {/* <Route path="/classmarker" element={<ClassMarkerPage />} /> */}
          <Route path="/solution/school-os" element={<SchoolOS />} />
          <Route
            path="/solution/financial-management"
            element={<FinancialManagement />}
          />
          <Route path="/solution/cbt-engine" element={<CBTEngine />} />
          <Route path="/solution/petra-pay" element={<PetraPay />} />
          <Route path="/solution/flexpay" element={<FlexPay />} />
          <Route path="/solution/performance" element={<Performance />} />
          <Route path="/solution/ai-study-app" element={<AIStudyApp />} />
          <Route path="/solution/learning-hub" element={<LearningHub />} />
          <Route
            path="/solution/digital-library"
            element={<DigitalLibrary />}
          />
          <Route
            path="/solution/teacher-workspace"
            element={<TeacherWorkspace />}
          />
          <Route path="/solution/lesson-planner" element={<LessonPlanner />} />
          <Route
            path="/solution/assessment-tools"
            element={<AssessmentTools />}
          />
          <Route
            path="/solution/school-analytics"
            element={<SchoolAnalytics />}
          />
          <Route path="/solution/admissions" element={<Admissions />} />
          <Route
            path="/solution/communication-hub"
            element={<CommunicationHub />}
          />
          <Route path="/company" element={<Company />} />
          <Route path="/schools" element={<ForSchool />} />
          <Route path="/parents" element={<Forparents />} />
          <Route path="/students" element={<ForStudents />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Dashboard */}
        <Route element={<DashboardLay />}>
          <Route path="/dashboard" element={<DashboardHomePage />} />
          <Route path="/dashboard/overview" element={<LiveOverviewPage />} />
          <Route path="/dashboard/overview/live" element={<LiveOverviewPage />} />
          <Route path="/dashboard/overview/daily" element={<DailyReportsPage />} />
          <Route path="/dashboard/overview/term" element={<TermSummaryPage />} />
          <Route path="/dashboard/get-started" element={<GetStarted />} />
          <Route path="/dashboard/setup/profile" element={<ProfilePage />} />
          <Route path="/dashboard/setup/sessions" element={<SessionsPage />} />
          <Route path="/dashboard/setup/classes" element={<ClassesPage />} />
          <Route path="/dashboard/setup/subjects" element={<SubjectsPage />} />

          <Route path="/dashboard/students" element={<StudentsListPage />} />
          <Route path="/dashboard/students/applicants" element={<ApplicantsPage />} />
          <Route
            path="/dashboard/students/enrollment"
            element={<EnrollmentPage />}
          />
          <Route
            path="/dashboard/students/enrollment/create"
            element={<EnrollmentCreatePage />}
          />
          <Route path="/dashboard/students/parents" element={<ParentsPage />} />
          <Route path="/dashboard/students/gate" element={<GatePage />} />

          <Route path="/dashboard/academics" element={<AcademicsPage />} />
          <Route
            path="/dashboard/academics/timetable"
            element={<TimetablePage />}
          />
          <Route path="/dashboard/academics/bus" element={<BusPage />} />
          <Route
            path="/dashboard/academics/attendance"
            element={<AttendancePage />}
          />

          <Route path="/dashboard/examination" element={<ExaminationPage />} />
          <Route path="/dashboard/examination/cbt" element={<CbtPage />} />
          <Route
            path="/dashboard/examination/results"
            element={<ResultsPage />}
          />
          <Route
            path="/dashboard/examination/reports"
            element={<ReportsPage />}
          />

          <Route path="/dashboard/staff" element={<StaffPage />} />
          <Route path="/dashboard/staff/teachers" element={<TeachersPage />} />
          <Route path="/dashboard/staff/admins" element={<StaffAdminsPage />} />
          <Route
            path="/dashboard/staff/management"
            element={<StaffManagementPage />}
          />
          <Route
            path="/dashboard/staff/attendance"
            element={<StaffAttendancePage />}
          />

          <Route path="/dashboard/finance" element={<FinancePage />} />
          <Route
            path="/dashboard/finance/payments"
            element={<PaymentsPage />}
          />
          <Route
            path="/dashboard/finance/invoices"
            element={<InvoicesPage />}
          />
          <Route
            path="/dashboard/finance/extra-fees"
            element={<ExtraFeesPage />}
          />
          <Route path="/dashboard/finance/wallet" element={<WalletPage />} />
          <Route path="/dashboard/finance/flexpay" element={<FlexpayPage />} />
          <Route
            path="/dashboard/finance/cashflow"
            element={<CashflowPage />}
          />

          <Route
            path="/dashboard/communication"
            element={<CommunicationPage />}
          />
          <Route
            path="/dashboard/communication/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/dashboard/communication/announcements"
            element={<AnnouncementsPage />}
          />
          <Route
            path="/dashboard/communication/messages"
            element={<MessagesPage />}
          />
          <Route
            path="/dashboard/communication/support"
            element={<SupportPage />}
          />
          <Route path="/dashboard/students/parent-links" element={<PortalLinksPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />

          <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="/staff/dashboard" element={<TeacherWorkspacePage />} />
          <Route path="/staff/classes" element={<TeacherWorkspacePage activeView="classes" />} />
          <Route path="/staff/classes/:classId" element={<TeacherWorkspacePage activeView="classDetails" />} />
          <Route path="/staff/students" element={<TeacherWorkspacePage activeView="students" />} />
          <Route path="/staff/attendance" element={<TeacherWorkspacePage activeView="attendance" />} />
          <Route path="/staff/assessments" element={<TeacherWorkspacePage activeView="assessments" />} />
          <Route path="/staff/results" element={<TeacherWorkspacePage activeView="results" />} />
          <Route path="/staff/announcements" element={<TeacherWorkspacePage activeView="announcements" />} />
          <Route path="/staff/profile" element={<TeacherWorkspacePage activeView="profile" />} />
          <Route path="/staff/settings" element={<TeacherWorkspacePage activeView="settings" />} />

          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/dashboard" element={<ParentDashboard />} />
          <Route 
  path="/portal/children" 
  element={
    <DynamicParentSection
      title="Children Overview"
      description="A calm snapshot of each child’s class, teacher, and current progress."
      heroTitle="Your children at a glance"
      heroDescription="Keep track of performance, wellbeing, and next steps."
      icons={{ children: School }} // Pass icons if needed
      actions={[
        { icon: FileText, title: "View child profile", meta: "Open the latest school summary" },
      ]}
    />
  } 
/>
          <Route
            path="/portal/attendance"
            element={parentSection({
              title: "Attendance Summary",
              description: "See how each child is doing in terms of punctuality and school presence.",
              heroTitle: "Attendance at a glance",
              heroDescription: "A healthy attendance record is visible right away for both children.",
              heroChips: ["92% so far", "2 late arrivals", "3 absences"],
              summaryCards: [
                { icon: CalendarDays, label: "Present", value: "92%", meta: "This term", tone: "tone-blue" },
                { icon: CheckCircle2, label: "Late", value: "2", meta: "This week", tone: "tone-teal" },
                { icon: FileText, label: "Absence", value: "3", meta: "Recorded this month", tone: "tone-rose" },
              ],
              sections: [
                {
                  title: "Attendance record",
                  items: [
                    { title: "Ayo Ogunleye", meta: "Present on 18 of 20 days", value: "90%" },
                    { title: "Tolu Ogunleye", meta: "Present on 17 of 20 days", value: "85%" },
                  ],
                },
              ],
              actions: [
                { icon: FileText, title: "Download attendance", meta: "Save a printable overview" },
                { icon: Bell, title: "Set reminder", meta: "Get a weekly attendance note" },
              ],
            })}
          />
          <Route
            path="/portal/results"
            element={parentSection({
              title: "Latest Results",
              description: "Track the most recent assessment outcomes and academic growth.",
              heroTitle: "Academic updates",
              heroDescription: "Review recent scores before the next parent-teacher conversation.",
              heroChips: ["English 81%", "Math 74%", "Biology 79%"],
              summaryCards: [
                { icon: FileText, label: "English", value: "81%", meta: "Excellent comprehension", tone: "tone-blue" },
                { icon: BookOpen, label: "Mathematics", value: "74%", meta: "Needs revision", tone: "tone-teal" },
                { icon: School, label: "Biology", value: "79%", meta: "Strong practical work", tone: "tone-rose" },
              ],
              sections: [
                {
                  title: "Recent scores",
                  items: [
                    { title: "English", meta: "Ayo improved in comprehension", value: "81%" },
                    { title: "Science", meta: "Tolu completed practicals", value: "76%" },
                  ],
                },
              ],
              actions: [
                { icon: Download, title: "Download report card", meta: "Keep a copy for your records" },
                { icon: MessageSquare, title: "Talk to teacher", meta: "Ask for support tips" },
              ],
            })}
          />
          <Route
            path="/portal/assignments"
            element={parentSection({
              title: "Assignments and Homework",
              description: "Stay on top of due dates and upcoming tasks for both children.",
              heroTitle: "Stay prepared",
              heroDescription: "See what is due soon and keep the week organised.",
              heroChips: ["3 tasks due", "1 due tomorrow", "2 due next week"],
              summaryCards: [
                { icon: BookOpen, label: "Science Homework", value: "Tomorrow", meta: "Due 08:00", tone: "tone-blue" },
                { icon: FileText, label: "Reading Log", value: "Friday", meta: "Due 15:00", tone: "tone-teal" },
                { icon: CalendarDays, label: "Math Practice", value: "Monday", meta: "Due 12:00", tone: "tone-rose" },
              ],
              sections: [
                {
                  title: "Upcoming tasks",
                  items: [
                    { title: "Science Homework", meta: "Due tomorrow • 08:00" },
                    { title: "Reading Log", meta: "Due Friday • 15:00" },
                  ],
                },
              ],
              actions: [
                { icon: BookOpen, title: "Open homework guide", meta: "Review learning instructions" },
                { icon: Bell, title: "Set task reminder", meta: "Receive a gentle nudge" },
              ],
            })}
          />
          <Route path="/portal/fees" element={<ParentFeesPage />} />
          <Route
            path="/portal/announcements"
            element={parentSection({
              title: "School Announcements",
              description: "Stay updated with school notices and important family updates.",
              heroTitle: "Latest notices",
              heroDescription: "Be informed about meetings, events, and changes in school routine.",
              heroChips: ["Parent-teacher meeting", "Mid-term revision", "Open day"],
              summaryCards: [
                { icon: Bell, label: "Meetings", value: "1", meta: "This week", tone: "tone-blue" },
                { icon: School, label: "Events", value: "2", meta: "Upcoming", tone: "tone-teal" },
              ],
              sections: [
                {
                  title: "Announcements",
                  items: [
                    { title: "Parent-Teacher Meeting", meta: "Thursday • 10:00" },
                    { title: "Mid-Term Revision", meta: "Friday • 14:00" },
                  ],
                },
              ],
              actions: [
                { icon: Bell, title: "Turn on alerts", meta: "Receive updates instantly" },
                { icon: FileText, title: "Read details", meta: "Open full notice" },
              ],
            })}
          />
          <Route
            path="/portal/messages"
            element={parentSection({
              title: "Messages from Teachers",
              description: "Read the latest teacher notes and school updates for your children.",
              heroTitle: "Stay connected",
              heroDescription: "A simple view for important messages from teachers and school offices.",
              heroChips: ["2 unread", "1 new note", "Quick replies"],
              summaryCards: [
                { icon: MessageSquare, label: "New messages", value: "2", meta: "Last 24 hours", tone: "tone-blue" },
                { icon: Bell, label: "Teacher notes", value: "3", meta: "This week", tone: "tone-teal" },
              ],
              sections: [
                {
                  title: "Recent messages",
                  items: [
                    { title: "Mrs. Adeyemi", meta: "Your child improved in reading" },
                    { title: "School Admin", meta: "Fee reminder for the next installment" },
                  ],
                },
              ],
              actions: [
                { icon: MessageSquare, title: "Reply now", meta: "Send a note back" },
                { icon: FileText, title: "View thread", meta: "Open the full conversation" },
              ],
            })}
          />
          <Route
            path="/portal/downloads"
            element={parentSection({
              title: "Downloads and Documents",
              description: "Access school forms, notices, and lesson resources from one place.",
              heroTitle: "Useful documents",
              heroDescription: "Download the records you need without hunting through email.",
              heroChips: ["4 available", "2 recent", "Ready to save"],
              summaryCards: [
                { icon: Download, label: "Reports", value: "2", meta: "Ready to download", tone: "tone-blue" },
                { icon: FileText, label: "Forms", value: "2", meta: "Available now", tone: "tone-teal" },
              ],
              sections: [
                {
                  title: "Available resources",
                  items: [
                    { title: "Term report card", meta: "PDF • Updated today", value: "Download" },
                    { title: "Transport form", meta: "PDF • For the next trip", value: "Download" },
                  ],
                },
              ],
              actions: [
                { icon: Download, title: "Download all", meta: "Save the latest files" },
                { icon: FileText, title: "Open folder", meta: "Browse school documents" },
              ],
            })}
          />
          <Route
            path="/portal/profile"
            element={parentSection({
              title: "Parent Profile",
              description: "Review the parent account details and preferred contact settings.",
              heroTitle: "Account overview",
              heroDescription: "Make sure your profile details stay current for school communication.",
              heroChips: ["Primary guardian", "Verified account", "Notifications on"],
              summaryCards: [
                { icon: UserCircle2, label: "Profile", value: "Active", meta: "Verified account", tone: "tone-blue" },
                { icon: Bell, label: "Contacts", value: "2", meta: "Preferred channels", tone: "tone-teal" },
              ],
              sections: [
                {
                  title: "Profile details",
                  items: [
                    { title: "Name", meta: "Mrs. Temitope Ogunleye" },
                    { title: "Phone", meta: "+234 812 345 6789" },
                  ],
                },
              ],
              actions: [
                { icon: UserCircle2, title: "Edit profile", meta: "Update your details" },
                { icon: Bell, title: "Notification settings", meta: "Adjust alerts" },
              ],
            })}
          />
          <Route path="/portal/settings" element={<SettingsPage role="parent" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
