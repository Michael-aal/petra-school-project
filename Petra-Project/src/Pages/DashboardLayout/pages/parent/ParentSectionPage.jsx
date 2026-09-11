import { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import { parentApi } from "../../../../services/parentApi";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatCard from "../../../../components/dashboard/StatCard";
import QuickActions from "../../../../components/dashboard/QuickActions";
import DashboardWidget from "../../../../components/dashboard/DashboardWidget";
import EmptyState from "../../../../components/dashboard/EmptyState";
import { GraduationCap } from "lucide-react";
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
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [hub, setHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setSelectedChildId((current) => nextChildren.some((child) => child.id === current) ? current : nextChildren[0]?.id || "");
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

  const connectedSections = useMemo(() => {
    if (!hub) return sections;
    const normalizedTitle = String(title || heroTitle || "").toLowerCase();

    if (normalizedTitle.includes("attendance")) {
      return [{ title: "Recent attendance", items: (hub.attendance || []).slice(0, 8).map((item) => ({ title: item.attendanceDate || "Attendance", meta: item.remarks || "Daily attendance record", value: item.status })) }];
    }
    if (normalizedTitle.includes("result")) {
      return [{ title: "Published results", items: (hub.results || []).slice(0, 8).map((item) => ({ title: item.subject || "Subject", meta: `${item.score}/${item.maxScore}`, value: `${Math.round((Number(item.score) / Math.max(1, Number(item.maxScore))) * 100)}%` })) }];
    }
    if (normalizedTitle.includes("announcement") || normalizedTitle.includes("notice")) {
      return [{ title: "School announcements", items: (hub.announcements || []).slice(0, 8).map((item) => ({ title: item.title, meta: item.body })) }];
    }
    if (normalizedTitle.includes("message")) {
      return [{ title: "Recent messages", items: (hub.messages || []).slice(0, 8).map((item) => ({ title: item.subject || "School message", meta: item.body })) }];
    }
    if (normalizedTitle.includes("download") || normalizedTitle.includes("document")) {
      return [{ title: "Published report cards", items: (hub.reportCards || []).slice(0, 8).map((item) => ({ title: "Report card", meta: item.fileUrl, value: "Download" })) }];
    }
    return sections;
  }, [hub, heroTitle, sections, title]);

  const headerBadge = heroChips.length > 0 ? `${heroChips.length} highlights` : null;
  const actionItems = actions.map((item) => ({ label: item.title, meta: item.meta, icon: item.icon }));

  if (loading) {
    return (
      <div className="parent-dashboard dashboard-home">
        <DashboardHeader eyebrow="Parent Portal" title={title || heroTitle || "Parent view"} subtitle={description || heroDescription || "Loading your child details..."} badge="Loading" />
        <div className="dashboard-page-copy">Loading your children...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parent-dashboard dashboard-home">
        <DashboardHeader eyebrow="Parent Portal" title={title || heroTitle || "Parent view"} subtitle={description || heroDescription || "Please try again."} badge="Error" />
        <div className="dashboard-alert error">{error}</div>
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="parent-dashboard dashboard-home">
        <DashboardHeader eyebrow="Parent Portal" title={title || heroTitle || "Parent view"} subtitle={description || heroDescription || "Your linked children will appear here."} badge="No children" />
        <EmptyState title="No child linked to this account yet." description="Please contact the school administrator to link a student to your parent account." icon={GraduationCap} actionLabel="View school notices" actionHref="/portal/announcements" />
      </div>
    );
  }

  return (
    <div className="parent-dashboard dashboard-home">
      <DashboardHeader
        eyebrow="Parent Portal"
        title={title || heroTitle || "Parent view"}
        subtitle={description || heroDescription || "A calm view of your child’s current school activity."}
        badge={headerBadge}
      />

      {heroChips.length > 0 ? (
        <div className="parent-chip-row">
          {heroChips.map((chip) => (
            <span key={chip} className="parent-chip">{chip}</span>
          ))}
        </div>
      ) : null}

      <div className="parent-list" style={{ marginBottom: "1rem" }}>
        {children.length > 1 ? (
          <div className="parent-list-item">
            <div>
              <strong>Selected child</strong>
              <p>Choose which linked student to review.</p>
            </div>
            <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)} style={{ minWidth: 180 }}>
              {children.map((child) => (
                <option key={child.id} value={child.id}>{child.name || child.firstName || child.lastName || child.id}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

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
                tone={item.tone === "tone-teal" ? "teal" : item.tone === "tone-rose" ? "rose" : "blue"}
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
              <DashboardWidget key={section.title} title={section.title} subtitle="Live updates">
                <div className="parent-list">
                  {section.items.map((item) => (
                    <div key={item.title || item.label} className="parent-list-item">
                      <div>
                        <strong>{item.title || item.label}</strong>
                        <p>{item.meta || item.description || item.detail || item.note}</p>
                      </div>
                      {item.value ? <div className="parent-pill">{item.value}</div> : null}
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            ))}
          </div>
        ) : null}

        {actions.length > 0 ? <QuickActions title="Parent shortcuts" items={actionItems} /> : null}
      </section>

      {footerAction ? <DashboardWidget title="Next step" subtitle="Continue">{footerAction}</DashboardWidget> : null}
    </div>
  );
}
