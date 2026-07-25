import { useContext, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, Lock, Moon, Settings2, Shield, Sun, User2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext";
import { authApi, clearAuthToken } from "../../../services/authApi";
import { applyTheme, getInitialTheme } from "../../../utils/theme";
import { getDisplayName, normalizeUser } from "../../../utils/userProfile";
import "./page-styles/SettingsPage.css";

const roleTitles = {
  admin: "Admin",
  principal: "Admin",
  teacher: "Teacher",
  staff: "Teacher",
  parent: "Parent",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function SettingsPage({ role: roleProp }) {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useContext(UserContext);
  const resolvedRole = (roleProp || userInfo?.role || "parent").toLowerCase();
  const roleLabel = roleTitles[resolvedRole] || "User";
  const [themeMode, setThemeMode] = useState(() => getInitialTheme());
  const [profileForm, setProfileForm] = useState({
    fullName: userInfo?.fullName || "",
    phoneNumber: userInfo?.phoneNumber || "",
    email: userInfo?.email || "",
    profileImage: userInfo?.profileImage || "",
    password: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    setProfileForm((current) => ({
      ...current,
      fullName: userInfo?.fullName || "",
      phoneNumber: userInfo?.phoneNumber || "",
      email: userInfo?.email || "",
      profileImage: userInfo?.profileImage || "",
    }));
  }, [userInfo?.fullName, userInfo?.phoneNumber, userInfo?.email, userInfo?.profileImage]);

  const accountDetails = useMemo(() => {
    const roleName = roleLabel;
    const assignedClasses = Array.isArray(userInfo?.staffClassAssigned)
      ? userInfo.staffClassAssigned
      : [userInfo?.staffClassAssigned].filter(Boolean);
    const assignedSubjects = Array.isArray(userInfo?.staffSubjectsAssigned)
      ? userInfo.staffSubjectsAssigned
      : [userInfo?.staffSubjectsAssigned].filter(Boolean);

    if (resolvedRole === "teacher" || resolvedRole === "staff") {
      return [
        { label: "Full Name", value: userInfo?.fullName || getDisplayName(userInfo) },
        { label: "Email", value: userInfo?.email || "—" },
        { label: "Role", value: roleName },
        { label: "Account Status", value: userInfo?.accountStatus || "active" },
        { label: "Date Joined", value: formatDate(userInfo?.createdAt) },
        { label: "Department", value: userInfo?.staffDepartment || "Not assigned" },
        { label: "Assigned Class(es)", value: assignedClasses.length ? assignedClasses.join(", ") : "Not assigned" },
        { label: "Assigned Subject(s)", value: assignedSubjects.length ? assignedSubjects.join(", ") : "Not assigned" },
      ];
    }

    if (resolvedRole === "parent") {
      return [
        { label: "Full Name", value: userInfo?.fullName || getDisplayName(userInfo) },
        { label: "Email", value: userInfo?.email || "—" },
        { label: "Role", value: roleName },
        { label: "Account Status", value: userInfo?.accountStatus || "active" },
        { label: "Date Joined", value: formatDate(userInfo?.createdAt) },
        { label: "Linked Student(s)", value: userInfo?.linkedStudentId || "No linked student yet" },
        { label: "Parent Access Code Status", value: userInfo?.parentAccessCodeUsed ? "Used" : "Pending" },
      ];
    }

    return [
      { label: "Full Name", value: userInfo?.fullName || getDisplayName(userInfo) },
      { label: "Email", value: userInfo?.email || "—" },
      { label: "Role", value: roleName },
      { label: "Account Status", value: userInfo?.accountStatus || "active" },
      { label: "Date Joined", value: formatDate(userInfo?.createdAt) },
      { label: "Institution Name", value: userInfo?.institution || "—" },
      { label: "Institution Type", value: userInfo?.institutionType || "—" },
      { label: "State", value: userInfo?.state || "—" },
      { label: "City", value: userInfo?.city || "—" },
    ];
  }, [roleLabel, resolvedRole, userInfo]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!profileForm.fullName.trim()) errors.fullName = "Full name is required.";
    if (!profileForm.phoneNumber.trim()) errors.phoneNumber = "Phone number is required.";
    if (!profileForm.email.trim()) errors.email = "Email is required.";

    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }

    setBusy(true);
    try {
      const response = await authApi.updateProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        email: profileForm.email.trim(),
        profileImage: profileForm.profileImage.trim(),
      });
      const updatedUser = normalizeUser({
        ...userInfo,
        ...response.user,
        fullName: response.user?.fullName || profileForm.fullName.trim(),
        phoneNumber: response.user?.phone || profileForm.phoneNumber.trim(),
        email: response.user?.email || profileForm.email.trim(),
        profileImage: response.user?.profileImage || response.user?.profilePicture || profileForm.profileImage.trim(),
      });
      setUserInfo(updatedUser);
      setStatusMessage("Profile updated successfully.");
      setProfileErrors({});
    } catch (error) {
      setStatusMessage(error.message || "Unable to update profile right now.");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!passwordForm.currentPassword.trim()) errors.currentPassword = "Current password is required.";
    if (!passwordForm.newPassword.trim()) errors.newPassword = "New password is required.";
    if (passwordForm.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters.";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      setStatusMessage("Please fix the password fields.");
      return;
    }

    setBusy(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setStatusMessage("Password updated successfully.");
    } catch (error) {
      setStatusMessage(error.message || "Unable to change your password right now.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }
    if (!deletePassword.trim()) {
      setDeleteError("Current password is required to delete your account.");
      return;
    }

    setDeleteBusy(true);
    setDeleteError("");
    try {
      await authApi.deleteAccount({ password: deletePassword });
      clearAuthToken();
      window.localStorage.removeItem("petra_user_info");
      window.localStorage.removeItem("petra-theme");
      window.sessionStorage.clear();
      navigate("/signin", { replace: true });
    } catch (error) {
      setDeleteError(error.message || "Unable to delete your account right now.");
    } finally {
      setDeleteBusy(false);
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
          <p>Manage your profile, account preferences, and security for your {roleLabel.toLowerCase()} workspace.</p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <User2 size={16} />
              <span>Profile Settings</span>
            </h2>
          </div>

          <form onSubmit={handleProfileSave}>
            <label className="settings-field">
              <span>Profile Picture URL</span>
              <input name="profileImage" value={profileForm.profileImage} onChange={handleProfileChange} placeholder="https://..." />
            </label>

            <label className="settings-field">
              <span>Full Name</span>
              <input name="fullName" value={profileForm.fullName} onChange={handleProfileChange} />
              {profileErrors.fullName ? <small className="settings-error">{profileErrors.fullName}</small> : null}
            </label>

            <label className="settings-field">
              <span>Phone Number</span>
              <input name="phoneNumber" value={profileForm.phoneNumber} onChange={handleProfileChange} />
              {profileErrors.phoneNumber ? <small className="settings-error">{profileErrors.phoneNumber}</small> : null}
            </label>

            <label className="settings-field">
              <span>Email Address</span>
              <input type="email" name="email" value={profileForm.email} onChange={handleProfileChange} />
              {profileErrors.email ? <small className="settings-error">{profileErrors.email}</small> : null}
            </label>

            <label className="settings-field">
              <span>Password</span>
              <input type="password" name="password" value={profileForm.password} onChange={handleProfileChange} placeholder="Leave blank to keep current password" />
            </label>

            <button type="submit" className="settings-button" disabled={busy}>
              <Settings2 size={14} />
              <span>{busy ? "Saving..." : "Save Profile"}</span>
            </button>
          </form>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Bell size={16} />
              <span>Account Information</span>
            </h2>
          </div>

          <div className="settings-info-list">
            {accountDetails.map((item) => (
              <div key={item.label} className="settings-info-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Moon size={16} />
              <span>Appearance</span>
            </h2>
          </div>

          <div className="settings-theme-card">
            <div className="settings-theme-copy">
              <strong>Theme mode</strong>
              <span>Switch between light, dark, or the system default.</span>
            </div>
            <label className="settings-select-wrap">
              <select value={themeMode} onChange={(event) => setThemeMode(event.target.value)}>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </label>
          </div>

          <div className="settings-theme-card compact">
            <div className="settings-theme-copy">
              <strong>Active theme</strong>
              <span>{themeMode === "system" ? "Uses your device preference" : themeMode === "dark" ? "Dark mode enabled" : "Light mode enabled"}</span>
            </div>
            {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <h2>
              <Shield size={16} />
              <span>Security</span>
            </h2>
          </div>

          <form onSubmit={handlePasswordChange}>
            <label className="settings-field">
              <span>Current Password</span>
              <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
              {passwordErrors.currentPassword ? <small className="settings-error">{passwordErrors.currentPassword}</small> : null}
            </label>

            <label className="settings-field">
              <span>New Password</span>
              <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
              {passwordErrors.newPassword ? <small className="settings-error">{passwordErrors.newPassword}</small> : null}
            </label>

            <label className="settings-field">
              <span>Confirm New Password</span>
              <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
              {passwordErrors.confirmPassword ? <small className="settings-error">{passwordErrors.confirmPassword}</small> : null}
            </label>

            <button type="submit" className="settings-button" disabled={busy}>
              <Lock size={14} />
              <span>{busy ? "Updating..." : "Change Password"}</span>
            </button>
          </form>
        </article>

        <article className="settings-card settings-danger-card">
          <div className="settings-card-head">
            <h2>
              <AlertTriangle size={16} />
              <span>Danger Zone</span>
            </h2>
          </div>

          <p className="settings-danger-copy">This action is permanent. Deleting your account cannot be undone.</p>
          <button type="button" className="settings-button settings-delete-button" onClick={() => setDeleteOpen(true)}>
            <AlertTriangle size={14} />
            <span>Delete Account</span>
          </button>
        </article>
      </section>

      <p className="settings-status">{statusMessage || `Signed in as ${getDisplayName(userInfo)}`}</p>

      {deleteOpen ? (
        <div className="settings-modal-backdrop" role="presentation" onClick={() => setDeleteOpen(false)}>
          <div className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(event) => event.stopPropagation()}>
            <div className="settings-modal-header">
              <div>
                <h3 id="delete-account-title">Delete your account</h3>
                <p>This action permanently removes your account and invalidates your current session.</p>
              </div>
              <button type="button" className="settings-modal-close" aria-label="Close delete dialog" onClick={() => setDeleteOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="settings-modal-body">
              <label className="settings-field">
                <span>Type DELETE to confirm</span>
                <input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="DELETE" />
              </label>
              <label className="settings-field">
                <span>Current Password</span>
                <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
              </label>
              {deleteError ? <p className="settings-delete-error">{deleteError}</p> : null}
            </div>
            <div className="settings-modal-actions">
              <button type="button" className="settings-modal-cancel" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
              <button type="button" className="settings-modal-delete" onClick={handleDelete} disabled={deleteBusy}>
                {deleteBusy ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
