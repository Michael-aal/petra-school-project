import { 
  Building2, ArrowRight, LayoutDashboard, Wallet, TestTube, 
  TrendingUp, Shield, CircleCheck, Zap, Users, Lock 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const schoolFeatures = [
  {
    logo: <LayoutDashboard size={24} />,
    title: "Unified School Management",
    info: "Manage students, staff, attendance, and timetables from a single, intuitive dashboard. Say goodbye to scattered spreadsheets.",
    to: "School OS",
    color: "#8B5CF6", // Purple
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  {
    logo: <Wallet size={24} />,
    title: "Smart Financial Control",
    info: "Eliminate revenue leakage, automate fee collection with Paystack, and provide complete financial transparency to parents.",
    to: "Finance",
    color: "#10B981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  {
    logo: <TestTube size={24} />,
    title: "Advanced Assessments",
    info: "Run CBT exams, generate automated report cards, and track student performance analytics with zero manual effort.",
    to: "Assessments",
    color: "#06B6D4", // Cyan
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
];

const schoolBenefits = [
  {
    logo: <TrendingUp size={20} />,
    title: "Revenue Assurance",
    info: "Capture 100% of fee payments and simplify end-of-term reconciliation with built-in tracking and automated receipts.",
  },
  {
    logo: <Shield size={20} />,
    title: "Bank-Grade Security",
    info: "Your data is sacred. Nuvora uses enterprise-level encryption to keep student and financial records completely safe.",
  },
  {
    logo: <CircleCheck size={20} />,
    title: "Dedicated Onboarding",
    info: "We don't just give you software. Our education specialists guide your staff through setup and training.",
  },
  {
    logo: <Building2 size={20} />,
    title: "Infinite Scalability",
    info: "Whether you have 50 or 5,000 learners, our cloud-native infrastructure handles the load with 99.9% uptime.",
  },
];

export default function ForSchool() {
  return (
    <section className="marketing-page fsos">
      
      {/* HERO SECTION */}
      <div className="marketing-header">
        <span className="marketing-badge">
          <Building2 size={16} /> FOR SCHOOLS & INSTITUTIONS
        </span>
        
        <h1 className="marketing-title">
          The All-in-One Operating System for <br />
          <span>Modern Schools</span>
        </h1>
        
        <p className="marketing-description">
          Stop juggling fragmented tools. Nuvora connects administration, finance, and academics into one powerful, secure, and easy-to-use platform.
        </p>
        
        <div className="marketing-actions">
          <NavLink to="/contact" className="marketing-btn marketing-btn-primary">
            Request a Strategic Demo <ArrowRight size={18} />
          </NavLink>
          <NavLink to="/contact" className="marketing-btn marketing-btn-secondary">
            Contact Sales
          </NavLink>
        </div>

        {/* Trust Indicators */}
        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <Users size={16} />
            <span>Trusted by 50+ Schools</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Lock size={16} />
            <span>SOC-2 Compliant Security</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Zap size={16} />
            <span>Setup in Under 48 Hours</span>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="marketing-section feature-grid">
        {schoolFeatures.map((item, index) => (
          <article className="marketing-card" key={index} style={{ '--card-accent': item.color }}>
            <span className="feature-top-circle" style={{ background: item.bgColor }} />
            
            <div className="marketing-card-icon" style={{ backgroundColor: item.bgColor, color: item.color }}>
              {item.logo}
            </div>
            
            <h3 className="marketing-card-title">{item.title}</h3>
            <p className="marketing-card-text">{item.info}</p>
            
            <NavLink to="/solution" className="marketing-card-link" style={{ color: item.color }}>
              Explore {item.to} <ArrowRight size={16} />
            </NavLink>
          </article>
        ))}
      </div>

      {/* BENEFITS SECTION */}
      <section className="marketing-section marketing-highlight-section">
        <div className="marketing-intro-block">
          <h2>Why Top Institutions Choose Nuvora</h2>
          <p>We partner with forward-thinking schools to deliver operational excellence, stronger finances, and safer student management.</p>
        </div>
        
        <div className="feature-grid highlight-grid">
          {schoolBenefits.map((item, index) => (
            <div className="marketing-card highlight-card" key={index}>
              <div className="marketing-card-icon highlight-icon">
                {item.logo}
              </div>
              <h3 className="marketing-card-title">{item.title}</h3>
              <p className="marketing-card-text">{item.info}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="marketing-section marketing-cta">
        <div className="cta-badge">
          <Shield size={18} />
          <span>Partner with Nuvora</span>
        </div>
        <h2 className="marketing-cta-title">Ready to transform your school's operations?</h2>
        <p className="marketing-cta-text">
          Join hundreds of institutions that have modernized their workflows. Schedule a personalized, no-obligation walkthrough today.
        </p>
        <NavLink to="/contact" className="marketing-btn marketing-btn-primary cta-btn">
          Book Your Demo <ArrowRight size={18} />
        </NavLink>
      </section>

    </section>
  );
}