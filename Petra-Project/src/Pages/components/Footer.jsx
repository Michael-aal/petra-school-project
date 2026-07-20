import { NavLink } from "react-router-dom";
import "../../Styles/components/Footer.css";
import { School, MapPin, Mail, Phone } from "lucide-react";

const footerInfo= [
        {
        title: "Products",
        info1: "For Parents",
info2: "For Schools",
info3: "For Students"
    },
    {
        title: "Company",
        info1: "About Us",
        info2: "Careers",
        info3: "Blog & Articles",
        info4: "Medium"
    },
    {
        title: "Help & Support",
        logo1: <Mail size={20} />,
        info1: "support@acceede.com",
        info2: "sales@acceede.com",
        logo2: <Phone size={20} />,
        info3: "+234 912 207 4867"
    }
]


export default function Footer(){


    return(
        <div className="footer">
        <div className="footer-1-section">
            <div className="footer-1-section-1">
                <h2><School size={34} className="sch" />Petra School Ota</h2>
                <p>Building the operating system for African education. From financial compliance to academic mastery.</p>
                <h3><MapPin size={45} className="sch" />TSC Building; Plot 8, The Rock Drive, Off C & I Leasing Drive, Lekki Phase 1, Lagos, Nigeria.</h3>
            </div>

            <div className="footer-1-section-2">
                {
                    footerInfo.map((item, index) => (
                        <div className="type" key={index}>
                            <h2>{item.title}</h2>
                            <div className="type-info">
                                <h3>{item.logo1 && item.logo1} {item.info1}</h3>
                                <h3>{item.logo1 && item.logo1} {item.info2}</h3>
                                <h3>{item.logo2 && item.logo2} {item.info3}</h3>
                                {item.info4 && <h3>{item.info4}</h3>}
                                
                            </div>
                        </div>
                    ))
                }
            </div>
  
        </div>

        <div className="footer-2-section">
            <p>Acceede is a financial and education technology company, not a bank, we are a technology service developed and powered by Acceede Labs Limited (Acceede). Acceede is duly registered with the Nigerian Corporate Affairs Commission. All financial services are provided by our CBN licensed Banking and Banking-as-a-Services Provider in Nigeria. The Acceede trademarks and all the copyrights in Acceede are wholly owned by Acceede Labs Limited.</p>
        </div>

        <div className="footer-3-section">
            <h2>© 2026 Acceede Inc. All rights reserved.</h2>
            <div className="last-place">
                <h3>Privacy Policy</h3>
                <h3>Terms & Conditions</h3>
            </div>
        </div>
        </div>
    )
}