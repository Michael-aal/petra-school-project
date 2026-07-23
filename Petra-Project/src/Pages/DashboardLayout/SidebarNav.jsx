import { useState, useContext } from "react";
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
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  ClipboardList,
  UserCheck,
  PlusCircle,
  X,
} from "lucide-react";
import "../../Styles/DashBoardLayout/SidebarNav.css";
import { UserContext } from "../../context/UserContext";
import { getDisplayName } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";

const navGroups = [
  {
    label: "Get Started",
    icon: LayoutDashboard,
    href: "/dashboard/get-started",
  },
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "School Setup",
    icon: School,
    children: [
      {
        label: "School Profile",
        icon: School,
        href: "/dashboard/setup/profile",
      },
      {
        label: "Academic Session",
        icon: Calendar,
        href: "/dashboard/setup/sessions",
      },
      { label: "Classes", icon: BookOpen, href: "/dashboard/setup/classes" },
      {
        label: "Subjects",
        icon: ClipboardList,
        href: "/dashboard/setup/subjects",
      },
    ],
  },
  {
    label: "Students",
    icon: GraduationCap,
    children: [
      { label: "Students", icon: GraduationCap, href: "/dashboard/students" },
      {
        label: "Enrollment",
        icon: UserCheck,
        href: "/dashboard/students/enrollment",
      },
      { label: "Parents", icon: Users, href: "/dashboard/students/parents" },
      {
        label: "Gate Monitoring",
        icon: UserCheck,
        href: "/dashboard/students/gate",
      },
    ],
  },
  {
    label: "Academics",
    icon: BookOpen,
    children: [
      {
        label: "Timetable",
        icon: Calendar,
        href: "/dashboard/academics/timetable",
      },
      { label: "School Bus", icon: Bus, href: "/dashboard/academics/bus" },
      {
        label: "Attendance",
        icon: ClipboardCheck,
        href: "/dashboard/academics/attendance",
      },
    ],
  },
  {
    label: "Examination",
    icon: FileText,
    children: [
      { label: "CBT", icon: ClipboardList, href: "/dashboard/examination/cbt" },
      {
        label: "Results",
        icon: BarChart2,
        href: "/dashboard/examination/results",
      },
      {
        label: "Report Cards",
        icon: FileText,
        href: "/dashboard/examination/reports",
      },
    ],
  },
  {
    label: "Staff",
    icon: UserCog,
    children: [
      { label: "Teachers", icon: UserCog, href: "/dashboard/staff/teachers" },
      { label: "Admins", icon: UserCog, href: "/dashboard/staff/admins" },
      {
        label: "Attendance",
        icon: ClipboardCheck,
        href: "/dashboard/staff/attendance",
      },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    children: [
      {
        label: "Payments",
        icon: CreditCard,
        href: "/dashboard/finance/payments",
      },
      { label: "Invoices", icon: Receipt, href: "/dashboard/finance/invoices" },
      {
        label: "Extra Fees",
        icon: PlusCircle,
        href: "/dashboard/finance/extra-fees",
      },
      { label: "Wallet", icon: Wallet, href: "/dashboard/finance/wallet" },
      { label: "FlexPay", icon: Wallet, href: "/dashboard/finance/flexpay" },
      {
        label: "Cashflow",
        icon: TrendingUp,
        href: "/dashboard/finance/cashflow",
      },
    ],
  },
  {
    label: "Communication",
    icon: Bell,
    children: [
      {
        label: "Notifications",
        icon: Bell,
        href: "/dashboard/communication/notifications",
      },
      {
        label: "Support",
        icon: HelpCircle,
        href: "/dashboard/communication/support",
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

const FIXED_NAV = navGroups;

export function SidebarNav({ onNavigate, collapsed = false }) {
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};

    FIXED_NAV.forEach((group) => {
      if (
        group.children?.some((child) =>
          location.pathname.startsWith(child.href),
        )
      ) {
        initial[group.label] = true;
      }
    });

    return initial;
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (href) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  const { userInfo } = useContext(UserContext);

  const schoolName = userInfo.institution?.split(" ")[0] ?? "";

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-contaner-logo">
            <School size={30} />

          {/* <UserAvatar user={userInfo} size={40} className="sidebar-logo sidebar-logo-avatar" /> */}
        </div>
        <div className="sidebar-brand">
          <h2 className="brand-title">PETRA        </h2>
          <h3 className="brand-sub">SCHOOL PLATFORM</h3>
        </div>
        <h4 className="sidebar-close">
          <X />
        </h4>
      </div>

      <nav className="sidebar-nav">
        {FIXED_NAV.map((item) => {
          if (!item.children) {
            const active = isActive(item.href);

            return (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={onNavigate}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                <item.icon className="sidebar-icon" />

                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            );
          }

          const isOpen = openGroups[item.label];

          const groupActive = item.children.some((child) =>
            isActive(child.href),
          );

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                className={`sidebar-group ${groupActive ? "group-active" : ""}`}
              >
                <item.icon className="sidebar-icon" />

                <span className="sidebar-title sidebar-label">
                  {item.label}
                </span>

                {isOpen ? (
                  <ChevronDown className="arrow-icon" />
                ) : (
                  <ChevronRight className="arrow-icon" />
                )}
              </button>

              {isOpen && (
                <div className="sidebar-children">
                  {item.children.map((child) => {
                    const active = isActive(child.href);

                    return (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        onClick={onNavigate}
                        className={`sidebar-child ${active ? "active" : ""}`}
                      >
                        <child.icon className="child-icon" />

                        <span className="child-label">{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <UserAvatar user={userInfo} size={40} className="sidebar-avatar" />
        <div className="sidebar-user">
          <h3>{getDisplayName(userInfo)}</h3>
          <h4>{userInfo.email || "Complete your profile"}</h4>
        </div>
      </div>
    </div>
  );
}
