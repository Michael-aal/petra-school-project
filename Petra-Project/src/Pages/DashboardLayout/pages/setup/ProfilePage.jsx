import { useContext, useRef } from "react";
import { Building2, Save, Upload } from "lucide-react";
import "../page-styles/ProfilePage.css";
import { UserContext } from "../../../../context/UserContext";
import UserAvatar from "../../../../components/UserAvatar";

export default function ProfilePage() {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const fileInputRef = useRef(null);

  const profile = {
    schoolName: userInfo?.institution || "Petra International School",
    schoolCode: userInfo?.schoolCode || "PIS-0042",
    phoneNumber: userInfo?.phoneNumber || "+234 801 234 5678",
    email: userInfo?.email || "admin@petra.edu.ng",
    address: userInfo?.address || "12 Education Road, Abuja, FCT, Nigeria",
    state: userInfo?.state || "FCT Abuja",
    country: userInfo?.country || "Nigeria",
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUserInfo((current) => {
        const updatedUser = {
          ...current,
          profileImage: reader.result,
        };

        window.localStorage.setItem("petra_user_info", JSON.stringify(updatedUser));
        return updatedUser;
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="dashboard-page profile-page">
      <section className="profile-page-hero">
        <div className="profile-page-hero-icon" aria-hidden="true">
          <Building2 size={20} />
        </div>
        <div>
          <h1>School Profile</h1>
          <p>Manage your school&apos;s identity and contact information</p>
        </div>
      </section>

      <section className="profile-page-grid">
        <div className="profile-card profile-card-main">
          <h2 className="profile-card-title">Basic Information</h2>

          <div className="profile-fields-grid">
            <label className="profile-field">
              <span>School Name</span>
              <input type="text" value={profile.schoolName} readOnly />
            </label>

            <label className="profile-field">
              <span>School Code</span>
              <input type="text" value={profile.schoolCode} readOnly />
            </label>

            <label className="profile-field">
              <span>Phone Number</span>
              <input type="text" value={profile.phoneNumber} readOnly />
            </label>

            <label className="profile-field">
              <span>Email Address</span>
              <input type="email" value={profile.email} readOnly />
            </label>

            <label className="profile-field profile-field-full">
              <span>Address</span>
              <textarea value={profile.address} readOnly rows={4} />
            </label>

            <label className="profile-field">
              <span>State</span>
              <input type="text" value={profile.state} readOnly />
            </label>

            <label className="profile-field">
              <span>Country</span>
              <input type="text" value={profile.country} readOnly />
            </label>
          </div>

          <button type="button" className="profile-save-button">
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>

        <div className="profile-card profile-card-side">
          <h2 className="profile-card-title">School Logo</h2>

          <div className="profile-logo-box">
            <div className="profile-logo-mark">
              {userInfo?.institution ? (
                <UserAvatar user={userInfo} size={120} className="profile-logo-avatar" />
              ) : (
                <span>P</span>
              )}
            </div>
            <p>PNG or JPG, max 2MB</p>
            <button
              type="button"
              className="profile-upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>Upload Logo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="profile-hidden-input"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
