import { useContext, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { parentApi } from "../../../../services/parentApi";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import QuickActions from "../../../../components/dashboard/QuickActions";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import "../page-styles/ParentDashboard.css";
import "../../../../components/dashboard/dashboard.css";

export default function ParentSectionPage({
  title,
  description,
  summaryCards = [],
  sections = [],
  actions = [],
  heroTitle,
  heroDescription,
  heroChips = [],
  footerAction = null,
}) {
  const { userInfo } = useContext(UserContext);
  const [hub, setHub] = useState(null);
  const childId = userInfo?.children?.[0]?.id;

  useEffect(() => {
    if (!childId) return;
    parentApi
      .childHub(childId)
      .then(setHub)
      .catch(() => setHub(null));
  }, [childId]);

  const connectedSections = useMemo(() => {
    if (!hub) return sections;
    const normalizedTitle = String(title || heroTitle || "").toLowerCase();
    if (normalizedTitle.includes("attendance")) {
      return [
        {
          title: "Recent attendance",
          items: (hub.attendance?.history || [])
            .slice(0, 8)
            .map((item) => ({
              title: item.attendanceDate?.slice(0, 10) || "Attendance",
              meta: item.remarks || "Daily attendance record",
              value: item.status,
            })),
        },
      ];
    }
    if (normalizedTitle.includes("result")) {
      return [
        {
          title: "Published results",
          items: (hub.academic?.results || [])
            .slice(0, 8)
            .map((item) => ({
              title: item.subject || "Subject",
              meta: `${item.score}/${item.maxScore}`,
              value: `${Math.round((Number(item.score) / Math.max(1, Number(item.maxScore))) * 100)}%`,
            })),
        },
      ];
    }
    if (
      normalizedTitle.includes("announcement") ||
      normalizedTitle.includes("notice")
    ) {
      return [
        {
          title: "School announcements",
          items: (hub.announcements || [])
            .slice(0, 8)
            .map((item) => ({ title: item.title, meta: item.body })),
        },
      ];
    }
    if (normalizedTitle.includes("message")) {
      return [
        {
          title: "Recent messages",
          items: (hub.messages || [])
            .slice(0, 8)
            .map((item) => ({
              title: item.subject || "School message",
              meta: item.body,
            })),
        },
      ];
    }
    if (
      normalizedTitle.includes("download") ||
      normalizedTitle.includes("document")
    ) {
      return [
        {
          title: "Published report cards",
          items: (hub.reportCards || [])
            .slice(0, 8)
            .map((item) => ({
              title: "Report card",
              meta: item.fileUrl,
              value: "Download",
            })),
        },
      ];
    }
    return sections;
  }, [heroTitle, hub, sections, title]);
  const headerBadge =
    heroChips.length > 0 ? `${heroChips.length} highlights` : null;
  const actionItems = actions.map((item) => ({
    label: item.title,
    meta: item.meta,
    icon: item.icon,
  }));

  return (
    <div className="parent-dashboard dashboard-home">
      <DashboardHeader
        eyebrow="Parent Portal"
        title={title || heroTitle || "Parent view"}
        subtitle={
          description ||
          heroDescription ||
          "A calm view of your child’s current school activity."
        }
        badge={headerBadge}
      />

      {heroChips.length > 0 ? (
        <div className="parent-chip-row">
          {heroChips.map((chip) => (
            <span key={chip} className="parent-chip">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {summaryCards.length > 0 ? (
        <section className="parent-summary-grid">
          {summaryCards.map((item) => {
            const Icon = item.icon;
            return (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                icon={Icon}
                tone={
                  item.tone === "tone-teal"
                    ? "teal"
                    : item.tone === "tone-rose"
                      ? "rose"
                      : "blue"
                }
                description={item.meta || "Overview"}
                trend="Live"
              />
            );
          })}
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
                  {section.items.map((item) => (
                    <div
                      key={item.title || item.label}
                      className="parent-list-item"
                    >
                      <div>
                        <strong>{item.title || item.label}</strong>
                        <p>
                          {item.meta ||
                            item.description ||
                            item.detail ||
                            item.note}
                        </p>
                      </div>
                      {item.value ? (
                        <div className="parent-pill">{item.value}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            ))}
          </div>
        ) : null}

        {actions.length > 0 ? (
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
