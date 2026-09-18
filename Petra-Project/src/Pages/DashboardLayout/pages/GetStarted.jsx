
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
import { getFirstName } from "../../../utils/userProfile";
import "./page-styles/GetStarted.css";

const PAGE_COPY = {
  eyebrow: "Nuvora setup",
  title: "A thoughtful start,",
  description:
    "Set up the essentials once, then let Nuvora keep your school's people, learning, and finances moving in sync.",
  setupKicker: "Your workspace",
  setupTitle: "Make Nuvora yours",
  setupDescription:
    "Complete these essentials to give your team a clear foundation for the term ahead.",
};

const SETUP_STEPS = [
  {
    id: "school-profile",
    icon: Building2,
    title: "Build your school profile",
    description:
      "Add your school details so records, notices, and receipts feel unmistakably yours.",
    actionLabel: "Open school profile",
    to: "/dashboard/setup/profile",
  },
  {
    id: "academic-term",
    icon: CalendarDays,
    title: "Set up the academic term",
    description:
      "Create the session, classes, and subjects your team will use throughout the term.",
    actionLabel: "Set up your term",
    to: "/dashboard/setup/sessions",
  },
  {
    id: "payments",
    icon: Landmark,
    title: "Prepare for payments",
    description:
      "Finish verification and configure your payout details before collecting school fees.",
    actionLabel: "Review payment settings",
    to: "/dashboard/finance",
  },
];

const SUPPORT = {
  title: "Our school success team is here for you.",
  to: "/contact",
  actionLabel: "Contact support",
};

function OnboardingHero({ firstName, firstStep }) {
  return (
    <section className="gs-intro" aria-labelledby="get-started-title">
      <div className="gs-intro-copy">
        <p className="gs-eyebrow">
          <Sparkles size={14} aria-hidden="true" />
          {PAGE_COPY.eyebrow}
        </p>

        <h1 id="get-started-title">
          {PAGE_COPY.title}
          <br />
          <span>{firstName}.</span>
        </h1>

        <p className="gs-intro-description">
          {PAGE_COPY.description}
        </p>

        <Link to={firstStep.to} className="gs-primary-action">
          <span>Start setup</span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>

      <SetupProgress totalSteps={SETUP_STEPS.length} />
    </section>
  );
}

function SetupProgress({ totalSteps }) {
  const completedSteps = 0;
  const progress = totalSteps
    ? (completedSteps / totalSteps) * 100
    : 0;

  return (
    <aside className="gs-progress-card" aria-label="Setup progress">
      <div className="gs-progress-header">
        <div>
          <p className="gs-progress-label">Setup progress</p>
          <span>Getting your school ready</span>
        </div>

        <strong>
          {completedSteps}/{totalSteps}
        </strong>
      </div>

      <div
        className="gs-progress-track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={totalSteps}
        aria-valuenow={completedSteps}
        aria-label={`${completedSteps} of ${totalSteps} setup steps complete`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="gs-progress-summary">
        <div className="gs-progress-check" aria-hidden="true">
          <Check size={15} />
        </div>

        <p>
          <strong>A clear start, one step at a time.</strong>
          {" "}
          Complete these essentials whenever you're ready.
        </p>
      </div>
    </aside>
  );
}

function SetupSteps() {
  return (
    <section
      className="gs-setup"
      aria-labelledby="setup-steps-title"
    >
      <header className="gs-section-heading">
        <div>
          <p className="gs-section-kicker">
            {PAGE_COPY.setupKicker}
          </p>

          <h2 id="setup-steps-title">
            {PAGE_COPY.setupTitle}
          </h2>
        </div>

        <p>{PAGE_COPY.setupDescription}</p>
      </header>

      <div className="gs-step-grid">
        {SETUP_STEPS.map((step, index) => (
          <SetupStep
            key={step.id}
            step={step}
            stepNumber={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

function SetupStep({ step, stepNumber }) {
  const Icon = step.icon;
  const number = String(stepNumber).padStart(2, "0");

  return (
    <article className="gs-step-card">
      <div className="gs-step-top">
        <span className="gs-step-number" aria-hidden="true">
          {number}
        </span>

        <div className="gs-step-icon" aria-hidden="true">
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>

      <div className="gs-step-content">
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </div>

      <Link to={step.to} className="gs-step-link">
        <span>{step.actionLabel}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

function SupportCallout() {
  return (
    <section className="gs-help" aria-labelledby="support-title">
      <div className="gs-help-icon" aria-hidden="true">
        <CircleHelp size={20} />
      </div>

      <div className="gs-help-content">
        <p>Need a hand?</p>
        <h2 id="support-title">{SUPPORT.title}</h2>
      </div>

      <Link to={SUPPORT.to} className="gs-help-link">
        <FileCheck2 size={16} aria-hidden="true" />
        <span>{SUPPORT.actionLabel}</span>
      </Link>
    </section>
  );
}

export default function GetStarted() {
  const { userInfo } = useContext(UserContext);
  const firstName = getFirstName(userInfo) || "there";

  return (
    <main className="gs">
      <OnboardingHero
        firstName={firstName}
        firstStep={SETUP_STEPS[0]}
      />

      <SetupSteps />

      <SupportCallout />
    </main>
  );
}

