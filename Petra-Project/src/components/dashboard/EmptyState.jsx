export default function EmptyState({ title, description, icon: Icon, actionLabel, actionHref }) {
  return (
    <div className="dashboard-empty-state">
      {Icon ? (
        <div className="dashboard-empty-icon">
          <Icon size={18} />
        </div>
      ) : null}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {actionLabel && actionHref ? (
        <a className="dashboard-empty-action" href={actionHref}>
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
