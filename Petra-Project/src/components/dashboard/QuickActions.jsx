import { ArrowRight } from "lucide-react";

export default function QuickActions({ title, items }) {
  return (
    <section className="dashboard-widget dashboard-quick-actions">
      <div className="dashboard-widget-head">
        <div>
          <p className="dashboard-widget-kicker">Quick Actions</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="dashboard-quick-actions-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className="dashboard-quick-action" type="button">
              <div className="dashboard-quick-action-icon">
                <Icon size={16} />
              </div>
              <div>
                <strong>{item.label}</strong>
                <span>{item.meta}</span>
              </div>
              <ArrowRight size={14} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
