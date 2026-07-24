import { Link } from "react-router-dom";
import { Building2, Users, UserRound } from "lucide-react";
import AuthShell from "./AuthShell";
import "../../Styles/Sigin/auth.css";

const options = [
  {
    title: "Register School",
    description: "Create a new school account for your institution.",
    href: "/register",
    icon: Building2,
  },
  {
    title: "Staff Registration",
    description: "Teachers and staff should activate accounts using the code from the school administrator.",
    href: "/staff/register",
    icon: Users,
  },
  {
    title: "Parent Registration",
    description: "Parents can create an account to access child information after the school links the student.",
    href: "/parent/register",
    icon: UserRound,
  },
];

export default function RegistrationEntry() {
  return (
    <AuthShell
      eyebrow="Choose your path"
      title="Choose Registration Type"
      subtitle="Select how you would like to join Petra School Management System."
      footnote="Already have an account? Continue to the Login page."
    >
      <div className="auth-form">
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
          Already have an account? <Link to="/signin">Login</Link>
        </p>
      </div>
    </AuthShell>
  );
}
