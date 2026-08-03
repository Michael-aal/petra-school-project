import { ArrowRight } from "lucide-react";

export default function DashboardWidget({ title, subtitle, actionLabel, children, compact = false }) {
  return (
    <section className={`dashboard-widget${compact ? " dashboard-widget-compact" : ""}`}>
      <div className="dashboard-widget-head">
        <div>
          {subtitle ? <p className="dashboard-widget-kicker">{subtitle}</p> : null}
          <h3>{title}</h3>
        </div>
        {actionLabel ? (
          <button className="dashboard-widget-action" type="button">
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        ) : null}
      </div>
      <div className="dashboard-widget-body">{children}</div>
    </section>
  );
}
