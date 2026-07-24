import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  User,
  Users,
  School,
  ClipboardList,
} from "lucide-react";

import { normalizeRole } from "./roleAccess";

const buildSections = (items) =>
  items.map((item) => ({
    ...item,
    id: item.id || item.label,
  }));

const roleDashboardConfig = {
  admin: {
    routeBase: "/dashboard",
    title: "Admin Dashboard",
    subtitle: "Existing admin and principal workspace.",
    sidebar: [],
    pages: [],
  },
  portal: {
    routeBase: "/portal",
    title: "Portal Dashboard",
    subtitle: "A shared space for parents and students to track school life together.",
    sidebar: buildSections([
      { label: "Dashboard Home", href: "/portal/dashboard", icon: LayoutDashboard },
      { label: "My Children", href: "/portal/children", icon: Users },
      { label: "My Subjects", href: "/portal/subjects", icon: BookOpen },
      { label: "Assignments", href: "/portal/assignments", icon: ClipboardList },
      { label: "Attendance", href: "/portal/attendance", icon: ClipboardCheck },
      { label: "Results", href: "/portal/results", icon: FileText },
      { label: "Report Cards", href: "/portal/report-cards", icon: FileText },
      { label: "School Fees", href: "/portal/fees", icon: BookOpen },
      { label: "Announcements", href: "/portal/announcements", icon: Bell },
      { label: "Messages", href: "/portal/messages", icon: MessageSquare },
      { label: "Profile", href: "/portal/profile", icon: User },
      { label: "Settings", href: "/portal/settings", icon: Settings },
    ]),
    overview: [
      { label: "Children", value: "2", note: "Linked students", icon: Users },
      { label: "Courses", value: "8", note: "Active subjects", icon: BookOpen },
      { label: "Attendance", value: "98%", note: "This term", icon: ClipboardCheck },
    ],
    pages: {
      "/portal/children": {
        title: "My Children",
        description: "View linked learners and their academic overview.",
        sections: [{ title: "Children", items: ["Academic progress", "Attendance", "Fee status"] }],
      },
      "/portal/subjects": {
        title: "My Subjects",
        description: "Track subjects, teachers, and progress.",
        sections: [{ title: "Subjects", items: ["Mathematics", "English", "Science"] }],
      },
      "/portal/assignments": {
        title: "Assignments",
        description: "Review tasks, due dates, and submitted files.",
        sections: [{ title: "Assignments", items: ["Due today", "Due this week", "Completed"] }],
      },
      "/portal/attendance": { title: "Attendance", description: "Monitor attendance performance.", sections: [{ title: "Summary", items: ["Monthly attendance", "Late records"] }] },
      "/portal/results": { title: "Results", description: "Review test and exam performance.", sections: [{ title: "Results", items: ["CA", "Exams", "Overall average"] }] },
      "/portal/report-cards": { title: "Report Cards", description: "Access academic reports.", sections: [{ title: "Reports", items: ["Current term", "Previous term"] }] },
      "/portal/fees": { title: "School Fees", description: "Review fee balance and payment history.", sections: [{ title: "Fees", items: ["Paid", "Outstanding balance"] }] },
      "/portal/announcements": { title: "Announcements", description: "School news and notices.", sections: [{ title: "Announcements", items: ["News", "Notices"] }] },
      "/portal/messages": { title: "Messages", description: "Teacher and school communications.", sections: [{ title: "Messages", items: ["Inbox", "Sent"] }] },
      "/portal/calendar": { title: "Calendar", description: "Academic calendar and events.", sections: [{ title: "Events", items: ["Exams", "Meetings", "Holidays"] }] },
      "/portal/downloads": { title: "Downloads", description: "Timetables, documents, and report cards.", sections: [{ title: "Downloads", items: ["Timetable", "Documents", "Reports"] }] },
      "/portal/profile": { title: "Profile", description: "Edit profile, password, and account settings.", sections: [{ title: "Profile", items: ["Edit profile", "Change password", "Delete account"] }] },
      "/portal/settings": { title: "Settings", description: "Theme and notification preferences.", sections: [{ title: "Settings", items: ["Theme", "Notifications"] }] },
    },
  },
  staff: {
    routeBase: "/staff",
    title: "Staff Dashboard",
    subtitle: "Manage classes, students, attendance, and academic activities.",
    sidebar: buildSections([
      { label: "Dashboard Home", href: "/staff/dashboard", icon: LayoutDashboard },
      { label: "My Classes", href: "/staff/classes", icon: School },
      { label: "Students", href: "/staff/students", icon: Users },
      { label: "Attendance", href: "/staff/attendance", icon: ClipboardCheck },
      { label: "Results", href: "/staff/results", icon: FileText },
      { label: "Assignments", href: "/staff/assignments", icon: ClipboardList },
      { label: "Timetable", href: "/staff/timetable", icon: CalendarDays },
      { label: "Announcements", href: "/staff/announcements", icon: Bell },
      { label: "Profile", href: "/staff/profile", icon: User },
      { label: "Settings", href: "/staff/settings", icon: Settings },
    ]),
    overview: [
      { label: "Classes", value: "4", note: "Assigned groups", icon: School },
      { label: "Students", value: "128", note: "Managed records", icon: Users },
      { label: "Tasks", value: "6", note: "Open actions", icon: ClipboardList },
    ],
    pages: {
      "/staff/classes": { title: "My Classes", description: "Assigned classes, subjects, and students.", sections: [{ title: "Classes", items: ["Class A", "Class B", "Class C"] }] },
      "/staff/students": { title: "Students", description: "Search and view student profiles.", sections: [{ title: "Students", items: ["Search students", "View profile"] }] },
      "/staff/attendance": { title: "Attendance", description: "Mark and review attendance.", sections: [{ title: "Attendance", items: ["Mark attendance", "Attendance history"] }] },
      "/staff/assignments": { title: "Assignments", description: "Create, share, and track assignments.", sections: [{ title: "Assignments", items: ["Create assignment", "Submission status"] }] },
      "/staff/examinations": { title: "Examinations", description: "Upcoming exams and schedules.", sections: [{ title: "Examinations", items: ["Exam schedule", "Invigilation"] }] },
      "/staff/results": { title: "Results", description: "Upload and view results.", sections: [{ title: "Results", items: ["Upload results", "View results"] }] },
      "/staff/lesson-plans": { title: "Lesson Plans", description: "Weekly lesson plans.", sections: [{ title: "Plans", items: ["Weekly plan", "Topics covered"] }] },
      "/staff/timetable": { title: "Timetable", description: "Daily timetable and class periods.", sections: [{ title: "Timetable", items: ["Monday", "Tuesday", "Wednesday"] }] },
      "/staff/announcements": { title: "Announcements", description: "School announcements and notices.", sections: [{ title: "Announcements", items: ["School news", "Staff notices"] }] },
      "/staff/messages": { title: "Messages", description: "Teacher communication center.", sections: [{ title: "Messages", items: ["Inbox", "Sent"] }] },
      "/staff/calendar": { title: "Calendar", description: "Events and academic calendar.", sections: [{ title: "Calendar", items: ["Events", "Deadlines"] }] },
      "/staff/resources": { title: "Resources", description: "Teaching materials and tools.", sections: [{ title: "Resources", items: ["Lesson notes", "Templates"] }] },
      "/staff/profile": { title: "Profile", description: "Edit profile, change password, delete account.", sections: [{ title: "Profile", items: ["Edit profile", "Change password", "Delete account"] }] },
      "/staff/settings": { title: "Settings", description: "Theme and notifications.", sections: [{ title: "Settings", items: ["Theme", "Notifications"] }] },
    },
  },
};

export function getDashboardRoleBase(pathname = "") {
  if (pathname.startsWith("/portal")) return "portal";
  if (pathname.startsWith("/parent")) return "portal";
  if (pathname.startsWith("/student")) return "portal";
  if (pathname.startsWith("/staff")) return "staff";
  return normalizeRole(pathname.split("/")[1] || "");
}

export function getDashboardConfigForRole(role = "") {
  const normalizedRole = normalizeRole(role);

  if (role === "portal" || normalizedRole === "parent" || normalizedRole === "student") {
    return roleDashboardConfig.portal;
  }

  return roleDashboardConfig[normalizedRole] || roleDashboardConfig.staff;
}

export function getDashboardPageConfig(role = "", pathname = "") {
  const config = getDashboardConfigForRole(role);
  return config.pages?.[pathname] || null;
}

export function getDashboardRoleFromPath(pathname = "") {
  if (pathname.startsWith("/portal")) return "portal";
  if (pathname.startsWith("/parent")) return "parent";
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/staff")) return "staff";
  return null;
}
