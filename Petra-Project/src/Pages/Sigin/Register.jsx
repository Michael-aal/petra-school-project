import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, LoaderCircle, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { authApi } from "../../services/authApi";
import "../../Styles/Sigin/auth.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
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
