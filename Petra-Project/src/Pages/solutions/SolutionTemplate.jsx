import { ArrowRight, CheckCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import Footer from "../../Pages/components/Footer";
import "../../Styles/solutions.css";

function Hero({ data }) {
  const Icon = data.icon;
  return (
    <section className="solution-hero">
      <div className="solution-hero-copy">
        <div className="solution-eyebrow" style={{ color: data.accent }}>
          <Icon size={18} />
          {data.eyebrow}
        </div>
        <h1>{data.title}</h1>
        <p>{data.summary}</p>
        <div className="solution-actions">
          <NavLink to="/get-started" className="solution-btn primary">
            Get Started <ArrowRight size={18} />
          </NavLink>
          <a href="#faq" className="solution-btn secondary">
            View FAQ
          </a>
        </div>
      </div>
      <div className="solution-hero-panel">
        <div className="solution-chip">{data.badge}</div>
        <div className="solution-hero-stat">
          <span>Built for</span>
          <strong>Responsive SaaS workflows</strong>
        </div>
        <div className="solution-hero-preview">
          <img src={data.heroImage} alt="" className="solution-hero-image" />
        </div>
      </div>
    </section>
  );
}

function FeatureCards({ data }) {
  return (
    <section className="solution-section">
      <div className="section-heading">
        <h2>Feature Overview</h2>
        <p>Focused capabilities designed to feel consistent with Petra's existing dark SaaS language.</p>
      </div>
      <div className="solution-grid">
        {data.highlights.map((item) => (
          <article key={item} className="solution-card">
            <CheckCircle2 size={20} style={{ color: data.accent }} />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Benefits({ data }) {
  return (
    <section className="solution-section solution-benefits">
      <div className="section-heading">
        <h2>Benefits</h2>
        <p>The page structure keeps the same clean hierarchy while showing where the product helps most.</p>
      </div>
      <div className="solution-benefit-list">
        {data.benefits.map((item) => (
          <div key={item} className="solution-benefit-item">
            <span className="benefit-marker" style={{ background: data.accent }} />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Screenshots({ data }) {
  return (
    <section className="solution-section">
      <div className="section-heading">
        <h2>Screenshots / Placeholders</h2>
        <p>These blocks are ready for product imagery, dashboard captures or motion assets later.</p>
      </div>
      <div className="solution-shots">
        {data.screenshots.map((item, index) => (
          <div key={item} className={`solution-shot shot-${index + 1}`}>
            <img src={data.heroImage} alt="" className="solution-shot-image" />
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA({ data }) {
  return (
    <section className="solution-cta">
      <h2>Ready to explore {data.title}?</h2>
      <p>Use this route as a dedicated landing page for demos, onboarding and product storytelling.</p>
      <NavLink to="/get-started" className="solution-btn primary">
        Book a Demo <ArrowRight size={18} />
      </NavLink>
    </section>
  );
}

function FAQ({ data }) {
  return (
    <section className="solution-section" id="faq">
      <div className="section-heading">
        <h2>FAQ</h2>
        <p>Short answers for the most common questions about this module and page behavior.</p>
      </div>
      <div className="solution-faq">
        {data.faq.map((item) => (
          <details key={item.question} className="solution-faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function SolutionTemplate({ data }) {
  return (
    <main className="solution-page">
      <Hero data={data} />
      <FeatureCards data={data} />
      <Benefits data={data} />
      <Screenshots data={data} />
      <CTA data={data} />
      <FAQ data={data} />
      <Footer />
    </main>
  );
}
