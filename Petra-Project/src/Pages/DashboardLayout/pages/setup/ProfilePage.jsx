import { useContext, useRef, useState, useEffect } from "react";
import { 
  Building2, Save, Upload, CheckCircle2, Lock, Unlock, 
  Eye, EyeOff, AlertCircle 
} from "lucide-react";
import "../page-styles/ProfilePage.css";
import { UserContext } from "../../../../context/UserContext";
import UserAvatar from "../../../../components/UserAvatar";

export default function ProfilePage() {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const fileInputRef = useRef(null);
  
  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  
  // Password Change States
  const [newEditPassword, setNewEditPassword] = useState("");
  const [confirmEditPassword, setConfirmEditPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    schoolName: userInfo?.institution || "",
    schoolCode: userInfo?.schoolCode || "",
    phoneNumber: userInfo?.phoneNumber || "",
    email: userInfo?.email || "",
    address: userInfo?.address || "",
    state: userInfo?.state || "",
    country: userInfo?.country || "",
  });

  // Sync form if userInfo loads later from API
  useEffect(() => {
    setFormData({
      schoolName: userInfo?.institution || "",
      schoolCode: userInfo?.schoolCode || "",
      phoneNumber: userInfo?.phoneNumber || "",
      email: userInfo?.email || "",
      address: userInfo?.address || "",
      state: userInfo?.state || "",
      country: userInfo?.country || "",
    });
  }, [userInfo]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUserInfo((current) => {
        const updatedUser = { ...current, profileImage: reader.result };
        window.localStorage.setItem("petra_user_info", JSON.stringify(updatedUser));
        return updatedUser;
      });
    };
    reader.readAsDataURL(file);
  };

  // 1. Handle Unlocking the Form
  const handleUnlock = () => {
    const currentPassword = userInfo?.profileEditPassword || "";
    
    // If no password is set yet, just unlock it
    if (!currentPassword) {
      setIsEditing(true);
      setIsUnlocking(false);
      setErrorMessage("");
      return;
    }

    // If password is set, verify it
    if (unlockPassword === currentPassword) {
      setIsEditing(true);
      setIsUnlocking(false);
      setUnlockPassword("");
      setErrorMessage("");
    } else {
      setErrorMessage("Incorrect password. Please try again.");
    }
  };

  // 2. Handle Saving the Form & New Password
  const handleSave = () => {
    // Validate new password if they tried to change it
    if (newEditPassword && newEditPassword !== confirmEditPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setUserInfo((current) => {
      const updatedUser = {
        ...current,
        institution: formData.schoolName,
        schoolCode: formData.schoolCode,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        country: formData.country,
        // Update the edit password if a new one was provided
        profileEditPassword: newEditPassword || current?.profileEditPassword || "",
      };
      window.localStorage.setItem("petra_user_info", JSON.stringify(updatedUser));
      return updatedUser;
    });

    // Reset states after saving
    setIsEditing(false);
    setNewEditPassword("");
    setConfirmEditPassword("");
    setErrorMessage("");
    setSaveMessage("Profile updated and locked successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const institutionInitial = formData.schoolName ? formData.schoolName[0].toUpperCase() : "S";

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

      {/* Success / Error Messages */}
      {saveMessage && (
        <div className="dashboard-alert success" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} /> {saveMessage}
        </div>
      )}
      {errorMessage && !isEditing && (
        <div className="dashboard-alert error" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <section className="profile-page-grid">
        <div className="profile-card profile-card-main">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 className="profile-card-title" style={{ margin: 0 }}>Basic Information</h2>
            
            {/* Unlock / Lock Button */}
            {!isEditing && !isUnlocking && (
              <button 
                type="button" 
                className="profile-save-button" 
                style={{ background: "oklch(0.3 0.08 264)", padding: "8px 16px", fontSize: "13px" }}
                onClick={() => {
                  if (userInfo?.profileEditPassword) {
                    setIsUnlocking(true);
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                <Unlock size={14} />
                <span>Unlock to Edit</span>
              </button>
            )}
          </div>

          {/* Password Prompt Overlay */}
          {isUnlocking && (
            <div style={{ padding: "20px", background: "oklch(0.25 0.04 260)", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={16} /> Enter Edit Password
              </h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="password" 
                  placeholder="Enter password to unlock"
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid oklch(1 0 0 / 10%)", background: "oklch(1 0 0 / 12%)", color: "oklch(0.93 0.01 240)" }}
                  autoFocus
                />
                <button onClick={handleUnlock} className="profile-save-button" style={{ padding: "10px 20px" }}>Unlock</button>
                <button onClick={() => { setIsUnlocking(false); setUnlockPassword(""); setErrorMessage(""); }} className="btn-ghost" style={{ padding: "10px 20px", background: "transparent", border: "1px solid oklch(1 0 0 / 10%)", color: "oklch(0.93 0.01 240)", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              </div>
              {errorMessage && <p style={{ color: "oklch(0.65 0.22 27)", fontSize: "13px", marginTop: "8px" }}>{errorMessage}</p>}
            </div>
          )}

          {/* Main Form */}
          <div className="profile-fields-grid">
            <label className="profile-field">
              <span>School Name</span>
              <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} readOnly={!isEditing} placeholder="Enter school name" />
            </label>

            <label className="profile-field">
              <span>School Code</span>
              <input type="text" name="schoolCode" value={formData.schoolCode} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., SCH-001" />
            </label>

            <label className="profile-field">
              <span>Phone Number</span>
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} readOnly={!isEditing} placeholder="+234 800 000 0000" />
            </label>

            <label className="profile-field">
              <span>Email Address</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} readOnly={!isEditing} placeholder="admin@school.com" />
            </label>

            <label className="profile-field profile-field-full">
              <span>Address</span>
              <textarea name="address" value={formData.address} onChange={handleChange} readOnly={!isEditing} rows={4} placeholder="Enter full school address" />
            </label>

            <label className="profile-field">
              <span>State</span>
              <input type="text" name="state" value={formData.state} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., Lagos" />
            </label>

            <label className="profile-field">
              <span>Country</span>
              <input type="text" name="country" value={formData.country} onChange={handleChange} readOnly={!isEditing} placeholder="e.g., Nigeria" />
            </label>

            {/* Password Change Section (Only visible when editing) */}
            {isEditing && (
              <>
                <div className="profile-field profile-field-full" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid oklch(1 0 0 / 10%)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "oklch(0.85 0.05 264)" }}>
                    <Lock size={14} /> Change Edit Password (Optional)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ position: "relative" }}>
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="New edit password"
                        value={newEditPassword}
                        onChange={(e) => setNewEditPassword(e.target.value)}
                        style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: "6px", border: "1px solid oklch(1 0 0 / 10%)", background: "oklch(1 0 0 / 12%)", color: "oklch(0.93 0.01 240)", boxSizing: "border-box" }}
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "oklch(0.6 0.02 250)", cursor: "pointer" }}>
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <input 
                      type="password" 
                      placeholder="Confirm new password"
                      value={confirmEditPassword}
                      onChange={(e) => setConfirmEditPassword(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid oklch(1 0 0 / 10%)", background: "oklch(1 0 0 / 12%)", color: "oklch(0.93 0.01 240)", boxSizing: "border-box" }}
                    />
                  </div>
                  {errorMessage && isEditing && <p style={{ color: "oklch(0.65 0.22 27)", fontSize: "13px", marginTop: "8px" }}>{errorMessage}</p>}
                </div>
              </>
            )}
          </div>

          {/* Save Button (Only visible when editing) */}
          {isEditing && (
            <button type="button" className="profile-save-button" onClick={handleSave} style={{ marginTop: "24px" }}>
              <Save size={16} />
              <span>Save & Lock Profile</span>
            </button>
          )}
        </div>

        {/* Right Side: Logo Upload */}
        <div className="profile-card profile-card-side">
          <h2 className="profile-card-title">School Logo</h2>

          <div className="profile-logo-box">
            <div className="profile-logo-mark">
              {userInfo?.profileImage || formData.schoolName ? (
                <UserAvatar user={{ ...userInfo, institution: formData.schoolName }} size={120} className="profile-logo-avatar" />
              ) : (
                <span>{institutionInitial}</span>
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