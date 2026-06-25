import { NavLink } from "react-router-dom";

export default function Footer(){


    return(
        <div>
        <div className="">
            <div className="">
                <h2>Petra School Ota</h2>
                <p>Building the operating system for African education. From financial compliance to academic mastery.</p>
                <h3>TSC Building; Plot 8, The Rock Drive, Off C & I Leasing Drive, Lekki Phase 1, Lagos, Nigeria.</h3>
            </div>
            <div>
                <h2>Company</h2>

                <NavLink to="/about" >About Us</NavLink>
                <NavLink to="/careers" >Careers</NavLink>
                <NavLink to="/blog" >Blog & Articles</NavLink>
                <NavLink to="/" >Medium</NavLink>
            </div>

            <div className="">
                <h2>Products</h2>

                <NavLink to="/for-parents">For Parents</NavLink>
                <NavLink to="/for-schools">For Schools</NavLink>
                <NavLink to="/for-students">For Students</NavLink>
            </div>

            <div className="">
                <h2>Help & Support</h2>
                <h3>support@acceede.com</h3>
                <h3>sales@acceede.com</h3>
                <h3>+234 912 207 4867</h3>
            </div>
        </div>

        <div className="">
            <p>Acceede is a financial and education technology company, not a bank, we are a technology service developed and powered by Acceede Labs Limited (Acceede). Acceede is duly registered with the Nigerian Corporate Affairs Commission. All financial services are provided by our CBN licensed Banking and Banking-as-a-Services Provider in Nigeria. The Acceede trademarks and all the copyrights in Acceede are wholly owned by Acceede Labs Limited.</p>
        </div>

        <div className="">
            <h2>© 2026 Acceede Inc. All rights reserved.</h2>
            <div className="">
                <h3>Privacy Policy</h3>
                <h3>Terms & Conditions</h3>
            </div>
        </div>
        </div>
    )
}