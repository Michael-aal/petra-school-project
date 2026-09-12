import {
  ArrowRight,
  BookOpen,
  Building2,
  HeartHandshake,
  Sparkles,
  Wallet,
} from "lucide-react";
import "../Styles/about.css";

const values = [
  {
    icon: BookOpen,
    title: "Simple operations",
    text: "We make school administration easier so staff spend less time on admin and more time supporting students.",
  },
  {
    icon: Wallet,
    title: "Better financial flow",
    text: "From fees to reconciliation, we help schools collect, track, and manage money with more visibility.",
  },
  {
    icon: Building2,
    title: "School-first design",
    text: "Every workflow is built around how schools actually work in the real world, not a perfect theoretical model.",
  },
];

const principles = [
  "Accessible to families and schools",
  "Built for real school operations",
  "Clear data and smarter decisions",
  "Made to scale without complexity",
];

export default function About() {
  return (
    <main className="nuvora-about">
      <section className="about-hero">
        <div className="container about-hero__inner">
          <p className="about-kicker">About Nuvora</p>
          <h1>Simple tools for schools that want to grow with confidence.</h1>
          <p className="about-hero__text">
            We help schools manage admissions, payments, communication, academic operations,
            and daily decision-making in one place.
          </p>
          <div className="about-hero__actions">
            <a href="/contact" className="about-button about-button--primary">
              Talk to us
              <ArrowRight size={16} />
            </a>
            <a href="/" className="about-button about-button--secondary">
              Explore platform
            </a>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container about-grid">
          <div>
            <p className="section-eyebrow">Our story</p>
          </div>
          <div className="about-copy">
            <h2>We started by solving one frustrating problem: disconnected school operations.</h2>
            <p>
              Schools were managing fees, attendance, results, communication, and records across
              multiple systems and manual processes. We saw the friction and decided to build a
              more connected way forward.
            </p>
            <p>
              Nuvora brings those everyday school needs together so administrators, teachers,
              parents, and students can work from one clear system.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-section--muted">
        <div className="container">
          <p className="section-eyebrow">What we do</p>
          <div className="feature-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon">
                  <Icon size={18} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container about-approach">
          <div>
            <p className="section-eyebrow">Why it matters</p>
          </div>
          <div className="about-copy">
            <h2>Less chaos. More clarity. Better outcomes for learners.</h2>
            <p>
              When school processes are clear and connected, families feel more informed, staff work
              more efficiently, and leaders can make faster, smarter decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-section--muted">
        <div className="container">
          <div className="principles-wrap">
            <div className="principles-header">
              <p className="section-eyebrow">How we work</p>
              <div className="heart-mark">
                <HeartHandshake size={18} />
              </div>
            </div>
            <div className="principles-list">
              {principles.map((item) => (
                <div className="principle-item" key={item}>
                  <span className="principle-dot" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container about-cta">
          <div className="about-cta__card">
            <div>
              <p className="section-eyebrow section-eyebrow--dark">Built for real schools</p>
              <h2>We believe education technology should feel calm, clear, and useful.</h2>
            </div>
            <a href="/contact" className="about-button about-button--primary">
              Let’s build better school systems
              <Sparkles size={16} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}