import { NavLink } from "react-router-dom";
import "../../Styles/DashBoardLayout/homeDahboard.css"
import { useState, useEffect } from "react";

const dgd = [
    {
        title: "NGN Balance",
        amonut: 0.00 ,
        logo: "	https://school.acceede.com/static/media/wallet-03.93baae9472a0359e2f0058ef8635ffbb.svg",
        func: "Withdraw Balance",
        logoBgColor: "#3371E8",
        to: "withdrawBalance"
    },
    {
        title: "Balance Payouts",
        amonut: 0.00,
        logo: "	https://school.acceede.com/static/media/upload-03.caf2d75c8bf3151327372053d51d1394.svg",
        func: "View History",
        logoBgColor: "#41D38D",
        to: "viewHistory"
    },
    {
        title: "Cashflow",
        amonut: 0.00,
        logo: "",
        func: "Get Cashflow",
        logoBgColor: "#E26E6A",
        to: "getCashflow"
    }
]

export default function HomeDashBoard() {
    const userFirstName = "Temioluwa";  //This is where the UserFirstName will be
    const schoolName = "Petra Schools";   //This is where the user School name will be

    const today = new Date();

    const month = today.getMonth();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const lastYear = currentYear - 1;

    let term = "";
    let session = "";

    // First Term: September - December
    if (month >= 8) {
        term = "1st";
        session = `${currentYear}/${nextYear}`;
    }

    // Second Term: January - April
    else if (month <= 3) {
        term = "2nd";
        session = `${lastYear}/${currentYear}`;
    }

    // Third Term: May - August
    else {
        term = "3rd";
        session = `${lastYear}/${currentYear}`;
    }

    return (
<section className="dashboard-home">

    <h2 className="dashboard-home-welcome">
        Welcome Back, {userFirstName} 👋
    </h2>

    <div className="dashboard-home-intro">

        <p className="dashboard-home-description">
            Here's the latest activity happening at {schoolName}.
        </p>

        <h3 className="dashboard-home-session">
            {term} Term • {session} Academic Session
        </h3>

    </div>


    <div className="dashboard-home-summary-cards">

        {
            dgd.map((item, index) => (

                <div className="dashboard-home-summary-card">

                    <div className="dashboard-home-card-top">

                        <div className="dashboard-home-card-content">

                            <h2 className="dashboard-home-card-title">
                                {item.title}
                            </h2>

                            <h3 className="dashboard-home-card-amount">
                                {item.amonut}
                            </h3>

                        </div>


                        <img
                            className="dashboard-home-card-icon"
                            src={item.logo}
                            alt="logo"
                            style={{backgroundColor: item.logoBgColor}}
                        />

                    </div>


                    <NavLink
                        className="dashboard-home-card-action"
                        to={item.to}
                    >
                        {item.func}
                    </NavLink>

                </div>

            ))
        }

    </div>

</section>
    );
}