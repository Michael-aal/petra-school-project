import { Building2, ArrowRight, LayoutDashboard, Wallet, TestTube, TrendingUp, Shield, CircleCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";

const forSchoolBtn = ["Request a Strategic Demo", "Contact Sales"];

const ForSchoolPurpose = [
    {
        logo: <LayoutDashboard />,
        title: "Core Operation",
        info: "Manage students, staff, attendance, and results generation with ease. The backbone of your digital campus.",
        to: "School OS"
    },
    {
        logo: <Wallet />,
        title: "Financial Control",
        info: "Eliminate fraud, automate fee collection, and boost revenue with Flexpay installment plans for parents.",
        to: "Finance"
    },
    {
        logo: <TestTube />,
        title: "Modern Assessment",
        info: "Conduct exams, CA, and homework digitally. Save thousands of teacher hours on grading and analysis.",
        to: "CBT Engine"
    }
]

const topSchoolInfo = [
    {
        logo: <TrendingUp className="fsos-svg" />,
        title: "Revenue Assurance",
        info: "Our integrated payment rails and reconciliation tools ensure you collect 100% of your fees, on time. No more leakages."
    },
    {
        logo: <Shield className="fsos-svg" />,
        title: "Data Security First",
        info: "We employ bank-grade encryption and security protocols to keep your sensitive student and financial data safe."
    },
    {
        logo: <CircleCheck className="fsos-svg" />,
        title: "Dedicated Support",
        info: "You get a dedicated account manager and 24/7 technical support. We are an extension of your team."
    },
    {
        logo: <Building2 className="fsos-svg" />,
        title: "Scalable Infrastructure",
        info: "Whether you have 50 students or 5,000, our cloud-native infrastructure scales with your growth without skipping a beat."
    },
]

const Modernie = ["Ready to Modernize Your School?", "Join hundreds of forward-thinking institutions that trust Acceede. Schedule a personalized walkthrough today.", "Book Your Demo"]

export default function ForSchool() {
  return (
    <section className="fsos">

      {/* HEADER */}
      <div className="fsos-header">

        <div className="fsos-badge">
          <Building2 />
          FOR SCHOOLS
        </div>

        <h2 className="fsos-title">
          Run Your Entire School on <span>Autopilot</span>
        </h2>

        <p className="fsos-description">
          Stop using fragmented tools. Acceede connects your Administration,
          Finances, and Assessments into one powerful, unified Operating System.
        </p>

        <div className="fsos-actions">
          {forSchoolBtn.map((item, index) => (
            <NavLink to="/" key={index} className={index === 0 ? "fsos-btn1" : "fsos-btn2"}>
              {item}
              {index === 0 && <ArrowRight className="fsos-icon" />}
            </NavLink>
          ))}
        </div>

      </div>

      {/* FEATURES */}
      <div className="fsos-features">

        {ForSchoolPurpose.map((item, index) => (
          <div className="fsos-featureCard" key={index}>

            <h3 className="fsos-featureIcon">{item.logo}</h3>

            <h2 className="fsos-featureTitle">{item.title}</h2>

            <p className="fsos-featureText">{item.info}</p>

            <h4 className="fsos-featureLink">
              Explore {item.to} <ArrowRight />
            </h4>

          </div>
        ))}

      </div>

      {/* REASONS */}
      <div className="fsos-reasons">

        <h2 className="fsos-reasonsTitle">
          Why Top Schools Choose Acceede
        </h2>

        <p className="fsos-reasonsText">
          We don't just sell software; we partner with you to achieve operational excellence.
        </p>

<div className="fsos-info">
        {topSchoolInfo.map((item, index) => (
          <div className="fsos-reasonItem" key={index}>

            <h3 className="fsos-reasonIcon">{item.logo}</h3>

            <div className="fsos-reasonContent">
              <h4 className="fsos-reasonTitle">{item.title}</h4>
              <p className="fsos-reasonText">{item.info}</p>
            </div>

          </div>
        ))}

        </div>

      </div>

      {/* CTA */}
      <div className="fsos-cta">

        <h2 className="fsos-ctaTitle">
          Ready to Modernize Your School?
        </h2>

        <p className="fsos-ctaText">
          Join hundreds of forward-thinking institutions that trust Acceede.
          Schedule a personalized walkthrough today.
        </p>

        <NavLink to="/" className="fsos-ctaButton">
          Book Your Demo
        </NavLink>

      </div>

    </section>
  );
}
