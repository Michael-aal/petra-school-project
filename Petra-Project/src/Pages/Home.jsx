import { Notebook, ArrowRight, Brain, Target, Map, CheckCircle, Shield, Star, Zap, TrendingUp, TrendingDown, Clock, GraduationCap, Sparkles, MessageCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Home.css";

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
            <HomeSection5 />
            <HomeSection7 />
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
    <section>
      <div>
        {img1.map((item, index) => (
          <img key={index} src={item} alt="" width={300} />
        ))}
      </div>

      <div>
        <h2>
          <Star size={18} /> Acceede OS v2.0 is Live
        </h2>

        <h3>
          The Operating System <span>for Academic</span>{" "}
          <span>Excellence</span>
        </h3>

        <p>
          The single platform trusted by schools for school management,
          financial control, and by students for crushing WAEC & JAMB with
          AI-powered mastery.
        </p>

        <div className="section1btn">
          <button>
            Book a Demo (Schools)
            <Notebook />
          </button>

          <button>
            Try AI Study App
            <Zap />
          </button>
        </div>
      </div>

      <div>
        {img2.map((item, index) => (
          <img key={index} src={item} alt="" width={300} />
        ))}
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
      <div className="section2-content">
        <div className="recognition-badge">
          <Sparkles size={16} />
          Recognition
        </div>

        <h2>As Featured In</h2>

        <div className="logos-container">
          {logos.map((item, index) => (
            <div key={index} className="logo-item">
              <img src={item.logo} alt={item.name} />
            </div>
          ))}
        </div>
      </div>

      <a href="https://wa.me/" className="whatsapp-btn" aria-label="Contact us on WhatsApp">
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