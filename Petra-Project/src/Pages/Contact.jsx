import "../Styles/Contact.css"
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { NavLink } from "react-router-dom";

const ContantInfo = [
  {
    logo: <Mail />,
    title: "Email Us",
    location: "General Inquiries",
    where: "support@acceede.com",
  },
  {
    logo: <Phone />,
    title: "Call Us",
    location: "Mon-Fri from 9am to 5pm",
    where: "+234 912 207 4867",
  },
  {
    logo: <MapPin />,
    title: "Visit Us",
    location: "Lagos, Nigeria",
    where:
      "TSC Building; Plot 8, The Rock Drive, Off C & I Leasing Drive, Lekki Phase 1, Lagos, Nigeria.",
  },
];

const sendTO = [
  {
    label: "Full Name",
    placeholder: "John Doe",
  },
  {
    label: "Email Address",
    placeholder: "john@example.com",
  },
  {
    label: "Message",
    placeholder: "How can we help you?",
  },
];

const selectTopic = [
  "General Inquiry",
  "School Sales & Partnerships",
  "Technical Support",
  "Feedback",
];

export default function Contaaant() {
  return (
    <section className="ctc-page">

      {/* HEADER */}
      <div className="ctc-header">
        <h2>GET IN TOUCH</h2>
        <h3>We'd Love to Hear from You</h3>
        <p>
          Have a question about our products? Want to schedule a demo for your
          school? We're just a message away.
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ctc-layout">

        {/* LEFT SIDE */}
        <div className="ctc-info">

          <h2>Contact Information</h2>

          {ContantInfo.map((item, index) => (
            <div className="ctc-infoCard" key={index}>
              <div className="ctc-icon">{item.logo}</div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.location}</p>
                <span>{item.where}</span>
              </div>
            </div>
          ))}

          <div className="ctc-supportBox">
            <h3>Need Technical Support?</h3>
            <p>
              Our support team is available to help you with any issues you
              might encounter.
            </p>

            <NavLink to="/" className="ctc-link">
              Visit Help Center <ArrowRight />
            </NavLink>
          </div>

        </div>

        {/* RIGHT SIDE (FORM) */}
        <div className="ctc-formBox">

          <h2>Send us a Message</h2>
          <p>Fill out the form below and we'll get back to you shortly.</p>

          {/* FIRST ROW (index 0 + 1) */}
          <div className="ctc-row">
            <div className="ctc-field">
              <label>{sendTO[0].label}</label>
              <input placeholder={sendTO[0].placeholder} />
            </div>

            <div className="ctc-field">
              <label>{sendTO[1].label}</label>
              <input placeholder={sendTO[1].placeholder} />
            </div>
          </div>

          {/* DROPDOWN (IN BETWEEN) */}
          <div className="ctc-field">
            <label>Select Topic</label>
            <select>
              <option disabled selected>
                Choose a topic
              </option>
              {selectTopic.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* MESSAGE FIELD (index 2 OUTSIDE) */}
          <div className="ctc-field">
            <label>{sendTO[2].label}</label>
            <textarea placeholder={sendTO[2].placeholder} />
          </div>

          <button className="ctc-btn">
            Send Message <ArrowRight />
          </button>

        </div>
      </div>

    </section>
  );
}