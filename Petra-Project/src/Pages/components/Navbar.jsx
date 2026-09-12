import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

import "../../Styles/components/Navbar.css";

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

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
    if (window.innerWidth >= 768) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <NavLink to="/" className="navbar-logo" aria-label="Nuvora home">
            <NuvoraLogo size={18} />
            <span className="petra">Nuvora</span>
          </NavLink>

          {!isMobile && (
            <div className="nav-links">
              <NavLink to="/schools" className="nav-link">
                For Schools
              </NavLink>
              <NavLink to="/parents" className="nav-link">
                For Parents
              </NavLink>
              <NavLink to="/students" className="nav-link">
                For Students
              </NavLink>
              <NavLink to="/about" className="nav-link">
                About
              </NavLink>
              <NavLink to="/contact" className="nav-link">
                Contact
              </NavLink>
            </div>
          )}
        </div>

        <div className="navbar-right">
          {!isMobile && (
            <NavLink to="/get-started" className="cta-btn">
              Get Started
            </NavLink>
          )}

          {isMobile && (
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu">
          <NavLink to="/schools" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            For Schools
          </NavLink>
          <NavLink to="/parents" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            For Parents
          </NavLink>
          <NavLink to="/students" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            For Students
          </NavLink>
          <NavLink to="/about" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            About
          </NavLink>
          <NavLink to="/contact" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Contact
          </NavLink>
          <NavLink to="/get-started" className="mobile-cta-btn" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </NavLink>
        </div>
      )}
    </nav>
  );
}
