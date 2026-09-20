import { Inbox, Plus } from "lucide-react";
import "./EmptyState.css";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  description = "Get started by adding your first record to this section.",
  actionLabel,
  onAction,
  className = ""
}) {
  return (
    <div className={`petra-empty-state ${className}`}>
      <div className="petra-empty-icon-box">
        <Icon size={28} />
      </div>
      <h3 className="petra-empty-title">{title}</h3>
      <p className="petra-empty-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="petra-empty-btn" onClick={onAction}>
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
