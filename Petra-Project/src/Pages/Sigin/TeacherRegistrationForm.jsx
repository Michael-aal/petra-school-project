import { useContext, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, Mail, LoaderCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "./AuthShell";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { normalizeUser } from "../../utils/userProfile";
import "../../Styles/Sigin/auth.css";

export default function TeacherRegistrationForm() {
  const { setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = useMemo(() => String(searchParams.get("code") || "").trim(), [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");

    if (!code) {
      setServerError("Teacher registration code is missing. Use the code supplied by the school.");
      return;
    }
    if (!email.trim()) {
      setServerError("Enter the email address used on your teacher application.");
      return;
    }
    if (password.length < 8 || password !== confirmPassword) {
      setServerError("Use a password of at least 8 characters and make sure both passwords match.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.staffActivate({
        code,
        email: email.trim().toLowerCase(),
        password,
      });
      const user = response?.user || {};
      setUserInfo(normalizeUser(user));
      navigate("/staff/dashboard", { replace: true });
    } catch (error) {
      setServerError(error?.data?.message || error?.message || "Teacher registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Teacher registration"
      subtitle="Your school has approved your teacher application. Use the registration code supplied by the school to activate your teacher account."
      footnote="Already registered? Use the login page to access your Teacher Portal."
    >
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-form-header">
          <h2>Activate Teacher Account</h2>
          <p>The code identifies your approved teacher record. It can only be used once.</p>
        </div>

        {serverError ? <div className="auth-alert">{serverError}</div> : null}

        <label className="auth-field">
          <span>Teacher Registration Code</span>
          <div className="auth-input-wrap">
            <KeyRound size={18} />
            <input value={code} readOnly placeholder="PET-TEACHER-XXXXXXXX" />
          </div>
        </label>

        <label className="auth-field">
          <span>Application Email</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Use the email from your application"
              autoComplete="email"
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Create Password</span>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a secure password"
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="auth-field">
          <span>Confirm Password</span>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? <><LoaderCircle className="auth-spin" size={18} /> Activating account...</> : "Activate Teacher Account"}
        </button>
      </form>
    </AuthShell>
  );
}
