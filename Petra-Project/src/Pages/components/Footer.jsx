import "../../Styles/components/Footer.css";
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

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <h2>Nuvora</h2>
            <p>
              A simple platform for schools to manage daily work, communication, and records in
              one place.
            </p>
          </div>

          <div className="footer-links">
            {footerGroups.map((group) => (
              <div className="footer-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.links.map(([label, path]) => (
                  <NavLink to={path} key={path}>
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Nuvora</span>
          <span>All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
