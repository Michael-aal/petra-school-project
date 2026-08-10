import { useContext, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, LoaderCircle, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { UserContext } from "../../context/UserContext";
import { authApi, writeAuthToken } from "../../services/authApi";
import { normalizeUser, splitFullName } from "../../utils/userProfile";
import { normalizeRole } from "../../utils/roleAccess";
import "../../Styles/Sigin/auth.css";

const initialForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  institution: "",
  institutionType: "",
  state: "",
  city: "",
  hearAbout: "",
  role: "",
};

export default function Register({ rolePreset = "" }) {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const [form, setForm] = useState(() => ({ ...initialForm, role: rolePreset || "" }));
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
      .then((response) => {
        const role = normalizeRole(response?.user?.role);
        navigate(role === "parent" || role === "student" ? "/portal/dashboard" : role === "teacher" || role === "staff" ? "/staff/dashboard" : "/dashboard", { replace: true });
      })
      .catch(() => setCheckingSession(false));
  }, [navigate]);

  useEffect(() => {
    setForm((current) => ({ ...current, role: rolePreset || current.role }));
  }, [rolePreset]);

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

      if (name === "role") {
        nextUser.role = value;
      }

      return normalizeUser(nextUser);
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!form.username.trim()) nextErrors.username = "Username is required.";
    if (!form.email.trim()) nextErrors.email = "Email address is required.";
    if (!form.role && !rolePreset) nextErrors.role = "Please select a role.";
    if ((rolePreset || form.role) === "principal" && !form.institution.trim()) {
      nextErrors.institution = "School name is required — it creates your school workspace.";
    }
    if (!form.password) nextErrors.password = "Password is required.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (form.password.length > 128) nextErrors.password = "Password must be at most 128 characters.";
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
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        fullName: [form.firstName, form.lastName].filter(Boolean).join(" "),
        email: form.email,
        confirmPassword: form.confirmPassword,
        password: form.password,
        phone: form.phone,
        institution: form.institution,
        institutionType: form.institutionType,
        state: form.state,
        city: form.city,
        hearAbout: form.hearAbout,
        role: rolePreset || form.role,
      });

      const registeredUser = response?.user || {};
      writeAuthToken(response?.token);
      const selectedRole = normalizeRole(registeredUser.role || form.role || "student");
      const storedFullName = registeredUser.fullName || [form.firstName, form.lastName].filter(Boolean).join(" ");
      const storedEmail = registeredUser.email || form.email;

      persistRegistrationUser({
        ...registeredUser,
        firstName: registeredUser.firstName || form.firstName,
        lastName: registeredUser.lastName || form.lastName,
        username: registeredUser.username || form.username,
        fullName: storedFullName,
        email: storedEmail,
        role: selectedRole,
      });
      navigate(
        selectedRole === "parent" || selectedRole === "student"
          ? "/portal/dashboard"
          : selectedRole === "teacher"
            ? "/staff/dashboard"
            : "/dashboard",
        { replace: true },
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
      title={rolePreset === "principal" ? "Register as School Administrator" : rolePreset === "teacher" ? "Register as Staff" : "Join Petra School"}
      subtitle={rolePreset === "principal" ? "Create your school administration account and start managing your institution." : rolePreset === "teacher" ? "Create your staff account and begin managing your school responsibilities." : "Set up your account to access the school dashboard, modules, and secure tools."}
      footnote="Already enrolled? Use the login link below to return to your account."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Register</h2>
          <p>Fill in the details below to create your Petra School account.</p>
        </div>

        {serverError ? <div className="auth-alert">{serverError}</div> : null}

        <div style={{ display: "flex", gap: 12 }}>
          <label className="auth-field" style={{ flex: 1 }}>
            <span>First Name</span>
            <div className="auth-input-wrap">
              <UserRound size={18} />
              <input name="firstName" type="text" placeholder="Enter first name" value={form.firstName} onChange={handleChange} autoComplete="given-name" />
            </div>
            {errors.firstName ? <small>{errors.firstName}</small> : null}
          </label>

          <label className="auth-field" style={{ flex: 1 }}>
            <span>Last Name</span>
            <div className="auth-input-wrap">
              <UserRound size={18} />
              <input name="lastName" type="text" placeholder="Enter last name" value={form.lastName} onChange={handleChange} autoComplete="family-name" />
            </div>
            {errors.lastName ? <small>{errors.lastName}</small> : null}
          </label>
        </div>

        <label className="auth-field">
          <span>Username</span>
          <div className="auth-input-wrap">
            <UserRound size={18} />
            <input
              name="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>
          {errors.username ? <small>{errors.username}</small> : null}
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

        {rolePreset ? (
          <div className="auth-field">
            <span>Registration Type</span>
            <div className="auth-input-wrap" style={{ justifyContent: "space-between", padding: "0 14px" }}>
              <span>{rolePreset === "principal" ? "School Administrator" : "Staff / Teacher"}</span>
              <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }}>Selected</span>
            </div>
          </div>
        ) : (
          <label className="auth-field">
            <span>Register As</span>
            <div className="auth-input-wrap">
              <UserRound size={18} />
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="principal">School Administrator</option>
              </select>
            </div>
            {errors.role ? <small>{errors.role}</small> : null}
          </label>
        )}

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
          {errors.institution ? <small>{errors.institution}</small> : null}
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
