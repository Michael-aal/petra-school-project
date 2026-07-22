import { useContext } from "react";
import { UserContext } from "../../../context/UserContext";
import UserAvatar from "../../../components/UserAvatar";
import { getDisplayName } from "../../../utils/userProfile";

export default function SettingsPage() {
  const { userInfo } = useContext(UserContext);

  return (
    <div className="dashboard-page">
      <h1>Settings</h1>
      <p>Configure your school platform preferences.</p>
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
