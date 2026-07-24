import { useContext, useEffect, useState } from "react";
import { Globe, Bell, Shield, Settings2, ArrowRight, Moon, Sun, Trash2, X, LoaderCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext";
import { getDisplayName, normalizeUser, splitFullName } from "../../../utils/userProfile";
import { applyTheme, getInitialTheme } from "../../../utils/theme";
import { authApi } from "../../../services/authApi";
import "./page-styles/SettingsPage.css";

export default function SettingsPage() {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState(() => {
    return getInitialTheme();
  });
  const [formData, setFormData] = useState(() => ({
    themeColor: "#6366f1",
    schoolBannerText: userInfo.institution || "Petra International School",
    activeSession: "2024/2025",
    activeTerm: "Second Term",
    passMark: "50",
    adminEmail: userInfo.email || "admin@petra.edu.ng",
    smsNumber: userInfo.phoneNumber || "+234 801 234 5678",
    sessionTimeout: "30",
    maxLoginAttempts: "5",
  }));
  const [statusMessage, setStatusMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      schoolBannerText: userInfo.institution || "Petra International School",
      adminEmail: userInfo.email || "admin@petra.edu.ng",
      smsNumber: userInfo.phoneNumber || "+234 801 234 5678",
    }));
  }, [userInfo]);

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const saveBlock = (message) => {
    const nameParts = splitFullName(userInfo.fullName || getDisplayName(userInfo));
    setUserInfo(
      normalizeUser({
        ...userInfo,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        fullName: nameParts.fullName,
        institution: formData.schoolBannerText,
        phoneNumber: formData.smsNumber,
      }),
    );
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(""), 2500);
  };

  const resetDeleteState = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteError("");
    setDeleteLoading(false);
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteError("");

    if (!deletePassword.trim()) {
      setDeleteError("Current password is required.");
      return;
    }

    setDeleteLoading(true);
    try {
      await authApi.deleteAccount({ password: deletePassword });
      window.localStorage.removeItem("petra_user_info");
      window.localStorage.removeItem("petra_remember_email");
      setUserInfo({});
      resetDeleteState();
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteError(error.data?.message || error.message || "Unable to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="dashboard-page settings-page">
      <section className="settings-page-hero">
        <div className="settings-page-hero-icon" aria-hidden="true">
          <Settings2 size={18} />
        </div>
        <div>
          <h1>Settings</h1>
          <p>Configure your school platform preferences</p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Globe size={16} />
              <span>Appearance</span>
            </h2>
          </div>

          <div className="settings-theme-card">
            <div className="settings-theme-copy">
              <strong>Theme mode</strong>
              <span>Switch between light and dark dashboard styling</span>
            </div>
            <button
              type="button"
              className="settings-theme-toggle"
              onClick={() => setThemeMode((current) => (current === "dark" ? "light" : "dark"))}
              aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{themeMode === "dark" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>

          <label className="settings-field">
            <span>Theme Color</span>
            <input name="themeColor" value={formData.themeColor} onChange={handleChange} />
          </label>

          <label className="settings-field">
            <span>School Banner Text</span>
            <input
              name="schoolBannerText"
              value={formData.schoolBannerText}
              onChange={handleChange}
            />
          </label>

          <button type="button" className="settings-button" onClick={() => saveBlock("Appearance saved.")}>
            <Settings2 size={14} />
            <span>Save Appearance</span>
          </button>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Globe size={16} />
              <span>Academic Defaults</span>
            </h2>
          </div>

          <label className="settings-field">
            <span>Active Session</span>
            <input name="activeSession" value={formData.activeSession} onChange={handleChange} />
          </label>

          <label className="settings-field">
            <span>Active Term</span>
            <input name="activeTerm" value={formData.activeTerm} onChange={handleChange} />
          </label>

          <label className="settings-field">
            <span>Pass Mark (%)</span>
            <input name="passMark" value={formData.passMark} onChange={handleChange} />
          </label>

          <button type="button" className="settings-button" onClick={() => saveBlock("Academic defaults saved.")}>
            <Settings2 size={14} />
            <span>Save Academic Defaults</span>
          </button>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Bell size={16} />
              <span>Notification Preferences</span>
            </h2>
          </div>

          <label className="settings-field">
            <span>Admin Email for Alerts</span>
            <input name="adminEmail" value={formData.adminEmail} onChange={handleChange} />
          </label>

          <label className="settings-field">
            <span>SMS Alert Number</span>
            <input name="smsNumber" value={formData.smsNumber} onChange={handleChange} />
          </label>

          <button type="button" className="settings-button" onClick={() => saveBlock("Notification preferences saved.")}>
            <Settings2 size={14} />
            <span>Save Notification Preferences</span>
          </button>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Shield size={16} />
              <span>Security</span>
            </h2>
          </div>

          <label className="settings-field">
            <span>Session Timeout (minutes)</span>
            <input name="sessionTimeout" value={formData.sessionTimeout} onChange={handleChange} />
          </label>

          <label className="settings-field">
            <span>Max Login Attempts</span>
            <input name="maxLoginAttempts" value={formData.maxLoginAttempts} onChange={handleChange} />
          </label>

          <button type="button" className="settings-button" onClick={() => saveBlock("Security settings saved.")}>
            <ArrowRight size={14} />
            <span>Save Security</span>
          </button>

          <button
            type="button"
            className="settings-button settings-delete-button"
            onClick={() => {
              setDeleteError("");
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
        </article>
      </section>

      <p className="settings-status">{statusMessage || `Signed in as ${getDisplayName(userInfo)}`}</p>

      {showDeleteModal ? (
        <div className="settings-modal-backdrop" role="presentation" onClick={() => !deleteLoading && resetDeleteState()}>
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div>
                <h3 id="delete-account-title">Delete Account</h3>
                <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
              </div>
              <button type="button" className="settings-modal-close" onClick={resetDeleteState} aria-label="Close delete dialog" disabled={deleteLoading}>
                <X size={16} />
              </button>
            </div>

            <form className="settings-modal-body" onSubmit={handleDeleteAccount}>
              <label className="settings-field">
                <span>Current Password</span>
                <div className="settings-password-wrap">
                  <Lock size={16} />
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    disabled={deleteLoading}
                  />
                </div>
              </label>

              {deleteError ? <p className="settings-delete-error">{deleteError}</p> : null}

              <div className="settings-modal-actions">
                <button type="button" className="settings-modal-cancel" onClick={resetDeleteState} disabled={deleteLoading}>
                  Cancel
                </button>
                <button type="submit" className="settings-modal-delete" disabled={deleteLoading}>
                  {deleteLoading ? (
                    <>
                      <LoaderCircle size={16} className="settings-spinner" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
