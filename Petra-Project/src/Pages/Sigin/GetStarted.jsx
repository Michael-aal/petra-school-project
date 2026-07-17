import { User, Mail, Phone, Building2, MapPin, Search, Send } from "lucide-react";
import "../../Styles/Sigin/GetStarted.css";
import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";

export default function GetStarted() {

  const {userInfo, setUserInfo} = useContext(UserContext);

  const handleChange = (e) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value
    });
  };

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
          <label>FirstName</label>

          <div className="gs-inputWrapper">
            <User className="gs-icon" />
            <input name="firstName" type="text" placeholder="Enter your first name" value={userInfo.firstName} onChange={handleChange} />
          </div>
        </div>

        <div className="gs-field">
          <label>LastName</label>

          <div className="gs-inputWrapper">
            <User className="gs-icon" />
            <input name="lastName" type="text" placeholder="Enter your Last name" value={userInfo.lastName} onChange={handleChange} />
          </div>
        </div>

        {/* EMAIL */}
        <div className="gs-field">
          <label>Email Address</label>

          <div className="gs-inputWrapper">
            <Mail className="gs-icon" />
            <input  type="text" placeholder="name@example.com" value={userInfo.email} onChange={handleChange} />
          </div>
        </div>

        {/* PHONE */}
        <div className="gs-field">
          <label>Phone Number</label>

          <div className="gs-inputWrapper">
            <Phone className="gs-icon" />
            <input name="phoneNumber" type="tel" placeholder="+234..." value={userInfo.phoneNumber} onChange={handleChange} />
          </div>
        </div>

        {/* INSTITUTION */}
        <h2 className="gs-sectionTitle">Institution Information</h2>

        <div className="gs-field">
          <label>Name of Institution</label>

          <div className="gs-inputWrapper">
            <Building2 className="gs-icon" />
            <input name="institution" type="text" placeholder="e.g Grace Schools" value={userInfo.institution} onChange={handleChange} />
          </div>
        </div>

        <div className="gs-grid">

          <div className="gs-field">
            <label>State</label>

            <div className="gs-inputWrapper">
              <MapPin className="gs-icon" />
              <input name="state" type="text" placeholder="Select state" value={userInfo.state} onChange={handleChange} />
            </div>
          </div>

          <div className="gs-field">
            <label>City</label>

            <input name="city" type="text" placeholder="e.g Sango" value={userInfo.city} onChange={handleChange} />
          </div>

        </div>

        <div className="gs-field">
          <label>How did you hear about us?</label>

          <div className="gs-inputWrapper">
            <Search className="gs-icon" />
            <input name="referral" type="text" placeholder="LinkedIn, Friend, Event..." value={userInfo.referral} onChange={handleChange} />
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