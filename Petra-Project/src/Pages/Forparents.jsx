import { 
  Users, Smartphone, CreditCard, PiggyBank, GraduationCap, 
  Heart, Clock, CircleCheck, ArrowRight, Shield, Bell 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const parentFeatures = [
  {
    logo: <CreditCard size={24} />,
    title: "Seamless Fee Payments",
    info: "Pay tuition, buy uniforms, and settle bills in seconds. Get instant digital receipts and track your complete spending history.",
    to: "Nuvora Pay",
    color: "#3B82F6", // Blue
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  {
    logo: <PiggyBank size={24} />,
    title: "Flexible Payment Plans",
    info: "Can't pay all at once? Split tuition into convenient, interest-free monthly installments with Nuvora Flexpay.",
    to: "Flexpay",
    color: "#10B981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  {
    logo: <GraduationCap size={24} />,
    title: "Academic Insights",
    info: "Access real-time homework tracking, attendance records, and progress reports to keep your child ahead of the curve.",
    to: "Learning Hub",
    color: "#8B5CF6", // Purple
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
];

const parentHighlights = [
  { 
    logo: <Heart size={20} />, 
    title: "Total Peace of Mind", 
    info: "Know exactly when fees are paid, attendance is logged, and important school updates are delivered." 
  },
  { 
    logo: <Clock size={20} />, 
    title: "Reclaim Your Time", 
    info: "Manage your child’s entire school life from one beautiful dashboard instead of juggling multiple apps." 
  },
  { 
    logo: <Bell size={20} />, 
    title: "Real-Time Alerts", 
    info: "Receive instant push notifications whenever your child’s school activity or status changes." 
  },
  { 
    logo: <Users size={20} />, 
    title: "Multi-Child Support", 
    info: "Keep siblings in different classes or even different schools perfectly organized under one parent account." 
  },
];

export default function ForParents() {
  return (
    <section className="marketing-page fparent">
      
      {/* HERO SECTION */}
      <div className="marketing-header">
        <span className="marketing-badge">
          <Users size={16} /> FOR PARENTS & GUARDIANS
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
            Create Parent Account <ArrowRight size={18} />
          </NavLink>
          <NavLink to="/solution" className="marketing-btn marketing-btn-secondary">
            See How It Works
          </NavLink>
        </div>

        {/* Trust Indicators */}
        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <Users size={16} />
            <span>50,000+ Active Parents</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Shield size={16} />
            <span>100% Secure Transactions</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <CircleCheck size={16} />
            <span>Real-Time School Updates</span>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="marketing-section feature-grid">
        {parentFeatures.map((item, index) => (
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

      {/* HIGHLIGHTS SECTION */}
      <section className="marketing-section marketing-highlight-section">
        <div className="marketing-intro-block">
          <h2>Built for Modern Parenting</h2>
          <p>We handle the administrative logistics so you can focus on what matters most: raising the next generation of leaders.</p>
        </div>
        
        <div className="feature-grid highlight-grid">
          {parentHighlights.map((item, index) => (
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
      <section className="marketing-section marketing-cta fparent-cta">
        <div className="cta-badge">
          <Smartphone size={18} />
          <span>Download the Nuvora App</span>
        </div>
        <h2 className="marketing-cta-title">Your Child's School, In Your Pocket</h2>
        <p className="marketing-cta-text">
          Join thousands of parents who use Nuvora to simplify school payments, monitor academic progress, and stay connected with teachers.
        </p>
        <div className="marketing-actions">
          <a href="/" className="marketing-btn marketing-btn-primary cta-btn">
            <Smartphone size={18} /> Get it on Google Play
          </a>
          <a href="/" className="marketing-btn marketing-btn-secondary cta-btn">
            Download on App Store
          </a>
        </div>
      </section>

    </section>
  );
}