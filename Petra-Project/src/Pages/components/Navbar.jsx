import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  School,
  Wallet,
  FileCheck,
  CreditCard,
  BarChart3,
  Shield,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

import "../../Styles/components/Navbar.css";

const fullScreenSixeSolutionInfo = [
  {
  header: "For Schools",
  logo: <School size={22} />,

  logo2: <School size={20} />,
  header2: "School OS",
  info2: "Attendance, Admin & Results",

  logo3: <Wallet size={20} />,
  header3: "Financial Management",
  info3: "Fee Compliance & Reconciliation",

  logo4: <FileCheck size={20} />,
  header4: "CBT Engine",
  info4: "Assessment & Exams",
},

 {
  header: "For Parents",
  logo: <Shield size={22} />,

  logo2: <CreditCard size={20} />,
  header2: "Acceede Pay",
  info2: "Tuition & Fee Payments",

  logo3: <Wallet size={20} />,
  header3: "Flexpay",
  info3: "Installment Plans",

  logo4: <BarChart3 size={20} />,
  header4: "Performance",
  info4: "Monitor Child's Progress",
},

 {
  header: "For Students",
  logo: <GraduationCap size={22} />,

  logo2: <GraduationCap size={20} />,
  header2: "Study App",
  info2: "AI-Powered Learning",
}
];

const companyInfo = [
  {
    logo: <School size={20} />,
    info: "About Us",
    content: "Our Mission & Story",
  },
  {
    logo: <Shield size={20} />,
    info: "Contact",
    content: "Get in Touch",
  },
];

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);

      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LEFT */}
        <div className="navbar-left">

          <div className="navbar-logo">
            <School size={34} />
            <span>Petra School</span>
          </div>

          {!isMobile && (
            <div className="nav-links">

              {/* SOLUTIONS */}
              <div
                className="dropdown-wrapper"
                onMouseEnter={() => setShowSolutions(true)}
                onMouseLeave={() => setShowSolutions(false)}
              >
                <button className="nav-link-btn">
                  Solutions <ChevronDown
  className= "chere"
/>
                </button>

                {showSolutions && (
                  <div className="solutions-dropdown">
                    {fullScreenSixeSolutionInfo.map((item, index) => (
                      <div key={index} className="solution-column">
                        <h3 className="solution-heading">
                          {item.logo}
                          {item.header}
                        </h3>

                        {item.header2 && (
                          <div className="solution-item">
  <div className="solution-icon">
    {item.logo2}
  </div>

  <div className="solution-content">
    <h4>{item.header2}</h4>
    <p>{item.info2}</p>
  </div>
</div>
                        )}

                        {item.header3 && (
                          <div className="solution-item">
  <div className="solution-icon">
    {item.logo3}
  </div>

  <div className="solution-content">
    <h4>{item.header3}</h4>
    <p>{item.info3}</p>
  </div>
</div>
                        )}

                        {item.header4 && (
                          <div className="solution-item">
  <div className="solution-icon">
    {item.logo4}
  </div>

  <div className="solution-content">
    <h4>{item.header4}</h4>
    <p>{item.info4}</p>
  </div>
</div>
                        )}
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
                <button className="nav-link-btn">
                  Company <ChevronDown
  className="chere"
/>
                </button>

                {showCompany && (
                  <div className="company-dropdown">
                    {companyInfo.map((item, index) => (
                      <div key={index} className="company-item">
  <div className="company-icon">
    {item.logo}
  </div>

  <div className="company-content">
    <h4>{item.info}</h4>
    <p>{item.content}</p>
  </div>
</div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACCORDION LINKS */}
              <div className="accordion-item">
                <button
                  className="accordion-header"
                  onClick={() => toggleSection("schools")}
                >
                  For Schools
                </button>
              </div>

              <div className="accordion-item">
                <button
                  className="accordion-header"
                  onClick={() => toggleSection("parents")}
                >
                  For Parents
                </button>

              </div>

              <div className="accordion-item">
                <button
                  className="accordion-header"
                  onClick={() => toggleSection("students")}
                >
                  For Students
                </button>

              </div>

            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="navbar-right">

          <button
            className="theme-btn"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {!isMobile && (
            <button className="cta-btn">Get Started</button>
          )}

          {isMobile && (
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu">

          <div className="mobile-menu-section">
            <h3>Solutions</h3>
            {fullScreenSixeSolutionInfo.map((item, index) => (
              <div key={index} className="mobile-solution-group">
                <h4>{item.header}</h4>
                {item.header2 && <p>{item.header2}</p>}
                {item.header3 && <p>{item.header3}</p>}
                {item.header4 && <p>{item.header4}</p>}
              </div>
            ))}
          </div>

          <div className="mobile-menu-section">
            <h3>Company</h3>
            {companyInfo.map((item, index) => (
              <p key={index}>{item.info}</p>
            ))}
          </div>

          <NavLink to="/schools">For Schools</NavLink>
          <NavLink to="/parents">For Parents</NavLink>
          <NavLink to="/students">For Students</NavLink>

          <button className="mobile-cta-btn">
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}