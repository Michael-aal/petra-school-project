import "./StudentPaymentPage.css";

const About = () => {
  return (
    <main className="nuvora-about">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="about-hero">
        <div className="container">

          <div className="about-hero__top">
            <div className="eyebrow">
              <span className="eyebrow__dot" />
              About Nuvora
            </div>

            <span className="hero-code">
              NUVORA / EDUCATION OS
            </span>
          </div>

          <div className="about-hero__content">
            <h1>
              Building the
              <span> infrastructure </span>
              behind better schools.
            </h1>

            <p>
              Nuvora is Africa's modern operating system for
              academic excellence — bringing finance, academics,
              operations, and learning into one intelligent platform.
            </p>
          </div>

          <div className="about-hero__bottom">
            <span>Founded 2022</span>
            <span>Built for Africa</span>
            <span>Education × Technology</span>
          </div>

        </div>
      </section>


      {/* =====================================================
          INTRODUCTION
      ===================================================== */}
      <section className="about-story section">
        <div className="container about-story__grid">

          <div className="section-label">
            <span>01</span>
            Why we exist
          </div>

          <div className="about-story__content">

            <h2>
              We started with
              <span> payments.</span>
              <br />
              We discovered a much
              <br />
              bigger problem.
            </h2>

            <div className="story-copy">
              <p>
                In 2022, we recognized a problem countless African
                families faced every day: the cost and complexity of
                education was becoming a barrier to opportunity.
              </p>

              <p>
                We began by building a flexible payment platform.
                But working closely with schools revealed something
                much larger.
              </p>

              <p>
                Schools were managing finance, attendance, results,
                assessments, communication, and administration across
                disconnected tools and manual processes.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          WHAT NUVORA BUILDS
      ===================================================== */}
      <section className="about-platform section">
        <div className="container">

          <div className="section-intro">
            <div className="section-label">
              <span>02</span>
              What we build
            </div>

            <div>
              <h2>
                One operating layer
                <span> for the entire school.</span>
              </h2>

              <p>
                Nuvora connects the systems schools depend on every
                day, replacing fragmented workflows with a single
                source of truth.
              </p>
            </div>
          </div>

          <div className="platform-list">

            <article className="platform-row">
              <span className="platform-row__number">01</span>

              <div className="platform-row__main">
                <h3>Financial Infrastructure</h3>

                <p>
                  Fee collection, payment tracking, reconciliation,
                  budgeting, and financial visibility.
                </p>
              </div>

              <span className="platform-row__tag">
                FINANCE
              </span>
            </article>


            <article className="platform-row">
              <span className="platform-row__number">02</span>

              <div className="platform-row__main">
                <h3>Academic Operations</h3>

                <p>
                  Attendance, results, assessments, CBT, and the
                  workflows teachers use every day.
                </p>
              </div>

              <span className="platform-row__tag">
                ACADEMICS
              </span>
            </article>


            <article className="platform-row">
              <span className="platform-row__number">03</span>

              <div className="platform-row__main">
                <h3>Intelligent Insights</h3>

                <p>
                  AI and analytics that turn school data into
                  practical information for better decisions.
                </p>
              </div>

              <span className="platform-row__tag">
                INTELLIGENCE
              </span>
            </article>

          </div>

        </div>
      </section>


      {/* =====================================================
          EVOLUTION
      ===================================================== */}
      <section className="about-evolution section">
        <div className="container about-evolution__grid">

          <div className="about-evolution__timeline">

            <div className="timeline-item">
              <span>2022</span>

              <div>
                <strong>Payments</strong>
                <p>
                  Making school payments simpler and more accessible.
                </p>
              </div>
            </div>


            <div className="timeline-item timeline-item--active">
              <span>2024</span>

              <div>
                <strong>School Operations</strong>
                <p>
                  Expanding into the systems schools depend on
                  every day.
                </p>
              </div>
            </div>


            <div className="timeline-item">
              <span>NOW</span>

              <div>
                <strong>Education OS</strong>
                <p>
                  Building the intelligent infrastructure for
                  African education.
                </p>
              </div>
            </div>

          </div>


          <div className="about-evolution__content">

            <div className="section-label">
              <span>03</span>
              The evolution
            </div>

            <h2>
              From payments
              <span> to an operating system.</span>
            </h2>

            <p>
              Nuvora evolved because schools needed more than a
              payment processor. They needed a system that
              understood how their entire organization worked.
            </p>

            <p>
              Our approach is deliberately African. We design for
              mobile-first families, local payment realities,
              imperfect connectivity, and the operational complexity
              schools actually face.
            </p>

            <div className="evolution-note">
              <span>"</span>

              <p>
                We don't build technology for an imaginary school.
                We build for the schools that exist today.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          INNOVATION
      ===================================================== */}
      <section className="about-innovation section">
        <div className="container">

          <div className="section-intro">
            <div className="section-label">
              <span>04</span>
              Innovation
            </div>

            <div>
              <h2>
                Turning complexity
                <span> into leverage.</span>
              </h2>

              <p>
                The goal isn't to add more software to schools.
                It's to remove friction.
              </p>
            </div>
          </div>


          <div className="innovation-grid">

            <article className="innovation-item innovation-item--featured">
              <div className="innovation-item__meta">
                <span>01 / ASSESSMENTS</span>
                <span>CBT</span>
              </div>

              <h3>
                Digital assessments without the administrative burden.
              </h3>

              <p>
                Helping schools move from paper-based assessments
                into secure, scalable digital examination workflows.
              </p>
            </article>


            <article className="innovation-item">
              <div className="innovation-item__meta">
                <span>02 / INTELLIGENCE</span>
                <span>AI</span>
              </div>

              <h3>
                School data that actually helps people decide.
              </h3>

              <p>
                Transforming information into useful signals for
                school leaders and educators.
              </p>
            </article>


            <article className="innovation-item">
              <div className="innovation-item__meta">
                <span>03 / PAYMENTS</span>
                <span>FIN</span>
              </div>

              <h3>
                Financial infrastructure designed around schools.
              </h3>

              <p>
                Payments, visibility, and reconciliation working
                together instead of across disconnected systems.
              </p>
            </article>

          </div>

        </div>
      </section>


      {/* =====================================================
          IMPACT
      ===================================================== */}
      <section className="about-impact section">
        <div className="container">

          <div className="section-label">
            <span>05</span>
            Impact
          </div>

          <h2 className="impact-title">
            Built to create
            <span> measurable change.</span>
          </h2>

          <div className="impact-grid">

            <div className="impact-item">
              <span className="impact-value">₦M+</span>

              <p>
                in administrative and back-office savings
              </p>
            </div>


            <div className="impact-item">
              <span className="impact-value">10K+</span>

              <p>
                hours of teacher busywork eliminated
              </p>
            </div>


            <div className="impact-item">
              <span className="impact-value">100K+</span>

              <p>
                digital assessments taken
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          PEOPLE
      ===================================================== */}
      <section className="about-people section">
        <div className="container about-people__grid">

          <div>

            <div className="section-label">
              <span>06</span>
              The people
            </div>

            <h2>
              Small team.
              <span> Serious ambition.</span>
            </h2>

            <p>
              We're builders, operators, designers, strategists,
              engineers, and problem-solvers united by one belief:
              African education deserves world-class infrastructure.
            </p>

          </div>


          <div className="people-list">

            <div className="people-row">
              <span>01</span>

              <div>
                <strong>Product & Design</strong>

                <p>
                  Creating experiences schools and families
                  actually enjoy using.
                </p>
              </div>
            </div>


            <div className="people-row">
              <span>02</span>

              <div>
                <strong>Engineering</strong>

                <p>
                  Building reliable infrastructure capable of
                  supporting complex school ecosystems.
                </p>
              </div>
            </div>


            <div className="people-row">
              <span>03</span>

              <div>
                <strong>Data & AI</strong>

                <p>
                  Turning education data into practical intelligence.
                </p>
              </div>
            </div>


            <div className="people-row">
              <span>04</span>

              <div>
                <strong>Customer Success</strong>

                <p>
                  Making sure schools get measurable value from
                  everything we build.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          RECOGNITION
      ===================================================== */}
      <section className="about-recognition section">
        <div className="container">

          <div className="section-intro">
            <div className="section-label">
              <span>07</span>
              Recognition
            </div>

            <div>
              <h2>
                Progress worth
                <span> noting.</span>
              </h2>
            </div>
          </div>


          <div className="recognition-list">

            <div className="recognition-row">
              <span>2025</span>

              <p>
                Selected for the Wema Bank Hackaholics Accelerator.
              </p>
            </div>


            <div className="recognition-row">
              <span>GLOBAL</span>

              <p>
                Selected by Harvard Innovation Labs & AWS as one
                of 25 ventures for the inaugural NextGen Accelerator.
              </p>
            </div>


            <div className="recognition-row">
              <span>IMPACT</span>

              <p>
                Partnered with institutions and processed millions
                in school fees.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          CULTURE
      ===================================================== */}
      <section className="about-culture section">
        <div className="container">

          <div className="section-intro">
            <div className="section-label">
              <span>08</span>
              Culture
            </div>

            <div>
              <h2>
                How we
                <span> work.</span>
              </h2>

              <p>
                The environment determines the quality of the work.
              </p>
            </div>
          </div>


          <div className="culture-list">

            <div className="culture-row">
              <span>01</span>

              <h3>Move Fast</h3>

              <p>
                We value momentum, ownership, and learning quickly.
              </p>
            </div>


            <div className="culture-row">
              <span>02</span>

              <h3>Think Deeply</h3>

              <p>
                Fast execution is useful only when paired with
                thoughtful decisions.
              </p>
            </div>


            <div className="culture-row">
              <span>03</span>

              <h3>Stay Curious</h3>

              <p>
                The best solutions often come from questions nobody
                thought to ask.
              </p>
            </div>


            <div className="culture-row">
              <span>04</span>

              <h3>Build Together</h3>

              <p>
                Strong products come from strong collaboration.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          FUTURE
      ===================================================== */}
      <section className="about-future section">
        <div className="container">

          <div className="section-label">
            <span>09</span>
            What's next
          </div>

          <h2>
            The future of African
            <span> education is being built.</span>
          </h2>

          <p className="future-description">
            Our vision is to become the operating system powering
            schools across Africa — from the first payment to the
            final classroom insight.
          </p>


          <div className="future-list">

            <div>
              <span>01</span>
              Advanced AI tutoring systems
            </div>

            <div>
              <span>02</span>
              Predictive analytics for student outcomes
            </div>

            <div>
              <span>03</span>
              Pan-African payment infrastructure
            </div>

            <div>
              <span>04</span>
              Virtual classroom technologies
            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          CTA
      ===================================================== */}
      <section className="about-cta">

        <div className="about-cta__glow" />

        <div className="container">

          <div className="about-cta__card">

            <div className="about-cta__top">

              <span className="about-cta__label">
                <span className="about-cta__dot" />
                The next chapter
              </span>

              <span className="about-cta__mono">
                NUVORA / 2026
              </span>

            </div>


            <div className="about-cta__content">

              <h2>
                Let's build the
                <span> future of school </span>
                infrastructure.
              </h2>

              <p>
                Nuvora is building the infrastructure that helps
                African schools operate smarter, move faster, and
                create better outcomes for every learner.
              </p>


              <div className="about-cta__actions">

                <a
                  href="mailto:hello@nuvora.school"
                  className="about-cta__primary"
                >
                  Talk to Nuvora
                  <span>↗</span>
                </a>

                <a
                  href="/"
                  className="about-cta__secondary"
                >
                  Explore the platform
                  <span>→</span>
                </a>

              </div>

            </div>


            <div className="about-cta__footer">
              <span>Built in Africa</span>
              <span>Designed for scale</span>
              <span>Made for education</span>
            </div>

          </div>

        </div>
      </section>

    </main>
  );
};

export default About;