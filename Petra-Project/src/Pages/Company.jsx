import { ArrowRight, Building2, HeartHandshake } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Company.css";

export default function Company() {
  return (
    <main className="company-page">
      <div className="company-page__inner">
        <header className="company-page__hero">
          <p className="company-page__eyebrow">
            The people behind the platform
          </p>
          <h1>
            Building better <em>school days.</em>
          </h1>
          <p className="company-page__intro">
            Nuvora exists to give ambitious schools the clarity, time, and
            confidence to do their most important work: helping learners grow.
          </p>
        </header>

        <section className="company-page__grid" aria-label="About Nuvora">
          <article className="company-page__panel">
            <Building2 size={28} aria-hidden="true" />
            <p className="company-page__label">Our mission</p>
            <h2>Infrastructure that feels human.</h2>
            <p>
              Schools are complex communities, not spreadsheets. We connect the
              operational details with the people and decisions behind them, so
              every team can move with less friction.
            </p>
          </article>

          <article className="company-page__panel company-page__contact">
            <div>
              <HeartHandshake size={28} aria-hidden="true" />
              <p className="company-page__label">Work with us</p>
              <h2>Have a school story to share?</h2>
              <p>Tell us what your community needs next.</p>
            </div>
            <NavLink className="company-page__link" to="/contact">
              Get in touch <ArrowRight size={16} />
            </NavLink>
          </article>
        </section>
      </div>
    </main>
  );
}
