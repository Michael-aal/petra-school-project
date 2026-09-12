import { 
  Building2, 
  ArrowRight, 
  LayoutDashboard, 
  Wallet, 
  TestTube, 
  TrendingUp, 
  Shield, 
  CircleCheck, 
  Users, 
  Lock
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const schoolFeatures = [
  {
    icon: LayoutDashboard,
    title: "Unified School Management",
    info: "Manage students, staff, attendance, and timetables from a single intuitive dashboard. Say goodbye to scattered spreadsheets.",
    to: "School OS",
  },
  {
    icon: Wallet,
    title: "Smart Financial Control",
    info: "Eliminate revenue leakage, automate term fee collection, and provide transparent receipts to parents.",
    to: "Finance",
  },
  {
    icon: TestTube,
    title: "Advanced CBT & Reports",
    info: "Run CBT exams, generate automated student report cards, and track performance analytics with zero manual effort.",
    to: "Assessments",
  },
];

const schoolBenefits = [
  {
    icon: TrendingUp,
    title: "Revenue Assurance",
    info: "Simplify fee payment tracking and end-of-term reconciliation with automated tracking and receipts.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    info: "Your school data is secure. Nuvora uses enterprise-level encryption to protect student and financial records.",
  },
  {
    icon: CircleCheck,
    title: "Dedicated Onboarding",
    info: "We guide your team step-by-step. Our specialists ensure smooth setup and staff training for your institution.",
  },
  {
    icon: Building2,
    title: "Infinite Scalability",
    info: "Whether you have 50 or 5,000 learners, our cloud-native platform handles your growth reliably.",
  },
];

export default function ForSchool() {
  return (
    <main className="marketing-page fsos">
      
      {/* HERO SECTION */}
      <section className="marketing-header">
        <span className="marketing-badge">
          <Building2 size={15} /> FOR SCHOOLS & INSTITUTIONS
        </span>
        
        <h1 className="marketing-title">
          The Complete Operating System for <br />
          <span>Modern Schools</span>
        </h1>
        
        <p className="marketing-description">
          Stop juggling fragmented tools. Nuvora connects administration, finance, and academics into one secure, clean, and reliable platform.
        </p>
        
        <div className="marketing-actions">
          <NavLink to="/contact" className="marketing-btn marketing-btn-primary">
            Request a Strategic Demo <ArrowRight size={16} />
          </NavLink>
          <NavLink to="/contact" className="marketing-btn marketing-btn-secondary">
            Contact Sales
          </NavLink>
        </div>

        {/* Trust Indicators */}
        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <Users size={15} />
            <span>Role-Based Access Control</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Lock size={15} />
            <span>Encrypted Data Security</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <CircleCheck size={15} />
            <span>Fast & Intuitive Setup</span>
          </div>
        </div>
      </section>

      {/* CORE SOLUTIONS */}
      <section className="marketing-section">
        <div className="section-intro">
          <p className="landing-kicker">Core Solutions</p>
          <h2>Everything your institution needs to succeed.</h2>
        </div>

        <div className="feature-grid">
          {schoolFeatures.map(({ icon: Icon, title, info, to }) => (
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

      {/* WHY SCHOOLS CHOOSE NUVORA */}
      <section className="marketing-section marketing-highlight-section">
        <div className="section-intro">
          <p className="landing-kicker">Institutional Value</p>
          <h2>Why Top Institutions Choose Nuvora</h2>
          <p className="section-subtext">We partner with forward-thinking schools to deliver operational excellence and financial clarity.</p>
        </div>
        
        <div className="feature-grid highlight-grid">
          {schoolBenefits.map(({ icon: Icon, title, info }) => (
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
      <section className="marketing-section marketing-cta">
        <div className="cta-badge">
          <Shield size={16} />
          <span>Partner with Nuvora</span>
        </div>
        <h2 className="marketing-cta-title">Ready to transform your school's operations?</h2>
        <p className="marketing-cta-text">
          Join institutions that have modernized their workflows. Schedule a personalized, no-obligation walkthrough today.
        </p>
        <NavLink to="/contact" className="marketing-btn marketing-btn-primary cta-btn">
          Book Your Demo <ArrowRight size={16} />
        </NavLink>
      </section>

    </main>
  );
}