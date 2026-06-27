import {Users, Smartphone, CreditCard, PiggyBank, GraduationCap, Heart, Clock, CircleCheck, Wallet, ArrowRight } from "lucide-react";
import { NavLink } from "react-router-dom";

const ForParentBtn =["Download App", "Learn More"]

const ForParentFeature = [
    {
        logo: <CreditCard />,
        title: "Instant Payments",
        info: "Pay tuition, buy uniforms, and settle bills in seconds. Get instant receipts and track your spending history.",
        to: "Acceede Pay"
    },
    {
        logo: <PiggyBank />,
        title: "Financial Flexibility",
        info: "Can't pay all at once? Split tuition into convenient monthly installments at 0% interest with Flexpay.",
        to: "Flexpay"
    },
    {
        logo: <GraduationCap />,
        title: "Academic Success",
        info: "Give your child a 24/7 AI Tutor. Personalized lesson plans, instant homework help, and exam prep for WAEC & JAMB.",
        to: "Study App"
    },
]

const forParentModern = [
    {
        logo: <Heart />,
        title: "Peace of Mind",
        info: "Never worry about your child being sent home for fees. Flexpay ensures seamless education continuity."
    },
    {
        logo: <Clock />,
        title: "Save Time",
        info: "No more queues at the bank. Pay for everything from tuition to excursions in just a few taps."
    },
    {
        logo: <CircleCheck />,
        title: "Real-time Updated",
        info: "Get notifications when your child attends class, completes an assignment, or when results are released."
    },
    {
        logo: <Users />,
        title: "Multi-child Support",
        info: "Have children in different schools? Manage all their profiles and payments from a single dashboard."
    },
]

export default function Forparents(){


    return(
        <section>
            <div className="">
            <div className="">
                <h2>FOR PARENTS</h2>
                <h3>Champion Your Child's <span>Future</span> </h3>
                <p>Paying for school shouldn't be a struggle. Acceede gives you the financial tools to keep your child in school and the academic insights to ensure they excel.</p>

                <div className="">
                    {
                        ForParentBtn.map((item, index) => (
                            <NavLink
                            to="/" key={index} className={index === 0 ? "parent1" : "pARENT2"} >
                                {item}
                                {index === 0 && <Smartphone />}
                            </NavLink>
                        ))
                    }
                </div>
            </div>

            <div className="">
                    {
                        ForParentFeature.map((item, index) => (
                            <div className="" key={index}>
                                <h3>{item.logo}</h3>
                                <h2>{item.title}</h2>
                                <p>{item.info}</p>

                                <h4>Explore {item.to} <ArrowRight /></h4>
                            </div>
                        ))
                    }
            </div>

            <div className="">
                <h2>Built for Modern Parenting</h2>
                <p>We handle the logistics so you can focus on what matters most: raising the next generation of leaders.</p>

                <div className="">
                    {
                        forParentModern.map((item, index) => (
                            <div className="">
                                <h3>{item.logo}</h3>
                                <div className="">
                                    <h2>{item.title}</h2>
                                    <p>{item.info}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>

            <div className="">
                <h3><Smartphone /> FOR PARENTS</h3>
                <h2>Join the Community</h2>
                <p>Over 50,000 parents are already using Acceede to power their children's education.</p>

                <div className="">
                    <a href="">Google Play</a>
                    <a href="">App Store</a>
                </div>
            </div>
            </div>
        </section>
    )
}