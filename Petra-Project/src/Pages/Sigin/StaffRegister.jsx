import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Mail, Lock, Code2, UserRound, Briefcase, ImagePlus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "./AuthShell";
import { authApi, writeAuthToken } from "../../services/authApi";
import { normalizeRole } from "../../utils/roleAccess";
import "../../Styles/Sigin/auth.css";

const initialForm = { invitationCode: "", fullName: "", email: "", department: "", position: "", password: "", confirmPassword: "", profilePicture: "" };

const getPasswordScore = (value = "") => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
};

export default function StaffRegister() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [invitationLoading, setInvitationLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authApi.me().then((response) => {
      const role = normalizeRole(response?.user?.role);
      navigate(role === "staff" ? "/staff/dashboard" : role === "parent" ? "/portal/dashboard" : "/dashboard", { replace: true });
    }).catch(() => setCheckingSession(false));
  }, [navigate]);

  useEffect(() => {
    const loadInvitation = async (code) => {
      if (!code) {
        setCheckingSession(false);
        return;
      }

      setInvitationLoading(true);
      try {
        const response = await authApi.staffInvitationDetails(code);
        setForm((current) => ({
          ...current,
          invitationCode: code,
          fullName: response?.invitation?.staffName || "",
          email: response?.invitation?.email || "",
          department: response?.invitation?.department || "",
          position: response?.invitation?.role || "",
        }));
        setErrors((e) => {
          const next = { ...e };
          delete next.token;
          return next;
        });
      } catch (error) {
        setInvitationError(error.data?.message || error.message || "This invitation is no longer valid.");
        setErrors((e) => ({ ...e, token: error.data?.message || error.message || "Invitation invalid." }));
      } finally {
        setInvitationLoading(false);
        setCheckingSession(false);
      }
    };

    // If token present in query param, validate it and populate fields
    if (token) loadInvitation(token);
    else setCheckingSession(false);
  }, [token]);

  const validateInvitationCode = async (code) => {
    if (!code || !code.trim()) {
      setErrors((e) => ({ ...e, token: "Invitation code is required." }));
      return;
    }

    setInvitationLoading(true);
    try {
      const response = await authApi.staffInvitationDetails(code.trim());
      setForm((current) => ({
        ...current,
        fullName: response?.invitation?.staffName || "",
        email: response?.invitation?.email || "",
        department: response?.invitation?.department || "",
        position: response?.invitation?.role || "",
        invitationCode: code.trim(),
      }));
      setErrors((e) => {
        const next = { ...e };
        delete next.token;
        return next;
      });
    } catch (error) {
      setErrors((e) => ({ ...e, token: error.data?.message || error.message || "Invitation invalid or expired." }));
    } finally {
      setInvitationLoading(false);
    }
  };

  const passwordScore = useMemo(() => getPasswordScore(form.password), [form.password]);
  const passwordLabel = passwordScore <= 2 ? "Weak" : passwordScore <= 4 ? "Good" : "Strong";

  const handleChange = (e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setForm((c) => ({ ...c, profilePicture: "" }));
    setForm((c) => ({ ...c, profilePicture: file }));
  };

  const validate = () => {
    const next = {};
    const code = form.invitationCode?.trim();
    if (!code && !token) next.token = "Invitation code is required.";
    if (!form.password) next.password = "Password is required.";
    if (form.password && form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        code: token || form.invitationCode,
        fullName: form.fullName,
        department: form.department,
        position: form.position,
      };

      // If user uploaded a file, convert to base64 string
      if (form.profilePicture && form.profilePicture instanceof File) {
        const toBase64 = (file) => new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onerror = () => rej(new Error("Failed to read file"));
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(file);
        });
        try {
          payload.profilePicture = await toBase64(form.profilePicture);
        } catch {
          payload.profilePicture = "";
        }
      } else {
        payload.profilePicture = form.profilePicture || "";
      }

      const response = await authApi.staffActivate(payload);
      writeAuthToken(response?.token);
      navigate("/signin", { replace: true });
    } catch (error) {
      setServerError(error.data?.message || error.message || "Activation failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <main className="auth-page auth-page-loading"><LoaderCircle className="auth-spinner" size={34} /></main>;

  if (invitationError) {
    return (
      <AuthShell eyebrow="Invitation unavailable" title="This invitation cannot be used" subtitle="The invitation link is invalid, expired, or already used." footnote="Please contact your school administrator for a new invitation.">
        <div className="auth-form">
          <div className="auth-alert">{invitationError}</div>
          <p className="auth-switch"><Link to="/signin">Go to Sign In</Link></p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Staff registration" title="Complete Your Staff Registration" subtitle="You've been invited by your school administrator. Enter your invitation code and create your password to activate your staff account." footnote="Your invitation will be marked as used after activation.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Staff Registration</h2>
          <p>Complete the details below to activate your staff account.</p>
        </div>

        {serverError ? <div className="auth-alert">{serverError}</div> : null}

        <label className="auth-field">
          <span>Invitation Code</span>
          <div className="auth-input-wrap">
            <Code2 size={18} />
            <input
              name="invitationCode"
              type="text"
              placeholder="Enter invitation code"
              value={form.invitationCode}
              onChange={handleChange}
              onBlur={(e) => validateInvitationCode(e.target.value)}
              disabled={invitationLoading}
              autoComplete="one-time-code"
            />
          </div>
          {errors.token ? <small>{errors.token}</small> : null}
        </label>

        <label className="auth-field">
          <span>Full Name</span>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input name="fullName" type="text" value={form.fullName} onChange={handleChange} readOnly disabled autoComplete="name" />
          </div>
        </label>

        <label className="auth-field">
          <span>Email Address</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} readOnly disabled />
          </div>
        </label>

        <label className="auth-field">
          <span>Department</span>
          <div className="auth-input-wrap">
            <Briefcase size={18} />
            <input name="department" type="text" value={form.department} onChange={handleChange} readOnly disabled />
          </div>
        </label>

        <label className="auth-field">
          <span>Position</span>
          <div className="auth-input-wrap">
            <Briefcase size={18} />
            <input name="position" type="text" value={form.position} onChange={handleChange} readOnly disabled />
          </div>
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((c) => !c)} aria-label={showPassword ? "Hide password" : "Show password"}>
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
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword((c) => !c)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
        </label>

        <div className="auth-field">
          <span>Password Strength</span>
          <div className="auth-input-wrap" style={{ justifyContent: "space-between", padding: "0 14px" }}>
            <span>{passwordLabel}</span>
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>{passwordScore}/5</span>
          </div>
        </div>

        <label className="auth-field">
          <span>Profile Picture (optional)</span>
          <div className="auth-input-wrap">
            <ImagePlus size={18} />
            <input name="profilePicture" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </label>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? <><LoaderCircle className="auth-spin" size={18} />Activating...</> : "Activate Staff Account"}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/signin">Sign In</Link></p>
      </form>
    </AuthShell>
  );
}
