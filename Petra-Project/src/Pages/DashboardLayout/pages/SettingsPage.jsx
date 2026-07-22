import { useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { UserContext } from "../../../context/UserContext";
import UserAvatar from "../../../components/UserAvatar";
import { getDisplayName } from "../../../utils/userProfile";

export default function SettingsPage() {
  const { userInfo } = useContext(UserContext);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedTheme = window.localStorage.getItem("petra-theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.body.classList.toggle("light", !darkMode);
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    window.localStorage.setItem("petra-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className="dashboard-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          padding: "24px",
          borderRadius: "20px",
          border: "1px solid var(--app-border)",
          background: "var(--app-surface)",
          color: "var(--app-text)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "6px" }}>Settings</h1>
          <p style={{ margin: 0 }}>Configure your school platform preferences.</p>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode((prev) => !prev)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid var(--app-border)",
            background: darkMode ? "var(--dashboard-accent-gradient)" : "var(--app-surface)",
            color: darkMode ? "#ffffff" : "var(--app-text)",
            padding: "10px 14px",
            borderRadius: "999px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "24px" }}>
        <UserAvatar user={userInfo} size={64} />
        <div>
          <h2 style={{ margin: 0 }}>{getDisplayName(userInfo)}</h2>
          <p style={{ margin: "4px 0 0" }}>{userInfo.email || "No email available"}</p>
          <p style={{ margin: "4px 0 0" }}>
            {userInfo.username || "No username yet"} - {userInfo.role || "user"}
          </p>
        </div>
      </div>
    </div>
  );
}
