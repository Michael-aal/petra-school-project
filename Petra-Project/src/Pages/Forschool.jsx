import { Building2, ArrowRight, LayoutDashboard, Wallet, TestTube, TrendingUp, Shield, CircleCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const schoolButtons = ["Request a Strategic Demo", "Contact Sales"];

const schoolFeatures = [
  {
    logo: <LayoutDashboard />,
    title: "Core Operations",
    info: "Manage students, staff, attendance, and results from a single, unified school platform.",
    to: "School OS",
    svgColor: "#9333ea",
    svgBgColor: "rgba(148, 63, 247, 0.12)",
    rightTop: "rgba(148, 63, 247, 0.12)",
  },
  {
    logo: <Wallet />,
    title: "Financial Control",
    info: "Eliminate fraud, automate fee collection, and improve transparency for parents and administrators.",
    to: "Finance",
    svgColor: "#16a34a",
    svgBgColor: "rgba(22, 163, 74, 0.12)",
    rightTop: "rgba(22, 163, 74, 0.12)",
  },
  {
    logo: <TestTube />,
    title: "Modern Assessment",
    info: "Run exams, quizzes, and performance analytics with fewer manual steps and clearer insights.",
    to: "Assessments",
    svgColor: "#0891b2",
    svgBgColor: "rgba(6, 182, 212, 0.12)",
    rightTop: "rgba(6, 182, 212, 0.12)",
  },
];

const schoolBenefits = [
  {
    logo: <TrendingUp className="marketing-icon" />,
    title: "Revenue Assurance",
    info: "Capture every fee payment and simplify reconciliation with built-in tracking and reporting.",
  },
  {
    logo: <Shield className="marketing-icon" />,
    title: "Data Security First",
    info: "Bank-grade security keeps student and financial data protected across every school workflow.",
  },
  {
    logo: <CircleCheck className="marketing-icon" />,
    title: "Dedicated Support",
    info: "Access a team of education specialists who help you launch and scale with confidence.",
  },
  {
    logo: <Building2 className="marketing-icon" />,
    title: "Scalable Infrastructure",
    info: "Support 50 or 5,000 learners with cloud-native performance and high availability.",
  },
];

export default function ForSchool() {
  return (
    <section className="marketing-page fsos">
      <div className="marketing-header">
        <span className="marketing-badge">
          <Building2 />
          For Schools
        </span>
        <h1 className="marketing-title">
          Run your entire school on <span>autopilot</span>
        </h1>
        <p className="marketing-description">
          Stop using fragmented tools. Nuvora connects administration, finance, and assessments into one powerful operating system.
        </p>
        <div className="marketing-actions">
          {schoolButtons.map((item, index) => (
            <NavLink
              to="/"
              key={index}
              className={index === 0 ? "marketing-btn marketing-btn-primary" : "marketing-btn marketing-btn-secondary"}
            >
              {item}
              {index === 0 && <ArrowRight className="button-icon" />}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="marketing-section feature-grid">
        {schoolFeatures.map((item, index) => (
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
          <h2>Why Top Schools Choose Nuvora</h2>
          <p>We partner with schools to deliver operational excellence, stronger finances, and safer student management.</p>
        </div>
        <div className="feature-grid highlight-grid">
          {schoolBenefits.map((item, index) => (
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
          <Shield />
          <span>For Schools</span>
        </div>
        <h2 className="marketing-cta-title">Ready to modernize your school?</h2>
        <p className="marketing-cta-text">
          Join hundreds of forward-thinking institutions that trust Nuvora. Schedule a personalized walkthrough today.
        </p>
        <NavLink to="/" className="marketing-btn marketing-btn-primary">
          Book Your Demo
        </NavLink>
      </section>
    </section>
  );
}
