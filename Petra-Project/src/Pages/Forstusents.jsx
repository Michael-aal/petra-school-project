import {
  GraduationCap,
  ArrowRight,
  BrainCircuit,
  Sparkles,
  Target,
  CalendarClock,
  Trophy,
  Gamepad2
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css"

const studetFeature = [
  {
    logo: <Sparkles />,
    title: "Your Personal AI Tutor",
    text:
      "Stuck on a math problem? Need to understand chemistry concepts? Just snap a photo or ask a question. Your AI companion explains it instantly, 24/7.",
    to: "Try it now",
    toColor: "#9333EA",
    logo2: <ArrowRight />,
    logo3: <BrainCircuit />,
    logo3BgColor: "#F3E8FF",
    logo3Color: "#9333EA",
    svgColor: "#9333EA",
    topRight: "#A855F71A",
  },
  {
    logo: <Target />,
    title: "Crush WAEC & JAMB",
    text:
      "Practice with thousands of past questions. Get detailed performance analytics to know your weak spots before the D-day.",
    svgColor: "#06B6D4",
    topRight: "#06B6D41A",
  },
  {
    logo: <CalendarClock />,
    title: "Stay Organized",
    text:
      "View your timetable, check your results, and track your assignments. Never miss a deadline again.",
    svgColor: "#2563EB",
    topRight: "#2563EB1A",
  },
  {
    logo: <Trophy />,
    title: "Make Learning Fun",
    text:
      'Earn badges, climb the leaderboard, and challenge your friends in "School Wars" quizzes.',
    svgColor: "#16A34A",
    topRight: "#22C55E1A",
    logo3: <Gamepad2 />,
    logo3BgColor: "#DCFCE7",
    logo3Color: "#16A34A",
  },
];

export default function ForStudents() {
  return (
    <section className="fsu-section">

      {/* HERO */}
      <div className="fsu-hero">
        <h2 className="fsu-badge">
          <GraduationCap /> FOR STUDENTS
        </h2>

        <h3 className="fsu-title">
          Unlock Your True <span>Potential</span>
        </h3>

        <p className="fsu-text">
          School is hard enough. Acceede gives you the superpowers to learn faster,
          remember more, and ace every exam.
        </p>

        <div className="fsu-actions">
          <NavLink className="fsu-btnPrimary">
            Join the Waitlist <BrainCircuit />
          </NavLink>

          <NavLink className="fsu-btnSecondary">
            Start Practicing
          </NavLink>
        </div>
      </div>

      {/* CARDS */}
      <div className="fsu-grid">
        {studetFeature.map((item, index) => (
          <div className="fsu-card" key={index}>

            {/* glow background */}
            <div
              className="fsu-glow"
              style={{ backgroundColor: item.topRight }}
            />

            {/* icon */}
            <div
              className="fsu-icon"
              style={{
                backgroundColor: item.topRight,
                color: item.svgColor,
              }}
            >
              {item.logo}
            </div>

            <h3 className="fsu-cardTitle">{item.title}</h3>

            <p className="fsu-cardText">{item.text}</p>

            {/* CTA */}
            {item.to && (
              <NavLink
                className="fsu-link"
                style={{ color: item.toColor }}
              >
                {item.to} {item.logo2}
              </NavLink>
            )}

            {/* optional badge icon */}
            {item.logo3 && (
              <div
                className="fsu-badgeIcon"
                style={{
                  backgroundColor: item.logo3BgColor,
                  color: item.logo3Color,
                }}
              >
                {item.logo3}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER CTA */}
      <div className="fsu-footer">
        <h2>Join 100,000+ Students</h2>
        <p>The smartest students use Acceede. Don't get left behind.</p>

        <NavLink className="fsu-footerBtn">Join the Waitlist</NavLink>
      </div>

    </section>
  );
}