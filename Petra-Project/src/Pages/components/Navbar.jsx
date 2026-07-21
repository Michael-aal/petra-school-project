import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  School,
  Shield,
  ChevronDown,
} from "lucide-react";
import { solutionGroups } from "../../pages/solutions/solutionData";

import "../../Styles/components/Navbar.css";

const companyInfo = [
  {
    logo: <School size={20} />,
    info: "About Us",
    content: "Our Mission & Story",
    path: "/about",
  },
  {
    logo: <Shield size={20} />,
    info: "Contact",
    content: "Get in Touch",
    path: "/contact",
  },
];

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;

    const savedTheme = window.localStorage.getItem("petra-theme");
    if (savedTheme) {
      return savedTheme === "white";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    }
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.body.classList.toggle("light", !darkMode);
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    window.localStorage.setItem("petra-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-wrapper")) {
        setShowSolutions(false);
        setShowCompany(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleMenuClose = (shouldScrollToHome = false) => {
    setMobileMenuOpen(false);
    setExpandedSection(null);
    setShowSolutions(false);
    setShowCompany(false);

    if (shouldScrollToHome) {
      window.setTimeout(() => {
        const firstSection = document.getElementById("home-section-1");
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 70);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LEFT */}
        <div className="navbar-left">
          <NavLink to="/" className="navbar-logo">
            <School size={18} />
            <span className="petra">Petra School</span>
          </NavLink>

          {!isMobile && (
            <div className="nav-links">
              {/* SOLUTIONS */}
              <div
                className="dropdown-wrapper"
                onMouseEnter={() => setShowSolutions(true)}
                onMouseLeave={() => setShowSolutions(false)}
              >
                <button className="nav-link-btn" aria-label="Solutions menu">
                  Solutions
                  <ChevronDown className="chevron-icon" size={15} />
                </button>

                {showSolutions && (
                  <div className="solutions-dropdown">
                    {solutionGroups.map((item, index) => (
                      <div key={index} className="solution-column">
                        <h3 className="solution-heading">
                          {item.header}
                        </h3>

                        {item.items.map((subItem, subIndex) => (
                          <NavLink
                            key={subIndex}
                            to={subItem.path}
                            className="solution-item"
                            onClick={() => handleMenuClose(false)}
                          >
                            <div className="solution-content">
                              <h4>{subItem.title}</h4>
                              <p>{subItem.desc}</p>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPANY */}
              <div
                className="dropdown-wrapper"
                onMouseEnter={() => setShowCompany(true)}
                onMouseLeave={() => setShowCompany(false)}
              >
                <button className="nav-link-btn" aria-label="Company menu">
                  Company
                  <ChevronDown className="chevron-icon" size={15} />
                </button>

                {showCompany && (
                  <div className="company-dropdown">
                    {companyInfo.map((item, index) => (
                      <NavLink
                        key={index}
                        to={item.path}
                        className="company-item"
                        onClick={() => handleMenuClose(item.path === "/")}
                      >
                        <div className="company-icon">
                          {item.logo}
                        </div>
                        <div className="company-content">
                          <h4>{item.info}</h4>
                          <p>{item.content}</p>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* STATIC LINKS */}
              <NavLink to="/schools" className="nav-link">
                For Schools
              </NavLink>

              <NavLink to="/parents" className="nav-link">
                For Parents
              </NavLink>

              <NavLink to="/students" className="nav-link">
                For Students
              </NavLink>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="navbar-right">
          <button
            className="theme-btn"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

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
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu">
          {/* SOLUTIONS SECTION */}
          <div className="mobile-menu-section">
            <button
              className="mobile-section-header"
              onClick={() => toggleSection("solutions")}
              aria-expanded={expandedSection === "solutions"}
            >
              <span>Solutions</span>
              <ChevronDown
                className={`section-chevron ${
                  expandedSection === "solutions" ? "expanded" : ""
                }`}
                size={18}
              />
            </button>

            {expandedSection === "solutions" && (
              <div className="accordion-body show">
                {solutionGroups.map((item, index) => (
                  <div key={index} className="mobile-solution-group">
                    <h4>{item.header}</h4>
                    {item.items.map((subItem, subIndex) => (
                      <NavLink
                        key={subIndex}
                        to={subItem.path}
                        className="mobile-menu-link"
                        onClick={() => handleMenuClose(false)}
                      >
                        {subItem.title}
                      </NavLink>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPANY SECTION */}
          <div className="mobile-menu-section">
            <button
              className="mobile-section-header"
              onClick={() => toggleSection("company")}
              aria-expanded={expandedSection === "company"}
            >
              <span>Company</span>
              <ChevronDown
                className={`section-chevron ${
                  expandedSection === "company" ? "expanded" : ""
                }`}
                size={18}
              />
            </button>

            {expandedSection === "company" && (
              <div className="accordion-body show">
                {companyInfo.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.path}
                    className="mobile-menu-link"
                  >
                    {item.info}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* PAGES SECTION */}
          <div className="mobile-menu-section">
            <button
              className="mobile-section-header"
              onClick={() => toggleSection("pages")}
              aria-expanded={expandedSection === "pages"}
            >
              <span>Pages</span>
              <ChevronDown
                className={`section-chevron ${
                  expandedSection === "pages" ? "expanded" : ""
                }`}
                size={18}
              />
            </button>

            {expandedSection === "pages" && (
              <div className="accordion-body show">
                <NavLink to="/schools" className="mobile-menu-link" onClick={() => handleMenuClose(false)}>
                  For Schools
                </NavLink>
                <NavLink to="/parents" className="mobile-menu-link" onClick={() => handleMenuClose(false)}>
                  For Parents
                </NavLink>
                <NavLink to="/students" className="mobile-menu-link" onClick={() => handleMenuClose(false)}>
                  For Students
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/get-started" className="mobile-cta-btn" onClick={() => handleMenuClose(false)}>
            Get Started
          </NavLink>
        </div>
      ) }
    </nav>
  );
}
