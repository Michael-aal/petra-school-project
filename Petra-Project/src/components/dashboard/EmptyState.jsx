export default function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="dashboard-empty-state">
      {Icon ? (
        <div className="dashboard-empty-icon">
          <Icon size={18} />
        </div>
      ) : null}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
