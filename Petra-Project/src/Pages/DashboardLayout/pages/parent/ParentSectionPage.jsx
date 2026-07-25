import { ArrowRight } from "lucide-react";
import "../page-styles/ParentDashboard.css";

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
  return (
    <div className="parent-dashboard dashboard-home">
      <section className="parent-hero">
        <article className="parent-hero-card">
          <h3>{title}</h3>
          <p>{description}</p>
          {heroChips.length > 0 ? (
            <div className="parent-chip-row">
              {heroChips.map((chip) => (
                <span key={chip} className="parent-chip">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </article>
        <article className="parent-hero-card accent">
          <h3>{heroTitle || "Parent view"}</h3>
          <p>{heroDescription || "A read-only view built from realistic mock data."}</p>
        </article>
      </section>

      {summaryCards.length > 0 ? (
        <section className="dashboard-home-summary">
          {summaryCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="dashboard-home-summary-card">
                <div className="dashboard-home-summary-top">
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className={`dashboard-home-summary-icon ${item.tone || "tone-blue"}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className={`dashboard-home-summary-action ${item.tone || "tone-blue"}`}>
                  <span>{item.meta || "Overview"}</span>
                  <ArrowRight size={14} />
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <section className="parent-grid">
        {sections.map((section) => (
          <article key={section.title} className="dashboard-home-panel">
            <h2>{section.title}</h2>
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
          </article>
        ))}
      </section>

      {actions.length > 0 ? (
        <section className="dashboard-home-panel">
          <h2>Quick Actions</h2>
          <div className="parent-actions">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} type="button" className="parent-action-btn">
                  <div className="dashboard-home-account-row">
                    <div className="dashboard-home-account-icon">
                      <Icon size={16} />
                    </div>
                    <div className="dashboard-home-account-text">
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {footerAction ? <div className="dashboard-home-panel">{footerAction}</div> : null}
    </div>
  );
}
