import { User, Mail, Phone, Building2, MapPin, Search, Send } from "lucide-react";
import "../../Styles/Sigin/GetStarted.css";
import { useNavigate } from "react-router-dom"; // 1. Change NavLink to useNavigate
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";

export default function GetStarted() {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const navigate = useNavigate(); // 2. Initialize the navigation hook

  const handleChange = (e) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value
    });
  };

  // 3. Handle submission properly
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents full page reload
    
    // Optional: Add form validation here if needed
    
    navigate("/dashboard"); // Seamless React Router navigation (keeps context intact)
  };

  return (
    <section className="gs">
      {/* HERO */}
      <div className="gs-hero">
        <h2 className="gs-title">JOIN THE FUTURE</h2>
        <h3 className="gs-subtitle">Request <span>Dashboard Access</span></h3>
        <p className="gs-description">
          Transform your institution with an AI-powered operating system.
          Fill out the form below to get started.
        </p>
      </div>

      {/* 4. WRAP ALL INPUTS IN A FORM TAG */}
      <form onSubmit={handleSubmit} className="gs-form">
        <h2 className="gs-sectionTitle">Contact Details</h2>

        {/* FULL NAME */}
        <div className="gs-field">
          <label>First Name</label>
          <div className="gs-inputWrapper">
            <User className="gs-icon" />
            <input name="firstName" type="text" placeholder="Enter your first name" value={userInfo.firstName} onChange={handleChange} required />
          </div>
        </div>

        <div className="gs-field">
          <label>Last Name</label>
          <div className="gs-inputWrapper">
            <User className="gs-icon" />
            <input name="lastName" type="text" placeholder="Enter your Last name" value={userInfo.lastName} onChange={handleChange} required />
          </div>
        </div>

        {/* EMAIL */}
        <div className="gs-field">
          <label>Email Address</label>
          <div className="gs-inputWrapper">
            <Mail className="gs-icon" />
            {/* Added missing name attribute */}
            <input name="email" type="email" placeholder="name@example.com" value={userInfo.email} onChange={handleChange} required />
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
            <input name="institution" type="text" placeholder="e.g Grace Schools" value={userInfo.institution} onChange={handleChange} required />
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

        {/* 5. CHANGED TO AN ACTUAL BUTTON TYPE="SUBMIT" */}
        <button type="submit" className="gs-button" style={{ border: 'none', cursor: 'pointer' }}>
          Submit Request <Send />
        </button>
      </form>
    </section>
  );
}
