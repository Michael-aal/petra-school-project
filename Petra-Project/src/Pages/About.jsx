import {
  ArrowRight,
  BookOpen,
  Building2,
  HeartHandshake,
  Sparkles,
  Wallet,
  Users,
  Target,
  CircleCheck,
  Info,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const aboutFeatures = [
  {
    icon: BookOpen,
    title: "Simple Operations",
    info: "We make school administration easier so staff spend less time on admin and more time supporting students.",
    to: "Platform",
  },
  {
    icon: Wallet,
    title: "Better Financial Flow",
    info: "From fees to reconciliation, we help schools collect, track, and manage money with more visibility.",
    to: "Finance",
  },
  {
    icon: Building2,
    title: "School-First Design",
    info: "Every workflow is built around how schools actually work in the real world, not a perfect theoretical model.",
    to: "Solutions",
  },
];

const aboutHighlights = [
  {
    icon: Users,
    title: "Accessible to All",
    info: "Designed to be easy for families, staff, and administrators — no technical background required.",
  },
  {
    icon: Target,
    title: "Built for Real Schools",
    info: "Every feature is grounded in how schools actually operate, not a theoretical ideal.",
  },
  {
    icon: CircleCheck,
    title: "Clear Data, Smarter Decisions",
    info: "Give school leaders the visibility they need to make faster, more informed choices.",
  },
  {
    icon: Sparkles,
    title: "Made to Scale",
    info: "Whether you run one campus or many, Nuvora grows with you without adding complexity.",
  },
];

export default function About() {
  return (
    <main className="marketing-page fparent">

      {/* HERO SECTION */}
      <section className="marketing-header">
        <span className="marketing-badge">
          <Info size={15} /> ABOUT NUVORA
        </span>

        <h1 className="marketing-title">
          Simple tools for schools that <br />
          <span>want to grow with confidence</span>
        </h1>

        <p className="marketing-description">
          We started by solving one frustrating problem: disconnected school operations.
          Nuvora brings admissions, payments, communication, and academics into one clear system.
        </p>

        <div className="marketing-actions">
          <NavLink to="/contact" className="marketing-btn marketing-btn-primary">
            Talk to Us <ArrowRight size={16} />
          </NavLink>
          <NavLink to="/" className="marketing-btn marketing-btn-secondary">
            Explore Platform
          </NavLink>
        </div>

        {/* Trust bar */}
        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <BookOpen size={15} />
            <span>Built for Real Schools</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <CircleCheck size={15} />
            <span>Clear, Connected Operations</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <HeartHandshake size={15} />
            <span>Designed Around People</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="marketing-section">
        <div className="section-intro">
          <p className="landing-kicker">What We Do</p>
          <h2>Designed for clarity and real school operations.</h2>
        </div>

        <div className="feature-grid">
          {aboutFeatures.map(({ icon: Icon, title, info, to }) => (
            <article className="marketing-card" key={title}>
              <div className="marketing-card-icon">
                <Icon size={22} />
              </div>

              <h3 className="marketing-card-title">{title}</h3>
              <p className="marketing-card-text">{info}</p>

              <NavLink to="/solution" className="marketing-card-link">
                Explore {to} <ArrowRight size={14} />
              </NavLink>
            </article>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS SECTION */}
      <section className="marketing-section marketing-highlight-section">
        <div className="section-intro">
          <p className="landing-kicker">Our Principles</p>
          <h2>How We Work</h2>
          <p className="section-subtext">Less chaos. More clarity. Better outcomes for everyone in the school community.</p>
        </div>

        <div className="feature-grid highlight-grid">
          {aboutHighlights.map(({ icon: Icon, title, info }) => (
            <div className="marketing-card highlight-card" key={title}>
              <div className="marketing-card-icon highlight-icon">
                <Icon size={20} />
              </div>
              <h3 className="marketing-card-title">{title}</h3>
              <p className="marketing-card-text">{info}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="marketing-section marketing-cta fparent-cta">
        <div className="cta-badge">
          <Sparkles size={16} />
          <span>Built for real schools</span>
        </div>
        <h2 className="marketing-cta-title">Education Technology Should Feel Calm, Clear, and Useful</h2>
        <p className="marketing-cta-text">
          Let's build better school systems together. Talk to us about how Nuvora can work for your school.
        </p>
        <div className="marketing-actions">
          <NavLink to="/contact" className="marketing-btn marketing-btn-primary cta-btn">
            Let's Build Better Schools <ArrowRight size={16} />
          </NavLink>
        </div>
      </section>

    </main>
  );
}