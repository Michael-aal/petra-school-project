import { ArrowRight } from "lucide-react";
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
  const headerBadge = heroChips.length > 0 ? `${heroChips.length} highlights` : null;
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
        subtitle={description || heroDescription || "A calm view of your child’s current school activity."}
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
                tone={item.tone === "tone-teal" ? "teal" : item.tone === "tone-rose" ? "rose" : "blue"}
                description={item.meta || "Overview"}
                trend="Live"
              />
            );
          })}
        </section>
      ) : null}

      <section className="parent-grid">
        {sections.length > 0 ? (
          <div className="parent-section-stack">
            {sections.map((section) => (
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

      {footerAction ? (
        <DashboardWidget title="Next step" subtitle="Continue">
          {footerAction}
        </DashboardWidget>
      ) : null}
    </div>
  );
}
