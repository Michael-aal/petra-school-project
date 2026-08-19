import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  Heart,
  Landmark,
  Lock,
  MessageSquare,
  Play,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Zap,
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

const impactStats = [
  { value: "4.2x", label: "Faster fee collection", note: "vs. manual reconciliation" },
  { value: "94%", label: "Parent engagement rate", note: "across active schools" },
  { value: "18hrs", label: "Saved per week", note: "per administrator" },
  { value: "99.9%", label: "Platform uptime", note: "bank-grade reliability" },
];

const personas = [
  {
    icon: Landmark,
    role: "School Owners",
    title: "See the whole picture.",
    text: "One dashboard for every school you run. Cashflow, compliance and growth, without chasing reports.",
    tone: "coral",
  },
  {
    icon: BookOpen,
    role: "Administrators",
    title: "Less paperwork, more presence.",
    text: "Automate the repetitive. Approve admissions, send reminders, and close the term with confidence.",
    tone: "mint",
  },
  {
    icon: GraduationCap,
    role: "Teachers",
    title: "Teach, don't administer.",
    text: "Take attendance in seconds, enter results cleanly, and message parents without leaving your lesson plan.",
    tone: "blue",
  },
  {
    icon: Heart,
    role: "Parents",
    title: "Stay close without hovering.",
    text: "Pay fees, track attendance, read teacher notes and celebrate progress — all from one calm pocket-sized app.",
    tone: "paper",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Import your school in minutes.",
    text: "Bring in your students, staff and classes from a spreadsheet. Nuvora maps everything for you — no IT team required.",
    icon: Server,
  },
  {
    step: "02",
    title: "Invite your community.",
    text: "Send one link. Teachers, parents and students land in their own calm workspace, ready to go from day one.",
    icon: Users,
  },
  {
    step: "03",
    title: "Run your school on autopilot.",
    text: "Fees collected. Reminders sent. Reports generated. You just watch the momentum build, term after term.",
    icon: Zap,
  },
];

const testimonials = [
  {
    quote: "We used to chase fees for weeks. Now parents pay before we even send the reminder.",
    name: "Chioma Eze",
    role: "Bursar, Riverside Academy",
    initials: "CE",
  },
  {
    quote: "My teachers finally have time to teach. The admin work just… disappears into Nuvora.",
    name: "Dr. Ibrahim Musa",
    role: "Principal, Greenfield College",
    initials: "IM",
  },
  {
    quote: "As a parent of three, seeing everything in one place has genuinely changed our mornings.",
    name: "Funke Adeyemi",
    role: "Parent, Lagos",
    initials: "FA",
  },
];

const securityPoints = [
  { icon: Lock, title: "End-to-end encryption", text: "Every record, every payment, every message is encrypted in transit and at rest." },
  { icon: Shield, title: "NDPR compliant", text: "Built from the ground up to meet Nigerian data protection standards." },
  { icon: Server, title: "Daily encrypted backups", text: "Your school's data is mirrored across three geographically separate servers." },
  { icon: CreditCard, title: "PCI-DSS payments", text: "Card data never touches our servers — Paystack handles it all." },
];

const faqs = [
  {
    q: "How long does it take to set up Nuvora?",
    a: "Most schools are fully operational within 48 hours. Our onboarding team imports your data, configures your sessions, and trains your staff — so you can go live before the next Monday.",
  },
  {
    q: "Do parents need to download an app?",
    a: "No. Nuvora works entirely in the browser on any phone. There is an optional native app for parents who prefer it, but nothing is locked behind a download.",
  },
  {
    q: "Can we use Nuvora alongside our existing tools?",
    a: "Yes. Nuvora integrates with Paystack, Flutterwave, WhatsApp, and common accounting tools. We also offer a full API for custom integrations.",
  },
  {
    q: "What happens to our data if we stop using Nuvora?",
    a: "Your data is yours. You can export every record — students, payments, results — in open formats at any time. No lock-in, ever.",
  },
  {
    q: "Is there a contract or minimum term?",
    a: "No. Nuvora is billed term-by-term. You can pause or cancel between terms with zero penalties.",
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

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`landing-faq-item ${open ? "open" : ""}`}>
      <button className="landing-faq-trigger" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <ChevronDown size={18} />
      </button>
      {open && <div className="landing-faq-answer"><p>{a}</p></div>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      {/* ========== HERO ========== */}
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

      {/* ========== TRUST BAR ========== */}
      <section className="landing-trust" aria-label="Nuvora benefits">
        <p>One operating rhythm for the whole school</p>
        <div><span>Admissions</span><span>Finance</span><span>Academics</span><span>People</span><span>Communication</span></div>
      </section>

      {/* ========== PLATFORM MODULES ========== */}
      <section className="landing-platform" id="platform">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> A better everyday system</div>
          <h2>Less admin noise.<br /><em>More school momentum.</em></h2>
          <p>Good software should make a complex school feel legible. Nuvora gives every team the context to act with confidence.</p>
        </div>
        <div className="landing-module-grid">
          {modules.map(({ icon: Icon, label, title, text, tone }) => (
            <article className={`landing-module landing-module-${tone}`} key={label}>
              <div className="module-icon"><Icon size={20} /></div>
              <small>{label}</small>
              <h3>{title}</h3>
              <p>{text}</p>
              <NavLink to="/solutions">Discover module <ArrowRight size={15} /></NavLink>
            </article>
          ))}
        </div>
      </section>

      {/* ========== IMPACT STATS (NEW) ========== */}
      <section className="landing-impact">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> The Nuvora difference</div>
          <h2>Numbers that <em>move schools forward.</em></h2>
          <p>Measured across every school running on Nuvora, term after term. These are not projections — they are the quiet results of a system that just works.</p>
        </div>
        <div className="landing-impact-grid">
          {impactStats.map((stat) => (
            <div className="landing-impact-card" key={stat.label}>
              <div className="impact-value">{stat.value}</div>
              <div className="impact-label">{stat.label}</div>
              <div className="impact-note">{stat.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== PERSONAS (NEW) ========== */}
      <section className="landing-personas">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> Built for everyone in the building</div>
          <h2>One system. <em>Four calm workdays.</em></h2>
          <p>Every role in your school gets a workspace shaped around what they actually do — not what an engineer assumed they do.</p>
        </div>
        <div className="landing-persona-grid">
          {personas.map(({ icon: Icon, role, title, text, tone }) => (
            <article className={`landing-persona landing-persona-${tone}`} key={role}>
              <div className="persona-icon"><Icon size={20} /></div>
              <small>{role}</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ========== FIRST TESTIMONIAL ========== */}
      <section className="landing-quote">
        <div className="quote-mark">"</div>
        <blockquote>Nuvora helps us see the whole school at once, without making the work feel bigger than it is.</blockquote>
        <div className="quote-person"><span>AO</span><div><b>Amaka Okafor</b><small>School administrator, Lagos</small></div></div>
      </section>

      {/* ========== HOW IT WORKS (NEW) ========== */}
      <section className="landing-workflow">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> From signup to momentum</div>
          <h2>Live in <em>48 hours.</em><br />Not 48 weeks.</h2>
          <p>Other platforms sell you a project. Nuvora gives you a Monday morning where everything just… works.</p>
        </div>
        <div className="landing-workflow-steps">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div className="landing-workflow-step" key={step.step}>
                <div className="workflow-step-number">{step.step}</div>
                <div className="workflow-step-icon"><Icon size={22} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== MORE TESTIMONIALS (NEW) ========== */}
      <section className="landing-testimonials">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> Loved by schools across Nigeria</div>
          <h2>Quiet confidence, <em>loud results.</em></h2>
        </div>
        <div className="landing-testimonial-grid">
          {testimonials.map((t) => (
            <figure className="landing-testimonial" key={t.name}>
              <div className="testimonial-mark">"</div>
              <blockquote>{t.quote}</blockquote>
              <figcaption>
                <span className="testimonial-avatar">{t.initials}</span>
                <div>
                  <b>{t.name}</b>
                  <small>{t.role}</small>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ========== SECURITY (NEW) ========== */}
      <section className="landing-security">
        <div className="landing-security-copy">
          <div className="landing-eyebrow"><span /> Trust, engineered</div>
          <h2>Your school's data is <em>sacred.</em></h2>
          <p>We treat every record — from a child's report card to a parent's card token — with the seriousness it deserves. No shortcuts, no compromises.</p>
          <NavLink to="/security" className="landing-button landing-button-quiet">Read our security whitepaper <ArrowRight size={15} /></NavLink>
        </div>
        <div className="landing-security-grid">
          {securityPoints.map(({ icon: Icon, title, text }) => (
            <div className="security-card" key={title}>
              <div className="security-icon"><Icon size={18} /></div>
              <div>
                <b>{title}</b>
                <small>{text}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FAQ (NEW) ========== */}
      <section className="landing-faq">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> Good questions</div>
          <h2>Everything you <em>wanted to ask.</em></h2>
          <p>Still curious? Our team answers questions every day on hello@nuvora.com.</p>
        </div>
        <div className="landing-faq-list">
          {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="landing-final">
        <div>
          <div className="landing-eyebrow"><span /> Start with a clearer Monday</div>
          <h2>Your next chapter<br /><em>starts here.</em></h2>
        </div>
        <NavLink to="/get-started" className="landing-button landing-button-dark">Talk to Nuvora <ArrowRight size={17} /></NavLink>
      </section>
    </main>
  );
}