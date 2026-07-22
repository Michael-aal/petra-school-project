import { useContext } from "react";
import { UserContext } from "../../../context/UserContext";
import { getFirstName } from "../../../utils/userProfile";
import {
  BellRing,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  PlusCircle,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import "../../../Styles/DashBoardLayout/homeDahboard.css";

const quickActions = [
  {
    id: 1,
    title: "Enroll a new student",
    description: "Add student records and start the admission process.",
    icon: PlusCircle,
    link: "/dashboard/students",
  },
  {
    id: 2,
    title: "Create a timetable",
    description: "Plan lessons for the week and keep classes organized.",
    icon: CalendarDays,
    link: "/dashboard/academics/timetable",
  },
  {
    id: 3,
    title: "Review school fees",
    description: "Track pending payments and update fee records.",
    icon: Wallet,
    link: "/dashboard/finance/payments",
  },
];

const recentActivity = [
  {
    id: 1,
    title: "Attendance updated",
    meta: "Class attendance for Grade 8 was synced this morning.",
    icon: UserCheck,
  },
  {
    id: 2,
    title: "New lesson published",
    meta: "The Mathematics timetable was updated for next week.",
    icon: BookOpenCheck,
  },
  {
    id: 3,
    title: "School notice sent",
    meta: "A parent reminder was shared to all active guardians.",
    icon: BellRing,
  },
];

import './page-styles/DashboardHomePage.css';

export default function DashboardHomePage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const { userInfo, students } = useContext(UserContext);
  const totalNumber = students ? students.length : 0;

  const dashboardHomeInfo = [
    {
      id: 1,
      info: "Total Students",
      logo: GraduationCap,
      amount: totalNumber,
      link: "/dashboard/students",
    },
    {
      id: 2,
      info: "Total Staff",
      logo: Users,
      amount: 87,
      link: "/dashboard/staff/teachers",
    },
    {
      id: 3,
      info: "Revenue",
      logo: Wallet,
      amount: "₦0",
      link: "/dashboard/finance/payments",
    },
    {
      id: 4,
      info: "Attendance Rate",
      logo: UserCheck,
      amount: "0%",
      link: "/dashboard/academics/attendance",
    },
  ];

  return (
    <div className="dashboard-home">
      <div className="dashboard-home-intro">
        <div>
          <h1 className="dashboard-home-welcome">
            Welcome back, {getFirstName(userInfo)} 👋
          </h1>
          <p className="dashboard-home-description">
            Here is a quick overview of your school operations for today, {userInfo?.role || "user"}.
          </p>
        </div>
        <div className="dashboard-home-session">Today • {formattedDate}</div>
      </div>

      <div className="dashboard-home-summary-cards">
        {dashboardHomeInfo.map((item) => {
          const IconComponent = item.logo;
          return (
            <a href={item.link} className="dashboard-home-summary-card" key={item.id}>
              <div className="dashboard-home-card-top">
                <div className="dashboard-home-card-content">
                  <p className="dashboard-home-card-title">{item.info}</p>
                  <h2 className="dashboard-home-card-amount">{item.amount}</h2>
                </div>
                <div className="dashboard-home-card-icon">
                  <IconComponent size={24} />
                </div>
              </div>
              <span className="dashboard-home-card-action">View details →</span>
            </a>
          );
        })}
      </div>

      <div className="dashboard-home-grid">
        <section className="dashboard-home-panel">
          <div className="dashboard-home-panel-header">
            <h3 className="dashboard-home-panel-title">Quick Actions</h3>
            <a href="/dashboard" className="dashboard-home-panel-link">View all</a>
          </div>
          <div className="dashboard-home-actions">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <a key={action.id} href={action.link} className="dashboard-home-action-card">
                  <div className="dashboard-home-action-text">
                    <div className="dashboard-home-action-icon">
                      <ActionIcon size={18} />
                    </div>
                    <div>
                      <h4>{action.title}</h4>
                      <p>{action.description}</p>
                    </div>
                  </div>
                  <span className="dashboard-home-action-arrow">→</span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="dashboard-home-panel">
          <div className="dashboard-home-panel-header">
            <h3 className="dashboard-home-panel-title">Recent Activity</h3>
            <a href="/dashboard" className="dashboard-home-panel-link">See more</a>
          </div>
          <ul className="dashboard-home-list">
            {recentActivity.map((item) => {
              const ActivityIcon = item.icon;
              return (
                <li key={item.id} className="dashboard-home-list-item">
                  <div className="dashboard-home-list-icon">
                    <ActivityIcon size={16} />
                  </div>
                  <div className="dashboard-home-list-content">
                    <h4>{item.title}</h4>
                    <p>{item.meta}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
