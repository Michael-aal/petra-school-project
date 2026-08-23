import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
} from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import QuickActions from "../../../../components/dashboard/QuickActions";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import EmptyState from "../../../../components/dashboard/EmptyState";
import "../page-styles/ParentDashboard.css";
import "../../../../components/dashboard/dashboard.css";
import { getStudentDisplayName } from "../../../../utils/studentDisplay";
import { parentApi } from "../../../../services/parentApi";

export default function ParentDashboard() {
  const { userInfo } = useContext(UserContext);
  const myChildren = userInfo?.children || [];
  const [hub, setHub] = useState(null);

  useEffect(() => {
    const childId = myChildren[0]?.id;
    if (!childId) return;
    parentApi
      .childHub(childId)
      .then(setHub)
      .catch(() => setHub(null));
  }, [myChildren]);

  const summaryItems = [
    {
      label: "Linked Students",
      value: myChildren.length,
      icon: GraduationCap,
      description: myChildren.length
        ? `${myChildren.length} active profiles`
        : "No profiles linked yet",
      trend: "Live",
    },
    {
      label: "Attendance",
      value: hub?.summary?.attendancePercentage
        ? `${hub.summary.attendancePercentage}%`
        : "On track",
      icon: ClipboardCheck,
      description: "Latest updates shared",
      trend: "Live",
    },
    {
      label: "Results",
      value: hub?.summary?.performanceAverage
        ? `${hub.summary.performanceAverage}%`
        : "Pending",
      icon: FileText,
      description: "Published scores",
      trend: "Live",
    },
    {
      label: "Resources",
      value: hub?.reportCards?.length || "Ready",
      icon: BookOpen,
      description: "Report cards available",
      trend: "Ready",
    },
  ];

  return (
    <div className="parent-dashboard dashboard-home">
      <DashboardHeader
        eyebrow="Parent Portal"
        title={`Welcome back, ${userInfo?.firstName || "Parent"}`}
        subtitle="Stay informed with a calm, modern view of your children’s school progress."
        badge={`${myChildren.length} linked child${myChildren.length === 1 ? "" : "ren"}`}
        actionLabel="View school notices"
        actionHref="#"
      />

      <section className="parent-summary-grid">
        {summaryItems.map(
          ({ label, value, icon: Icon, description, trend }) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              icon={Icon}
              tone="blue"
              description={description}
              trend={trend}
            />
          ),
        )}
      </section>

      <section className="parent-grid">
        <QuickActions
          title="Parent shortcuts"
          items={[
            {
              label: "View Child",
              meta: "Open profile details",
              icon: GraduationCap,
              href: "/portal/children",
            },
            { label: "Pay Fees", meta: "Review pending fees", icon: BookOpen, href: "/portal/fees" },
            {
              label: "Check Attendance",
              meta: "See the latest attendance",
              icon: ClipboardCheck,
              href: "/portal/attendance",
            },
            {
              label: "View Results",
              meta: "Inspect recent scores",
              icon: FileText,
              href: "/portal/results",
            },
          ]}
        />

        <DashboardWidget
          title="Your children"
          subtitle="Linked students"
          actionLabel="Manage"
        >
          {myChildren.length > 0 ? (
            <div className="parent-list">
              {myChildren.map((child) => {
                const childFullName = getStudentDisplayName(child);
                return (
                  <div key={child.id} className="parent-list-item">
                    <div>
                      <strong>{childFullName}</strong>
                      <p>{child.className || "No class assigned"}</p>
                    </div>
                    <div className="parent-pill">
                      {child.status || "Active"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No children linked yet"
              description="Link a student account to start viewing updates, attendance, and assignments here."
              icon={GraduationCap}
              actionLabel="Link a child"
              actionHref="/dashboard/students/parent-links"
            />
          )}
        </DashboardWidget>
      </section>
    </div>
  );
}
