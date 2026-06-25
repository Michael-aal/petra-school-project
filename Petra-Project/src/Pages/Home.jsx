import { Notebook, Star, Zap,TrendingUp, Clock, GraduationCap } from "lucide-react";

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
            </> 
  )
}

const homeInfo = [
    {
        logo: <TrendingUp /> ,
        amount: "₦10 Million+",
        text: "Saved in administrative and back-office overhead"
    },
    {
        logo: <Clock />,
        amount: "10,000+",
        text: "Hours of teacher busywork and grading eliminated"
    },
    {
        logo: <GraduationCap />,
        amount: "100,000+",
        text: "Digital assessments taken, driving student mastery in motion"
    }
]

function HomeSection2(){

    return(
        <div className="">
            <h2><Zap /> THE ACCEEDE ADVANTAGE </h2>
            <h3>Scale and Efficiency</h3>
            <p>Acceede is the trusted engine powering Africa's top schools. We deliver guaranteed results on both the balance sheet and the classroom desk.</p>

            <div className="">
                {
                    homeInfo.map((item, index) => (
                        <div className="" key={index}>
                            <h3>{item.logo}</h3>
                            <h4>{item.amount}</h4>
                            <p>{item.text}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}



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