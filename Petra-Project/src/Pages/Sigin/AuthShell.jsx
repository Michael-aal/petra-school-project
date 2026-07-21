import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function AuthShell({ children, eyebrow, title, subtitle, footnote }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedTheme = window.localStorage.getItem("petra-theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.body.classList.toggle("light", !darkMode);
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    window.localStorage.setItem("petra-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <main className="auth-page">
      <section className="auth-shell">
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
            <img src="/petra logo.png" alt="Petra School logo" className="auth-logo" />
            <div>
              <p className="auth-brand">Petra School</p>
              <p className="auth-brand-sub">Secure access for schools</p>
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
        </div>

        <div className="auth-card">
          {children}
          <p className="auth-footnote">{footnote}</p>
        </div>
      </section>
    </main>
  );
}
