import { useContext, useEffect, useMemo, useState } from "react";
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
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hub, setHub] = useState(null);

  useEffect(() => {
    let active = true;

    const loadChildren = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await parentApi.children();
        const nextChildren = Array.isArray(response?.children) ? response.children : [];

        if (!active) return;

        setChildren(nextChildren);
        setSelectedChildId((current) => {
          if (nextChildren.some((child) => child.id === current)) return current;
          return nextChildren[0]?.id || "";
        });
      } catch (err) {
        if (!active) return;
        setChildren([]);
        setSelectedChildId("");
        setError(err.data?.message || err.message || "Unable to load your children.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadChildren();
    return () => { active = false; };
  }, []);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) || children[0] || null,
    [children, selectedChildId],
  );

  useEffect(() => {
    if (!selectedChild?.id) {
      setHub(null);
      return;
    }

    parentApi
      .childHub(selectedChild.id)
      .then(setHub)
      .catch(() => setHub(null));
  }, [selectedChild?.id]);

  const summaryItems = [
    {
      label: "Linked Students",
      value: children.length,
      icon: GraduationCap,
      description: children.length ? `${children.length} active profiles` : "No profiles linked yet",
      trend: "Live",
    },
    {
      label: "Attendance",
      value: hub?.summary?.attendancePercentage ? `${hub.summary.attendancePercentage}%` : "On track",
      icon: ClipboardCheck,
      description: "Latest updates shared",
      trend: "Live",
    },
    {
      label: "Results",
      value: hub?.summary?.performanceAverage ? `${hub.summary.performanceAverage}%` : "Pending",
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
        badge={`${children.length} linked child${children.length === 1 ? "" : "ren"}`}
        actionLabel="View school notices"
        actionHref="/portal/announcements"
      />

      {error ? (
        <div className="dashboard-alert error">{error}</div>
      ) : null}

      {loading ? (
        <div className="dashboard-page-copy">Loading your children...</div>
      ) : null}

      {!loading && children.length === 0 ? (
        <EmptyState
          title="No child linked to this account yet."
          description="Please contact the school administrator to link a student to your parent account."
          icon={GraduationCap}
          actionLabel="View school notices"
          actionHref="/portal/announcements"
        />
      ) : null}

      {!loading && children.length > 0 ? (
        <>
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
              <div className="parent-list">
                {children.length > 1 ? (
                  <div className="parent-list-item" style={{ marginBottom: "0.75rem" }}>
                    <div>
                      <strong>Selected child</strong>
                      <p>Choose which linked student to review.</p>
                    </div>
                    <select
                      value={selectedChildId}
                      onChange={(event) => setSelectedChildId(event.target.value)}
                      style={{ minWidth: 180 }}
                    >
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {getStudentDisplayName(child)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {children.map((child) => {
                  const childFullName = getStudentDisplayName(child);
                  const isSelected = child.id === selectedChildId;
                  return (
                    <div
                      key={child.id}
                      className="parent-list-item"
                      style={{ borderLeft: isSelected ? "3px solid #3b82f6" : undefined }}
                    >
                      <div>
                        <strong>{childFullName}</strong>
                        <p>{child.className || "No class assigned"}</p>
                      </div>
                      <div className="parent-pill">
                        {isSelected ? "Selected" : child.status || "Active"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardWidget>
          </section>
        </>
      ) : null}
    </div>
  );
}
