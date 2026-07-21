
import { NavLink } from "react-router-dom";
import { solutionGroups } from "../pages/solutions/solutionData";

export default function Solution() {
  return (
    <section className="solution-index">
      <div className="solution-index-hero">
        <p className="solution-index-kicker">Solutions</p>
        <h1>Choose the right Petra workflow</h1>
        <p>
          Explore every module in the dropdown navigation. Each route is a dedicated landing page with the same
          responsive SaaS hierarchy.
        </p>
      </div>
      <div className="solution-index-grid">
        {solutionGroups.map((group) => (
          <div key={group.header} className="solution-index-group">
            <h2>{group.header}</h2>
            <div className="solution-index-links">
              {group.items.map((item) => (
                <NavLink key={item.path} to={item.path}>
                  <span>{item.title}</span>
                  <small>{item.desc}</small>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
