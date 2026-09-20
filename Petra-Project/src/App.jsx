import { useContext, useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Bell, BookOpen, CalendarDays, CheckCircle2, Download, FileText, MessageSquare, School } from "lucide-react";
import Navbar from "./Pages/components/Navbar";
import Footer from "./Pages/components/Footer";
import { SidebarNav } from "./Pages/DashboardLayout/SidebarNav";
import TopNavbar from "./Pages/DashboardLayout/TopNavbar";
import DeleteAccountButton from "./components/DeleteAccountButton";
import PageLoadingFallback from "./components/PageLoadingFallback/PageLoadingFallback";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { UserContext } from "./context/UserContext";
import { applyTheme } from "./utils/theme.js";
import "./Styles/DashBoardLayout/SidebarNav.css";
import "./components/dashboard/dashboard.css";
import "../src/utils/theme";

// Lazy-loaded Public Pages
const LandingPage = lazy(() => import("./Pages/LandingPage"));
const About = lazy(() => import("./Pages/About"));
const Contact = lazy(() => import("./Pages/Contact"));
const Company = lazy(() => import("./Pages/Company"));
const ForSchool = lazy(() => import("./Pages/Forschool"));
const Forparents = lazy(() => import("./Pages/Forparents"));
const ForStudents = lazy(() => import("./Pages/Forstusents"));
const Solution = lazy(() => import("./Pages/Solution"));

// Lazy-loaded Solutions Pages
const SchoolOS = lazy(() => import("./Pages/solutions/SchoolOS"));
const FinancialManagement = lazy(() => import("./Pages/solutions/FinancialManagement"));
const CBTEngine = lazy(() => import("./Pages/solutions/CBTEngine"));
const PetraPay = lazy(() => import("./Pages/solutions/PetraPay"));
const FlexPay = lazy(() => import("./Pages/solutions/FlexPay"));
const Performance = lazy(() => import("./Pages/solutions/Performance"));
const AIStudyApp = lazy(() => import("./Pages/solutions/AIStudyApp"));
const LearningHub = lazy(() => import("./Pages/solutions/LearningHub"));
const DigitalLibrary = lazy(() => import("./Pages/solutions/DigitalLibrary"));
const TeacherWorkspace = lazy(() => import("./Pages/solutions/TeacherWorkspace"));
const LessonPlanner = lazy(() => import("./Pages/solutions/LessonPlanner"));
const AssessmentTools = lazy(() => import("./Pages/solutions/AssessmentTools"));
const SchoolAnalytics = lazy(() => import("./Pages/solutions/SchoolAnalytics"));
const Admissions = lazy(() => import("./Pages/solutions/Admissions"));
const CommunicationHub = lazy(() => import("./Pages/solutions/CommunicationHub"));

// Lazy-loaded Auth & Standalone Pages
const SignIn = lazy(() => import("./Pages/Sigin/SignIn"));
const Register = lazy(() => import("./Pages/Sigin/Register"));
const RegistrationEntry = lazy(() => import("./Pages/Sigin/RegistrationEntry"));
const StaffRegister = lazy(() => import("./Pages/Sigin/StaffRegister"));
const ParentRegister = lazy(() => import("./Pages/Sigin/ParentRegister"));
const AdminRegister = lazy(() => import("./Pages/Sigin/AdminRegister"));
const AdmissionForm = lazy(() => import("./Pages/DashboardLayout/AdmissionForm/AdmissionForm"));
const SchoolFeesPaymentPage = lazy(() => import("./Pages/DashboardLayout/SchoolFeesPaymentPage/SchoolFeesPaymentPage"));
const StudentPaymentPage = lazy(() => import("./Pages/DashboardLayout/StudentPaymentPage/StudentPaymentPage"));
const Payment = lazy(() => import("./Payment"));
const SuperAdminDashboard = lazy(() => import("./Pages/DashboardLayout/pages/dev/SuperAdminDashboard"));

// Lazy-loaded Dashboard Pages
const DashboardHomePage = lazy(() => import("./Pages/DashboardLayout/pages/DashboardHomePage"));
const GetStarted = lazy(() => import("./Pages/DashboardLayout/pages/GetStarted"));
const AskNuvoraPage = lazy(() => import("./Pages/DashboardLayout/pages/AskNuvoraPage"));
const LiveOverviewPage = lazy(() => import("./Pages/DashboardLayout/pages/overview/LiveOverviewPage"));
const DailyReportsPage = lazy(() => import("./Pages/DashboardLayout/pages/overview/DailyReportsPage"));
const TermSummaryPage = lazy(() => import("./Pages/DashboardLayout/pages/overview/TermSummaryPage"));

// Lazy-loaded Setup & Academics
const ProfilePage = lazy(() => import("./Pages/DashboardLayout/pages/setup/ProfilePage"));
const SessionsPage = lazy(() => import("./Pages/DashboardLayout/pages/setup/SessionsPage"));
const ClassesPage = lazy(() => import("./Pages/DashboardLayout/pages/setup/ClassesPage"));
const SubjectsPage = lazy(() => import("./Pages/DashboardLayout/pages/setup/SubjectsPage"));
const AcademicsPage = lazy(() => import("./Pages/DashboardLayout/pages/AcademicsPage"));
const TimetablePage = lazy(() => import("./Pages/DashboardLayout/pages/academics/TimetablePage"));
const BusPage = lazy(() => import("./Pages/DashboardLayout/pages/academics/BusPage"));
const AttendancePage = lazy(() => import("./Pages/DashboardLayout/pages/academics/AttendancePage"));

// Lazy-loaded Students & Examination
const StudentsListPage = lazy(() => import("./Pages/DashboardLayout/pages/students/StudentsListPage"));
const ApplicantsPage = lazy(() => import("./Pages/DashboardLayout/pages/students/ApplicantsPage"));
const EnrollmentPage = lazy(() => import("./Pages/DashboardLayout/pages/students/EnrollmentPage"));
const EnrollmentCreatePage = lazy(() => import("./Pages/DashboardLayout/pages/students/EnrollmentCreatePage"));
const ParentsPage = lazy(() => import("./Pages/DashboardLayout/pages/students/ParentsPage"));
const GatePage = lazy(() => import("./Pages/DashboardLayout/pages/students/GatePage"));
const PortalLinksPage = lazy(() => import("./Pages/DashboardLayout/pages/PortailLinks/PortalLinksPage"));
const ExaminationPage = lazy(() => import("./Pages/DashboardLayout/pages/ExaminationPage"));
const CbtPage = lazy(() => import("./Pages/DashboardLayout/pages/examination/CbtPage"));
const ResultsPage = lazy(() => import("./Pages/DashboardLayout/pages/examination/ResultsPage"));
const ReportsPage = lazy(() => import("./Pages/DashboardLayout/pages/examination/ReportCardsPage"));

// Lazy-loaded Staff & Finance
const StaffPage = lazy(() => import("./Pages/DashboardLayout/pages/StaffPage"));
const TeachersPage = lazy(() => import("./Pages/DashboardLayout/pages/staff/TeachersPage"));
const StaffAdminsPage = lazy(() => import("./Pages/DashboardLayout/pages/staff/AdminsPage"));
const StaffManagementPage = lazy(() => import("./Pages/DashboardLayout/pages/staff/StaffManagementPage"));
const StaffAttendancePage = lazy(() => import("./Pages/DashboardLayout/pages/staff/StaffAttendancePage"));
const TeacherWorkspacePage = lazy(() => import("./Pages/DashboardLayout/pages/staff/TeacherWorkspacePage"));
const FinancePage = lazy(() => import("./Pages/DashboardLayout/pages/FinancePage"));
const PaymentsPage = lazy(() => import("./Pages/DashboardLayout/pages/finance/PaymentsPage"));
const InvoicesPage = lazy(() => import("./Pages/DashboardLayout/pages/finance/InvoicesPage"));
const ExtraFeesPage = lazy(() => import("./Pages/DashboardLayout/pages/finance/ExtraFeesPage"));
const FlexpayPage = lazy(() => import("./Pages/DashboardLayout/pages/finance/FlexpayPage"));
const CashflowPage = lazy(() => import("./Pages/DashboardLayout/pages/finance/CashflowPage"));
const WalletPage = lazy(() => import("./Pages/DashboardLayout/pages/finance/WalletPage"));

// Lazy-loaded Communication & Portal
const CommunicationPage = lazy(() => import("./Pages/DashboardLayout/pages/CommunicationPage"));
const NotificationsPage = lazy(() => import("./Pages/DashboardLayout/pages/communication/NotificationsPage"));
const AnnouncementsPage = lazy(() => import("./Pages/DashboardLayout/pages/communication/AnnouncementsPage"));
const MessagesPage = lazy(() => import("./Pages/DashboardLayout/pages/communication/MessagesPage"));
const SupportPage = lazy(() => import("./Pages/DashboardLayout/pages/communication/SupportPage"));
const SettingsPage = lazy(() => import("./Pages/DashboardLayout/pages/SettingsPage"));
const ParentDashboard = lazy(() => import("./Pages/DashboardLayout/pages/parent/ParentDashboard"));
const ParentSectionPage = lazy(() => import("./Pages/DashboardLayout/pages/parent/ParentSectionPage"));
const ParentFeesPage = lazy(() => import("./Pages/DashboardLayout/pages/parent/ParentFeesPage"));

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoadingFallback message="Loading page..." />}>
        <Outlet />
      </Suspense>
      <Footer />
    </>
  );
}

function DashboardLay() {
  const { userInfo, authReady } = useContext(UserContext);
  const sidebarStorageKey = `petra-dashboard-sidebar-${userInfo?.id || "guest"}`;
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(sidebarStorageKey) === "collapsed";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    applyTheme("light");
  }, []);

  useEffect(() => {
    if (!userInfo?.id) return;
    try {
      setCollapsed(window.localStorage.getItem(sidebarStorageKey) === "collapsed");
    } catch {}
  }, [sidebarStorageKey, userInfo?.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarStorageKey, collapsed ? "collapsed" : "expanded");
    } catch {}
  }, [collapsed, sidebarStorageKey]);

  const toggle = () => {
    if (window.innerWidth <= 900) setMobileOpen((open) => !open);
    else setCollapsed((c) => !c);
  };
  const closeSidebar = () => setMobileOpen(false);

  if (!authReady) return null;
  if (!userInfo?.email) return <Navigate to="/signin" replace />;

  return (
    <div className="dashboard-shell">
      <div className={`dashboard-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
        <SidebarNav collapsed={collapsed} onNavigate={closeSidebar} onClose={closeSidebar} />
      </div>
      {mobileOpen && <button type="button" className="sidebar-backdrop" onClick={closeSidebar} aria-label="Close sidebar" />}
      <div className="dashboard-main">
        <TopNavbar onToggle={toggle} />
        <div className="dashboard-content">
          <ErrorBoundary>
            <Suspense fallback={<PageLoadingFallback message="Loading view..." />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function DynamicParentSection(props) {
  const { userInfo } = useContext(UserContext);
  const myChildren = userInfo?.children || [];
  const dynamicSummaryCards = [
    { icon: props.icons?.children || School, label: "Children", value: myChildren.length.toString(), meta: "Active learners", tone: "tone-blue" },
  ];
  const dynamicSections = [
    {
      title: "Current learner status",
      items: myChildren.map((child) => ({
        title: child.name,
        meta: [child.className || child.class, child.teacher || "Assigned Teacher"].filter(Boolean).join(" • "),
        value: child.status || "On Track",
      })),
    },
  ];
  return <ParentSectionPage {...props} summaryCards={dynamicSummaryCards} sections={dynamicSections} />;
}

function parentSection(props) {
  return <ParentSectionPage {...props} />;
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback message="Initializing Petra..." />}>
          <Routes>
            <Route path="/admission_form" element={<AdmissionForm />} />
            <Route path="/school_Fees" element={<SchoolFeesPaymentPage />} />
            <Route path="/student_Payment" element={<StudentPaymentPage />} />
            <Route path="/Payment" element={<Payment />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dev/schools/:id" element={<SuperAdminDashboard />} />
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
              <Route path="/solution/school-os" element={<SchoolOS />} />
              <Route path="/solution/financial-management" element={<FinancialManagement />} />
              <Route path="/solution/cbt-engine" element={<CBTEngine />} />
              <Route path="/solution/petra-pay" element={<PetraPay />} />
              <Route path="/solution/flexpay" element={<FlexPay />} />
              <Route path="/solution/performance" element={<Performance />} />
              <Route path="/solution/ai-study-app" element={<AIStudyApp />} />
              <Route path="/solution/learning-hub" element={<LearningHub />} />
              <Route path="/solution/digital-library" element={<DigitalLibrary />} />
              <Route path="/solution/teacher-workspace" element={<TeacherWorkspace />} />
              <Route path="/solution/lesson-planner" element={<LessonPlanner />} />
              <Route path="/solution/assessment-tools" element={<AssessmentTools />} />
              <Route path="/solution/school-analytics" element={<SchoolAnalytics />} />
              <Route path="/solution/admissions" element={<Admissions />} />
              <Route path="/solution/communication-hub" element={<CommunicationHub />} />
              <Route path="/company" element={<Company />} />
              <Route path="/schools" element={<ForSchool />} />
              <Route path="/parents" element={<Forparents />} />
              <Route path="/students" element={<ForStudents />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route element={<DashboardLay />}>
              <Route path="/dashboard/ask-nuvora" element={<AskNuvoraPage />} />
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
              <Route path="/dashboard/students/enrollment" element={<EnrollmentPage />} />
              <Route path="/dashboard/students/enrollment/create" element={<EnrollmentCreatePage />} />
              <Route path="/dashboard/students/parents" element={<ParentsPage />} />
              <Route path="/dashboard/students/gate" element={<GatePage />} />
              <Route path="/dashboard/academics" element={<AcademicsPage />} />
              <Route path="/dashboard/academics/timetable" element={<TimetablePage />} />
              <Route path="/dashboard/academics/bus" element={<BusPage />} />
              <Route path="/dashboard/academics/attendance" element={<AttendancePage />} />
              <Route path="/dashboard/examination" element={<ExaminationPage />} />
              <Route path="/dashboard/examination/cbt" element={<CbtPage />} />
              <Route path="/dashboard/examination/results" element={<ResultsPage />} />
              <Route path="/dashboard/examination/reports" element={<ReportsPage />} />
              <Route path="/dashboard/staff" element={<StaffPage />} />
              <Route path="/dashboard/staff/teachers" element={<TeachersPage />} />
              <Route path="/dashboard/staff/admins" element={<StaffAdminsPage />} />
              <Route path="/dashboard/staff/management" element={<StaffManagementPage />} />
              <Route path="/dashboard/staff/attendance" element={<StaffAttendancePage />} />
              <Route path="/dashboard/finance" element={<FinancePage />} />
              <Route path="/dashboard/finance/payments" element={<PaymentsPage />} />
              <Route path="/dashboard/finance/invoices" element={<InvoicesPage />} />
              <Route path="/dashboard/finance/extra-fees" element={<ExtraFeesPage />} />
              <Route path="/dashboard/finance/wallet" element={<WalletPage />} />
              <Route path="/dashboard/finance/flexpay" element={<FlexpayPage />} />
              <Route path="/dashboard/finance/cashflow" element={<CashflowPage />} />
              <Route path="/dashboard/communication" element={<CommunicationPage />} />
              <Route path="/dashboard/communication/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/communication/announcements" element={<AnnouncementsPage />} />
              <Route path="/dashboard/communication/messages" element={<MessagesPage />} />
              <Route path="/dashboard/communication/support" element={<SupportPage />} />
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
              <Route path="/staff/notifications" element={<NotificationsPage />} />
              <Route path="/staff/messages" element={<MessagesPage />} />
              <Route path="/staff/profile" element={<TeacherWorkspacePage activeView="profile" />} />
              <Route path="/staff/settings" element={<TeacherWorkspacePage activeView="settings" />} />
              <Route path="/staff/ask-nuvora" element={<AskNuvoraPage />} />

              <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
              <Route path="/portal/ask-nuvora" element={<AskNuvoraPage />} />
              <Route path="/portal/dashboard" element={<ParentDashboard />} />
              <Route
                path="/portal/children"
                element={
                  <DynamicParentSection
                    title="Children Overview"
                    description="A calm snapshot of each child’s class, teacher, and current progress."
                    heroTitle="Your children at a glance"
                    heroDescription="Keep track of performance, wellbeing, and next steps."
                    icons={{ children: School }}
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
                  description: "Homework for the selected linked child will appear here once it is published by the school.",
                  heroTitle: "Stay prepared",
                  heroDescription: "Assignments are loaded from the authenticated child’s school records.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
              <Route path="/portal/fees" element={<ParentFeesPage />} />
              <Route
                path="/portal/announcements"
                element={parentSection({
                  title: "School Announcements",
                  description: "School notices for the linked child will appear here once they are published.",
                  heroTitle: "Latest notices",
                  heroDescription: "Announcements are loaded from the authenticated parent’s school and linked students.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
              <Route
                path="/portal/messages"
                element={parentSection({
                  title: "Messages from Teachers",
                  description: "Teacher notes and school updates will appear here for your linked children once they are sent.",
                  heroTitle: "Stay connected",
                  heroDescription: "Messages are loaded only for the authenticated parent and their linked students.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
              <Route
                path="/portal/downloads"
                element={parentSection({
                  title: "Downloads and Documents",
                  description: "Published school documents for the selected child will appear here automatically.",
                  heroTitle: "Useful documents",
                  heroDescription: "No demo files are shown; only authorized records are loaded from the backend.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
              <Route
                path="/portal/profile"
                element={parentSection({
                  title: "Parent Profile",
                  description: "Your authenticated account details are shown in the settings area, not from demo data.",
                  heroTitle: "Account overview",
                  heroDescription: "Profile information is loaded from the signed-in parent record only.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
              <Route path="/portal/settings" element={<SettingsPage role="parent" />} />
              <Route
                path="/portal/subjects"
                element={parentSection({
                  title: "My Subjects",
                  description: "Subjects, teachers, and academic progress for your linked learners.",
                  heroTitle: "Your subjects",
                  heroDescription: "Subject information is shown for the authenticated portal account.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
              <Route
                path="/portal/report-cards"
                element={parentSection({
                  title: "Report Cards",
                  description: "Access available academic report cards.",
                  heroTitle: "Academic reports",
                  heroDescription: "Published report cards for your linked learners appear here.",
                  heroChips: [],
                  summaryCards: [],
                  sections: [],
                  actions: [],
                })}
              />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <DeleteAccountButton />
    </Router>
  );
}

export default App;
