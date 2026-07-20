import React from 'react';
import '../Styles/about.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <p className="heading">About us</p>
          <h1>Building the <span className="highlight">Future </span> of <span className="highlight">Education</span> in Africa</h1>
          <p className="hero-subtitle">
            Acceede is Africa's first AI-powered operating system for academic excellence, 
            revolutionizing how schools operate from finance to learning.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="section origin-section">
        <div className="container">
          <h2>From Payment Platform to Educational Revolution</h2>
          <p>
            In 2022, fueled by a passion to democratize access to learning, we recognized a problem 
            that countless African families faced daily: the burden of educational expenses was holding back brilliant minds.
          </p>
          <p>
            What started as a flexible payment platform evolved into something far more ambitious. 
            As we worked with schools, we discovered they weren't just struggling with payments, 
            they were drowning in administrative complexity.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Intelligent Financial Management</h3>
              <p>Automated fee collection and budget tracking</p>
            </div>
            <div className="feature-card">
              <h3>Academic Operations</h3>
              <p>Attendance tracking and result computation</p>
            </div>
            <div className="feature-card">
              <h3>AI-Powered Insights</h3>
              <p>Data-driven decision-making tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Evolution & Difference */}
      <section className="section evolution-section">
        <div className="container">
          <div className="split-layout">
            <div className="text-block">
              <h2>The Evolution: From Payments to Operating System</h2>
              <p>
                In 2024, Acceede transformed from a payment solution into Africa's first AI-powered 
                operating system for academic excellence. We're not just processing payments; 
                we're revolutionizing how African schools operate.
              </p>
              <h3>The Acceede Difference</h3>
              <p>
                What sets us apart isn't just our technology—it's our relentless focus on the African context. 
                We understand that internet connectivity can be spotty, that parents prefer mobile-first solutions, 
                and that schools need systems that work for their unique operational realities.
              </p>
              <p>
                Every feature we build is tested and refined with real African schools, ensuring that 
                we're solving actual problems, not theoretical ones.
              </p>
            </div>
            <div className="innovations-block">
              <h3>Recent Innovations</h3>
              <div className="innovation-card">
                <h4>CBT Platform</h4>
                <p>Helping schools transition from paper assessments to digital evaluations.</p>
              </div>
              <div className="innovation-card">
                <h4>AI Analytics Engine</h4>
                <p>Providing actionable insights for school improvement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Recognition */}
      <section className="section team-section">
        <div className="container">
          <h2>The Engine Behind Innovation</h2>
          <p className="section-intro">
            We're a tight-knit team of builders, dreamers, and problem-solvers united by one vision: 
            transforming education across Africa.
          </p>
          <div className="split-layout">
            <div className="who-we-are">
              <h3>Who We Are</h3>
              <ul>
                <li>Product innovators & design mentors</li>
                <li>Engineering experts building scalable infra</li>
                <li>Business strategists with global experience</li>
                <li>Customer success champions</li>
                <li>Data scientists & AI specialists</li>
              </ul>
            </div>
            <div className="recognition">
              <h3>Recognition & Growth</h3>
              <ul>
                <li>Selected for the Wema Bank Hackaholics Accelerator in 2025.</li>
                <li>Honored by Harvard Innovation Labs & AWS as one of 25 ventures selected for the inaugural NextGen Accelerator across Africa and the US.</li>
                <li>Partnered with leading institutions and processed millions in school fees.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section stats-section">
        <div className="container">
          <h2>Scale and Efficiency</h2>
          <p className="section-intro">
            Acceede is the trusted engine powering Africa's top schools. We deliver guaranteed results 
            on both the balance sheet and the classroom desk.
          </p>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">₦ Millions</span>
              <span className="stat-label">Saved in administrative and back-office overhead</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Hours of teacher busywork and grading eliminated</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">100,000+</span>
              <span className="stat-label">Digital assessments taken, driving student mastery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="section culture-section">
        <div className="container">
          <h2>Our Culture: Innovation Meets Impact</h2>
          <p className="section-intro">
            Working at Acceede means being part of something bigger than yourself.
          </p>
          <div className="culture-grid">
            <div className="culture-card">
              <h3>Rapid Growth</h3>
              <p>In a startup environment, you'll learn more in months than years elsewhere. You'll wear multiple hats and solve complex problems.</p>
            </div>
            <div className="culture-card">
              <h3>Innovation First</h3>
              <p>We encourage experimentation, embrace failure as learning, and celebrate breakthrough thinking.</p>
            </div>
            <div className="culture-card">
              <h3>Mission-Driven</h3>
              <p>Every line of code we write brings us closer to our vision of making quality education accessible to every African child.</p>
            </div>
            <div className="culture-card">
              <h3>Collaborative Spirit</h3>
              <p>We break down silos and build together. From weekly innovation sessions to cross-functional teams.</p>
            </div>
            <div className="culture-card">
              <h3>Career Acceleration</h3>
              <p>Many team members progress from individual contributors to leadership roles. Your growth is our growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section className="section careers-section">
        <div className="container">
          <h2>Join the Movement</h2>
          <p className="section-intro">
            We're actively hiring across multiple roles as we scale our operations:
          </p>
          <div className="roles-grid">
            <div className="role-card">
              <h3>Senior Business Developers</h3>
              <p>Helping more schools discover Acceede</p>
            </div>
            <div className="role-card">
              <h3>Software Engineers</h3>
              <p>Building the next gen of ed-tech</p>
            </div>
            <div className="role-card">
              <h3>Product Managers</h3>
              <p>Shaping features that impact millions</p>
            </div>
            <div className="role-card">
              <h3>Customer Success Specialists</h3>
              <p>Ensuring every school maximizes value</p>
            </div>
          </div>
          <p className="careers-cta">
            If you're passionate about technology, education, and Africa's future, we want to hear from you.
          </p>
        </div>
      </section>

      {/* Future Vision */}
      <section className="section future-section">
        <div className="container">
          <h2>The Future We're Building</h2>
          <p>
            Our vision is audacious: to become the operating system powering every school in Africa. We're working on:
          </p>
          <ul className="future-list">
            <li>Advanced AI tutoring systems</li>
            <li>Predictive analytics for at-risk students</li>
            <li>Pan-African payment infrastructure</li>
            <li>Virtual classroom technologies</li>
          </ul>
          <p className="future-closing">
            The journey from a payment platform to Africa's education operating system has been remarkable, 
            but we're just getting started.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section contact-section">
        <div className="container">
          <h2>Let's Build Together</h2>
          <p>Whether you're a school, parent, professional, or investor—we want to connect with you.</p>
          <div className="contact-details">
            <p><strong>Email:</strong> hi@acceede.com</p>
            <p><strong>Website:</strong> www.acceede.com</p>
            <p><strong>Address:</strong> TSC Building; Plot 8, The Rock Drive, Off C & I Leasing Drive, Lekki Phase 1, Lagos, Nigeria.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;