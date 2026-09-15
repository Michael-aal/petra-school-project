import { useEffect, useMemo, useState } from "react";
import { parentApi } from "../../../../services/parentApi";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import QuickActions from "../../../../components/dashboard/QuickActions";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import EmptyState from "../../../../components/dashboard/EmptyState";
import { ClipboardCheck, FileText, GraduationCap, Users } from "lucide-react";
import "../page-styles/ParentDashboard.css";
import "../../../../components/dashboard/dashboard.css";

const percent = (score, maxScore) => {
  const scoreNumber = Number(score);
  const maxNumber = Math.max(1, Number(maxScore || 100));
  if (!Number.isFinite(scoreNumber)) return 0;
  return Math.round((scoreNumber / maxNumber) * 100);
};

export default function ParentSectionPage({
  title,
  description,
  sections = [],
  actions = [],
  heroTitle,
  heroDescription,
  footerAction = null,
}) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubLoading, setHubLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadChildren = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await parentApi.children();
        const nextChildren = Array.isArray(response?.children)
          ? response.children
          : [];
        if (!active) return;
        setChildren(nextChildren);
        setSelectedChildId((current) =>
          nextChildren.some((child) => child.id === current)
            ? current
            : nextChildren[0]?.id || "",
        );
      } catch (err) {
        if (!active) return;
        setChildren([]);
        setSelectedChildId("");
        setError(
          err?.data?.message || err?.message || "Unable to load your children.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    loadChildren();
    return () => {
      active = false;
    };
  }, []);

  const selectedChild = useMemo(
    () =>
      children.find((child) => child.id === selectedChildId) ||
      children[0] ||
      null,
    [children, selectedChildId],
  );

  useEffect(() => {
    if (!selectedChild?.id) {
      setHub(null);
      setHubLoading(false);
      return undefined;
    }
    let active = true;
    setHub(null);
    setHubLoading(true);
    parentApi
      .childHub(selectedChild.id)
      .then((data) => {
        if (active) setHub(data);
      })
      .catch((err) => {
        if (active)
          setError(
            err?.data?.message ||
              err?.message ||
              "Unable to load this child's school data.",
          );
      })
      .finally(() => {
        if (active) setHubLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedChild?.id]);

  const mode = String(title || heroTitle || "").toLowerCase();
  const isAttendance = mode.includes("attendance");
  const isResults = mode.includes("result");
  const liveSummaryCards = useMemo(() => {
    if (!hub) return [];

    if (isAttendance) {
      const history = Array.isArray(hub.attendance?.history)
        ? hub.attendance.history
        : [];
      return [
        {
          icon: ClipboardCheck,
          label: "Attendance",
          value: `${Number(hub.attendance?.percentage || 0)}%`,
          meta: `${history.length} records`,
          tone: "blue",
        },
      ];
    }

    if (isResults) {
      const results = Array.isArray(hub.academic?.results)
        ? hub.academic.results
        : [];
      return [
        {
          icon: FileText,
          label: "Published Results",
          value: results.length,
          meta: `${Number(hub.academic?.performanceAverage || 0)}% average`,
          tone: "blue",
        },
      ];
    }

    if (mode.includes("child")) {
      return [
        {
          icon: Users,
          label: "Linked Students",
          value: children.length,
          meta: "Live linked profiles",
          tone: "blue",
        },
      ];
    }

    return [];
  }, [children.length, hub, isAttendance, isResults, mode]);

  const connectedSections = useMemo(() => {
    if (!hub) return [];

    if (isAttendance) {
      const history = Array.isArray(hub.attendance?.history)
        ? hub.attendance.history
        : [];
      return [
        {
          title: "Recent attendance",
          items: history.slice(0, 8).map((item) => ({
            title: item.attendanceDate
              ? new Date(item.attendanceDate).toLocaleDateString()
              : "Attendance record",
            meta: item.remarks || "Daily attendance record",
            value: item.status || "Recorded",
          })),
        },
      ];
    }

    if (isResults) {
      const results = Array.isArray(hub.academic?.results)
        ? hub.academic.results
        : [];
      return [
        {
          title: "Published results",
          items: results.slice(0, 8).map((item) => ({
            title:
              item.subject?.name ||
              item.subjectName ||
              item.subject ||
              "Subject",
            meta: `${item.score ?? 0}/${item.maxScore ?? 100}`,
            value: `${percent(item.score, item.maxScore)}%`,
          })),
        },
      ];
    }

    if (mode.includes("announcement") || mode.includes("notice")) {
      const notifications = Array.isArray(hub.announcements)
        ? hub.announcements
        : [];
      return [
        {
          title: "School announcements",
          items: notifications
            .slice(0, 8)
            .map((item) => ({
              title: item.title || "School notice",
              meta: item.body || item.message || "",
              value: "New",
            })),
        },
      ];
    }

    if (mode.includes("message")) {
      const messages = Array.isArray(hub.messages) ? hub.messages : [];
      return [
        {
          title: "Recent messages",
          items: messages
            .slice(0, 8)
            .map((item) => ({
              title: item.subject || "School message",
              meta: item.body || item.content || "",
              value: "Message",
            })),
        },
      ];
    }

    if (mode.includes("download") || mode.includes("document")) {
      const reportCards = Array.isArray(hub.reportCards) ? hub.reportCards : [];
      return [
        {
          title: "Published report cards",
          items: reportCards
            .slice(0, 8)
            .map((item) => ({
              title: "Report card",
              meta: item.fileUrl || "Published document",
              value: item.fileUrl ? "Available" : "Pending",
            })),
        },
      ];
    }

    if (mode.includes("child")) {
      return [
        {
          title: "Linked students",
          items: children.map((child) => ({
            title: child.name || child.id,
            meta: child.className || "Class not assigned",
            value: child.status || "Active",
          })),
        },
      ];
    }

    return sections;
  }, [children, hub, isAttendance, isResults, mode, sections]);

  const displayedSummaryCards = liveSummaryCards.length ? liveSummaryCards : [];
  const actionItems = actions
    .filter((item) => item.href || item.onClick)
    .map((item) => ({
      label: item.title,
      meta: item.meta,
      icon: item.icon,
      href: item.href,
      onClick: item.onClick,
    }));

  if (loading) {
    return (
      <div className="parent-dashboard dashboard-home">
        <DashboardHeader
          eyebrow="Parent Portal"
          title={title || heroTitle || "Parent view"}
          subtitle={
            description || heroDescription || "Loading your child details..."
          }
          badge="Loading"
        />
        <div className="dashboard-page-copy">Loading your children...</div>
      </div>
    );
  }

  if (error && !children.length) {
    return (
      <div className="parent-dashboard dashboard-home">
        <DashboardHeader
          eyebrow="Parent Portal"
          title={title || heroTitle || "Parent view"}
          subtitle={description || heroDescription || "Please try again."}
          badge="Error"
        />
        <div className="dashboard-alert error">{error}</div>
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="parent-dashboard dashboard-home">
        <DashboardHeader
          eyebrow="Parent Portal"
          title={title || heroTitle || "Parent view"}
          subtitle={
            description ||
            heroDescription ||
            "Your linked children will appear here."
          }
          badge="No children"
        />
        <EmptyState
          title="No child linked to this account yet."
          description="Please contact the school administrator to link a student to your parent account."
          icon={GraduationCap}
          actionLabel="View school notices"
          actionHref="/portal/announcements"
        />
      </div>
    );
  }

  return (
    <div className="parent-dashboard dashboard-home">
      <DashboardHeader
        eyebrow="Parent Portal"
        title={title || heroTitle || "Parent view"}
        subtitle={
          description ||
          heroDescription ||
          "A live view of your child's school activity."
        }
        badge={selectedChild?.name || "Live data"}
      />

      {error ? <div className="dashboard-alert error">{error}</div> : null}

      <div className="parent-list parent-child-picker-wrap">
        {children.length > 1 ? (
          <div className="parent-list-item">
            <div>
              <strong>Selected child</strong>
              <p>Choose which linked student to review.</p>
            </div>
            <select
              className="parent-child-select"
              value={selectedChildId}
              onChange={(event) => setSelectedChildId(event.target.value)}
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name || child.id}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {hubLoading ? (
        <div className="parent-live-note">
          Updating this child&apos;s latest school records...
        </div>
      ) : null}

      {displayedSummaryCards.length > 0 ? (
        <section className="parent-summary-grid">
          {displayedSummaryCards.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              icon={item.icon}
              tone={item.tone || "blue"}
              description={item.meta || "Live data"}
              trend="Live"
            />
          ))}
        </section>
      ) : null}

      <section className="parent-grid">
        {connectedSections.length > 0 ? (
          <div className="parent-section-stack">
            {connectedSections.map((section) => (
              <DashboardWidget
                key={section.title}
                title={section.title}
                subtitle="Live updates"
              >
                <div className="parent-list">
                  {section.items.length ? (
                    section.items.map((item) => (
                      <div
                        key={`${item.title}-${item.value || ""}`}
                        className="parent-list-item"
                      >
                        <div>
                          <strong>{item.title || item.label}</strong>
                          <p>{item.meta || item.description || ""}</p>
                        </div>
                        {item.value ? (
                          <div className="parent-pill">{item.value}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-page-copy">
                      No published records yet.
                    </div>
                  )}
                </div>
              </DashboardWidget>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published records yet"
            description="When the school publishes data for this student, it will appear here automatically."
            icon={GraduationCap}
          />
        )}

        {actionItems.length > 0 ? (
          <QuickActions title="Parent shortcuts" items={actionItems} />
        ) : null}
      </section>

      {footerAction ? (
        <DashboardWidget title="Next step" subtitle="Continue">
          {footerAction}
        </DashboardWidget>
      ) : null}
    </div>
  );
}
