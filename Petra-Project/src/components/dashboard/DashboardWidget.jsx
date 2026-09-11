import { ArrowRight } from "lucide-react";

export default function DashboardWidget({ title, subtitle, actionLabel, actionHref, onAction, children, compact = false }) {
  return (
    <section className={`dashboard-widget${compact ? " dashboard-widget-compact" : ""}`}>
      <div className="dashboard-widget-head">
        <div>
          {subtitle ? <p className="dashboard-widget-kicker">{subtitle}</p> : null}
          <h3>{title}</h3>
        </div>
        {actionLabel ? (
          onAction ? (
            <button className="dashboard-widget-action" type="button" onClick={onAction}>
              <span>{actionLabel}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <a className="dashboard-widget-action" href={actionHref || "#"}>
              <span>{actionLabel}</span>
              <ArrowRight size={14} />
            </a>
          )
        ) : null}
      </div>
      <div className="dashboard-widget-body">{children}</div>
    </section>
  );
}
