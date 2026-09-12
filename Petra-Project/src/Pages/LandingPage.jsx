import { 
  ArrowRight, 
  Check, 
  UserCheck, 
  CreditCard, 
  MessageSquare, 
  Award,
  ShieldCheck,
  Zap,
  Quote
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/LandingPage.css";

const features = [
  {
    icon: UserCheck,
    title: "Student & Staff Records",
    text: "Organize student profiles, class rosters, and staff records in one clear, searchable place.",
  },
  {
    icon: CreditCard,
    title: "Fee Collection & Tracking",
    text: "Monitor payment updates, generate automated receipts, and simplify end-of-term reconciliation.",
  },
  {
    icon: MessageSquare,
    title: "Parent Communication",
    text: "Share important announcements, notices, and academic updates with parents effortlessly.",
  },
  {
    icon: Award,
    title: "CBT & Report Cards",
    text: "Conduct computer-based tests and generate accurate student report cards in seconds.",
  },
];

const steps = [
  {
    step: "01",
    title: "Set up your school profile",
    text: "Add your school details, classes, and subjects in under 10 minutes.",
  },
  {
    step: "02",
    title: "Invite your team",
    text: "Give staff, teachers, parents, and students secure access to their own portals.",
  },
  {
    step: "03",
    title: "Run daily operations smoothly",
    text: "Manage attendance, issue fee notices, and publish academic reports with ease.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-badge">
            <Zap size={14} /> School Management Made Simple
          </span>
          <h1>A simpler way to run your school.</h1>
          <p className="landing-text">
            Nuvora connects student records, fee tracking, parent communication, and academic reports into one clean, reliable platform.
          </p>

          <div className="landing-actions">
            <NavLink to="/get-started" className="landing-button landing-button-primary">
              Get Started with Nuvora
              <ArrowRight size={16} />
            </NavLink>
            <NavLink to="/solution" className="landing-button landing-button-secondary">
              Explore Features
            </NavLink>
          </div>

          <div className="landing-proof">
            <Check size={15} />
            <span>Simple for staff, parents, and students</span>
          </div>
        </div>

        <div className="landing-card">
          <div className="mini-header">
            <span>School Live Status</span>
            <span className="live-dot" />
          </div>
          <ul className="mini-list">
            <li>
              <strong>Admissions</strong>
              <span className="status-pill status-open">Open</span>
            </li>
            <li>
              <strong>Term Fees</strong>
              <span className="status-pill status-updated">Updated</span>
            </li>
            <li>
              <strong>Parent Portal</strong>
              <span className="status-pill status-connected">Connected</span>
            </li>
            <li>
              <strong>Attendance</strong>
              <span className="status-pill status-connected">Recorded</span>
            </li>
          </ul>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="landing-section">
        <div className="section-header">
          <p className="landing-kicker">Everything you need</p>
          <h2 className="section-title">Designed for clarity and daily efficiency.</h2>
        </div>

        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section landing-section-soft">
        <div className="section-header">
          <p className="landing-kicker">Simple setup</p>
          <h2 className="section-title">Get started in three easy steps.</h2>
        </div>

        <div className="steps-grid">
          {steps.map((item) => (
            <div className="step-card" key={item.step}>
              <span className="step-number">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT REASSURANCE & PRIVACY */}
      <section className="landing-section landing-reassurance-section">
        <div className="reassurance-card">
          <ShieldCheck size={28} className="reassurance-icon" />
          <h3>Built for clarity, privacy, and reliability</h3>
          <p>
            Nuvora is designed from the ground up to give administrators, teachers, and parents a calm, transparent platform for daily school operations.
          </p>
          <div className="reassurance-points">
            <div className="point-item">
              <Check size={16} />
              <span>Role-based access control</span>
            </div>
            <div className="point-item">
              <Check size={16} />
              <span>Secure data protection</span>
            </div>
            <div className="point-item">
              <Check size={16} />
              <span>No complex training required</span>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="landing-cta">
        <div>
          <p className="landing-kicker">Ready to begin?</p>
          <h2>Let’s make school operations feel effortless.</h2>
          <p className="cta-subtext">No long setup process required. Get started in minutes.</p>
        </div>

        <NavLink to="/get-started" className="landing-button landing-button-primary">
          Get Started Today
          <ArrowRight size={16} />
        </NavLink>
      </section>
    </main>
  );
}
