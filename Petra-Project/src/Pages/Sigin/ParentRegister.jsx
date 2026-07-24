import { useEffect, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Mail, Lock, UserRound, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { authApi } from "../../services/authApi";
import { normalizeRole } from "../../utils/roleAccess";
import "../../Styles/Sigin/auth.css";

const initialForm = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };

export default function ParentRegister() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    authApi.me().then((response) => {
      const role = normalizeRole(response?.user?.role);
      navigate(role === "staff" ? "/staff/dashboard" : role === "parent" ? "/portal/dashboard" : "/dashboard", { replace: true });
    }).catch(() => setCheckingSession(false));
  }, [navigate]);

  const handleChange = (e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }));
  const validate = () => {
    const next = {};
    if (!form.fullName) next.fullName = "Full name is required.";
    if (!form.email) next.email = "Email address is required.";
    if (!form.password) next.password = "Password is required.";
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
      await authApi.parentRegister(form);
      navigate("/signin", { replace: true });
    } catch (error) {
      setServerError(error.data?.message || error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <main className="auth-page auth-page-loading"><LoaderCircle className="auth-spinner" size={34} /></main>;

  return (
    <AuthShell eyebrow="Parent registration" title="Create parent account" subtitle="Use your details to create a parent account." footnote="Already have an account? Sign in below.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header"><h2>Parent Registration</h2><p>Fill in your details to register.</p></div>
        {serverError ? <div className="auth-alert">{serverError}</div> : null}
        <label className="auth-field"><span>Full Name</span><div className="auth-input-wrap"><UserRound size={18} /><input name="fullName" value={form.fullName} onChange={handleChange} /></div>{errors.fullName ? <small>{errors.fullName}</small> : null}</label>
        <label className="auth-field"><span>Email Address</span><div className="auth-input-wrap"><Mail size={18} /><input name="email" type="email" value={form.email} onChange={handleChange} /></div>{errors.email ? <small>{errors.email}</small> : null}</label>
        <label className="auth-field"><span>Phone Number</span><div className="auth-input-wrap"><Phone size={18} /><input name="phone" value={form.phone} onChange={handleChange} /></div></label>
        <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><Lock size={18} /><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} /><button type="button" className="auth-eye-btn" onClick={() => setShowPassword((c) => !c)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password ? <small>{errors.password}</small> : null}</label>
        <label className="auth-field"><span>Confirm Password</span><div className="auth-input-wrap"><Lock size={18} /><input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} /><button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword((c) => !c)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}</label>
        <button type="submit" className="auth-submit" disabled={loading}>{loading ? <><LoaderCircle className="auth-spin" size={18} />Creating account...</> : "Create Account"}</button>
        <p className="auth-switch">Back to <Link to="/signin">Login</Link></p>
      </form>
    </AuthShell>
  );
}
