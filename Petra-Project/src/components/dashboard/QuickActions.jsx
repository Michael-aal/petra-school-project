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
          const content = (
            <>
              <div className="dashboard-quick-action-icon">
                <Icon size={16} />
              </div>
              <div>
                <strong>{item.label}</strong>
                <span>{item.meta}</span>
              </div>
              <ArrowRight size={14} />
            </>
          );

          return item.href ? (
            <a key={item.label} className="dashboard-quick-action" href={item.href}>
              {content}
            </a>
          ) : (
            <button key={item.label} className="dashboard-quick-action" type="button" onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
