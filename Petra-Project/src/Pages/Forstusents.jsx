import {
  GraduationCap,
  ArrowRight,
  BrainCircuit,
  Sparkles,
  Target,
  CalendarClock,
  Trophy,
  Gamepad2,
  CheckCircle2,
  Zap,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const studentFeatures = [
  {
    logo: <BrainCircuit size={24} />,
    title: "Meet Your 24/7 AI Tutor",
    text: "Stuck on a calculus problem at 11 PM? Snap a photo or ask a question. Nuvora’s AI breaks down complex concepts into simple, easy-to-understand steps instantly.",
    color: "#8B5CF6", // Purple
    bgColor: "rgba(139, 92, 246, 0.1)",
    badgeIcon: <Sparkles size={18} />,
  },
  {
    logo: <Target size={24} />,
    title: "Crush WAEC, JAMB & Post-UTME",
    text: "Practice with thousands of past questions. Get real-time performance analytics to identify your weak spots and track your improvement before the big day.",
    color: "#06B6D4", // Cyan
    bgColor: "rgba(6, 182, 212, 0.1)",
    badgeIcon: <Zap size={18} />,
  },
  {
    logo: <CalendarClock size={24} />,
    title: "Master Your Academic Life",
    text: "Never miss a deadline again. Sync your class timetable, track assignments, and view your results in one beautiful, distraction-free dashboard.",
    color: "#3B82F6", // Blue
    bgColor: "rgba(59, 130, 246, 0.1)",
    badgeIcon: <CheckCircle2 size={18} />,
  },
  {
    logo: <Trophy size={24} />,
    title: "Make Learning Addictive",
    text: "Earn XP, unlock achievement badges, and challenge your classmates to the top of the leaderboard. Learning has never been this fun.",
    color: "#10B981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.1)",
    badgeIcon: <Gamepad2 size={18} />,
  },
];

export default function ForStudents() {
  return (
    <section className="fsu-section">
      
      {/* HERO SECTION */}
      <div className="fsu-hero">
        <div className="fsu-badge">
          <GraduationCap size={16} /> FOR STUDENTS
        </div>

        <h1 className="fsu-title">
          Experience the Future of <br /> Learning with <span>Nuvora</span>
        </h1>

        <p className="fsu-text">
          Stop struggling with tough subjects. Nuvora combines AI-powered tutoring, 
          smart scheduling, and gamified learning to help you ace your exams and 
          actually enjoy studying.
        </p>

        <div className="fsu-actions">
          <NavLink to="/register/student" className="fsu-btnPrimary">
            Start Learning for Free <ArrowRight size={18} />
          </NavLink>
          <NavLink to="/solution" className="fsu-btnSecondary">
            See How It Works
          </NavLink>
        </div>

        {/* NEW: Trust Bar to build credibility */}
        <div className="fsu-trust-bar">
          <div className="fsu-trust-item">
            <Users size={16} />
            <span>10,000+ Active Learners</span>
          </div>
          <div className="fsu-trust-divider" />
          <div className="fsu-trust-item">
            <CheckCircle2 size={16} />
            <span>Trusted by 50+ Schools</span>
          </div>
          <div className="fsu-trust-divider" />
          <div className="fsu-trust-item">
            <Trophy size={16} />
            <span>4.9/5 Student Rating</span>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="fsu-grid">
        {studentFeatures.map((item, index) => (
          <div className="fsu-card" key={index} style={{ '--card-accent': item.color }}>
            
            {/* Subtle background glow */}
            <div className="fsu-card-glow" style={{ background: item.bgColor }} />

            {/* Top Right Badge */}
            <div className="fsu-card-badge" style={{ background: item.bgColor, color: item.color }}>
              {item.badgeIcon}
            </div>

            {/* Icon */}
            <div className="fsu-card-icon" style={{ background: item.bgColor, color: item.color }}>
              {item.logo}
            </div>

            <h3 className="fsu-card-title">{item.title}</h3>
            <p className="fsu-card-text">{item.text}</p>

            <NavLink to="/register/student" className="fsu-card-link" style={{ color: item.color }}>
              Get Started <ArrowRight size={16} />
            </NavLink>
          </div>
        ))}
      </div>

      {/* FOOTER CTA */}
      <div className="fsu-footer">
        <div className="fsu-footer-card">
          <h2>Ready to upgrade your grades?</h2>
          <p>Join thousands of students already learning smarter, not harder, with Nuvora.</p>
          <NavLink to="/register/student" className="fsu-footer-btn">
            Join the Nuvora Waitlist <ArrowRight size={18} />
          </NavLink>
        </div>
      </div>

    </section>
  );
}