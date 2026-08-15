import { useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CircleHelp,
  FileCheck2,
  Landmark,
  Sparkles,
} from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { getDisplayName } from "../../../utils/userProfile";
import "./page-styles/GetStarted.css";

const setupSteps = [
  {
    icon: Building2,
    number: "01",
    title: "Build your school profile",
    description: "Add your school details so every record, notice, and receipt feels unmistakably yours.",
    action: "Open school profile",
    to: "/dashboard/setup/profile",
  },
  {
    icon: CalendarDays,
    number: "02",
    title: "Set up the academic term",
    description: "Create the session, classes, and subjects your team will use throughout the term.",
    action: "Set up your term",
    to: "/dashboard/setup/sessions",
  },
  {
    icon: Landmark,
    number: "03",
    title: "Prepare for payments",
    description: "Finish your verification and configure payout details before collecting school fees.",
    action: "Review payment settings",
    to: "/dashboard/finance",
  },
];

export default function GetStarted() {
  const { userInfo } = useContext(UserContext);
  const displayName = getDisplayName(userInfo) || "there";
  const firstName = displayName.split(" ")[0];

  return (
    <main className="gs">
      <section className="gs-intro" aria-labelledby="get-started-title">
        <div className="gs-intro-copy">
          <p className="gs-eyebrow"><Sparkles size={14} /> Petra setup</p>
          <h1 id="get-started-title">A thoughtful start,<br /><span>{firstName}.</span></h1>
          <p>
            Set up the essentials once, then let Petra keep your school&apos;s people,
            learning, and finances moving in sync.
          </p>
          <Link to="/dashboard/setup/sessions" className="gs-primary-action">
            Start setup <ArrowRight size={17} />
          </Link>
        </div>

        <div className="gs-progress-card" aria-label="Setup progress">
          <div className="gs-progress-topline">
            <span>Getting your school ready</span>
            <strong>3 steps</strong>
          </div>
          <div className="gs-progress-track"><span /></div>
          <div className="gs-progress-summary">
            <div className="gs-progress-check"><Check size={15} /></div>
            <p><strong>Everything in one calm place.</strong> Complete these essentials whenever you&apos;re ready.</p>
          </div>
        </div>
      </section>

      <section className="gs-setup" aria-labelledby="setup-steps-title">
        <div className="gs-section-heading">
          <div>
            <p className="gs-section-kicker">Your workspace</p>
            <h2 id="setup-steps-title">Make Petra yours</h2>
          </div>
          <p>Three small steps give your team a clear, reliable foundation for the term ahead.</p>
        </div>

        <div className="gs-step-grid">
          {setupSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article className="gs-step-card" key={step.number}>
                <div className="gs-step-top">
                  <span className="gs-step-number">{step.number}</span>
                  <span className="gs-step-icon"><Icon size={19} /></span>
                </div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <Link to={step.to} className="gs-step-link">
                  {step.action} <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="gs-help" aria-label="Support">
        <div className="gs-help-icon"><CircleHelp size={20} /></div>
        <div>
          <p>Need a hand?</p>
          <h2>Our school success team is here for you.</h2>
        </div>
        <Link to="/contact" className="gs-help-link">
          <FileCheck2 size={16} /> Contact support
        </Link>
      </section>
    </main>
  );
}
