import { useContext, useEffect, useState } from "react";
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
import AskNuvoraPage from "./Pages/DashboardLayout/pages/AskNuvoraPage";
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
import { applyTheme } from "./utils/theme.js";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Bell, BookOpen, CalendarDays, CheckCircle2, CreditCard, Download, FileText, MessageSquare, School, UserCircle2, Wallet } from "lucide-react";
import "./Styles/DashBoardLayout/SidebarNav.css";
import "./components/dashboard/dashboard.css";
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
import StudentPaymentPage from "./Pages/DashboardLayout/StudentPaymentPage/StudentPaymentPage";
import AdminPaymentSettings from "./Pages/DashboardLayout/AdminPaymentSettings/AdminPaymentSettings";
import Payment from "./Payment";

function PublicLayout() { return <><Navbar /><Outlet /><Footer /></>; }

function DashboardLay() {
  const { userInfo, authReady } = useContext(UserContext);
  const sidebarStorageKey = `petra-dashboard-sidebar-${userInfo?.id || "guest"}`;
  const [collapsed, setCollapsed] = useState(() => { try { return window.localStorage.getItem(`petra-dashboard-sidebar-${userInfo?.id || "guest"}`) === "collapsed"; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { applyTheme("light"); }, []);
  useEffect(() => { if (!userInfo?.id) return; try { setCollapsed(window.localStorage.getItem(sidebarStorageKey) === "collapsed"); } catch {} }, [sidebarStorageKey, userInfo?.id]);
  useEffect(() => { try { window.localStorage.setItem(sidebarStorageKey, collapsed ? "collapsed" : "expanded"); } catch {} }, [collapsed, sidebarStorageKey]);
  const toggle = () => { if (window.innerWidth <= 900) setMobileOpen((open) => !open); else setCollapsed((c) => !c); };
  const closeSidebar = () => setMobileOpen(false);
  if (!authReady) return null;
  if (!userInfo?.email) return <Navigate to="/signin" replace />;
  return <div className="dashboard-shell"><div className={`dashboard-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}><SidebarNav collapsed={collapsed} onNavigate={closeSidebar} onClose={closeSidebar} /></div>{mobileOpen && <button type="button" className="sidebar-backdrop" onClick={closeSidebar} aria-label="Close sidebar" /> }<div className="dashboard-main"><TopNavbar onToggle={toggle} /><div className="dashboard-content"><Outlet /></div></div></div>;
}

function DynamicParentSection(props) {
  const { userInfo } = useContext(UserContext);
  const myChildren = userInfo?.children || [];
  const dynamicSummaryCards = [{ icon: props.icons?.children || School, label: "Children", value: myChildren.length.toString(), meta: "Active learners", tone: "tone-blue" }];
  const dynamicSections = [{ title: "Current learner status", items: myChildren.map((child) => ({ title: child.name, meta: [child.className || child.class, child.teacher || "Assigned Teacher"].filter(Boolean).join(" • "), value: child.status || "On Track" })) }];
  return <ParentSectionPage {...props} summaryCards={dynamicSummaryCards} sections={dynamicSections} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admission_form" element={<AdmissionForm />} /><Route path="/school_Fees" element={<SchoolFeesPaymentPage />} /><Route path="/student_Payment" element={<StudentPaymentPage />} /><Route path="/Payment" element={<Payment />} /><Route path="/payment" element={<Payment />} /><Route path="/signin" element={<SignIn />} /><Route path="/dev/schools/:id" element={<SuperAdminDashboard />} /><Route path="/dev/*" element={<SuperAdminDashboard />} /><Route path="/register" element={<RegistrationEntry />} /><Route path="/register/select" element={<RegistrationEntry />} /><Route path="/register/admin" element={<AdminRegister />} /><Route path="/register/parent" element={<ParentRegister />} /><Route path="/register/staff" element={<StaffRegister />} /><Route path="/register/teacher" element={<Register rolePreset="teacher" />} /><Route path="/get-started" element={<RegistrationEntry />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} /><Route path="/solution" element={<Solution />} /><Route path="/solution/school-os" element={<SchoolOS />} /><Route path="/solution/financial-management" element={<FinancialManagement />} /><Route path="/solution/cbt-engine" element={<CBTEngine />} /><Route path="/solution/petra-pay" element={<PetraPay />} /><Route path="/solution/flexpay" element={<FlexPay />} /><Route path="/solution/performance" element={<Performance />} /><Route path="/solution/ai-study-app" element={<AIStudyApp />} /><Route path="/solution/learning-hub" element={<LearningHub />} /><Route path="/solution/digital-library" element={<DigitalLibrary />} /><Route path="/solution/teacher-workspace" element={<TeacherWorkspace />} /><Route path="/solution/lesson-planner" element={<LessonPlanner />} /><Route path="/solution/assessment-tools" element={<AssessmentTools />} /><Route path="/solution/school-analytics" element={<SchoolAnalytics />} /><Route path="/solution/admissions" element={<Admissions />} /><Route path="/solution/communication-hub" element={<CommunicationHub />} /><Route path="/company" element={<Company />} /><Route path="/schools" element={<ForSchool />} /><Route path="/parents" element={<Forparents />} /><Route path="/students" element={<ForStudents />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} />
        </Route>
        <Route element={<DashboardLay />}>
          <Route path="/dashboard/ask-nuvora" element={<AskNuvoraPage />} /><Route path="/dashboard" element={<DashboardHomePage />} /><Route path="/dashboard/overview" element={<LiveOverviewPage />} /><Route path="/dashboard/overview/live" element={<LiveOverviewPage />} /><Route path="/dashboard/overview/daily" element={<DailyReportsPage />} /><Route path="/dashboard/overview/term" element={<TermSummaryPage />} /><Route path="/dashboard/get-started" element={<GetStarted />} /><Route path="/dashboard/setup/profile" element={<ProfilePage />} /><Route path="/dashboard/setup/sessions" element={<SessionsPage />} /><Route path="/dashboard/setup/classes" element={<ClassesPage />} /><Route path="/dashboard/setup/subjects" element={<SubjectsPage />} />
          <Route path="/dashboard/students" element={<StudentsListPage />} /><Route path="/dashboard/students/applicants" element={<ApplicantsPage />} /><Route path="/dashboard/students/enrollment" element={<EnrollmentPage />} /><Route path="/dashboard/students/enrollment/create" element={<EnrollmentCreatePage />} /><Route path="/dashboard/students/parents" element={<ParentsPage />} /><Route path="/dashboard/students/gate" element={<GatePage />} />
          <Route path="/dashboard/academics" element={<AcademicsPage />} /><Route path="/dashboard/academics/timetable" element={<TimetablePage />} /><Route path="/dashboard/academics/bus" element={<BusPage />} /><Route path="/dashboard/academics/attendance" element={<AttendancePage />} />
          <Route path="/dashboard/examination" element={<ExaminationPage />} /><Route path="/dashboard/examination/cbt" element={<CbtPage />} /><Route path="/dashboard/examination/results" element={<ResultsPage />} /><Route path="/dashboard/examination/reports" element={<ReportsPage />} />
          <Route path="/dashboard/staff" element={<StaffPage />} /><Route path="/dashboard/staff/teachers" element={<TeachersPage />} /><Route path="/dashboard/staff/admins" element={<StaffAdminsPage />} /><Route path="/dashboard/staff/management" element={<StaffManagementPage />} /><Route path="/dashboard/staff/attendance" element={<StaffAttendancePage />} />
          <Route path="/dashboard/finance" element={<FinancePage />} /><Route path="/dashboard/finance/payments" element={<PaymentsPage />} /><Route path="/dashboard/finance/invoices" element={<InvoicesPage />} /><Route path="/dashboard/finance/extra-fees" element={<ExtraFeesPage />} /><Route path="/dashboard/finance/wallet" element={<WalletPage />} /><Route path="/dashboard/finance/flexpay" element={<FlexpayPage />} /><Route path="/dashboard/finance/cashflow" element={<CashflowPage />} />
          <Route path="/dashboard/communication" element={<CommunicationPage />} /><Route path="/dashboard/communication/notifications" element={<NotificationsPage />} /><Route path="/dashboard/communication/announcements" element={<AnnouncementsPage />} /><Route path="/dashboard/communication/messages" element={<MessagesPage />} /><Route path="/dashboard/communication/support" element={<SupportPage />} /><Route path="/dashboard/students/parent-links" element={<PortalLinksPage />} /><Route path="/dashboard/settings" element={<SettingsPage />} />

          <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} /><Route path="/staff/dashboard" element={<TeacherWorkspacePage />} /><Route path="/staff/classes" element={<TeacherWorkspacePage activeView="classes" />} /><Route path="/staff/classes/:classId" element={<TeacherWorkspacePage activeView="classDetails" />} /><Route path="/staff/students" element={<TeacherWorkspacePage activeView="students" />} /><Route path="/staff/attendance" element={<TeacherWorkspacePage activeView="attendance" />} /><Route path="/staff/assessments" element={<TeacherWorkspacePage activeView="assessments" />} /><Route path="/staff/results" element={<TeacherWorkspacePage activeView="results" />} /><Route path="/staff/announcements" element={<TeacherWorkspacePage activeView="announcements" />} /><Route path="/staff/notifications" element={<NotificationsPage />} /><Route path="/staff/messages" element={<MessagesPage />} /><Route path="/staff/profile" element={<TeacherWorkspacePage activeView="profile" />} /><Route path="/staff/settings" element={<TeacherWorkspacePage activeView="settings" />} /><Route path="/staff/ask-nuvora" element={<AskNuvoraPage />} />

          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} /><Route path="/portal/ask-nuvora" element={<AskNuvoraPage />} /><Route path="/portal/dashboard" element={<ParentDashboard />} /><Route path="/portal/children" element={<DynamicParentSection title="Children" />} /><Route path="/portal/fees" element={<ParentFeesPage />} />
        </Route>
      </Routes>
      <DeleteAccountButton />
    </Router>
  );
}

export default App;
