import { Bell, Search, Send, Users, GraduationCap, CreditCard, BookOpen } from "lucide-react";
import "../page-styles/NotificationsPage.css";

const notifications = [
  {
    id: 1,
    title: "Term Fee Reminder",
    description: "Second term fees are due on Feb 28, 2025.",
    meta: "Sent: Feb 10, 2025",
    audience: "1,284 recipients",
    tag: "Finance",
    tone: "green",
    icon: CreditCard,
  },
  {
    id: 2,
    title: "Parent-Teacher Meeting",
    description: "PTA meeting scheduled for Feb 22, 2025 at 10am.",
    meta: "Sent: Feb 8, 2025",
    audience: "890 recipients",
    tag: "Event",
    tone: "blue",
    icon: Users,
  },
  {
    id: 3,
    title: "Exam Timetable Released",
    description: "First term exams begin March 3rd. Check portal.",
    meta: "Sent: Feb 5, 2025",
    audience: "1,284 recipients",
    tag: "Academic",
    tone: "purple",
    icon: BookOpen,
  },
];

export default function NotificationsPage() {
  return (
    <div className="notifications-page dashboard-page">
      <section className="notifications-hero">
        <div className="notifications-search-wrap">
          <Search size={17} className="notifications-search-icon" />
          <input
            type="search"
            className="notifications-search"
            placeholder="Search students, staff, payments..."
            aria-label="Search notifications"
          />
        </div>

        <div className="notifications-session">
          <span className="notifications-session-dot" />
          <span>2024/2025 Session</span>
        </div>

        <button type="button" className="notifications-avatar">
          AD
        </button>
      </section>

      <section className="notifications-toolbar">
        <div className="notifications-title-block">
          <div className="notifications-title-icon">
            <Bell size={20} />
          </div>
          <div>
            <h1>Notifications</h1>
            <p>Send announcements to parents, students, and staff</p>
          </div>
        </div>

        <button type="button" className="notifications-send-button">
          <Send size={16} />
          <span>Send Notification</span>
        </button>
      </section>

      <section className="notifications-list" aria-label="Notification list">
        {notifications.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.id} className="notification-card">
              <div className={`notification-card-icon tone-${item.tone}`}>
                <Icon size={18} />
              </div>

              <div className="notification-card-body">
                <div className="notification-card-main">
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <div className="notification-card-meta">
                      <span>{item.meta}</span>
                      <span>{item.audience}</span>
                    </div>
                  </div>

                  <span className={`notification-tag tone-${item.tone}`}>
                    {item.tag}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
