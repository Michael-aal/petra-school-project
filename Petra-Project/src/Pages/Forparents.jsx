import { Users, Smartphone, CreditCard, PiggyBank, GraduationCap, Heart, Clock, CircleCheck, ArrowRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const parentButtons = ["Download App", "Learn More"];

const parentFeatures = [
  {
    logo: <CreditCard />,
    title: "Instant Payments",
    info: "Pay tuition, buy uniforms, and settle bills in seconds. Get instant receipts and track your spending history.",
    to: "Nuvora Pay",
    svgColor: "#2563eb",
    svgBgColor: "rgba(59, 130, 246, 0.12)",
    rightTop: "rgba(59, 130, 246, 0.12)",
  },
  {
    logo: <PiggyBank />,
    title: "Financial Flexibility",
    info: "Can't pay all at once? Split tuition into convenient monthly installments with Flexpay.",
    to: "Flexpay",
    svgColor: "#16a34a",
    svgBgColor: "rgba(22, 163, 74, 0.12)",
    rightTop: "rgba(22, 163, 74, 0.12)",
  },
  {
    logo: <GraduationCap />,
    title: "Academic Confidence",
    info: "Access learning support, homework tracking, and progress insights that keep your child ahead.",
    to: "Learning Hub",
    svgColor: "#7c3aed",
    svgBgColor: "rgba(124, 58, 237, 0.12)",
    rightTop: "rgba(124, 58, 237, 0.12)",
  },
];

const parentHighlights = [
  { logo: <Heart />, title: "Peace of Mind", info: "Know when fees are paid, attendance is logged, and school updates are delivered." },
  { logo: <Clock />, title: "Save Time", info: "Manage your child’s school life from one dashboard instead of multiple apps." },
  { logo: <CircleCheck />, title: "Real-time Updates", info: "Receive instant notifications whenever your child’s school activity changes." },
  { logo: <Users />, title: "Multi-child Support", info: "Keep siblings in different classes or schools organized under one parent account." },
];

export default function Forparents() {
  return (
    <section className="marketing-page fparent">
      <div className="marketing-header">
        <span className="marketing-badge">
          <Users />
          For Parents
        </span>
        <h1 className="marketing-title">
          Champion your child’s <span>future</span>
        </h1>
        <p className="marketing-description">
          Paying for school shouldn’t be a struggle. Nuvora gives parents fast payments, clear school updates, and the tools they need to stay informed.
        </p>
        <div className="marketing-actions">
          {parentButtons.map((item, index) => (
            <NavLink
              to="/"
              key={index}
              className={index === 0 ? "marketing-btn marketing-btn-primary" : "marketing-btn marketing-btn-secondary"}
            >
              {item}
              {index === 0 && <Smartphone className="button-icon" />}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="marketing-section feature-grid">
        {parentFeatures.map((item, index) => (
          <article className="marketing-card" key={index}>
            <span className="feature-top-circle" style={{ backgroundColor: item.rightTop }} />
            <div className="marketing-card-icon" style={{ backgroundColor: item.svgBgColor, color: item.svgColor }}>
              {item.logo}
            </div>
            <h3 className="marketing-card-title">{item.title}</h3>
            <p className="marketing-card-text">{item.info}</p>
            <NavLink to="/" className="marketing-card-link" style={{ color: item.svgColor }}>
              Explore {item.to} <ArrowRight />
            </NavLink>
          </article>
        ))}
      </div>

      <section className="marketing-section marketing-highlight-section">
        <div className="marketing-intro-block">
          <h2>Built for Modern Parenting</h2>
          <p>
            We handle the logistics so you can focus on what matters most: raising the next generation of leaders.
          </p>
        </div>
        <div className="feature-grid highlight-grid">
          {parentHighlights.map((item, index) => (
            <div className="marketing-card" key={index}>
              <div className="marketing-card-icon highlight-icon">{item.logo}</div>
              <h3 className="marketing-card-title">{item.title}</h3>
              <p className="marketing-card-text">{item.info}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-cta">
        <div className="cta-badge">
          <Smartphone />
          <span>For Parents</span>
        </div>
        <h2 className="marketing-cta-title">Join the Community</h2>
        <p className="marketing-cta-text">
          Over 50,000 parents are already using Nuvora to simplify school payments, monitor progress, and stay connected.
        </p>
        <div className="marketing-actions">
          <a href="/" className="marketing-btn marketing-btn-primary">Google Play</a>
          <a href="/" className="marketing-btn marketing-btn-secondary">App Store</a>
        </div>
      </section>
    </section>
  );
}
