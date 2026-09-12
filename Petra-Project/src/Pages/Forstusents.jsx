import { 
  GraduationCap, 
  BrainCircuit, 
  Target, 
  CalendarClock, 
  Award, 
  Clock, 
  CircleCheck, 
  ArrowRight, 
  Shield, 
  BookOpen 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const studentFeatures = [
  {
    icon: BrainCircuit,
    title: "AI Study Assistant",
    info: "Get instant, step-by-step explanations for complex problems in math, science, and humanities whenever you get stuck.",
    to: "AI Tutor",
  },
  {
    icon: Target,
    title: "Exam Practice & Prep",
    info: "Practice with curated past questions and track your performance to pinpoint weak areas before test day.",
    to: "Exams",
  },
  {
    icon: CalendarClock,
    title: "Timetable & Schedule",
    info: "Organize your class schedule, homework deadlines, and term results in one clear, distraction-free dashboard.",
    to: "Dashboard",
  },
];

const studentHighlights = [
  { 
    icon: Award, 
    title: "Track Your Progress", 
    info: "Set learning goals and monitor your term-by-term academic growth to stay motivated throughout the year." 
  },
  { 
    icon: Clock, 
    title: "Stay Organized", 
    info: "Manage class schedules, assignments, and deadlines from one clean workspace without the clutter." 
  },
  { 
    icon: BookOpen, 
    title: "Learn at Your Pace", 
    info: "Access study materials, past questions, and AI explanations whenever you need them, on any device." 
  },
  { 
    icon: GraduationCap, 
    title: "School-Synced Content", 
    info: "Your timetable, notices, and academic records are automatically synced with your school portal." 
  },
];

export default function ForStudents() {
  return (
    <main className="marketing-page fparent">
      
      {/* HERO SECTION */}
      <section className="marketing-header">
        <span className="marketing-badge">
          <GraduationCap size={15} /> FOR STUDENTS
        </span>
        
        <h1 className="marketing-title">
          Study Smarter and Ace Your <br />
          <span>Exams with Nuvora</span>
        </h1>
        
        <p className="marketing-description">
          Staying on top of schoolwork shouldn't be overwhelming. 
          Nuvora gives students AI-powered study help, exam practice, and smart scheduling in one place.
        </p>
        
        <div className="marketing-actions">
          <NavLink to="/register/student" className="marketing-btn marketing-btn-primary">
            Start Learning for Free <ArrowRight size={16} />
          </NavLink>
          <NavLink to="/solution" className="marketing-btn marketing-btn-secondary">
            Explore Solutions
          </NavLink>
        </div>

        {/* Feature Assurances */}
        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <BrainCircuit size={15} />
            <span>AI-Powered Explanations</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Shield size={15} />
            <span>Safe & Ad-Free Environment</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <CircleCheck size={15} />
            <span>Synced with School Portal</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="marketing-section">
        <div className="section-intro">
          <p className="landing-kicker">Student Tools</p>
          <h2>Designed for focus and effective learning.</h2>
        </div>

        <div className="feature-grid">
          {studentFeatures.map(({ icon: Icon, title, info, to }) => (
            <article className="marketing-card" key={title}>
              <div className="marketing-card-icon">
                <Icon size={22} />
              </div>
              
              <h3 className="marketing-card-title">{title}</h3>
              <p className="marketing-card-text">{info}</p>
              
              <NavLink to="/solution" className="marketing-card-link">
                Explore {to} <ArrowRight size={14} />
              </NavLink>
            </article>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS SECTION */}
      <section className="marketing-section marketing-highlight-section">
        <div className="section-intro">
          <p className="landing-kicker">Smart Studying</p>
          <h2>Built for the Modern Student</h2>
          <p className="section-subtext">We bring together the tools you need so you can focus on learning and performing your best.</p>
        </div>
        
        <div className="feature-grid highlight-grid">
          {studentHighlights.map(({ icon: Icon, title, info }) => (
            <div className="marketing-card highlight-card" key={title}>
              <div className="marketing-card-icon highlight-icon">
                <Icon size={20} />
              </div>
              <h3 className="marketing-card-title">{title}</h3>
              <p className="marketing-card-text">{info}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="marketing-section marketing-cta fparent-cta">
        <div className="cta-badge">
          <GraduationCap size={16} />
          <span>Built for student success</span>
        </div>
        <h2 className="marketing-cta-title">Your Academics, In One Clear View</h2>
        <p className="marketing-cta-text">
          Create your student account to access AI study help, track exam preparation, and stay organized throughout the academic year.
        </p>
        <div className="marketing-actions">
          <NavLink to="/register/student" className="marketing-btn marketing-btn-primary cta-btn">
            Create Free Student Account <ArrowRight size={16} />
          </NavLink>
        </div>
      </section>

    </main>
  );
}

