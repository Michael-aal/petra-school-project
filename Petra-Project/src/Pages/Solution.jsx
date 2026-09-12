
import { NavLink } from "react-router-dom";
import { ArrowRight, BookOpen, Building2, Layers3, Sparkles, Users } from "lucide-react";
import { solutionGroups } from "./solutions/solutionData";

const solutionBenefits = [
  {
    icon: Building2,
    title: "Connected operations",
    info: "Bring academic, financial, and administrative work together in one clear system.",
  },
  {
    icon: Users,
    title: "Designed for people",
    info: "Give staff, parents, and students a simpler experience without extra friction.",
  },
  {
    icon: BookOpen,
    title: "Clear workflows",
    info: "Every module is structured around how schools actually work in day-to-day operations.",
  },
  {
    icon: Sparkles,
    title: "Built to grow",
    info: "Start simple, add more functionality as your school needs evolve.",
  },
];

export default function Solution() {
  return (
    <main className="marketing-page fparent solution-index-page">
      <section className="marketing-header">
        <span className="marketing-badge">
          <Layers3 size={15} /> SOLUTIONS
        </span>

        <h1 className="marketing-title">
          Everything your school needs, <br />
          <span>in one connected platform</span>
        </h1>

        <p className="marketing-description">
          Nuvora brings admissions, communication, payments, academics, and daily operations into one simple experience for schools.
        </p>

        <div className="marketing-actions">
          <NavLink to="/contact" className="marketing-btn marketing-btn-primary">
            Talk to Us <ArrowRight size={16} />
          </NavLink>
          <NavLink to="/" className="marketing-btn marketing-btn-secondary">
            Explore Platform
          </NavLink>
        </div>

        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <Building2 size={15} />
            <span>School-first design</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Users size={15} />
            <span>Built for every role</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <BookOpen size={15} />
            <span>Clear, practical workflows</span>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-intro">
          <p className="landing-kicker">Core Modules</p>
          <h2>Built for every part of the school journey.</h2>
        </div>

        <div className="feature-grid solution-grid">
          {solutionGroups.map((group) => (
            <article key={group.header} className="marketing-card solution-group-card">
              <div className="marketing-card-icon">
                <Layers3 size={20} />
              </div>

              <h3 className="marketing-card-title">{group.header}</h3>

              <ul className="solution-list">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink to={item.path}>{item.title}</NavLink>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-highlight-section">
        <div className="section-intro">
          <p className="landing-kicker">Why it works</p>
          <h2>One system. Better experience.</h2>
        </div>

        <div className="feature-grid highlight-grid">
          {solutionBenefits.map(({ icon: Icon, title, info }) => (
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

      <section className="marketing-section marketing-cta fparent-cta">
        <div className="cta-badge">
          <Sparkles size={16} />
          <span>Built for real schools</span>
        </div>
        <h2 className="marketing-cta-title">Need a platform that fits your school, not the other way around?</h2>
        <p className="marketing-cta-text">
          Let’s talk about the exact workflows, tools, and modules your school needs to run more smoothly.
        </p>
        <div className="marketing-actions">
          <NavLink to="/contact" className="marketing-btn marketing-btn-primary cta-btn">
            Book a Demo <ArrowRight size={16} />
          </NavLink>
        </div>
      </section>
    </main>
  );
}
