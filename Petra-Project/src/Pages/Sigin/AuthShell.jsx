import { useEffect, useState } from "react";
import { Moon, Sun, CheckCircle2 } from "lucide-react";
import { applyTheme, getInitialTheme } from "../../utils/theme";

const NuvoraLogo = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <title>Nuvora</title>
    <g fill="currentColor" stroke="none">
      <path d="M12 3L2 8l10 5 10-5-10-5z" />
      <path d="M6.5 11.2c-.2.1-.5.3-.5.6v2.2c0 .7.9 1.6 2.8 2.6 1.8.9 4.2 1.4 6.2 1.4s4.4-.5 6.2-1.4c1.9-1 2.8-1.9 2.8-2.6v-2.2c0-.3-.3-.5-.5-.6L12 15l-5.5-3.8z" opacity="0.95" />
    </g>
    <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M12 4.2v6.2" />
      <path d="M12 9.8l3 1" />
    </g>
  </svg>
);

export default function AuthShell({ children, eyebrow, title, subtitle, footnote, variant = "" }) {
  const [darkMode, setDarkMode] = useState(() => {
    return getInitialTheme() === "dark";
  });

  useEffect(() => {
    applyTheme(darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <main className="auth-page">
      <section className={`auth-shell ${variant ? `auth-shell--${variant}` : ""}`}>
        <div className={`auth-card ${variant ? `auth-card--${variant}` : ""}`}>
          {children}
          {footnote ? <p className="auth-footnote">{footnote}</p> : null}
        </div>

        <div className="auth-visual">
          <button
            type="button"
            className="auth-theme-btn"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="auth-brand-row">
            <div className="auth-brand-mark">
              <NuvoraLogo size={22} />
            </div>
            <div>
              <p className="auth-brand">Nuvora</p>
              <p className="auth-brand-sub">The school operating system</p>
            </div>
          </div>

          <div className="auth-copy">
            <span className="auth-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="auth-points">
            <div className="auth-point">
              <span className="auth-point-dot" />
              <div>
                <strong>Modern experience</strong>
                <p>Clean, responsive sign in and registration screens.</p>
              </div>
            </div>
            <div className="auth-point">
              <span className="auth-point-dot" />
              <div>
                <strong>Secure sessions</strong>
                <p>JWT is handled with an httpOnly cookie and protected routes.</p>
              </div>
            </div>
          </div>

          {/* Decorative status card — echoes the landing page dashboard mockup */}
          <div className="auth-status-card">
            <CheckCircle2 size={20} className="auth-status-icon" />
            <div>
              <strong>All systems synced</strong>
              <span>Attendance, fees, and admissions in one view</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
