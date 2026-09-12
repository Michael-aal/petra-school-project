import { 
  Users, 
  CreditCard, 
  PiggyBank, 
  GraduationCap, 
  Heart, 
  Clock, 
  CircleCheck, 
  ArrowRight, 
  Shield, 
  Bell 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const parentFeatures = [
  {
    icon: CreditCard,
    title: "Seamless Fee Payments",
    info: "Pay tuition and settle school bills in seconds. Receive digital receipts instantly and track your complete payment history.",
    to: "Nuvora Pay",
  },
  {
    icon: PiggyBank,
    title: "Flexible Payment Options",
    info: "Split tuition into manageable, installment arrangements with transparent payment schedules.",
    to: "Flexpay",
  },
  {
    icon: GraduationCap,
    title: "Academic Insights",
    info: "Access real-time homework tracking, attendance logs, and progress reports to stay updated on your child's learning.",
    to: "Learning Hub",
  },
];

const parentHighlights = [
  { 
    icon: Heart, 
    title: "Total Peace of Mind", 
    info: "Know exactly when fees are paid, attendance is logged, and important school updates are delivered." 
  },
  { 
    icon: Clock, 
    title: "Reclaim Your Time", 
    info: "Manage your child’s entire school life from one clean portal instead of juggling multiple channels." 
  },
  { 
    icon: Bell, 
    title: "Instant School Notices", 
    info: "Receive timely announcements whenever your child’s school posts new notices or events." 
  },
  { 
    icon: Users, 
    title: "Multi-Child Support", 
    info: "Keep siblings in different classes or schools organized under a single parent login." 
  },
];

export default function ForParents() {
  return (
    <main className="marketing-page fparent">
      
      {/* HERO SECTION */}
      <section className="marketing-header">
        <span className="marketing-badge">
          <Users size={15} /> FOR PARENTS & GUARDIANS
        </span>
        
        <h1 className="marketing-title">
          Stay Connected to Your Child's <br />
          <span>Education Journey</span>
        </h1>
        
        <p className="marketing-description">
          Paying for school shouldn't be a struggle, and staying informed shouldn't be a chore. 
          Nuvora gives parents fast, secure payments and crystal-clear school updates in one place.
        </p>
        
        <div className="marketing-actions">
          <NavLink to="/register/parent" className="marketing-btn marketing-btn-primary">
            Create Parent Account <ArrowRight size={16} />
          </NavLink>
          <NavLink to="/solution" className="marketing-btn marketing-btn-secondary">
            Explore Solutions
          </NavLink>
        </div>

        {/* Feature Assurances */}
        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <CreditCard size={15} />
            <span>Instant Digital Receipts</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Shield size={15} />
            <span>Encrypted Payment Processing</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <CircleCheck size={15} />
            <span>Direct School Connectivity</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="marketing-section">
        <div className="section-intro">
          <p className="landing-kicker">Parent Solutions</p>
          <h2>Designed for clarity and convenience.</h2>
        </div>

        <div className="feature-grid">
          {parentFeatures.map(({ icon: Icon, title, info, to }) => (
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
          <p className="landing-kicker">Modern Parenting</p>
          <h2>Built for Modern Parenting</h2>
          <p className="section-subtext">We streamline school communication and payments so you can focus on supporting your child.</p>
        </div>
        
        <div className="feature-grid highlight-grid">
          {parentHighlights.map(({ icon: Icon, title, info }) => (
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
          <Users size={16} />
          <span>Stay connected to school</span>
        </div>
        <h2 className="marketing-cta-title">Your Child's School, In One Clear View</h2>
        <p className="marketing-cta-text">
          Create your parent account to simplify school payments, monitor academic progress, and stay connected with teachers.
        </p>
        <div className="marketing-actions">
          <NavLink to="/register/parent" className="marketing-btn marketing-btn-primary cta-btn">
            Create Parent Account <ArrowRight size={16} />
          </NavLink>
        </div>
      </section>

    </main>
  );
}