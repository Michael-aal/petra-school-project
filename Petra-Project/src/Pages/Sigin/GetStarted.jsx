import { User, Mail, Phone, Building2, MapPin, Search, Send } from "lucide-react";
import "../../Styles/Sigin/GetStarted.css";
import { NavLink } from "react-router-dom";

export default function GetStarted() {
  return (
    <section className="gs">

      {/* HERO */}
      <div className="gs-hero">

        <h2 className="gs-title">
          JOIN THE FUTURE
        </h2>

        <h3 className="gs-subtitle">
          Request <span>Dashboard Access</span>
        </h3>

        <p className="gs-description">
          Transform your institution with an AI-powered operating system.
          Fill out the form below to get started.
        </p>

      </div>

      {/* FORM */}
      <div className="gs-form">

        <h2 className="gs-sectionTitle">Contact Details</h2>

        {/* FULL NAME */}
        <div className="gs-field">
          <label>Full Name</label>

          <div className="gs-inputWrapper">
            <User className="gs-icon" />
            <input type="text" placeholder="Enter your full name" />
          </div>
        </div>

        {/* EMAIL */}
        <div className="gs-field">
          <label>Email Address</label>

          <div className="gs-inputWrapper">
            <Mail className="gs-icon" />
            <input type="email" placeholder="name@example.com" />
          </div>
        </div>

        {/* PHONE */}
        <div className="gs-field">
          <label>Phone Number</label>

          <div className="gs-inputWrapper">
            <Phone className="gs-icon" />
            <input type="tel" placeholder="+234..." />
          </div>
        </div>

        {/* INSTITUTION */}
        <h2 className="gs-sectionTitle">Institution Information</h2>

        <div className="gs-field">
          <label>Name of Institution</label>

          <div className="gs-inputWrapper">
            <Building2 className="gs-icon" />
            <input type="text" placeholder="e.g Grace Schools" />
          </div>
        </div>

        <div className="gs-grid">

          <div className="gs-field">
            <label>State</label>

            <div className="gs-inputWrapper">
              <MapPin className="gs-icon" />
              <input type="text" placeholder="Select state" />
            </div>
          </div>

          <div className="gs-field">
            <label>City</label>

            <input type="text" placeholder="e.g Sango" />
          </div>

        </div>

        <div className="gs-field">
          <label>How did you hear about us?</label>

          <div className="gs-inputWrapper">
            <Search className="gs-icon" />
            <input type="text" placeholder="LinkedIn, Friend, Event..." />
          </div>
        </div>

        {/* SUBMIT */}
        <NavLink to="/dashboard" className="gs-button">
          Submit Request <Send />
        </NavLink>

      </div>

    </section>
  );
}