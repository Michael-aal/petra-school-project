import { useState } from "react";
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
import GetStarted from "./Pages/Sigin/GetStarted";
import Contact from "./Pages/Contact";
import TopNavbar from "./Pages/DashboardLayout/TopNavbar";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import "./Styles/DashBoardLayout/SidebarNav.css";
import DashboardHomePage from "./Pages/DashboardLayout/pages/DashboardHomePage";
import SettingsPage from "./Pages/DashboardLayout/pages/SettingsPage";

import ProfilePage from "./Pages/DashboardLayout/pages/setup/ProfilePage";
import SessionsPage from "./Pages/DashboardLayout/pages/setup/SessionsPage";
import ClassesPage from "./Pages/DashboardLayout/pages/setup/ClassesPage";
import SubjectsPage from "./Pages/DashboardLayout/pages/setup/SubjectsPage";

import StudentsListPage from "./Pages/DashboardLayout/pages/students/StudentsListPage";
import EnrollmentPage from "./Pages/DashboardLayout/pages/students/EnrollmentPage";
import ParentsPage from "./Pages/DashboardLayout/pages/students/ParentsPage";
import GatePage from "./Pages/DashboardLayout/pages/students/GatePage";

import TimetablePage from "./Pages/DashboardLayout/pages/academics/TimetablePage";
import BusPage from "./Pages/DashboardLayout/pages/academics/BusPage";
import AttendancePage from "./Pages/DashboardLayout/pages/academics/AttendancePage";

import CbtPage from "./Pages/DashboardLayout/pages/examination/CbtPage";
import ResultsPage from "./Pages/DashboardLayout/pages/examination/ResultsPage";
import ReportCardsPage from "./Pages/DashboardLayout/pages/examination/ReportCardsPage";

import TeachersPage from "./Pages/DashboardLayout/pages/staff/TeachersPage";
import AdminsPage from "./Pages/DashboardLayout/pages/staff/AdminsPage";
import StaffAttendancePage from "./Pages/DashboardLayout/pages/staff/StaffAttendancePage";

import PaymentsPage from "./Pages/DashboardLayout/pages/finance/PaymentsPage";
import InvoicesPage from "./Pages/DashboardLayout/pages/finance/InvoicesPage";
import ExtraFeesPage from "./Pages/DashboardLayout/pages/finance/ExtraFeesPage";
import FlexpayPage from "./Pages/DashboardLayout/pages/finance/FlexpayPage";
import CashflowPage from "./Pages/DashboardLayout/pages/finance/CashflowPage";

import NotificationsPage from "./Pages/DashboardLayout/pages/communication/NotificationsPage";
import SupportPage from "./Pages/DashboardLayout/pages/communication/SupportPage";

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

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/solution" element={<Solution />} />
          <Route path="/company" element={<Company />} />
          <Route path="/schools" element={<ForSchool />} />
          <Route path="/parents" element={<Forparents />} />
          <Route path="/students" element={<ForStudents />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/get-started" element={<GetStarted />} />
        </Route>

        {/* Dashboard */}
        <Route element={<DashboardLay />}>
          <Route path="/dashboard" element={<DashboardHomePage />} />
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

          <Route
            path="/dashboard/academics/timetable"
            element={<TimetablePage />}
          />
          <Route path="/dashboard/academics/bus" element={<BusPage />} />
          <Route
            path="/dashboard/academics/attendance"
            element={<AttendancePage />}
          />

          <Route path="/dashboard/examination/cbt" element={<CbtPage />} />
          <Route
            path="/dashboard/examination/results"
            element={<ResultsPage />}
          />
          <Route
            path="/dashboard/examination/reports"
            element={<ReportCardsPage />}
          />

          <Route path="/dashboard/staff/teachers" element={<TeachersPage />} />
          <Route path="/dashboard/staff/admins" element={<AdminsPage />} />
          <Route
            path="/dashboard/staff/attendance"
            element={<StaffAttendancePage />}
          />

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
          <Route path="/dashboard/finance/flexpay" element={<FlexpayPage />} />
          <Route
            path="/dashboard/finance/cashflow"
            element={<CashflowPage />}
          />

          <Route
            path="/dashboard/communication/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/dashboard/communication/support"
            element={<SupportPage />}
          />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
