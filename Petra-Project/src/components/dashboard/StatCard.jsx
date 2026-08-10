import { ArrowUpRight } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = "blue",
  accent,
  description,
  footer,
}) {
  return (
    <article className={`dashboard-stat-card tone-${tone}`} style={accent ? { borderColor: accent } : undefined}>
      <div className="dashboard-stat-card-top">
        <div className="dashboard-stat-card-icon">
          <Icon size={16} />
        </div>
        {trend ? (
          <div className="dashboard-stat-card-trend">
            <ArrowUpRight size={13} />
            <span>{trend}</span>
          </div>
        ) : null}
      </div>

      <div className="dashboard-stat-card-content">
        <span>{label}</span>
        <strong>{value}</strong>
        {description ? <p>{description}</p> : null}
      </div>

      {footer ? <div className="dashboard-stat-card-footer">{footer}</div> : null}
    </article>
  );
}
