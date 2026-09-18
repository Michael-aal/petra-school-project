import { Link } from "react-router-dom";
import { ArrowRight, Building2, Check, Users, UserRound } from "lucide-react";
import AuthShell from "./AuthShell";
import "../../Styles/Sigin/auth.css";

const options = [
  {
    title: "Parent",
    audience: "For families",
    description: "Register as a parent to monitor your child's academic progress, attendance, payments, and school activities.",
    href: "/register/parent",
    icon: UserRound,
  },
  {
    title: "Staff",
    audience: "For teachers and staff",
    description: "Register as a staff member to manage classes, attendance, assessments, and other assigned responsibilities.",
    href: "/register/staff",
    icon: Users,
  },
  {
    title: "School Administrator",
    audience: "For school leaders",
    description: "Register your school and manage staff, students, parents, finance, academics, and school operations.",
    href: "/register/admin",
    icon: Building2,
  },
];

export default function RegistrationEntry() {
  return (
    <AuthShell variant="registration-entry">
      <div className="auth-form registration-entry-form">
        <div className="registration-entry-topbar">
          <Link to="/" className="registration-home-link">← Back to home</Link>
          <p>Already enrolled? <Link to="/signin">Sign in</Link></p>
        </div>

        <header className="registration-entry-heading">
          <span className="registration-eyebrow">Get started with Nuvora</span>
          <h1>Choose the workspace that fits your role.</h1>
          <p>Start with the portal you need today. You can complete registration in just a few steps.</p>
        </header>

        <ol className="registration-journey" aria-label="Registration steps">
          <li className="is-active"><span>1</span>Choose a role</li>
          <li><span>2</span>Create your account</li>
          <li><span>3</span>Set up your workspace</li>
        </ol>

        <section className="registration-choice-section" aria-labelledby="registration-choice-title">
          <div className="registration-choice-header">
            <div>
              <p>Choose your role</p>
              <h2 id="registration-choice-title">Where do you belong?</h2>
            </div>
            <span className="registration-secure-note"><Check size={14} /> Secure registration</span>
          </div>

          <div className="registration-choice-grid">
          {options.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="registration-choice-card">
                <div className="registration-choice-card-head">
                  <div className="registration-choice-icon">
                    <Icon size={21} />
                  </div>
                  <span>{item.audience}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link to={item.href} className="auth-submit registration-choice-button">
                  Continue as {item.title}
                  <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
          </div>
        </section>

        <p className="registration-help">Need help choosing? <Link to="/contact">Talk to the Nuvora team</Link>.</p>
      </div>
    </AuthShell>
  );
}
