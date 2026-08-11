import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  GraduationCap,
  Landmark,
  Play,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/LandingPage.css";

const modules = [
  {
    icon: Landmark,
    label: "Operations",
    title: "Every school decision, in one clear view.",
    text: "Admissions, attendance, people and reporting move together, so your team can spend less time reconciling spreadsheets.",
    tone: "coral",
  },
  {
    icon: WalletCards,
    label: "Finance",
    title: "A healthier cashflow for the whole community.",
    text: "Collect fees with less friction, give families flexible options, and see what is happening before it becomes urgent.",
    tone: "mint",
  },
  {
    icon: GraduationCap,
    label: "Learning",
    title: "Make progress visible to every learner.",
    text: "Give teachers useful signals and students a more personal path from today's lesson to their next breakthrough.",
    tone: "blue",
  },
];

function ProductPreview() {
  return (
    <div className="landing-preview" aria-label="Nuvora school operations dashboard preview">
      <div className="landing-preview-topbar">
        <div className="preview-brand"><span />Nuvora OS</div>
        <div className="preview-top-actions"><span /> <span /> <b>AD</b></div>
      </div>
      <div className="landing-preview-body">
        <aside className="preview-sidebar">
          <div className="preview-sidebar-mark"><Sparkles size={15} /></div>
          <i /><i /><i /><i /><i />
        </aside>
        <div className="preview-content">
          <div className="preview-heading">
            <div><small>MONDAY, 10 FEBRUARY 2025</small><h3>Good morning, Admin.</h3></div>
            <span>2024/2025 Session</span>
          </div>
          <div className="preview-stats">
            <div><small>COLLECTED THIS TERM</small><strong>₦48.6m</strong><em>+12.8%</em></div>
            <div><small>STUDENT ATTENDANCE</small><strong>94.8%</strong><em>+4.2%</em></div>
            <div><small>ACTIVE LEARNERS</small><strong>2,841</strong><em>+8.4%</em></div>
          </div>
          <div className="preview-lower">
            <div className="preview-chart"><div className="preview-line" /><div className="chart-labels"><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span></div></div>
            <div className="preview-feed"><strong>Latest activity</strong><p><BellRing size={13} /> 42 fee reminders sent</p><p><Check size={13} /> 18 admissions approved</p><p><BarChart3 size={13} /> Weekly report ready</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" id="home-section-1">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><span /> The school operating system for what comes next</div>
          <h1>Give your school <em>room to grow.</em></h1>
          <p className="landing-hero-text">Nuvora brings operations, finance, and learning into one beautifully calm workspace for ambitious schools.</p>
          <div className="landing-actions">
            <NavLink to="/get-started" className="landing-button landing-button-primary">See Nuvora in action <ArrowRight size={17} /></NavLink>
            <a href="#platform" className="landing-button landing-button-quiet"><span className="play-icon"><Play size={13} fill="currentColor" /></span> Explore the platform</a>
          </div>
          <div className="landing-proof"><ShieldCheck size={16} /><span>Built for Nigerian schools</span><i /><span>No implementation theatre</span></div>
        </div>
        <div className="landing-hero-art"><div className="art-orbit art-orbit-one" /><div className="art-orbit art-orbit-two" /><ProductPreview /><div className="art-note art-note-top"><span className="art-note-icon"><WalletCards size={16} /></span><div><b>Fees are moving</b><small>+18.4% this month</small></div></div><div className="art-note art-note-bottom"><span className="art-avatar">JM</span><div><b>Joyce Mensah</b><small>Attendance is up today</small></div><Check size={16} /></div></div>
      </section>

      <section className="landing-trust" aria-label="Nuvora benefits"><p>One operating rhythm for the whole school</p><div><span>Admissions</span><span>Finance</span><span>Academics</span><span>People</span><span>Communication</span></div></section>

      <section className="landing-platform" id="platform">
        <div className="landing-section-intro"><div className="landing-eyebrow"><span /> A better everyday system</div><h2>Less admin noise.<br /><em>More school momentum.</em></h2><p>Good software should make a complex school feel legible. Nuvora gives every team the context to act with confidence.</p></div>
        <div className="landing-module-grid">{modules.map(({ icon: Icon, label, title, text, tone }) => <article className={`landing-module landing-module-${tone}`} key={label}><div className="module-icon"><Icon size={20} /></div><small>{label}</small><h3>{title}</h3><p>{text}</p><NavLink to="/solutions">Discover module <ArrowRight size={15} /></NavLink></article>)}</div>
      </section>

      <section className="landing-quote"><div className="quote-mark">“</div><blockquote>Nuvora helps us see the whole school at once, without making the work feel bigger than it is.</blockquote><div className="quote-person"><span>AO</span><div><b>Amaka Okafor</b><small>School administrator, Lagos</small></div></div></section>

      <section className="landing-final"><div><div className="landing-eyebrow"><span /> Start with a clearer Monday</div><h2>Your next chapter<br /><em>starts here.</em></h2></div><NavLink to="/get-started" className="landing-button landing-button-dark">Talk to Nuvora <ArrowRight size={17} /></NavLink></section>
    </main>
  );
}
