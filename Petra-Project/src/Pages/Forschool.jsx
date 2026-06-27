import { Building2, ArrowRight, LayoutDashboard, Wallet, TestTube, TrendingUp, Shield, CircleCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

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
        logo: <TrendingUp />,
        title: "Revenue Assurance",
        info: "Our integrated payment rails and reconciliation tools ensure you collect 100% of your fees, on time. No more leakages."
    },
    {
        logo: <Shield />,
        title: "Data Security First",
        info: "We employ bank-grade encryption and security protocols to keep your sensitive student and financial data safe."
    },
    {
        logo: <CircleCheck />,
        title: "Dedicated Support",
        info: "You get a dedicated account manager and 24/7 technical support. We are an extension of your team."
    },
    {
        logo: <Building2 />,
        title: "Scalable Infrastructure",
        info: "Whether you have 50 students or 5,000, our cloud-native infrastructure scales with your growth without skipping a beat."
    },
]

const Modernie = ["Ready to Modernize Your School?", "Join hundreds of forward-thinking institutions that trust Acceede. Schedule a personalized walkthrough today.", "Book Your Demo"]

export default function ForSchool() {
  return (
    <section>
        <div className="">
            <div className="">
      <h2>
        <Building2 /> FOR SCHOOLS
      </h2>
      <h3>
        Run Your Entire School on <span>Autopilot</span>
      </h3>
      <p>
        Stop using fragmented tools. Acceede connects your Administration, 
        Finances, and Assessments into one powerful, unified Operating System.
      </p>
      
      <div className="">
        {forSchoolBtn.map((item, index) => (
          <NavLink to="/" key={index}>
            {item}
            {index === 0 && <ArrowRight />}
          </NavLink>
        ))}
      </div>
      </div>

      <div className="">
        {
            ForSchoolPurpose.map((item, index) => (
                <div className="" key={index}>
                    <h3>{item.logo}</h3>
                    <h2>{item.title}</h2>
                    <p>{item.info}</p>

                    <h4>Explore {item.to} <ArrowRight /> </h4>
                </div>
            ))
        }
      </div>

      <div className="">
        <h2>Why Top Schools Choose Acceede</h2>
        <p>We don't just sell software; we partner with you to achieve operational excellence.</p>

        {
            topSchoolInfo.map((item, index) => (
                <div className="" key={index}>
                    <h3>{item.logo}</h3>
                    <div className="">
                        <h4>{item.title}</h4>
                        <p>{item.info}</p>
                    </div>
                </div>
            ))
        }
      </div>

      <div className="">
        <h2>Ready to Modernize Your School?</h2>
        <p>Join hundreds of forward-thinking institutions that trust Acceede. Schedule a personalized walkthrough today.</p>

        <button>Book Your Demo</button>
      </div>
      </div>
    </section>
  );
}
