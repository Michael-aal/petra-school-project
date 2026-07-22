import { useContext, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, LoaderCircle, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { normalizeUser, splitFullName } from "../../utils/userProfile";
import "../../Styles/Sigin/auth.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  institution: "",
  institutionType: "",
  state: "",
  city: "",
  hearAbout: "",
};

export default function Register() {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    authApi
      .me()
      .then(() => navigate("/dashboard", { replace: true }))
      .catch(() => setCheckingSession(false));
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "password" || name === "confirmPassword") {
      return;
    }

    setUserInfo((current) => {
      const nextUser = { ...current, [name]: value };

      if (name === "fullName") {
        const parts = value.trim().split(/\s+/).filter(Boolean);
        nextUser.firstName = parts[0] || "";
        nextUser.lastName = parts.length > 1 ? parts[parts.length - 1] : "";
        nextUser.fullName = value;
      }

      if (name === "firstName" || name === "lastName") {
        const firstName = name === "firstName" ? value : current.firstName || "";
        const lastName = name === "lastName" ? value : current.lastName || "";
        nextUser.firstName = firstName;
        nextUser.lastName = lastName;
        nextUser.fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
      }

      if (name === "email") {
        nextUser.email = value;
      }

      if (name === "phone") {
        nextUser.phoneNumber = value;
      }

      if (name === "institution") {
        nextUser.institution = value;
      }

      if (name === "state") {
        nextUser.state = value;
      }

      if (name === "city") {
        nextUser.city = value;
      }

      return normalizeUser(nextUser);
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email address is required.";
    if (!form.password) nextErrors.password = "Password is required.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    return nextErrors;
  };

  const persistRegistrationUser = (userData) => {
    const parsedName = splitFullName(userData?.fullName || form.fullName);
    const nextUser = normalizeUser({
      ...userInfo,
      ...userData,
      firstName: userData?.firstName || parsedName.firstName || userInfo?.firstName || "",
      lastName: userData?.lastName || parsedName.lastName || userInfo?.lastName || "",
      fullName: userData?.fullName || form.fullName || userInfo?.fullName || "",
      email: userData?.email || form.email || userInfo?.email || "",
      role: userData?.role || userInfo?.role || "user",
      institution: userData?.institution || userInfo?.institution || "My School",
      phoneNumber:
        userData?.phoneNumber || userData?.phone || userInfo?.phoneNumber || userInfo?.phone || "",
      state: userData?.state || userInfo?.state || "",
      city: userData?.city || userInfo?.city || "",
      profileImage: userData?.profileImage || userData?.profilePicture || userInfo?.profileImage || userInfo?.profilePicture || "",
    });

    setUserInfo(nextUser);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        institution: form.institution,
        institutionType: form.institutionType,
        state: form.state,
        city: form.city,
        hearAbout: form.hearAbout,
      });

      const registeredUser = response?.user || {};
      const storedFullName = registeredUser.fullName || form.fullName;
      const storedEmail = registeredUser.email || form.email;

      persistRegistrationUser({
        ...registeredUser,
        fullName: storedFullName,
        email: storedEmail,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const apiErrors = error.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const mapped = {};
        apiErrors.forEach((item) => {
          mapped[item.path] = item.msg;
        });
        setErrors(mapped);
      }
      setServerError(error.data?.message || error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="auth-page auth-page-loading">
        <LoaderCircle className="auth-spinner" size={34} />
      </main>
    );
  }

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join Petra School"
      subtitle="Set up your account to access the school dashboard, modules, and secure tools."
      footnote="Already enrolled? Use the login link below to return to your account."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Register</h2>
          <p>Fill in the details below to create your Petra School account.</p>
        </div>

        {serverError ? <div className="auth-alert">{serverError}</div> : null}

        <label className="auth-field">
          <span>Full Name</span>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>
          {errors.fullName ? <small>{errors.fullName}</small> : null}
        </label>

        <label className="auth-field">
          <span>Phone Number</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              name="phone"
              type="tel"
              placeholder="+234..."
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Name of Institution</span>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input
              name="institution"
              type="text"
              placeholder="e.g. Grace Schools"
              value={form.institution}
              onChange={handleChange}
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Institution Type</span>
          <div className="auth-input-wrap">
            <select name="institutionType" value={form.institutionType} onChange={handleChange}>
              <option value="">Select Type</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="tertiary">Tertiary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label className="auth-field" style={{ flex: 1 }}>
            <span>State</span>
            <div className="auth-input-wrap">
              <input
                name="state"
                type="text"
                placeholder="Select State"
                value={form.state}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="auth-field" style={{ flex: 1 }}>
            <span>City</span>
            <div className="auth-input-wrap">
              <input
                name="city"
                type="text"
                placeholder="e.g. Ikeja"
                value={form.city}
                onChange={handleChange}
              />
            </div>
          </label>
        </div>

        <label className="auth-field">
          <span>How did you hear about us?</span>
          <div className="auth-input-wrap">
            <input
              name="hearAbout"
              type="text"
              placeholder="e.g. LinkedIn, Friend, Event"
              value={form.hearAbout}
              onChange={handleChange}
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Email Address</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
          {errors.email ? <small>{errors.email}</small> : null}
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password ? <small>{errors.password}</small> : null}
        </label>

        <label className="auth-field">
          <span>Confirm Password</span>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
        </label>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="auth-spin" size={18} />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/signin">Login</Link>
        </p>
      </form>
    </AuthShell>
  );
}
