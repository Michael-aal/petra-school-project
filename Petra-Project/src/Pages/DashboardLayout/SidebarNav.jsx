import { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  BookOpen,
  GraduationCap,
  Users,
  Bus,
  ClipboardCheck,
  FileText,
  BarChart2,
  UserCog,
  CreditCard,
  Receipt,
  Wallet,
  TrendingUp,
  Bell,
  HelpCircle,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  ClipboardList,
  UserCheck,
  PlusCircle,
  X,
  LogOut,
  ShieldCheck
} from "lucide-react";
import "../../Styles/DashBoardLayout/SidebarNav.css";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/authApi";
import { getDisplayName, normalizeUser } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";

const navGroups = [
  { label: "Get Started", icon: LayoutDashboard, href: "/dashboard/get-started" },
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "Overview",
    icon: BarChart2,
    children: [
      { label: "Live Overview", icon: BarChart2, href: "/dashboard/overview/live" },
      { label: "Daily Reports", icon: Calendar, href: "/dashboard/overview/daily" },
      { label: "Term Summary", icon: TrendingUp, href: "/dashboard/overview/term" },
    ],
  },
  {
    label: "School Setup",
    icon: School,
    children: [
      { label: "School Profile", icon: School, href: "/dashboard/setup/profile" },
      { label: "Academic Session", icon: Calendar, href: "/dashboard/setup/sessions" },
      { label: "Classes", icon: BookOpen, href: "/dashboard/setup/classes" },
      { label: "Subjects", icon: ClipboardList, href: "/dashboard/setup/subjects" },
    ],
  },
  {
    label: "Students",
    icon: GraduationCap,
    children: [
      { label: "Students", icon: GraduationCap, href: "/dashboard/students" },
      { label: "Applicants", icon: GraduationCap, href: "/dashboard/students/applicants" },
      { label: "Enrollment", icon: UserCheck, href: "/dashboard/students/enrollment" },
      { label: "Parents", icon: Users, href: "/dashboard/students/parents" },
      { label: "Gate Monitoring", icon: UserCheck, href: "/dashboard/students/gate" },
    ],
  },
  {
    label: "Academics",
    icon: BookOpen,
    children: [
      { label: "Timetable", icon: Calendar, href: "/dashboard/academics/timetable" },
      { label: "School Bus", icon: Bus, href: "/dashboard/academics/bus" },
      { label: "Attendance", icon: ClipboardCheck, href: "/dashboard/academics/attendance" },
    ],
  },
  {
    label: "Examination",
    icon: FileText,
    children: [
      { label: "CBT", icon: ClipboardList, href: "/dashboard/examination/cbt" },
      { label: "Results", icon: BarChart2, href: "/dashboard/examination/results" },
      { label: "Report Cards", icon: FileText, href: "/dashboard/examination/reports" },
    ],
  },
  {
    label: "Staff",
    icon: UserCog,
    children: [
      { label: "Teachers", icon: UserCog, href: "/dashboard/staff/teachers" },
      { label: "Admins", icon: UserCog, href: "/dashboard/staff/admins" },
      { label: "Staff Management", icon: UserCog, href: "/dashboard/staff/management" },
      { label: "Attendance", icon: ClipboardCheck, href: "/dashboard/staff/attendance" },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    children: [
      { label: "Payments", icon: CreditCard, href: "/dashboard/finance/payments" },
      { label: "Invoices", icon: Receipt, href: "/dashboard/finance/invoices" },
      { label: "Extra Fees", icon: PlusCircle, href: "/dashboard/finance/extra-fees" },
      { label: "Wallet", icon: Wallet, href: "/dashboard/finance/wallet" },
      { label: "FlexPay", icon: Wallet, href: "/dashboard/finance/flexpay" },
      { label: "Cashflow", icon: TrendingUp, href: "/dashboard/finance/cashflow" },
    ],
  },
  {
    label: "Communication",
    icon: Bell,
    children: [
      { label: "Notifications", icon: Bell, href: "/dashboard/communication/notifications" },
      { label: "Announcements", icon: Bell, href: "/dashboard/communication/announcements" },
      { label: "Messages", icon: MessageSquare, href: "/dashboard/communication/messages" },
      { label: "Support", icon: HelpCircle, href: "/dashboard/communication/support" },
    ],
  },
  {label: "Links", icon: ShieldCheck, href: "/dashboard/students/parent-links"},
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const staffNavGroups = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/staff/dashboard" },
  { label: "My Classes", icon: School, href: "/staff/classes" },
  { label: "Students", icon: GraduationCap, href: "/staff/students" },
  { label: "Attendance", icon: ClipboardCheck, href: "/staff/attendance" },
  { label: "Assessments", icon: ClipboardList, href: "/staff/assessments" },
  { label: "Results", icon: FileText, href: "/staff/results" },
  { label: "Announcements", icon: Bell, href: "/staff/announcements" },
  { label: "Profile", icon: UserCog, href: "/staff/profile" },
  { label: "Settings", icon: Settings, href: "/staff/settings" },
  { label: "Logout", icon: LogOut, href: "/signin" },
];

const portalNavGroups = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/portal/dashboard" },
  { label: "Attendance", icon: ClipboardCheck, href: "/portal/attendance" },
  { label: "Results", icon: FileText, href: "/portal/results" },
  { label: "Assignments", icon: ClipboardList, href: "/portal/assignments" },
  { label: "Fees", icon: CreditCard, href: "/portal/fees" },
  { label: "Announcements", icon: Bell, href: "/portal/announcements" },
  { label: "Messages", icon: Bell, href: "/portal/messages" },
  { label: "Downloads", icon: FileText, href: "/portal/downloads" },
  { label: "Profile", icon: UserCog, href: "/portal/profile" },
  { label: "Settings", icon: Settings, href: "/portal/settings" },
  { label: "Logout", icon: LogOut, href: "/signin" },
];

export function SidebarNav({ onNavigate, collapsed = false, onClose }) {
  const location = useLocation();
  const { userInfo, setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const schoolName = userInfo?.schoolName || userInfo?.institution || "Nuvora";
  const navItems = location.pathname.startsWith("/staff")
    ? staffNavGroups
    : location.pathname.startsWith("/portal")
      ? portalNavGroups
      : navGroups;

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    navItems.forEach((group) => {
      if (group.children?.some((child) => location.pathname.startsWith(child.href))) {
        initial[group.label] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href) => {
    if (href === "/dashboard" || href === "/") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors during logout
    } finally {
      try {
        window.sessionStorage.removeItem("petra_user_info");
      } catch (e) {}
      try {
        window.localStorage.removeItem("petra_user_info");
      } catch (e) {}
      try {
        setUserInfo(normalizeUser({}));
      } catch {
        // ignore
      }
      navigate("/signin", { replace: true });
    }
  };

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-contaner-logo">
          <School size={30} />
        </div>
        <div className="sidebar-brand">
          <h2 className="brand-title">{schoolName.toUpperCase()}</h2>
          <h3 className="brand-sub">SCHOOL PLATFORM</h3>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (!item.children) {
            // Render a logout button that calls the logout handler instead of a plain link
            if (item.label === "Logout") {
              return (
                <button key={item.label} onClick={() => { if (onNavigate) onNavigate(); handleLogout(); }} className={`sidebar-link`}>
                  <item.icon className="sidebar-icon" />
                  <span className="sidebar-label">{item.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={onNavigate}
                className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
              >
                <item.icon className="sidebar-icon" />
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            );
          }

          const isOpen = openGroups[item.label];
          const groupActive = item.children.some((child) => isActive(child.href));

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                className={`sidebar-group ${groupActive ? "group-active" : ""}`}
              >
                <item.icon className="sidebar-icon" />
                <span className="sidebar-title sidebar-label">{item.label}</span>
                {isOpen ? <ChevronDown className="arrow-icon" /> : <ChevronRight className="arrow-icon" />}
              </button>

              {isOpen ? (
                <div className="sidebar-children">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      onClick={onNavigate}
                      className={`sidebar-child ${isActive(child.href) ? "active" : ""}`}
                    >
                      <child.icon className="child-icon" />
                      <span className="child-label">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <UserAvatar user={userInfo} size={40} className="sidebar-avatar" />
        <div className="sidebar-user">
          <h3>{getDisplayName(userInfo)}</h3>
          <h4>{userInfo?.email || "Complete your profile"}</h4>
        </div>
      </div>
    </div>
  );
}
