import "../../Styles/components/Footer.css";
import { School } from "lucide-react";
import { NavLink } from "react-router-dom";

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
                <h2><School size={34} className="sch" />Nuvora</h2>
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
