import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, LoaderCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { authApi } from "../../services/authApi";
import "../../Styles/Sigin/auth.css";

const initialForm = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function SignIn() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
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
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = "Email address is required.";
    if (!form.password) nextErrors.password = "Password is required.";
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
      await authApi.login({
        email: form.email,
        password: form.password,
      });

      if (form.rememberMe) {
        window.localStorage.setItem("petra_remember_email", form.email);
      } else {
        window.localStorage.removeItem("petra_remember_email");
      }

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
      setServerError(error.data?.message || error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem("petra_remember_email");
    if (rememberedEmail) {
      setForm((current) => ({ ...current, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  if (checkingSession) {
    return (
      <main className="auth-page auth-page-loading">
        <LoaderCircle className="auth-spinner" size={34} />
      </main>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Petra School"
      subtitle="Access your school workspace, manage operations, and continue where you left off."
      footnote="Need help accessing your account? Use the forgot password link or contact your school administrator."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Sign In</h2>
          <p>Enter your details to continue.</p>
        </div>

        {serverError ? <div className="auth-alert">{serverError}</div> : null}

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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
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

        <div className="auth-meta-row">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
            />
            <span>Remember Me</span>
          </label>

          <Link to="#" className="auth-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="auth-spin" size={18} />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </AuthShell>
  );
}
