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
import Home from "./Pages/Home";
import SignIn from "./Pages/Sigin/SignIn";
import Register from "./Pages/Sigin/Register";
import RegistrationEntry from "./Pages/Sigin/RegistrationEntry";
import StaffRegister from "./Pages/Sigin/StaffRegister";
import ParentRegister from "./Pages/Sigin/ParentRegister";
import AdminRegister from "./Pages/Sigin/AdminRegister";
import DashboardHomePage from "./Pages/DashboardLayout/pages/DashboardHomePage";
import GetStarted from "./Pages/DashboardLayout/pages/GetStarted";
import RoleDashboardShell from "./Pages/DashboardLayout/RoleDashboardShell";
import StaffDashboard from "./Pages/DashboardLayout/pages/staff/StaffDashboard";
import ParentDashboard from "./Pages/DashboardLayout/pages/parent/ParentDashboard";
import ParentSectionPage from "./Pages/DashboardLayout/pages/parent/ParentSectionPage";
import DeleteAccountButton from "./components/DeleteAccountButton";
import StaffManagementPage from "./Pages/DashboardLayout/pages/staff/StaffManagementPage";
import TeacherSectionPage from "./Pages/DashboardLayout/pages/staff/TeacherSectionPage";
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
import ParentsPage from "./Pages/DashboardLayout/pages/students/ParentsPage";
import GatePage from "./Pages/DashboardLayout/pages/students/GatePage";
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
import Contact from "./Pages/Contact";
import TopNavbar from "./Pages/DashboardLayout/TopNavbar";
import { UserContext } from "./context/UserContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
  useParams,
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
import {
  getParentPortalProfile,
  getSavedParentPortalId,
  parentPortalProfiles,
  setSavedParentPortalId,
} from "./utils/parentPortalData";

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
  const { parentId } = useParams();
  const [activeParentId, setActiveParentId] = useState(() =>
    getSavedParentPortalId(),
  );
  const selectedParent =
    getParentPortalProfile(parentId || activeParentId) ||
    parentPortalProfiles[0];
  const myChildren = selectedParent?.children || [];

  useEffect(() => {
    if (selectedParent?.id) {
      setSavedParentPortalId(selectedParent.id);
      setActiveParentId(String(selectedParent.id));
    }
  }, [selectedParent?.id]);

  const dynamicSummaryCards = [
    {
      icon: props.icons?.children || School,
      label: "Children",
      value: myChildren.length.toString(),
      meta: "Active learners",
      tone: "tone-blue",
    },
  ];

  const dynamicSections = [
    {
      title: "Current learner status",
      items: myChildren.map((child) => ({
        title: child.name,
        meta: `${child.class} • ${child.teacher || "Assigned Teacher"}`,
        value: child.status || "On Track",
      })),
    },
  ];

  return (
    <ParentSectionPage
      {...props}
      summaryCards={dynamicSummaryCards}
      sections={dynamicSections}
    />
  );
}

function ParentPortalView({ viewType }) {
  const { parentId } = useParams();
  const [activeParentId, setActiveParentId] = useState(() =>
    getSavedParentPortalId(),
  );
  const selectedParent =
    getParentPortalProfile(parentId || activeParentId) ||
    parentPortalProfiles[0];

  useEffect(() => {
    if (selectedParent?.id) {
      setSavedParentPortalId(selectedParent.id);
      setActiveParentId(String(selectedParent.id));
    }
  }, [selectedParent?.id]);

  const children = selectedParent?.children || [];
  const firstChild = children[0];

  const viewContent = (() => {
    switch (viewType) {
      case "children":
        return {
          title: "Children Overview",
          description:
            "A calm snapshot of each child’s class, teacher, and current progress.",
          heroTitle: "Your children at a glance",
          heroDescription:
            "Keep track of performance, wellbeing, and next steps.",
          heroChips: [
            `${children.length} child${children.length === 1 ? "" : "ren"} linked`,
          ],
          summaryCards: [
            {
              icon: School,
              label: "Children",
              value: String(children.length),
              meta: "Linked learners",
              tone: "tone-blue",
            },
            {
              icon: CheckCircle2,
              label: "Status",
              value: firstChild?.status || "On Track",
              meta: "Current standing",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Current learner status",
              items: children.map((child) => ({
                title: child.name,
                meta: `${child.class} • ${child.teacher || "Assigned Teacher"}`,
                value: child.status || "On Track",
              })),
            },
          ],
          actions: [
            {
              icon: FileText,
              title: "View child profile",
              meta: "Open the latest school summary",
            },
          ],
        };
      case "attendance":
        return {
          title: "Attendance Summary",
          description:
            "See how each child is doing in terms of punctuality and school presence.",
          heroTitle: "Attendance at a glance",
          heroDescription:
            "A healthy attendance record is visible right away for each child.",
          heroChips: children.map(
            (child) => `${child.name}: ${child.attendance?.average || "—"}`,
          ),
          summaryCards: [
            {
              icon: CalendarDays,
              label: "Average Attendance",
              value: firstChild?.attendance?.average || "—",
              meta: "Current term",
              tone: "tone-blue",
            },
            {
              icon: CheckCircle2,
              label: "Present",
              value: firstChild?.attendance?.present || "—",
              meta: "This period",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Attendance record",
              items: children.map((child) => ({
                title: child.name,
                meta: `${child.attendance?.note || "Attendance updated"} • Late ${child.attendance?.late || 0}`,
                value: child.attendance?.average || "—",
              })),
            },
          ],
          actions: [
            {
              icon: FileText,
              title: "Download attendance",
              meta: "Save a printable overview",
            },
            {
              icon: Bell,
              title: "Set reminder",
              meta: "Get a weekly attendance note",
            },
          ],
        };
      case "results":
        return {
          title: "Latest Results",
          description:
            "Track the most recent assessment outcomes and academic growth.",
          heroTitle: "Academic updates",
          heroDescription:
            "Review recent scores before the next parent-teacher conversation.",
          heroChips: children.flatMap(
            (child) =>
              child.results?.subjects
                ?.slice(0, 1)
                .map(
                  (subject) =>
                    `${child.name}: ${subject.name} ${subject.score}`,
                ) || [],
          ),
          summaryCards: [
            {
              icon: FileText,
              label: "Average",
              value: firstChild?.results?.average || "—",
              meta: "Latest average",
              tone: "tone-blue",
            },
            {
              icon: BookOpen,
              label: "Top Subject",
              value: firstChild?.results?.subjects?.[0]?.name || "—",
              meta: firstChild?.results?.subjects?.[0]?.score || "—",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Recent scores",
              items: children.flatMap((child) =>
                (child.results?.subjects || []).map((subject) => ({
                  title: `${child.name} • ${subject.name}`,
                  meta: `Trend ${subject.trend}`,
                  value: subject.score,
                })),
              ),
            },
          ],
          actions: [
            {
              icon: Download,
              title: "Download report card",
              meta: "Keep a copy for your records",
            },
            {
              icon: MessageSquare,
              title: "Talk to teacher",
              meta: "Ask for support tips",
            },
          ],
        };
      case "assignments":
        return {
          title: "Assignments and Homework",
          description:
            "Stay on top of due dates and upcoming tasks for each child.",
          heroTitle: "Stay prepared",
          heroDescription: "See what is due soon and keep the week organised.",
          heroChips: children.flatMap(
            (child) =>
              child.assignments
                ?.slice(0, 1)
                .map((assignment) => `${child.name}: ${assignment.title}`) ||
              [],
          ),
          summaryCards: [
            {
              icon: BookOpen,
              label: "Pending Tasks",
              value: String(
                children.reduce(
                  (total, child) => total + (child.assignments?.length || 0),
                  0,
                ),
              ),
              meta: "Across children",
              tone: "tone-blue",
            },
            {
              icon: CalendarDays,
              label: "Next Due",
              value: firstChild?.assignments?.[0]?.due || "—",
              meta: firstChild?.assignments?.[0]?.title || "No pending work",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Upcoming tasks",
              items: children.flatMap((child) =>
                (child.assignments || []).map((assignment) => ({
                  title: `${child.name} • ${assignment.title}`,
                  meta: `Due ${assignment.due}`,
                  value: assignment.status,
                })),
              ),
            },
          ],
          actions: [
            {
              icon: BookOpen,
              title: "Open homework guide",
              meta: "Review learning instructions",
            },
            {
              icon: Bell,
              title: "Set task reminder",
              meta: "Receive a gentle nudge",
            },
          ],
        };
      case "fees":
        return {
          title: "Fees and Payments",
          description:
            "Monitor pending balances and payment deadlines with clarity.",
          heroTitle: "Fee reminders",
          heroDescription:
            "Pay what is pending quickly so there are no surprises later in the term.",
          heroChips: children.flatMap(
            (child) =>
              child.fees
                ?.slice(0, 1)
                .map((fee) => `${child.name}: ${fee.amount}`) || [],
          ),
          summaryCards: [
            {
              icon: CreditCard,
              label: "Outstanding",
              value: children
                .flatMap((child) => child.fees || [])
                .filter((fee) => fee.status === "Pending")
                .length.toString(),
              meta: "Pending items",
              tone: "tone-blue",
            },
            {
              icon: Wallet,
              label: "Top Fee",
              value: firstChild?.fees?.[0]?.amount || "—",
              meta: firstChild?.fees?.[0]?.title || "No pending fee",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Payment status",
              items: children.flatMap((child) =>
                (child.fees || []).map((fee) => ({
                  title: `${child.name} • ${fee.title}`,
                  meta: fee.status,
                  value: fee.amount,
                })),
              ),
            },
          ],
          actions: [
            { icon: Wallet, title: "Pay now", meta: "Settle fees securely" },
            {
              icon: FileText,
              title: "Download invoice",
              meta: "Keep a copy for records",
            },
          ],
        };
      case "announcements":
        return {
          title: "School Announcements",
          description:
            "Stay updated with school notices and important family updates.",
          heroTitle: "Latest notices",
          heroDescription:
            "Be informed about meetings, events, and changes in school routine.",
          heroChips: children.flatMap(
            (child) =>
              child.announcements
                ?.slice(0, 1)
                .map(
                  (announcement) => `${child.name}: ${announcement.title}`,
                ) || [],
          ),
          summaryCards: [
            {
              icon: Bell,
              label: "Notices",
              value: String(
                children.reduce(
                  (total, child) => total + (child.announcements?.length || 0),
                  0,
                ),
              ),
              meta: "Current updates",
              tone: "tone-blue",
            },
            {
              icon: School,
              label: "Latest",
              value: firstChild?.announcements?.[0]?.title || "—",
              meta: firstChild?.announcements?.[0]?.detail || "—",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Announcements",
              items: children.flatMap((child) =>
                (child.announcements || []).map((announcement) => ({
                  title: `${child.name} • ${announcement.title}`,
                  meta: announcement.detail,
                })),
              ),
            },
          ],
          actions: [
            {
              icon: Bell,
              title: "Turn on alerts",
              meta: "Receive updates instantly",
            },
            { icon: FileText, title: "Read details", meta: "Open full notice" },
          ],
        };
      case "messages":
        return {
          title: "Messages from Teachers",
          description:
            "Read the latest teacher notes and school updates for your children.",
          heroTitle: "Stay connected",
          heroDescription:
            "A simple view for important messages from teachers and school offices.",
          heroChips: children.flatMap(
            (child) =>
              child.messages
                ?.slice(0, 1)
                .map((message) => `${child.name}: ${message.from}`) || [],
          ),
          summaryCards: [
            {
              icon: MessageSquare,
              label: "Messages",
              value: String(
                children.reduce(
                  (total, child) => total + (child.messages?.length || 0),
                  0,
                ),
              ),
              meta: "Latest notes",
              tone: "tone-blue",
            },
            {
              icon: Bell,
              label: "Latest",
              value: firstChild?.messages?.[0]?.from || "—",
              meta: firstChild?.messages?.[0]?.note || "—",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Recent messages",
              items: children.flatMap((child) =>
                (child.messages || []).map((message) => ({
                  title: `${child.name} • ${message.from}`,
                  meta: message.note,
                })),
              ),
            },
          ],
          actions: [
            {
              icon: MessageSquare,
              title: "Reply now",
              meta: "Send a note back",
            },
            {
              icon: FileText,
              title: "View thread",
              meta: "Open the full conversation",
            },
          ],
        };
      case "downloads":
        return {
          title: "Downloads and Documents",
          description:
            "Access school forms, notices, and lesson resources from one place.",
          heroTitle: "Useful documents",
          heroDescription:
            "Download the records you need without hunting through email.",
          heroChips: [
            `${children.length} linked child${children.length === 1 ? "" : "ren"}`,
            "Updated this term",
          ],
          summaryCards: [
            {
              icon: Download,
              label: "Reports",
              value: String(children.length),
              meta: "Ready to download",
              tone: "tone-blue",
            },
            {
              icon: FileText,
              label: "Forms",
              value: String(children.length),
              meta: "Available now",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Available resources",
              items: children.map((child) => ({
                title: `${child.name} report card`,
                meta: `PDF • Updated for ${child.class}`,
                value: "Download",
              })),
            },
          ],
          actions: [
            {
              icon: Download,
              title: "Download all",
              meta: "Save the latest files",
            },
            {
              icon: FileText,
              title: "Open folder",
              meta: "Browse school documents",
            },
          ],
        };
      case "profile":
        return {
          title: "Parent Profile",
          description:
            "Review the parent account details and preferred contact settings.",
          heroTitle: "Account overview",
          heroDescription:
            "Make sure your profile details stay current for school communication.",
          heroChips: [
            `Primary guardian`,
            `${selectedParent?.linkedStudents || 0} linked child${selectedParent?.linkedStudents === 1 ? "" : "ren"}`,
          ],
          summaryCards: [
            {
              icon: UserCircle2,
              label: "Profile",
              value: "Active",
              meta: "Verified account",
              tone: "tone-blue",
            },
            {
              icon: Bell,
              label: "Contacts",
              value: selectedParent?.phoneNumber || "—",
              meta: selectedParent?.email || "—",
              tone: "tone-teal",
            },
          ],
          sections: [
            {
              title: "Profile details",
              items: [
                {
                  title: "Parent name",
                  meta: selectedParent?.parentName || "—",
                },
                { title: "Phone", meta: selectedParent?.phoneNumber || "—" },
                { title: "Email", meta: selectedParent?.email || "—" },
              ],
            },
          ],
          actions: [
            {
              icon: UserCircle2,
              title: "Edit profile",
              meta: "Update your details",
            },
            {
              icon: Bell,
              title: "Notification settings",
              meta: "Adjust alerts",
            },
          ],
        };
      default:
        return {
          title: "Children Overview",
          description:
            "A calm snapshot of each child’s class, teacher, and current progress.",
          heroTitle: "Your children at a glance",
          heroDescription:
            "Keep track of performance, wellbeing, and next steps.",
          heroChips: [
            `${children.length} child${children.length === 1 ? "" : "ren"} linked`,
          ],
          summaryCards: [],
          sections: [],
        };
    }
  })();

  return <ParentSectionPage {...viewContent} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<RegistrationEntry />} />
        <Route path="/register/select" element={<RegistrationEntry />} />
        <Route path="/register/admin" element={<AdminRegister />} />
        <Route path="/register/parent" element={<ParentRegister />} />
        <Route path="/register/staff" element={<StaffRegister />} />
        <Route
          path="/register/teacher"
          element={<Register rolePreset="teacher" />}
        />
        <Route path="/get-started" element={<RegistrationEntry />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/solution" element={<Solution />} />
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
          <Route path="/dashboard/get-started" element={<GetStarted />} />
          <Route path="/dashboard/setup" element={<SchoolSetupPage />} />
          <Route path="/dashboard/setup/profile" element={<ProfilePage />} />
          <Route path="/dashboard/setup/sessions" element={<SessionsPage />} />
          <Route path="/dashboard/setup/classes" element={<ClassesPage />} />
          <Route path="/dashboard/setup/subjects" element={<SubjectsPage />} />

          <Route path="/dashboard/students" element={<StudentsListPage />} />
          <Route
            path="/dashboard/students/enrollment"
            element={<EnrollmentPage />}
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
            path="/dashboard/communication/support"
            element={<SupportPage />}
          />
          <Route
            path="/dashboard/students/parent-links"
            element={<PortalLinksPage />}
          />
          <Route path="/dashboard/settings" element={<SettingsPage />} />

          <Route
            path="/staff"
            element={<Navigate to="/staff/dashboard" replace />}
          />
          <Route path="/staff/dashboard" element={<TeacherWorkspacePage />} />
          <Route
            path="/staff/classes"
            element={<TeacherWorkspacePage activeView="classes" />}
          />
          <Route
            path="/staff/classes/:classId"
            element={<TeacherWorkspacePage activeView="classDetails" />}
          />
          <Route
            path="/staff/students"
            element={<TeacherWorkspacePage activeView="students" />}
          />
          <Route
            path="/staff/attendance"
            element={<TeacherWorkspacePage activeView="attendance" />}
          />
          <Route
            path="/staff/assessments"
            element={<TeacherWorkspacePage activeView="assessments" />}
          />
          <Route
            path="/staff/results"
            element={<TeacherWorkspacePage activeView="results" />}
          />
          <Route
            path="/staff/announcements"
            element={<TeacherWorkspacePage activeView="announcements" />}
          />
          <Route
            path="/staff/profile"
            element={<TeacherWorkspacePage activeView="profile" />}
          />
          <Route
            path="/staff/settings"
            element={<TeacherWorkspacePage activeView="settings" />}
          />

          <Route
            path="/portal"
            element={<Navigate to="/portal/dashboard" replace />}
          />
          <Route
            path="/portal/dashboard/:parentId?"
            element={<ParentDashboard />}
          />
          <Route
            path="/portal/children/:parentId?"
            element={
              <DynamicParentSection
                title="Children Overview"
                description="A calm snapshot of each child’s class, teacher, and current progress."
                heroTitle="Your children at a glance"
                heroDescription="Keep track of performance, wellbeing, and next steps."
                icons={{ children: School }}
                actions={[
                  {
                    icon: FileText,
                    title: "View child profile",
                    meta: "Open the latest school summary",
                  },
                ]}
              />
            }
          />
          <Route
            path="/portal/attendance/:parentId?"
            element={<ParentPortalView viewType="attendance" />}
          />
          <Route
            path="/portal/results/:parentId?"
            element={<ParentPortalView viewType="results" />}
          />
          <Route
            path="/portal/assignments/:parentId?"
            element={<ParentPortalView viewType="assignments" />}
          />
          <Route
            path="/portal/fees/:parentId?"
            element={<ParentPortalView viewType="fees" />}
          />
          <Route
            path="/portal/announcements/:parentId?"
            element={<ParentPortalView viewType="announcements" />}
          />
          <Route
            path="/portal/messages/:parentId?"
            element={<ParentPortalView viewType="messages" />}
          />
          <Route
            path="/portal/downloads/:parentId?"
            element={<ParentPortalView viewType="downloads" />}
          />
          <Route
            path="/portal/profile/:parentId?"
            element={<ParentPortalView viewType="profile" />}
          />
          <Route
            path="/portal/settings"
            element={<SettingsPage role="parent" />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
