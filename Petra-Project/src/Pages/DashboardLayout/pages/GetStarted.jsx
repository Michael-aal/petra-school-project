import { useContext } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck } from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import { getDisplayName } from "../../../utils/userProfile";
import "./page-styles/GetStarted.css";

export default function GetStarted() {
  const { userInfo } = useContext(UserContext);
  const displayName = getDisplayName(userInfo) || "User";
  const firstName = displayName.split(" ")[0];

  return (
    <main className="gs">
      <section className="gs-hero">
        <div className="gs-hero-content">
          <div>
            <p className="gs-hero-label">Welcome Back</p>
            <h1 className="gs-title">{firstName}</h1>
            <p className="gs-hero-copy">
              Welcome back {displayName}, please make sure you&apos;ve completed your setup for the term and enjoy the seamless experience.
            </p>
          </div>
          <div className="gs-hero-action">
            <Link to="/dashboard/setup/sessions" className="gs-button gs-button-accent">
              Setup Term
            </Link>
          </div>
        </div>
      </section>

      <section className="gs-panel">
        <div className="gs-panel-header">
          <div>
            <h2 className="gs-panel-title">Complete Business KYC</h2>
            <p className="gs-panel-copy">Finish these easy steps to get your school fully operational.</p>
          </div>
        </div>

        <div className="gs-card-grid">
          <article className="gs-card">
            <div className="gs-card-icon">
              <ShieldCheck size={24} />
            </div>
            <h3>Submit compliance documents</h3>
            <p>Upload all required business registration and verification documents.</p>
            <Link to="/dashboard/setup/profile" className="gs-card-button">
              Continue
            </Link>
          </article>

          <article className="gs-card">
            <div className="gs-card-icon">
              <FileText size={24} />
            </div>
            <h3>Setup withdrawal account</h3>
            <p>Configure your account and withdrawal frequency for payments.</p>
            <Link to="/dashboard/setup/sessions" className="gs-card-button">
              Continue
            </Link>
          </article>

          <article className="gs-card gs-card-highlight">
            <div className="gs-card-avatars">
              <span className="avatar avatar-one">O</span>
              <span className="avatar avatar-two">N</span>
              <span className="avatar avatar-three">M</span>
            </div>
            <p className="gs-card-highlight-label">Need help?</p>
            <h3>Contact support</h3>
            <p>Find answers to your questions and get in touch with our support staff.</p>
            <button type="button" className="gs-card-button gs-card-button-light">
              Get Support
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
