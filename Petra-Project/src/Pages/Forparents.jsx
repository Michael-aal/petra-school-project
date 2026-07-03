import {Users, Smartphone, CreditCard, PiggyBank, GraduationCap, Heart, Clock, CircleCheck, Wallet, ArrowRight } from "lucide-react";
 import { NavLink } from "react-router-dom";

  const ForParentBtn =["Download App", "Learn More"] 

  const ForParentFeature = [ 
    { 
      logo: <CreditCard />,
      title: "Instant Payments", 
      info: "Pay tuition, buy uniforms, and settle bills in seconds. Get instant receipts and track your spending history.", 
      to: "Acceede Pay" ,
      svgColor: "#2563eb",
      svgBgColor: "rgb(59, 130, 246/ 0.1)",
      rightTop: "#3B82F61A"
    }, 
      { 
        logo: <PiggyBank />, 
        title: "Financial Flexibility", 
        info: "Can't pay all at once? Split tuition into convenient monthly installments at 0% interest with Flexpay.", 
        to: "Flexpay" ,
        svgColor: "#16a34a",
        svgBgColor: "rgb(34, 197 ,94/ 0.1 )",
        rightTop: "#22C55E1A"
      }, 
      { 
        logo: <GraduationCap />, 
        title: "Academic Success", 
        info: "Give your child a 24/7 AI Tutor. Personalized lesson plans, instant homework help, and exam prep for WAEC & JAMB.", 
        to: "Study App" ,
        svgBgColor: "#6366F11A",
        svgColor: "rgb(79 70 229)",
        rightTop: "#6366F11A"
      }, 
    ] 
    
  const forParentModern = [ { logo: <Heart />, title: "Peace of Mind", info: "Never worry about your child being sent home for fees. Flexpay ensures seamless education continuity." }, { logo: <Clock />, title: "Save Time", info: "No more queues at the bank. Pay for everything from tuition to excursions in just a few taps." }, { logo: <CircleCheck />, title: "Real-time Updated", info: "Get notifications when your child attends class, completes an assignment, or when results are released." }, { logo: <Users />, title: "Multi-child Support", info: "Have children in different schools? Manage all their profiles and payments from a single dashboard." }, ]

  import "../Styles/Forschool.css";
export default function Forparents() {
  return (
    <section className="fparent">

        <div className="fparent-header">

          <h2 className="fparent-badge">
            <Users />
            FOR PARENTS
          </h2>

          <h3 className="fparent-title">
            Champion Your Child's <span>Future</span>
          </h3>

          <p className="fparent-description">
            Paying for school shouldn't be a struggle. Acceede gives you the
            financial tools to keep your child in school and the academic
            insights to ensure they excel.
          </p>

          <div className="fparent-actions">
            {ForParentBtn.map((item, index) => (
              <NavLink
                to="/"
                key={index}
                className={
                  index === 0
                    ? "fparent-btnPrimary"
                    : "fparent-btnSecondary"
                }
              >
                {item}
                {index === 0 && <Smartphone className="fparent-btnIcon" />}
              </NavLink>
            ))}
          </div>

        </div>

        <div className="fparent-features">

          {ForParentFeature.map((item, index) => (
            <div className="fparent-featureCard" key={index}>

              <div
  className="feature-top-circle"
  style={{ backgroundColor: item.rightTop }}
></div>

              <h3 className="fparent-featureIcon" style={{backgroundColor: item.svgBgColor, color: item.svgColor}}>
                {item.logo}
              </h3>

              <h2 className="fparent-featureTitle">
                {item.title}
              </h2>

              <p className="fparent-featureText">
                {item.info}
              </p>

              <h4 className="fparent-featureLink"style={{color: item.svgColor}} >
                Explore {item.to} <ArrowRight />
              </h4>

            </div>
          ))}

        </div>


      {/* Modern Parenting */}
      <div className="fparent-modern">

        <h2 className="fparent-modernTitle">
          Built for Modern Parenting
        </h2>

        <p className="fparent-modernDescription">
          We handle the logistics so you can focus on what matters most:
          raising the next generation of leaders.
        </p>

        <div className="fparent-modernGrid">

          {forParentModern.map((item, index) => (
            <div className="fparent-modernCard" key={index}>

              <h3 className="fparent-modernIcon">
                {item.logo}
              </h3>

              <div className="fparent-modernContent">

                <h2 className="fparent-modernCardTitle">
                  {item.title}
                </h2>

                <p className="fparent-modernCardText">
                  {item.info}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>
      
      {/* App Download */}
<div className="fparent-download">

  <div className="fparent-downloadBadge">
    <Smartphone />
    <span>FOR PARENTS</span>
  </div>

  <h2 className="fparent-downloadTitle">
    Join the Community
  </h2>

  <p className="fparent-downloadText">
    Over 50,000 parents are already using Acceede to power their children's education.
  </p>

  <div className="fparent-downloadActions">

    <a href="/" className="fparent-storeButton">
      Google Play
    </a>

    <a href="/" className="fparent-storeButton secondary">
      App Store
    </a>

  </div>

</div>

    </section>
  )
}