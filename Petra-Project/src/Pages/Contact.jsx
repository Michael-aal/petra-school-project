import { useState } from "react";
import { Mail, Phone, MapPin, ArrowRight, MessageCircle, Info, MessageSquareText } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Styles/Forschool.css";
import "../Styles/Contact.css";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    meta: "General Inquiries",
    detail: "support@acceede.com",
  },
  {
    icon: Phone,
    title: "Call Us",
    meta: "Mon-Fri from 9am to 5pm",
    detail: "+234 912 207 4867",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    meta: "Lagos, Nigeria",
    detail: "TSC Building; Plot 8, The Rock Drive, Off C & I Leasing Drive, Lekki Phase 1, Lagos, Nigeria.",
  },
];

const quickTopics = [
  "General Inquiry",
  "School Sales & Partnerships",
  "Technical Support",
  "Feedback",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });
  return (
    <main className="marketing-page fparent contact-page">
      <section className="marketing-header">
        <span className="marketing-badge">
          <Info size={15} /> CONTACT US
        </span>

        <h1 className="marketing-title">
          We’d love to hear from you. <br />
          <span>Let’s make school operations simpler</span>
        </h1>

        <p className="marketing-description">
          Have a question about our platform, want to schedule a demo, or need help with your school setup?
          We’re here to make the next step feel easy and clear.
        </p>

        <div className="marketing-actions">
          <a href="mailto:support@acceede.com" className="marketing-btn marketing-btn-primary">
            Email Us <ArrowRight size={16} />
          </a>
          <NavLink to="/" className="marketing-btn marketing-btn-secondary">
            Explore Platform
          </NavLink>
        </div>

        <div className="marketing-trust-bar">
          <div className="marketing-trust-item">
            <MessageSquareText size={15} />
            <span>Helpful support team</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Mail size={15} />
            <span>Fast response times</span>
          </div>
          <div className="marketing-trust-divider" />
          <div className="marketing-trust-item">
            <Phone size={15} />
            <span>People-first guidance</span>
          </div>
        </div>
      </section>

      <section className="marketing-section contact-section">
        <div className="section-intro">
          <p className="landing-kicker">Get in touch</p>
          <h2>Talk with our team.</h2>
        </div>

        <div className="contact-grid">
          <div className="contact-card contact-details">
            <h3>Contact Information</h3>

            {contactInfo.map(({ icon: Icon, title, meta, detail }) => (
              <div className="contact-row" key={title}>
                <div className="contact-icon">
                  <Icon size={18} />
                </div>
                <div className="contact-copy">
                  <h4>{title}</h4>
                  <p>{meta}</p>
                  <span>{detail}</span>
                </div>
              </div>
            ))}

            <div className="support-box">
              <h4>Need Technical Support?</h4>
              <p>
                Our support team is available to help you with any issue you may encounter while using the platform.
              </p>
              <NavLink to="/" className="ctc-link">
                Visit Help Center <ArrowRight size={14} />
              </NavLink>
            </div>
          </div>

          <div className="contact-card contact-form-card">
            <h3>Send us a message</h3>
            <p>Fill out the form below and we’ll get back to you shortly.</p>

            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
                const subject = encodeURIComponent(
                  form.topic
                    ? `${form.topic} — ${form.name || "Website visitor"}`
                    : `Website enquiry — ${form.name || "Website visitor"}`,
                );
                const body = encodeURIComponent(
                  [`Name: ${form.name}`, `Email: ${form.email}`, `Topic: ${form.topic}`, "", form.message].join("\n"),
                );
                window.location.href = `mailto:support@acceede.com?subject=${subject}&body=${body}`;
              }}
            >              <div className="contact-field-row">
                <div className="contact-field">
                  <label>Full Name</label>
                  <input type="text" name="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="John Doe" required />
                </div>

                <div className="contact-field">
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="john@example.com" required />
                </div>
              </div>

              <div className="contact-field">
                <label>Select Topic</label>
                <select name="topic" value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} required>
                  <option value="" disabled>
                    Choose a topic
                  </option>
                  {quickTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contact-field">
                <label>Message</label>
                <textarea name="message" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="How can we help you?" required />
              </div>

              <button type="submit" className="marketing-btn marketing-btn-primary cta-btn contact-submit">
                Send Message <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-cta fparent-cta">
        <div className="cta-badge">
          <MessageCircle size={16} />
          <span>We’re here to help</span>
        </div>
        <h2 className="marketing-cta-title">Need a quick walkthrough or a tailored solution for your school?</h2>
        <p className="marketing-cta-text">
          Talk with our team about how Nuvora can support your school operations, communication, and daily workflows.
        </p>
        <div className="marketing-actions">
          <a href="mailto:support@acceede.com" className="marketing-btn marketing-btn-primary cta-btn">
            Send us an email <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </main>
  );
}