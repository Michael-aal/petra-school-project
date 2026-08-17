import { useContext, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, LoaderCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { UserContext } from "../../context/UserContext";
import {
  authApi,
  writeAuthToken,
  readAuthToken,
} from "../../services/authApi";
import { normalizeUser } from "../../utils/userProfile";
import {
  getDashboardPathForRole,
  normalizeRole,
} from "../../utils/roleAccess";
import "../../Styles/Sigin/auth.css";

const initialForm = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function SignIn() {
  const { setUserInfo, authReady, userInfo } = useContext(UserContext);

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  /*
   * Check for an existing authenticated session.
   *
   * IMPORTANT:
   * Do not call /api/auth/me when there is no token.
   * Otherwise the backend protect middleware correctly returns:
   * "Not authorized, token missing"
   */
  useEffect(() => {
    const token = readAuthToken();

    // No token means this is a normal login session.
    if (!token) {
      setCheckingSession(false);
      return;
    }

    // A token exists, so it is safe to check the current user.
    authApi
      .me()
      .then((response) => {
        if (response?.user) {
          navigate(
            getDashboardPathForRole(response.user.role),
            { replace: true }
          );
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        // Token may be expired or invalid.
        // Let the user sign in again.
        setCheckingSession(false);
      });
  }, [navigate]);

  /*
   * If UserContext already knows the user,
   * send them to the appropriate dashboard.
   */
  useEffect(() => {
    if (authReady && userInfo?.email) {
      navigate(
        getDashboardPathForRole(userInfo.role),
        { replace: true }
      );
    }
  }, [authReady, userInfo, navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const nextErrors = validate();

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      /*
       * Login.
       *
       * authApi.login() already stores the returned token
       * through persistToken().
       */
      const response = await authApi.login({
        email: form.email,
        password: form.password,
      });

      const loggedInUser = response?.user || {};

      /*
       * Keep this for compatibility with the existing flow.
       */
      writeAuthToken(response?.token);

      /*
       * Now that the token exists, it is safe to call /me.
       */
      const profileResponse = await authApi.me();

      const profileUser = profileResponse?.user || {
        ...loggedInUser,
        fullName: loggedInUser.fullName || form.email,
        email: loggedInUser.email || form.email,
        role: normalizeRole(loggedInUser.role),
      };

      setUserInfo(normalizeUser(profileUser));

      /*
       * Remember email only.
       * The authentication token remains in sessionStorage,
       * as defined by authApi.js.
       */
      if (form.rememberMe) {
        window.localStorage.setItem(
          "petra_remember_email",
          form.email
        );
      } else {
        window.localStorage.removeItem(
          "petra_remember_email"
        );
      }

      /*
       * Send the user to the correct dashboard.
       */
      navigate(
        getDashboardPathForRole(
          profileResponse?.user?.role ||
            loggedInUser.role
        ),
        { replace: true }
      );
    } catch (error) {
      const apiErrors = error.data?.errors;

      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const mapped = {};

        apiErrors.forEach((item) => {
          mapped[item.path] = item.msg;
        });

        setErrors(mapped);
      }

      setServerError(
        error.data?.message ||
          error.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Restore remembered email.
   */
  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(
      "petra_remember_email"
    );

    if (rememberedEmail) {
      setForm((current) => ({
        ...current,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  /*
   * While checking an existing session,
   * keep the login form from flashing briefly.
   */
  if (checkingSession) {
    return (
      <AuthShell>
        <div className="auth-loading">
          <LoaderCircle
            className="auth-spin"
            size={24}
          />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Access your school workspace"
      subtitle="Sign in to review operations, learning, finance, and every update across your school in one calm view."
      variant="signin"
      footnote=""
    >
      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >
        <div className="auth-form-header auth-signin-heading">
          <div className="auth-form-heading-top">
            <div>
              <span className="auth-form-kicker">SECURE ACCESS</span>
              <h2>Sign In</h2>
            </div>
            <span className="auth-secure-chip" aria-label="Secure sign in">
              <ShieldCheck size={15} />
              Protected
            </span>
          </div>
          <p>Enter your credentials to access your school workspace.</p>
        </div>

        {serverError ? (
          <div className="auth-alert">
            {serverError}
          </div>
        ) : null}

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

          {errors.email ? (
            <small>{errors.email}</small>
          ) : null}
        </label>

        <label className="auth-field">
          <span>Password</span>

          <div className="auth-input-wrap">
            <Lock size={18} />

            <input
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="auth-eye-btn"
              onClick={() =>
                setShowPassword(
                  (current) => !current
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.password ? (
            <small>{errors.password}</small>
          ) : null}
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

          <Link
            to="#"
            className="auth-link"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="auth-submit signin-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle className="auth-spin" size={18} />
              Signing in...
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="auth-signin-bottom">
          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
          <p className="auth-security-note">
            <ShieldCheck size={14} />
            Your session is protected by secure authentication controls.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}