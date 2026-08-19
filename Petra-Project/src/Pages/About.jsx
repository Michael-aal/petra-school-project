import { ArrowUpRight, Code, Cpu, Globe, Heart, Layers, Lightbulb, TrendingUp, Users } from "lucide-react";
import "../Styles/about.css";

export default function About() {
  return (
    <main className="nuvora-about">
      
      {/* =====================================================
          1. HERO
      ===================================================== */}
      <section className="about-hero section">
        <div className="about-hero__glow" />
        <div className="container">
          <div className="section-label">
            <span>00</span> About Nuvora
          </div>
          <h1>
            We are building the <br />
            <span>operating system</span> for <br />
            African education.
          </h1>
          <p className="about-hero__text">
            Nuvora is the infrastructure that helps schools operate smarter, 
            move faster, and create better outcomes for every learner. 
            From the first payment to the final classroom insight.
          </p>
        </div>
      </section>

      {/* =====================================================
          2. STORY
      ===================================================== */}
      <section className="about-story section">
        <div className="container about-story__grid">
          <div className="section-label sticky-label">
            <span>01</span> Our Beginning
          </div>
          <div className="about-story__content">
            <h2>We started with a payment problem. <br/>We found a much bigger one.</h2>
            <div className="story-copy">
              <p>In 2022, we recognized a problem countless African families faced every day: the cost and complexity of education was becoming a barrier to opportunity.</p>
              <p>We began by building a flexible payment platform. But as we worked closer with schools, something became clear. Payments were only one part of the problem.</p>
              <p>Schools were managing finance, attendance, results, assessments, communication, and administration across disconnected tools and manual processes. We knew we had to build something entirely new.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          3. PLATFORM
      ===================================================== */}
      <section className="about-platform section">
        <div className="container">
          <div className="section-intro">
            <div className="section-label"><span>02</span> What We Build</div>
            <h2>One platform. <span>Entire school.</span></h2>
          </div>
          <div className="platform-list">
            <div className="platform-row">
              <span className="platform-row__number">01</span>
              <div className="platform-row__main">
                <h3>Financial Infrastructure</h3>
                <p>Fee collection, payment tracking, reconciliation, budgeting, and financial visibility built into a single operating layer.</p>
              </div>
              <span className="platform-row__tag">FIN</span>
            </div>
            <div className="platform-row">
              <span className="platform-row__number">02</span>
              <div className="platform-row__main">
                <h3>Academic Operations</h3>
                <p>Attendance, results, assessments, CBT, academic workflows, and the systems teachers use every single day.</p>
              </div>
              <span className="platform-row__tag">ACAD</span>
            </div>
            <div className="platform-row">
              <span className="platform-row__number">03</span>
              <div className="platform-row__main">
                <h3>Intelligent Insights</h3>
                <p>AI and analytics that turn raw school data into useful, actionable information for administrators and decision-makers.</p>
              </div>
              <span className="platform-row__tag">AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          4. EVOLUTION
      ===================================================== */}
      <section className="about-evolution section">
        <div className="container about-evolution__grid">
          <div className="about-evolution__timeline">
            <div className="timeline-item">
              <span>2022</span>
              <div>
                <strong>Payments</strong>
                <p>Making school payments simpler and more accessible.</p>
              </div>
            </div>
            <div className="timeline-item timeline-item--active">
              <span>2024</span>
              <div>
                <strong>School Operations</strong>
                <p>Expanding from payments into the core systems schools depend on.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span>NOW</span>
              <div>
                <strong>Education OS</strong>
                <p>Building the intelligent, unified infrastructure for African education.</p>
              </div>
            </div>
          </div>
          <div className="about-evolution__content">
            <div className="section-label"><span>03</span> The Evolution</div>
            <h2>From payments <span>to an operating system.</span></h2>
            <p>Nuvora evolved because schools needed more than a payment processor. They needed a system that understood how their entire organization worked.</p>
            <p>Our approach is deliberately African. We design for mobile-first families, imperfect connectivity, local payment realities, and the operational complexity schools actually face.</p>
            <div className="evolution-note">
              <span>"</span>
              <p>We don't build technology for an imaginary school. We build for the schools that exist today.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          5. INNOVATION (Bento Grid)
      ===================================================== */}
      <section className="about-innovation section">
        <div className="container">
          <div className="section-intro">
            <div className="section-label"><span>04</span> Innovation</div>
            <div>
              <h2>Turning complexity <span>into leverage.</span></h2>
              <p>The goal isn't to add more software to schools. It's to remove friction.</p>
            </div>
          </div>
          <div className="innovation-grid">
            <div className="innovation-item innovation-item--featured">
              <div className="innovation-item__meta">
                <span>01 / ASSESSMENTS</span>
                <span className="tag">CBT</span>
              </div>
              <h3>Digital assessments without the administrative burden.</h3>
              <p>Helping schools move from paper-based assessments into secure, scalable digital examination workflows.</p>
            </div>
            <div className="innovation-item">
              <div className="innovation-item__meta">
                <span>02 / INTELLIGENCE</span>
                <span className="tag">AI</span>
              </div>
              <h3>School data that actually helps people decide.</h3>
              <p>Transforming raw information into useful signals for school leaders.</p>
            </div>
            <div className="innovation-item">
              <div className="innovation-item__meta">
                <span>03 / PAYMENTS</span>
                <span className="tag">FIN</span>
              </div>
              <h3>Financial infrastructure designed around schools.</h3>
              <p>Payments, visibility, and reconciliation working together seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          6. IMPACT
      ===================================================== */}
      <section className="about-impact section">
        <div className="container">
          <div className="section-intro">
            <div className="section-label"><span>05</span> Impact</div>
            <h2>Built to create <span>measurable change.</span></h2>
          </div>
          <div className="impact-grid">
            <div className="impact-item">
              <span className="impact-value">₦2.4B+</span>
              <p>in administrative and back-office savings generated</p>
            </div>
            <div className="impact-item">
              <span className="impact-value">15,000+</span>
              <p>hours of teacher busywork eliminated annually</p>
            </div>
            <div className="impact-item">
              <span className="impact-value">500K+</span>
              <p>digital assessments securely processed</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          7. PEOPLE (With Photo Placeholders)
      ===================================================== */}
      <section className="about-people section">
        <div className="container about-people__grid">
          <div className="about-people__intro">
            <div className="section-label"><span>06</span> The People</div>
            <h2>Small team. <span>Serious ambition.</span></h2>
            <p>We're builders, operators, designers, strategists, engineers, and problem-solvers united by one belief: African education deserves world-class infrastructure.</p>
          </div>
          <div className="people-list">
            {/* Founder / Lead Dev Placeholder 1 */}
            <div className="people-row">
              <div className="people-photo">
                <Users size={24} />
                <span>Photo</span>
              </div>
              <div className="people-info">
                <span>01</span>
                <div>
                  <strong>Product & Engineering</strong>
                  <p>Creating experiences schools and families actually enjoy using.</p>
                </div>
              </div>
            </div>
            {/* Founder / Lead Dev Placeholder 2 */}
            <div className="people-row">
              <div className="people-photo">
                <Code size={24} />
                <span>Photo</span>
              </div>
              <div className="people-info">
                <span>02</span>
                <div>
                  <strong>Systems Architecture</strong>
                  <p>Building reliable infrastructure capable of supporting complex ecosystems.</p>
                </div>
              </div>
            </div>
            {/* Team Placeholder 3 */}
            <div className="people-row">
              <div className="people-photo">
                <Cpu size={24} />
                <span>Photo</span>
              </div>
              <div className="people-info">
                <span>03</span>
                <div>
                  <strong>Data & AI</strong>
                  <p>Turning education data into practical, actionable intelligence.</p>
                </div>
              </div>
            </div>
            {/* Team Placeholder 4 */}
            <div className="people-row">
              <div className="people-photo">
                <Heart size={24} />
                <span>Photo</span>
              </div>
              <div className="people-info">
                <span>04</span>
                <div>
                  <strong>Customer Success</strong>
                  <p>Making sure schools get measurable value from everything we build.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          8. RECOGNITION
      ===================================================== */}
      <section className="about-recognition section">
        <div className="container">
          <div className="section-intro">
            <div className="section-label"><span>07</span> Recognition</div>
            <h2>Progress worth noting.</h2>
          </div>
          <div className="recognition-list">
            <div className="recognition-row">
              <span className="rec-year">2025</span>
              <div className="rec-content">
                <strong>Wema Bank Hackaholics Accelerator</strong>
                <p>Selected as a top fintech/edtech venture for the prestigious accelerator program.</p>
              </div>
            </div>
            <div className="recognition-row">
              <span className="rec-year">GLOBAL</span>
              <div className="rec-content">
                <strong>Harvard Innovation Labs & AWS NextGen</strong>
                <p>Selected as one of 25 global ventures for the inaugural NextGen Accelerator.</p>
              </div>
            </div>
            <div className="recognition-row">
              <span className="rec-year">IMPACT</span>
              <div className="rec-content">
                <strong>Trusted by Leading Institutions</strong>
                <p>Partnered with top schools and processed millions in school fees securely.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          9. CULTURE
      ===================================================== */}
      <section className="about-culture section">
        <div className="container">
          <div className="section-intro section-intro--split">
            <div className="section-label"><span>08</span> Culture</div>
            <div>
              <h2>How we <span>work.</span></h2>
              <p>The environment determines the quality of the work.</p>
            </div>
          </div>
          <div className="culture-grid">
            <div className="culture-card">
              <span>01</span>
              <h3>Move Fast</h3>
              <p>We value momentum, ownership, and learning quickly from real-world feedback.</p>
            </div>
            <div className="culture-card">
              <span>02</span>
              <h3>Think Deeply</h3>
              <p>Fast execution is only useful when paired with thoughtful, long-term decisions.</p>
            </div>
            <div className="culture-card">
              <span>03</span>
              <h3>Stay Curious</h3>
              <p>The best solutions often come from questions nobody else thought to ask.</p>
            </div>
            <div className="culture-card">
              <span>04</span>
              <h3>Build Together</h3>
              <p>Strong products come from strong, ego-free collaboration across disciplines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          10. FUTURE
      ===================================================== */}
      <section className="about-future section">
        <div className="container about-future__content">
          <div className="section-label"><span>09</span> What's Next</div>
          <h2>The future of African <span>education is being built.</span></h2>
          <p className="future-description">
            Our vision is to become the operating system powering schools across Africa — from the first payment to the final classroom insight.
          </p>
          <div className="future-list">
            <div><span>01</span> Advanced AI tutoring systems</div>
            <div><span>02</span> Predictive analytics for student outcomes</div>
            <div><span>03</span> Pan-African payment infrastructure</div>
            <div><span>04</span> Virtual classroom technologies</div>
          </div>
        </div>
      </section>

      {/* =====================================================
          11. FINAL CTA
      ===================================================== */}
      <section className="about-cta section">
        <div className="about-cta__glow" />
        <div className="container">
          <div className="about-cta__card">
            <div className="about-cta__top">
              <span className="about-cta__label">
                <span className="about-cta__dot" />
                The next chapter
              </span>
              <span className="about-cta__mono">NUVORA / 2026</span>
            </div>
            <div className="about-cta__content">
              <h2>Let's build the <span>future of school</span> infrastructure.</h2>
              <p>Nuvora is building the infrastructure that helps African schools operate smarter, move faster, and create better outcomes for every learner.</p>
              <div className="about-cta__actions">
                <a href="mailto:hello@nuvora.school" className="about-cta__primary">
                  Talk to Nuvora <ArrowUpRight size={16} />
                </a>
                <a href="/" className="about-cta__secondary">
                  Explore the platform <ArrowUpRight size={16} />
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
}