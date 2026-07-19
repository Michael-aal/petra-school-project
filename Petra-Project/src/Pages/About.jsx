import "../Styles/about.css";

export default function About() {
  return (
    <>
      {/* HERO SECTION */}

      <section className="about">
        <div className="section1">

          <div className="title">
            <span>ⓘ</span> ABOUT US
          </div>

          <h1 className="context">
            Building the <span className="highlight">Future</span> of
            <br />
            <span className="highlight underline">Education</span> in Africa
          </h1>

          <p className="describe">
            Acceede is Africa's first AI-powered operating system for academic
            excellence, revolutionizing how schools operate from finance to
            learning.
          </p>

        </div>
      </section>

      {/* STORY SECTION */}

      <section className="story">

        <div className="story-container">

          <div className="story-left">

            <div className="story-badge">
              WHERE IT ALL BEGAN
            </div>

            <h2>
              From Payment Platform to
              <br />
              Educational Revolution
            </h2>

            <p>
              In 2022, fueled by a passion to democratize access to learning,
              we recognized a problem that countless African families faced
              daily: the burden of educational expenses was holding back
              brilliant minds.
            </p>

            <p>
              What started as a flexible payment platform evolved into
              something far more ambitious. As we worked with schools, we
              discovered they weren't just struggling with payments—they were
              drowning in administrative complexity.
            </p>

          </div>

          <div className="story-right">

            <div className="timeline-line"></div>

            <div className="timeline-card card1">
              <div className="year">2022</div>

              <div>
                <h3>Acceede is born</h3>
                <span>A payment solution</span>
              </div>
            </div>

            <div className="timeline-card card2">
              <div className="year">2023</div>

              <div>
                <h3>Expansion</h3>
                <span>Solving real problems</span>
              </div>
            </div>

            <div className="timeline-card card3">
              <div className="year">2024</div>

              <div>
                <h3>AI Operating System</h3>
                <span>Powering schools</span>
              </div>
            </div>

          </div>

        </div>

      </section>
    </>
  );
}