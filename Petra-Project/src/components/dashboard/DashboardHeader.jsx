import { ArrowRight, Sparkles } from "lucide-react";

export default function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
  badge,
  children,
}) {
  return (
    <section className="dashboard-shell-header">
      <div className="dashboard-shell-header-copy">
        {eyebrow ? <p className="dashboard-shell-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="dashboard-shell-header-actions">
        {badge ? <span className="dashboard-shell-pill">{badge}</span> : null}
        {actionLabel && actionHref ? (
          <a className="dashboard-shell-link" href={actionHref}>
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </a>
        ) : null}
        {children}
      </div>
    </section>
  );
}
