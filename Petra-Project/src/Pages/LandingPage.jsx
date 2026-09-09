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

const outcomes = [
  { value: "One workspace", label: "Coordinate school operations", note: "Bring people, classes, sessions, and setup into one place." },
  { value: "Clear finance", label: "Follow fees and payments", note: "Track invoices, receipts, wallets, and collections with context." },
  { value: "Visible progress", label: "Support better learning", note: "Connect attendance, assessments, results, and report cards." },
  { value: "Shared context", label: "Keep families informed", note: "Give staff, parents, and students the workflows they need." },
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

const securityPoints = [
  { icon: Lock, title: "Protected access", text: "Authentication and role-aware access keep school data behind the right boundaries." },
  { icon: Shield, title: "School-aware workflows", text: "Tenant context and resource authorization help keep each school's records separate." },
  { icon: Server, title: "Structured data", text: "Academic, finance, admissions, and communication workflows are handled through the API." },
  { icon: CreditCard, title: "Payment integrations", text: "Paystack payment flows and webhooks are handled through dedicated backend routes." },
];

const faqs = [
  {
    q: "What can Nuvora help our school coordinate?",
    a: "Nuvora brings together school setup, students and admissions, academics, finance, communication, parent workflows, and platform administration.",
  },
  {
    q: "Do parents need to download an app?",
    a: "No. Nuvora works entirely in the browser on any phone. There is an optional native app for parents who prefer it, but nothing is locked behind a download.",
  },
  {
    q: "Does Nuvora support different school roles?",
    a: "Yes. The application includes role-specific experiences for school leaders, staff, teachers, parents, students, and platform administrators.",
  },
  {
    q: "Can Nuvora connect to payment workflows?",
    a: "Yes. The platform includes payment-provider routes and finance workflows for fees, invoices, payments, receipts, wallets, and related records.",
  },
  {
    q: "Where can I learn more about the product?",
    a: "Use the Solutions menu to explore focused workflows, or choose Get Started to enter the product journey.",
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
            <div><small>NUVORA SCHOOL WORKSPACE</small><h3>Good morning, Admin.</h3></div>
            <span>Product preview</span>
          </div>
          <div className="preview-stats">
            <div><small>ADMISSIONS</small><strong>Review</strong><em>Applications</em></div>
            <div><small>ACADEMICS</small><strong>Track</strong><em>Attendance</em></div>
            <div><small>FINANCE</small><strong>Manage</strong><em>Collections</em></div>
          </div>
          <div className="preview-lower">
            <div className="preview-chart"><div className="preview-line" /><div className="chart-labels"><span>SETUP</span><span>PEOPLE</span><span>LEARNING</span><span>FINANCE</span></div></div>
            <div className="preview-feed"><strong>One clear view</strong><p><BellRing size={13} /> Fee collection status</p><p><Check size={13} /> Attendance trends</p><p><BarChart3 size={13} /> Reports and results</p></div>
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
              <NavLink to="/solution">Explore solutions <ArrowRight size={15} /></NavLink>
            </article>
          ))}
        </div>
      </section>

      {/* ========== PROBLEM TO SOLUTION ========== */}
      <section className="landing-impact">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> From fragmented work to one workspace</div>
          <h2>Less chasing. <em>More clarity.</em></h2>
          <p>Schools often split daily work across spreadsheets, messages, payment records, and disconnected academic tools. Nuvora brings the core workflows together so teams can act from shared context.</p>
        </div>
        <div className="landing-impact-grid">
          {outcomes.map((stat) => (
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

      {/* ========== PRODUCT BENEFIT ========== */}
      <section className="landing-quote">
        <div className="quote-mark" aria-hidden="true">+</div>
        <blockquote>One operating rhythm for the whole school, from the first setup task to the daily work that keeps learning moving.</blockquote>
        <div className="quote-person"><span>NV</span><div><b>Built around school workflows</b><small>Operations, finance, academics, and communication in one product.</small></div></div>
      </section>

      {/* ========== HOW IT WORKS (NEW) ========== */}
      <section className="landing-workflow">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> A straightforward way to begin</div>
          <h2>Start with <em>the work.</em></h2>
          <p>Set up the school context, organize the people and records that matter, then use the workflows your team needs every day.</p>
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

      {/* ========== PRODUCT FIT ========== */}
      <section className="landing-testimonials">
        <div className="landing-section-intro">
          <div className="landing-eyebrow"><span /> One platform, many roles</div>
          <h2>Everyone sees <em>their next step.</em></h2>
          <p>School leaders, administrators, teachers, parents, and students each get a clearer path through the work that belongs to them.</p>
        </div>
        <div className="landing-testimonial-grid">
          {personas.slice(0, 3).map(({ icon: Icon, role, title, text }) => (
            <article className="landing-testimonial" key={role}>
              <div className="testimonial-mark"><Icon size={18} /></div>
              <blockquote>{title}</blockquote>
              <p>{text}</p>
              <small>{role}</small>
            </article>
          ))}
        </div>
      </section>

      {/* ========== SECURITY (NEW) ========== */}
      <section className="landing-security">
        <div className="landing-security-copy">
          <div className="landing-eyebrow"><span /> Trust, engineered</div>
          <h2>Your school's data is <em>sacred.</em></h2>
          <p>We treat every record — from a child's report card to a parent's card token — with the seriousness it deserves. No shortcuts, no compromises.</p>
          <NavLink to="/contact" className="landing-button landing-button-quiet">Ask about security <ArrowRight size={15} /></NavLink>
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