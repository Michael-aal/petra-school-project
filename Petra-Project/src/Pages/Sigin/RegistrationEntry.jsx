import { Link } from "react-router-dom";
import { Building2, Users, UserRound } from "lucide-react";
import AuthShell from "./AuthShell";
import "../../Styles/Sigin/auth.css";

const options = [
  {
    title: "Parent",
    description: "Register as a parent to monitor your child's academic progress, attendance, payments, and school activities.",
    href: "/register/parent",
    icon: UserRound,
  },
  {
    title: "Staff",
    description: "Register as a staff member to manage classes, attendance, assessments, and other assigned responsibilities.",
    href: "/register/staff",
    icon: Users,
  },
  {
    title: "School Administrator",
    description: "Register your school and manage staff, students, parents, finance, academics, and school operations.",
    href: "/register/admin",
    icon: Building2,
  },
];

export default function RegistrationEntry() {
  return (
    <AuthShell
      eyebrow="Choose your path"
      title="Choose Your Registration Type"
      subtitle="Select how you want to register to continue."
      footnote="Already have an account? Sign in below."
    >
      <div className="auth-form">
          <Link to="/" className="auth-link auth-back-link">
          ← Back to Home
        </Link>

        <div className="registration-choice-grid">
          {options.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="registration-choice-card">
                <div className="registration-choice-icon">
                  <Icon size={20} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link to={item.href} className="auth-submit registration-choice-button">
                  Continue
                </Link>
              </article>
            );
          })}
        </div>

        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </AuthShell>
  );
}
