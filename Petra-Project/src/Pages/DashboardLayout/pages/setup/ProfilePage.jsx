import { useContext } from "react";
import { Building2, Upload } from "lucide-react";
import { UserContext } from "../../../../context/UserContext";
import { getDisplayName } from "../../../../utils/userProfile";
import UserAvatar from "../../../../components/UserAvatar";

export default function ProfilePage() {
  const { userInfo, setUserInfo } = useContext(UserContext);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUserInfo((current) => {
      if (name === "fullName") {
        const parts = value.trim().split(/\s+/).filter(Boolean);
        return {
          ...current,
          fullName: value,
          firstName: parts[0] || "",
          lastName: parts.length > 1 ? parts[parts.length - 1] : "",
        };
      }

      const nextState = {
        ...current,
        [name]: value,
      };

      if (name === "firstName" || name === "lastName") {
        nextState.fullName = [
          name === "firstName" ? value : current.firstName,
          name === "lastName" ? value : current.lastName,
        ]
          .filter(Boolean)
          .join(" ");
      }

      return nextState;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({
          ...userInfo,
          profileImage: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const styles = {
    container: {
      color: "var(--foreground)",
      backgroundColor: "var(--background)",
      minHeight: "100vh",
      padding: "32px",
      fontFamily: "system-ui, sans-serif",
    },
    headerSection: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "32px",
    },
    headerIcon: {
      backgroundColor: "var(--input)",
      color: "var(--primary)",
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: 0,
      border: "1px solid var(--border)",
    },
    title: {
      fontSize: "22px",
      fontWeight: "700",
      margin: "0 0 6px 0",
    },
    subtitle: {
      fontSize: "14px",
      color: "var(--muted-foreground)",
      fontWeight: "400",
      margin: 0,
    },
    mainLayout: {
      display: "grid",
      gridTemplateColumns: "1fr 280px",
      gap: "24px",
      alignItems: "start",
    },
    cardLeft: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "32px",
    },
    cardRight: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "32px",
      display: "flex",
      flexDirection: "column",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      margin: "0 0 24px 0",
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "var(--foreground)",
    },
    input: {
      color: "var(--foreground)",
      backgroundColor: "var(--input)",
      border: "1px solid var(--border)",
      height: "44px",
      padding: "0 16px",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
    },
    textarea: {
      color: "var(--foreground)",
      backgroundColor: "var(--input)",
      border: "1px solid var(--border)",
      padding: "12px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
      width: "100%",
      minHeight: "80px",
      resize: "none",
      boxSizing: "border-box",
    },
    imageContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
    },
    logoBox: {
      width: "140px",
      height: "140px",
      borderRadius: "999px",
      backgroundColor: "var(--input)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    fallbackText: {
      fontSize: "36px",
      fontWeight: "700",
      color: "var(--primary)",
    },
    metaText: {
      fontSize: "12px",
      color: "var(--muted-foreground)",
      margin: "4px 0 12px 0",
    },
    uploadBtn: {
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      height: "40px",
      width: "100%",
      backgroundColor: "var(--input)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      transition: "background-color 0.2s",
    },
  };

  return (
    <div className="dashboard-page" style={styles.container}>
      <div style={styles.headerSection}>
        <h2 style={styles.headerIcon}>
          <Building2 size={22} />
        </h2>
        <div>
          <h3 style={styles.title}>Profile</h3>
          <h4 style={styles.subtitle}>Manage your account identity and contact information</h4>
        </div>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.cardLeft}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>First Name</label>
              <input name="firstName" type="text" value={userInfo.firstName || ""} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Last Name</label>
              <input name="lastName" type="text" value={userInfo.lastName || ""} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input name="fullName" type="text" value={userInfo.fullName || getDisplayName(userInfo)} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input name="username" type="text" value={userInfo.username || ""} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Role</label>
              <input name="role" type="text" value={userInfo.role || ""} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input type="email" name="email" value={userInfo.email || ""} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <div style={{ ...styles.inputGroup, marginBottom: "20px" }}>
            <label style={styles.label}>Address</label>
            <textarea
              name="address"
              value={userInfo.address || ""}
              placeholder="Type your address here..."
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>
        </div>

        <div style={styles.cardRight}>
          <h2 style={styles.sectionTitle}>Profile Picture</h2>
          <div style={styles.imageContainer}>
            <div style={styles.logoBox}>
              <UserAvatar
                user={userInfo}
                size={140}
                alt={getDisplayName(userInfo)}
                className="profile-page-avatar"
              />
            </div>

            <div style={styles.imageContainer}>
              <span style={styles.metaText}>PNG or JPG, max 2MB</span>
              <label style={styles.uploadBtn}>
                <Upload size={14} /> Upload Photo
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <h3 style={{ margin: "0 0 8px" }}>{getDisplayName(userInfo)}</h3>
            <p style={{ margin: 0, color: "var(--muted-foreground)" }}>{userInfo.email}</p>
            <p style={{ margin: "6px 0 0", color: "var(--muted-foreground)" }}>
              {userInfo.username || "username pending"} · {userInfo.role || "user"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
