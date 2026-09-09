import "../../Styles/components/Footer.css";
import { NavLink } from "react-router-dom";

const NuvoraLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3L2 8l10 5 10-5-10-5z" fill="currentColor" />
        <path d="M6.5 11.2c-.2.1-.5.3-.5.6v2.2c0 .7.9 1.6 2.8 2.6 1.8.9 4.2 1.4 6.2 1.4s4.4-.5 6.2-1.4c1.9-1 2.8-1.9 2.8-2.6v-2.2c0-.3-.3-.5-.5-.6L12 15l-5.5-3.8z" fill="currentColor" opacity=".95" />
        <path d="M12 4.2v6.2M12 9.8l3 1" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const footerGroups = [
    {
        title: "Product",
        links: [
            ["For Schools", "/schools"],
            ["For Parents", "/parents"],
            ["For Students", "/students"],
            ["Solutions", "/solutions"],
        ],
    },
    {
        title: "Company",
        links: [
            ["About Nuvora", "/about"],
            ["Contact", "/contact"],
            ["Get Started", "/get-started"],
        ],
    },
];


export default function Footer(){


    return(
        <div className="footer">
        <div className="footer-1-section">
            <div className="footer-1-section-1">
                <h2><span className="sch"><NuvoraLogo /></span>Nuvora</h2>
                <p>The school operating system for coordinating operations, finance, learning, and communication in one clear workspace.</p>
            </div>

            <div className="footer-1-section-2">
                {
                    footerGroups.map((item) => (
                        <div className="type" key={item.title}>
                            <h2>{item.title}</h2>
                            <div className="type-info">
                                {item.links.map(([label, path]) => (
                                    <NavLink to={path} key={path}>{label}</NavLink>
                                ))}
                            </div>
                        </div>
                    ))
                }
            </div>
  
        </div>

        <div className="footer-2-section">
            <p>Built for school leaders, staff, teachers, parents, students, and platform administrators.</p>
        </div>

        <div className="footer-3-section">
            <h2>© 2026 Nuvora. All rights reserved.</h2>
        </div>
        </div>
    )
}
