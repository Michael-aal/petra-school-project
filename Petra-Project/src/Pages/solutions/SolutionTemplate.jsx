import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers3,
  Sparkles,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Footer from "../../Pages/components/Footer";
import "../../Styles/solutions.css";

function Hero({ data }) {
  const Icon = data.icon;

  return (
    <section className="marketing-header solution-template-header">
      <span className="marketing-badge" style={{ background: `${data.accent}1A`, color: data.accent }}>
        <Icon size={15} /> {data.eyebrow.toUpperCase()}
      </span>

      <h1 className="marketing-title">
        {data.title} <br />
        <span style={{ color: data.accent }}>for everyday school work</span>
      </h1>

      <p className="marketing-description">{data.summary}</p>

      <div className="marketing-actions">
        <NavLink to="/contact" className="marketing-btn marketing-btn-primary">
          Talk to Us <ArrowRight size={16} />
        </NavLink>
        <a href="#faq" className="marketing-btn marketing-btn-secondary">
          View FAQ
        </a>
      </div>

      <div className="marketing-trust-bar">
        <div className="marketing-trust-item">
          <BookOpen size={15} />
          <span>Simple setup</span>
        </div>
        <div className="marketing-trust-divider" />
        <div className="marketing-trust-item">
          <Users size={15} />
          <span>Built for schools</span>
        </div>
        <div className="marketing-trust-divider" />
        <div className="marketing-trust-item">
          <Layers3 size={15} />
          <span>Clear workflows</span>
        </div>
      </div>
    </section>
  );
}

function FeatureCards({ data }) {
  return (
    <section className="marketing-section">
      <div className="section-intro">
        <p className="landing-kicker">Why it matters</p>
        <h2>What this module helps teams do.</h2>
      </div>

      <div className="feature-grid solution-detail-grid">
        {data.highlights.map((item) => (
          <article key={item} className="marketing-card solution-detail-card">
            <div className="marketing-card-icon" style={{ background: `${data.accent}1A`, color: data.accent }}>
              <CheckCircle2 size={20} />
            </div>
            <h3 className="marketing-card-title">{item}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

function Benefits({ data }) {
  return (
    <section className="marketing-section marketing-highlight-section">
      <div className="section-intro">
        <p className="landing-kicker">Benefits</p>
        <h2>Designed for daily school operations.</h2>
      </div>

      <div className="feature-grid highlight-grid solution-benefit-grid">
        {data.benefits.map((item) => (
          <div key={item} className="marketing-card highlight-card solution-benefit-card">
            <div className="marketing-card-icon highlight-icon" style={{ background: `${data.accent}1A`, color: data.accent }}>
              <CheckCircle2 size={18} />
            </div>
            <h3 className="marketing-card-title">{item}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

function Screenshots({ data }) {
  const fallbackPreview =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="#fffaf5" offset="0%" />
            <stop stop-color="#fff1e8" offset="100%" />
          </linearGradient>
        </defs>
        <rect width="800" height="520" rx="34" fill="url(#bg)"/>
        <rect x="40" y="36" width="720" height="448" rx="24" fill="#fff" stroke="#f2d1ba" stroke-width="2"/>
        <rect x="72" y="72" width="180" height="18" rx="9" fill="#f7d9c6"/>
        <rect x="72" y="110" width="120" height="12" rx="6" fill="#f4c9ae"/>
        <rect x="72" y="170" width="260" height="180" rx="16" fill="#fff3eb"/>
        <rect x="362" y="170" width="330" height="28" rx="12" fill="#f7d9c6"/>
        <rect x="362" y="214" width="260" height="18" rx="9" fill="#f0c5a5"/>
        <rect x="362" y="250" width="290" height="18" rx="9" fill="#f0c5a5"/>
        <rect x="362" y="286" width="220" height="18" rx="9" fill="#f0c5a5"/>
        <rect x="72" y="382" width="160" height="58" rx="16" fill="#ff6600" opacity="0.12"/>
        <rect x="250" y="382" width="160" height="58" rx="16" fill="#ff6600" opacity="0.10"/>
        <rect x="428" y="382" width="160" height="58" rx="16" fill="#ff6600" opacity="0.08"/>
      </svg>
    `);

  return (
    <section className="marketing-section">
      <div className="section-intro">
        <p className="landing-kicker">Preview</p>
        <h2>Simple, structured, and easy to understand.</h2>
      </div>

      <div className="feature-grid solution-preview-grid">
        {data.screenshots.map((item, index) => (
          <article key={item} className="marketing-card solution-preview-card">
            <div className="solution-preview-media" style={{ background: `${data.accent}12` }}>
              <img
                src={data.heroImage || fallbackPreview}
                alt=""
                className="solution-preview-image"
                onError={(event) => {
                  event.currentTarget.src = fallbackPreview;
                }}
              />
            </div>
            <h3 className="marketing-card-title">{item}</h3>
            <p className="marketing-card-text">
              {index === 0 && "A clear overview for staff and administrators."}
              {index === 1 && "Built for responsive use across devices."}
              {index === 2 && "A cleaner way to see activity and priorities."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CTA({ data }) {
  return (
    <section className="marketing-section marketing-cta fparent-cta">
      <div className="cta-badge">
        <Sparkles size={16} />
        <span>{data.badge}</span>
      </div>
      <h2 className="marketing-cta-title">Ready to explore {data.title}?</h2>
      <p className="marketing-cta-text">
        Let’s talk about how this workflow can fit your school and make daily operations easier.
      </p>
      <div className="marketing-actions">
        <NavLink to="/contact" className="marketing-btn marketing-btn-primary cta-btn">
          Book a Demo <ArrowRight size={16} />
        </NavLink>
      </div>
    </section>
  );
}

function FAQ({ data }) {
  return (
    <section className="marketing-section" id="faq">
      <div className="section-intro">
        <p className="landing-kicker">FAQ</p>
        <h2>Questions people ask most.</h2>
      </div>

      <div className="solution-faq-list">
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
    <main className="marketing-page fsos solution-template-page">
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
