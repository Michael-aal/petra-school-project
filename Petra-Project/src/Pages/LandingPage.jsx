import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  School,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/LandingPage.css";

const features = [
  { icon: LayoutDashboard, title: "One school workspace", text: "Bring admissions, students, staff, academics, finance and communication into one connected system." },
  { icon: Users, title: "Every role connected", text: "Give administrators, teachers, parents and students the right information without exposing what they should not see." },
  { icon: CreditCard, title: "School fees made clearer", text: "Track invoices, payments, extra fees and financial activity without losing the story behind each transaction." },
  { icon: ClipboardCheck, title: "Assessments & results", text: "Run assessments, capture scores and move from classroom activity to polished reports with less manual work." },
  { icon: Bell, title: "Communication that moves", text: "Announcements, messages and important school updates stay close to the people who need them." },
  { icon: BookOpen, title: "Learning resources", text: "Create a richer learning experience with notes, digital resources, study spaces and a growing school library." },
  { icon: BarChart3, title: "See what is happening", text: "Turn everyday school activity into useful dashboards and summaries for faster decisions." },
  { icon: ShieldCheck, title: "Designed around trust", text: "Role-aware access and secure workflows help keep school records organized and protected." },
];

const roles = [
  { icon: School, title: "For school leaders", text: "See the whole school without jumping between disconnected systems.", points: ["Operations at a glance", "Finance visibility", "Staff and student management"] },
  { icon: GraduationCap, title: "For teachers", text: "Spend more energy teaching and less time fighting paperwork.", points: ["Attendance and classes", "Assessments and results", "Announcements and resources"] },
  { icon: Users, title: "For parents", text: "Give families a simple window into the school day.", points: ["Results and report cards", "Fees and payment history", "School notices and messages"] },
  { icon: BookOpen, title: "For students", text: "Make the school experience feel connected from the classroom to home.", points: ["Learning resources", "Schedules and assessments", "Academic progress"] },
];

const journey = [
  ["01", "Start with your school", "Create your school profile and establish the structure your people already understand."],
  ["02", "Connect your people", "Set up the right roles for administrators, staff, teachers, parents and students."],
  ["03", "Run the school day", "Handle attendance, academics, communication, admissions and finance from connected workflows."],
  ["04", "Learn from the data", "Use reports and dashboards to understand what needs attention and what is working."],
];

function FloatingBook({ className = "", label }) {
  return (
    <div className={`floating-book ${className}`} aria-hidden="true">
      <BookOpen size={30} />
      <span>{label}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero landing-anchor" id="home">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="landing-hero-copy">
          <div className="landing-badge">
            <Sparkles size={14} />
            <span>The connected school platform</span>
          </div>

          <h1>School should feel <span>connected.</span></h1>
          <p className="landing-text">
            Petra brings the people, learning, operations and everyday moments of a school into one beautifully connected digital experience.
          </p>

          <div className="landing-actions">
            <NavLink to="/get-started" className="landing-button landing-button-primary">
              Start your school
              <ArrowRight size={17} />
            </NavLink>
            <a href="#platform" className="landing-button landing-button-secondary">
              Explore Petra
            </a>
          </div>

          <div className="hero-proof-row">
            <span><Check size={15} /> Built for schools</span>
            <span><Check size={15} /> Mobile friendly</span>
            <span><Check size={15} /> Role-aware</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Petra school platform preview">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <FloatingBook className="book-one" label="Library" />
          <FloatingBook className="book-two" label="Results" />
          <FloatingBook className="book-three" label="Learning" />

          <div className="hero-dashboard">
            <div className="hero-dashboard-top">
              <div className="mini-brand"><span className="brand-mark">P</span><span>Petra</span></div>
              <div className="mini-user"><span className="mini-avatar">AO</span><span>Good morning</span></div>
            </div>
            <div className="hero-dashboard-heading">
              <div><small>Monday · School overview</small><h3>Your school at a glance</h3></div>
              <span className="live-status"><i /> Live</span>
            </div>
            <div className="hero-stat-grid">
              <div><Users size={16} /><strong>1,248</strong><span>Students</span></div>
              <div><GraduationCap size={16} /><strong>86</strong><span>Teachers</span></div>
              <div><BarChart3 size={16} /><strong>96%</strong><span>Attendance</span></div>
            </div>
            <div className="hero-dashboard-body">
              <div className="activity-card">
                <div className="activity-title"><span>School activity</span><span>This week</span></div>
                <div className="fake-chart">
                  <i style={{ height: "42%" }} /><i style={{ height: "62%" }} /><i style={{ height: "54%" }} /><i style={{ height: "78%" }} /><i style={{ height: "70%" }} /><i style={{ height: "92%" }} /><i style={{ height: "82%" }} />
                </div>
              </div>
              <div className="updates-card">
                <div className="activity-title"><span>Updates</span><span>3 new</span></div>
                <p><b>Results published</b><span>SS2 Mathematics</span></p>
                <p><b>Fee payment received</b><span>Invoice #2048</span></p>
                <p><b>New announcement</b><span>Parent meeting</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-story-strip">
        <div><strong>One platform.</strong><span>One shared view of the school.</span></div>
        <div><strong>Four connected roles.</strong><span>Different needs, one experience.</span></div>
        <div><strong>Every school day.</strong><span>From first bell to final report.</span></div>
      </section>

      <section className="landing-section intro-section landing-anchor" id="platform">
        <div className="section-header centered">
          <p className="landing-kicker">The Petra idea</p>
          <h2 className="section-title">The school is more than a collection of spreadsheets.</h2>
          <p className="section-lead">
            It is people, conversations, lessons, payments, results, questions and small moments happening at the same time. Petra gives all of that a place to connect.
          </p>
        </div>
        <div className="story-grid">
          <article className="story-card story-card-blue">
            <span className="story-number">01</span>
            <h3>See the whole picture</h3>
            <p>Leadership gets a clearer view of what is happening across academics, people, finance and daily operations.</p>
            <div className="story-line"><BarChart3 size={18} /><span>Connected school intelligence</span></div>
          </article>
          <article className="story-card story-card-light">
            <span className="story-number">02</span>
            <h3>Keep people in sync</h3>
            <p>Teachers, parents and students can stay close to the information that matters to them without unnecessary noise.</p>
            <div className="story-line"><MessageCircle size={18} /><span>Communication that feels human</span></div>
          </article>
          <article className="story-card story-card-dark">
            <span className="story-number">03</span>
            <h3>Make progress visible</h3>
            <p>From attendance to assessments, Petra turns school activity into useful signals that help people act sooner.</p>
            <div className="story-line"><Sparkles size={18} /><span>Progress you can understand</span></div>
          </article>
        </div>
      </section>

      <section className="landing-section feature-section landing-anchor" id="features">
        <div className="section-header">
          <p className="landing-kicker">Everything connected</p>
          <h2 className="section-title">The tools your school uses, finally telling the same story.</h2>
          <p className="section-lead">Petra is designed as a connected school operating experience, not a pile of separate tools.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={21} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-arrow"><ChevronRight size={17} /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section role-section landing-anchor" id="roles">
        <div className="section-header centered">
          <p className="landing-kicker">Made for everyone</p>
          <h2 className="section-title">Different people. One school experience.</h2>
          <p className="section-lead">Every role gets a focused experience while the school keeps one connected source of truth.</p>
        </div>
        <div className="role-grid">
          {roles.map(({ icon: Icon, title, text, points }) => (
            <article className="role-card" key={title}>
              <div className="role-icon"><Icon size={23} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <ul>{points.map((point) => <li key={point}><Check size={15} />{point}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-blue-break">
        <div className="blue-break-copy">
          <p className="landing-kicker">Learning comes alive</p>
          <h2>Let the digital school feel as alive as the real one.</h2>
          <p>Resources can move from a quiet library to a student's screen. Results can travel from teacher to parent. A notice can reach a whole school in seconds.</p>
          <a href="#learning" className="white-outline-button">See the learning experience <ArrowRight size={16} /></a>
        </div>
        <div className="blue-break-books" id="learning">
          <FloatingBook className="break-book-a" label="Science" />
          <FloatingBook className="break-book-b" label="Mathematics" />
          <FloatingBook className="break-book-c" label="English" />
          <FloatingBook className="break-book-d" label="Library" />
          <div className="learning-sphere"><BookOpen size={58} /><span>Learning Hub</span><small>Read · Learn · Grow</small></div>
        </div>
      </section>

      <section className="landing-section journey-section landing-anchor" id="how-it-works">
        <div className="section-header centered">
          <p className="landing-kicker">How Petra fits in</p>
          <h2 className="section-title">From setup to everyday school life.</h2>
        </div>
        <div className="journey-grid">
          {journey.map(([number, title, text]) => (
            <article className="journey-card" key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section dashboard-story-section">
        <div className="dashboard-story">
          <div className="dashboard-story-copy">
            <p className="landing-kicker">A calmer school day</p>
            <h2>Less hunting for information. More time doing the work that matters.</h2>
            <p>Petra keeps important school workflows close together, so a teacher can teach, a parent can stay informed and an administrator can make decisions without stitching together five different systems.</p>
            <div className="check-list">
              <span><Check size={17} /> Clear role-based experiences</span>
              <span><Check size={17} /> Responsive on phones and computers</span>
              <span><Check size={17} /> Connected academic and finance workflows</span>
              <span><Check size={17} /> Built to grow with the school</span>
            </div>
          </div>
          <div className="workflow-window">
            <div className="window-top"><span /><span /><span /><b>Petra workspace</b></div>
            <div className="workflow-layout">
              <aside><div className="side-logo">P</div><i /><i /><i /><i /><i /></aside>
              <div className="workflow-main">
                <small>Monday, 18 September</small><h3>Good morning, Administrator</h3>
                <div className="workflow-cards"><div /><div /><div /></div>
                <div className="workflow-table"><span /><span /><span /><span /><span /><span /><span /><span /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section trust-section">
        <div className="trust-panel">
          <div className="trust-icon"><ShieldCheck size={28} /></div>
          <div>
            <p className="landing-kicker">Built with responsibility</p>
            <h2>Your school's information deserves a careful home.</h2>
            <p>Petra's experiences are built around role-aware access, clear workflows and the principle that people should see the information they are authorized to use.</p>
          </div>
          <div className="trust-points"><span><Check size={15} /> Role-aware access</span><span><Check size={15} /> Secure workflows</span><span><Check size={15} /> Clear audit trails</span></div>
        </div>
      </section>

      <section className="landing-section pulse-section landing-anchor" id="school-life">
        <div className="section-header">
          <p className="landing-kicker">School life, in motion</p>
          <h2 className="section-title">A living view of what is happening across your school.</h2>
          <p className="section-lead">Instead of making people hunt through menus, Petra brings important moments into a clear, familiar flow — like a school day that keeps moving.</p>
        </div>
        <div className="pulse-layout">
          <div className="pulse-feed">
            <article className="pulse-post">
              <div className="pulse-avatar">A</div>
              <div className="pulse-post-body">
                <div className="pulse-meta"><strong>Academic Office</strong><span>Today · 9:42 AM</span></div>
                <h3>Mathematics results are ready</h3>
                <p>SS2 assessment results have been published. Teachers and authorized families can now review the latest academic update.</p>
                <div className="pulse-actions"><span><BarChart3 size={15}/> Results</span><span><MessageCircle size={15}/> Updates</span><span><Check size={15}/> Published</span></div>
              </div>
            </article>
            <article className="pulse-post">
              <div className="pulse-avatar pulse-avatar-soft">L</div>
              <div className="pulse-post-body">
                <div className="pulse-meta"><strong>School Library</strong><span>Yesterday · 2:18 PM</span></div>
                <h3>New learning resources arrived</h3>
                <p>Books, study notes and digital resources can be organized into one learning space students can return to whenever they need them.</p>
                <div className="pulse-book-row"><FloatingBook label="Biology"/><FloatingBook label="Physics"/><FloatingBook label="English"/></div>
              </div>
            </article>
          </div>
          <aside className="pulse-side">
            <div className="pulse-side-card">
              <span className="pulse-side-label">TODAY AT A GLANCE</span>
              <strong>School is moving.</strong>
              <div className="pulse-metric"><span>Attendance</span><b>96%</b></div>
              <div className="pulse-meter"><i style={{width:"96%"}}/></div>
              <div className="pulse-metric"><span>Published results</span><b>24</b></div>
              <div className="pulse-metric"><span>Active resources</span><b>318</b></div>
            </div>
            <div className="pulse-side-card pulse-side-blue">
              <Sparkles size={22}/>
              <strong>Small moments add up.</strong>
              <p>Petra connects them so the people responsible can act without losing context.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="landing-section library-section landing-anchor" id="library">
        <div className="library-copy">
          <p className="landing-kicker">The digital library</p>
          <h2>Books should not just sit on a shelf.</h2>
          <p>They can move, invite curiosity and make learning feel active. Petra gives your school a place to organize resources while playful motion makes the experience feel alive.</p>
        </div>
        <div className="library-stage" aria-hidden="true">
          <div className="book-stack">
            <FloatingBook className="stack-book stack-one" label="Mathematics"/>
            <FloatingBook className="stack-book stack-two" label="Computer Science"/>
            <FloatingBook className="stack-book stack-three" label="Literature"/>
            <FloatingBook className="stack-book stack-four" label="Physics"/>
          </div>
          <div className="library-orbit library-orbit-one"/>
          <div className="library-orbit library-orbit-two"/>
          <div className="library-label"><BookOpen size={20}/><span>Petra Library</span></div>
        </div>
      </section>

      <section className="landing-section numbers-section">
        <div className="numbers-grid">
          <div><strong>01</strong><span>Connected workspace</span><p>Admissions, academics, finance and communication in one school experience.</p></div>
          <div><strong>04</strong><span>Core roles</span><p>Focused experiences for leaders, teachers, parents and students.</p></div>
          <div><strong>24/7</strong><span>Access to information</span><p>Responsive experiences that keep important school information close.</p></div>
          <div><strong>∞</strong><span>Room to grow</span><p>A modular platform designed to expand as your school's needs evolve.</p></div>
        </div>
      </section>

      <section className="landing-section faq-section landing-anchor" id="faq">
        <div className="section-header centered">
          <p className="landing-kicker">Questions, answered</p>
          <h2 className="section-title">A few things worth knowing.</h2>
        </div>
        <div className="faq-grid">
          <details open><summary>Who is Petra for?</summary><p>Petra is designed for schools and the people around them: administrators, teachers, parents and students.</p></details>
          <details><summary>Does Petra work on phones?</summary><p>Yes. The public experience and the school workflows are designed to remain useful on smaller screens, with mobile navigation and responsive layouts.</p></details>
          <details><summary>Can different roles see different things?</summary><p>Yes. The platform is built around role-aware experiences so each person can work with the parts of the school they are responsible for.</p></details>
          <details><summary>Can Petra grow with a school?</summary><p>The platform is structured around connected modules, making it possible to expand school operations without replacing the entire system.</p></details>
        </div>
      </section>

      <section className="landing-cta landing-anchor" id="get-started">
        <div>
          <p className="landing-kicker">The next school day starts here.</p>
          <h2>Build a school experience people actually enjoy using.</h2>
          <p className="cta-subtext">Bring your school into one connected space with Petra.</p>
        </div>
        <div className="cta-actions">
          <NavLink to="/get-started" className="landing-button landing-button-white">Get started <ArrowRight size={17} /></NavLink>
          <NavLink to="/signin" className="landing-button landing-button-ghost">Sign in</NavLink>
        </div>
      </section>
    </main>
  );
}
