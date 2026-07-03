import { Notebook, Users, Building2, Book, Send, Mail,  Play ,Smartphone, Quote, ArrowRight, Brain, Target, Map, CheckCircle, Shield, Star, Zap, TrendingUp, TrendingDown, Clock, GraduationCap, Sparkles, MessageCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import "../Styles/Home.css";
import MarqueeModule from "react-fast-marquee";

const Marquee = MarqueeModule.default;

const img1 = [
  "https://acceede.com/assets/bookkeeping-CVnCZp_U.png",
  "https://acceede.com/assets/children-Bzqga-HY.png",
  "https://acceede.com/assets/woman-BpDTj0AB.png",
];

const img2 = [
  "https://acceede.com/assets/teacher-D_wgfr-G.png",
  "https://acceede.com/assets/boy-Cidne9lz.png",
];



export default function Home() {
  return (
    <><HomeSection1 />
    <HomeSection2 />
            <HomeSection3 />
            <HomeSection4 />
            <HomeSection5 />
            <HomeSection7 />
            <HomeSection8 />
            <HomeSection9 />
            <HomeSection10 />
            <HomeSection11 />
            </> 
  )
}

const homeInfo = [
    {
      color: "#22C55E",  // Green icon
        bgColor: "#22C55E1A",
        logo: <TrendingUp /> ,
        amount: "₦10 Million+",
        text: "Saved in administrative and back-office overhead"
    },
    {
      color: "#3B82F6",  // Blue icon
        bgColor: "#3B82F61A",
        logo: <Clock />,
        amount: "10,000+",
        text: "Hours of teacher busywork and grading eliminated"
    },
    {
      color: "#A855F7",  // Purple icon
        bgColor: "#A855F71A",
        logo: <GraduationCap />,
        amount: "100,000+",
        text: "Digital assessments taken, driving student mastery in motion"
    }
]


// Setion1
function HomeSection1() {

  return (
    <section className="homeSection1">
      <div className="section1-container">
        {/* LEFT IMAGES */}
        <div className="  section1-left-images">
          {img1.map((item, index) => (
            <img key={index} src={item} alt="Acceede user" className="section1-img" />
          ))}
        </div>

        {/* CENTER CONTENT */}
        <div className="section1-content">
          <div className="section1-badge">
            <span className="badge-dot">●</span>
            ACCEEDE OS V2.0 IS LIVE
          </div>

          <h1 className="section1-title">
            The Operating System
            <span className="section1-highlight"> for Academic</span>
            <span className="section1-highlight"> Excellence</span>
          </h1>

          <p className="section1-description">
            The single platform trusted by schools for school management,
            financial control, and by students for crushing WAEC & JAMB with
            AI-powered mastery.
          </p>

          <div className="section1-buttons">
            <button className="section1-btn section1-btn-primary">
              <Notebook size={18} />
              Book a Demo (Schools)
            </button>

            <button className="section1-btn section1-btn-secondary">
              <Zap size={18} />
              Try AI Study App
            </button>
          </div>
        </div>

        {/* RIGHT IMAGES */}
        <div className="section1-right-images">
          {img2.map((item, index) => (
            <img key={index} src={item} alt="Acceede student" className="section1-img" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Section2

function HomeSection2() {
  const logos = [
    {
      name: "Harvard Innovation Labs",
      logo: "https://acceede.com/assets/harvard-innovation-lab-BJArUWdE.png"
    },
    {
      name: "Future Perspectives",
      logo: "https://acceede.com/assets/future-perspectives-BL719FVN.png"
    },
    {
      name: "Disrupt",
      logo: "https://acceede.com/assets/disrupt-DrWMZp6o.png"
    },
    {
      name: "Startup LACOS",
      logo: "https://acceede.com/assets/startup-lagos-ytUMAKH3.png"
    }
  ];

  return (
    <section className="homeSection2">

      <div className="section2-wrapper">

        <div className="section2-text">
          <div className="recognition-badge">
            <Sparkles size={16} />
            Recognition
          </div>

          <h2>As Featured In</h2>
        </div>

        <div className="logos-container">
          {logos.map((item, index) => (
            <div key={index} className="logo-item">
              <img src={item.logo} alt={item.name} />
            </div>
          ))}
        </div>

      </div>

      <a href="https://wa.me/" className="whatsapp-btn">
        <MessageCircle size={24} />
      </a>

    </section>
  );
}

// Section3
function HomeSection3() {
  return (
    <div className="homeSection3">
      <div className="section3-header">
        <h2>
          <Zap size={28} /> THE ACCEEDE ADVANTAGE
        </h2>
        <h3>Scale and Efficiency</h3>
        <p>
          Acceede is the trusted engine powering Africa's top schools. We 
          deliver guaranteed results on both the balance sheet and the 
          classroom desk.
        </p>
      </div>

      <div className="info-grid">
        {homeInfo.map((item, index) => (
          <div className="info-card" key={index}>
            <div className="card-content">
              <div 
                className="card-icon" 
style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                {item.logo}
              </div>
              <h4 className="card-amount">{item.amount}</h4>
              <p className="card-text">{item.text}</p>
            </div>
            
            {/* Circle/Semi-circle button on the right */}
            <button 
              className="card-circle-btn"
              style={{ backgroundColor: item.bgColor, color: item.bgColor }}
            >
              →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

//Section4

function HomeSection4(){

  const homeSection4Inffo = [
    {
      logo: <Users />,
      user: "For Parents",
      info: "Split the payment of your child's school fees into 3 to 4 installments with 0% interest rate and enjoy amazing rewards, like free books and scholarships for just paying school fees.",
      img: "https://acceede.com/assets/parents-CoW2iC7K.png"
    },
    {
      logo: <Building2 />,
      user: "For Schools",
      info: "Tired of uncollected school fees payment? Get access to guaranteed school fees collection with our groundbreaking technology. Get access to cashflow financing at the beginning of the term to run your school efficiently.",
      img: "https://acceede.com/assets/schools-mzkTYKwk.png"
    },
    {
      logo: <Book />,
      user: "For Vocational / Training Institutes",
      info: "See increase in enrollment by up to 40% - GUARANTEED, with our flexible payment service. Get access to cashflow financing to run your Institution efficiently.",
      img: "https://acceede.com/assets/institutions-DKZZthvC.png"
    },
    {
      logo: <GraduationCap />,
      user: "For Students",
      info: "Get to learn and pay later. Split your course/training payment into flexible installment at 0% interest rate.",
      img: "https://acceede.com/assets/Students-D-Kr-uqs.png"
    }
  ]

  return(
    <section className="homeSection4">
        <div className="section4-header">
          <h2 className="section4-title">How we make life easier for everyone</h2>
          <div className="section4-divider">______</div>
        </div>

        <div className="section4-grid">
          {
            homeSection4Inffo.map((item, index) => (
              <div 
                key={index} 
                className={`section4-item ${index % 2 === 0 ? "section4-small" : "section4-large"}`}
              >
                <div className="section4-content">
                  <div className="section4-icon">
                    {item.logo}
                  </div>
                  <h4 className="section4-user">{item.user}</h4>
                  <p className="section4-info">{item.info}</p>

                  <NavLink to="/" className="section4-link">
                    Learn More <ArrowRight size={18} />
                  </NavLink>
                </div>
                <div className="section4-image">
                  <img src={item.img} alt={item.user} className="section4-img" />
                </div>
              </div>
            ))
          }
        </div>
    </section>
  )
}

// Section5

function HomeSection5(){

  const HomeSection5Info = [
    {
      circleMark: <CheckCircle /> ,
      info: "Automated fee collection and reconciliation"
    },
    {
      circleMark: <CheckCircle />,
      info: "Real-time financial compliance tracking"
    },
    {
      circleMark: <CheckCircle />,
      info: "Cashflow financing at term start"
    },
    {
      circleMark: <CheckCircle />,
      info: "Zero back-office administrative hassle"
    }
  ]

  const homesectionBtnInfo = [
    {
      logo: <TrendingDown />,
      amount: "COST REDUCTION",
      time: "₦ Millions",
      info: "In back-office overhead eliminated annually"
    },
    {
      logo: <Zap />,
      time: "1,000+ Hours",
      amount: "TIME EFFICIENCY",
      info: "Of administrative work automated per term"
    }
  ]

  return(
    <section className="homeSection5">
      <div className="section5-wrapper">
        
        {/* Left Content */}
        <div className="section5-content">
          <div className="section5-header">
            <h2 className="section5-badge">
              <Shield /> FOR SCHOOLS
            </h2>
            <h3 className="section5-title">
              LIBERATE YOUR 
              <br />
              OPERATIONS.
            </h3>

            <h4 className="section5-subtitle">
              ₦ MILLIONS IN SAVINGS.
              <br />
              ZERO BACK-OFFICE HASSLE.
            </h4>

            <p className="section5-description">
              Acceede automates your most complex administrative tasks, delivering over thousands of hours saved in overhead and millions in hard back-office cost reductions. Financial compliance, simplified.
            </p>
          </div>

          {/* Features List */}
          <div className="section5-features">
            {
              HomeSection5Info.map((item, index) => (
                <div key={index} className="feature-item">
                  <span className="feature-icon">{item.circleMark}</span>
                  <p className="feature-text">{item.info}</p>
                </div>
              ))
            }
          </div>

          {/* CTA Button */}
          <NavLink to="/" className="section5-link">
            <button className="section5-btn">
              Schedule a Demo <Zap size={18} />
            </button>
          </NavLink>
        </div>

        {/* Right Cards */}
        <div className="section5-cards">
          {
            homesectionBtnInfo.map((item, index) => (
              <div key={index} className="info-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon-bg">{item.logo}</span>
                </div>
                <div className="card-text-wrapper">
                  <h3 className="card-amount">{item.amount}</h3>
                  <h4 className="card-time">{item.time}</h4>
                </div>
                <p className="card-info">{item.info}</p>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  )
}

//Section 7
function HomeSection7(){

  const homeSection7feature = [
    {
      logo: <Brain />,
      title: "AL-Powered Learning",
      text: "Context-aware explanations that adapt to your learning style",
      logoColor: "rgb(255 255 255)",
      logoBgColor:"#a855f7" 
    },
    {
      logo: <Target />,
      title: "Infinite Practice",
      text: "Never run out of questions with our dynamic question engine",
      logoColor: "rgb(255 255 255)",
      logoBgColor: "#0891b2 "
    },
    {
      logo: <Map />,
      title: "Personalized Plans",
      text: "Adaptive learning paths created just for you based on performance gaps",
      logoColor: "rgb(255 255 255)",
      logoBgColor: "#22c55e"
    }
  ]

  return(
    <section className="homeSection7">
      
      {/* Left - Header and Stats */}
      <div className="section7-left">
        <div className="section7-header">
          <h2 className="section7-badge">
            <Sparkles /> FOR STUDENTS
          </h2>
          <h3 className="section7-title">
            MASTERY <span className="section7-title-highlight">IN MOTION.</span>
          </h3>
        </div>

        <div className="section7-stats">
          <div className="stats-number">100,000+</div>
          <h4 className="stats-label">Digital Assessments Taken</h4>
          <p className="stats-description">
            Our platform is tested daily by thousands of students. That's over 100,000 digital tests and mock exams analyzed by the Acceede engine, proving our RAG-powered approach works for real-world exam success.
          </p>
        </div>

<NavLink to="/" className="section7-link">
  <button className="section7-btn">
    <ArrowRight size={20} />
    Start Learning for Free 
  </button>
</NavLink>
      </div>
      
      {/* Right - Features and Exams */}
      <div className="section7-right">
        {/* Features Grid */}
        <div className="section7-features">
          {
            homeSection7feature.map((item, index) => (
              <div key={index} className="feature-card">
                <div 
                  className="feature-icon"
                  style={{
                    background: item.logoBgColor, 
                    color: item.logoColor
                  }}
                >
                  {item.logo}
                </div>
                <div className="feature-content">
                  <h2 className="feature-title">{item.title}</h2>
                  <p className="feature-text">{item.text}</p>
                </div>
              </div>
            ))
          }
        </div>

        {/* Exams Section */}
        <div className="section7-exams">
          <h2 className="exams-heading">Trusted by students preparing for</h2>
          <h3 className="exams-list">WAEC • JAMB • NECO</h3>
        </div>
      </div>
    </section>
  )
}

function HomeSection8(){

  const HomeSection8Img = [
    "https://acceede.com/assets/Paystack-DG63jtoH.jpg", 
    "https://acceede.com/assets/globus-CiXblTWW.jpg", 
    "https://acceede.com/assets/mono-Bd1MYfxU.png", 
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRionUdyUbXG8DIusYJ5EycjMjWy4qVA5fHv7X8SXEkkw&s=10", 
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2Nf7dOeDrYG-Q-DTOKBDwLHBNBDe1K4kV4HY9jkLN7fSt8FBdzpLR1PzG&s=10"  
  ]

  return(
    <section className="homeSection8">
      <div className="section8-header">
        <h2 className="section8-title">
          <Zap size={24} /> POWERED BY
        </h2>

        <p className="section8-subtitle">
          Accelerate your growth with our financial partners and enablers
        </p>
      </div>

      <div className="section8-marquee-wrapper">
        <Marquee pauseOnHover={true}>
          {
            HomeSection8Img.map((item, index) => (
              <div key={index} className="marquee-item">
                <img src={item} alt={`Partner ${index + 1}`} className="marquee-img" />
              </div>
            ))
          }
        </Marquee>
      </div>
    </section>
  )
}

function HomeSection9(){

  const homeSection9Info = [
    {
      info: "Acceede relieves the stress of bulky payment and frees up cash to do more things at a time. They are very very dependable, reliable and trustworthy. They keep to their promise in terms of charges. There are no extra charges. I pray GOD will take them to higher levels.",
      user: "Prince Ajibola",
      schoolName: "RoyalPath Schools"
    },
    {
      info: "Acceede is a good company, very very good. They're reliable, they reduce stress unlike other banks and their interest is very low. I recommend them to anyone that is interested.",
      user: "Mrs Obar",
      schoolName: "Agnity School"
    },
    {
      info: "Aceede, your service is awesome, reliable and time friendly. I appreciate your quick response despite the short notice. Kindly keep up the good service.",
      user: "Mr Giwa",
      schoolName: "Eclos College"
    }
  ]

  return(
    <section className="homeSection9">
      <div className="section9-header">
        <h2 className="section9-title">
          What Our <span className="section9-highlight">Customers Say About</span> Us
        </h2>
        <div className="section9-divider">______</div>
      </div>

      <div className="section9-testimonials">
        {
          homeSection9Info.map((item, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-quote-icon">
                <Quote size={32} />
              </div>
              <p className="testimonial-text">{item.info}</p>
              <hr className="testimonial-divider" />
              <div className="testimonial-author">
                <h3 className="author-name">{item.user}</h3>
                <h4 className="author-school">{item.schoolName}</h4>
              </div>
            </div>
          ))
        }
      </div>
    </section>
  )
}

function HomeSection10(){

  return(
    <section className="homeSection10">
      <div className="section10-container">
        <div className="section10-content">
          <h2 className="section10-title">
            <Smartphone size={28} /> For Parents
          </h2>
          <h3 className="section10-subtitle">
            Manage school payments on the go.
          </h3>
          <p className="section10-description">
            No more harassment or embarrassment. Download the Acceede App to pay tuition fees instantly, schedule installment plans, and track your child's education journey.
          </p>

          <div className="section10-buttons">
            <a 
              href="https://play.google.com/store/apps/details?id=com.acceede" 
              target="_blank"
              rel="noopener noreferrer"
              className="app-link google-play"
            >
             <Play />
              Google Play
            </a>
            <a 
              href="https://apps.apple.com/app/acceede" 
              target="_blank"
              rel="noopener noreferrer"
              className="app-link app-store"
            >
              <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className="app-logo" />
              App Store
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function HomeSection11(){

  return(
    <section className="homeSection11">
      <div className="section11-header">
        <h2 className="section11-title">
          <Mail size={28} /> STAY UPDATED
        </h2>
        <h3 className="section11-subtitle">Newsletter</h3>
        <p className="section11-description">
          Stay updated with exclusive offers and educational content by subscribing to our newsletter. Our monthly newsletter provides a curated selection of articles, tips, and success stories in education. Join our community of educators, students, and parents to stay informed and inspired.
        </p>
      </div>

      <div className="section11-form">
        <input 
          type="email" 
          placeholder="Enter your email" 
          className="section11-input"
        />
        <button className="section11-btn">
          Subscribe <Send size={20} />
        </button>
      </div>

      <p className="section11-privacy">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </section>
  )
}