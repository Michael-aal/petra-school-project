import { Building2, Upload } from "lucide-react";
import { UserContext } from "/src/context/UserContext"; 
import { useContext } from "react";

export default function ProfilePage() {
  const { userInfo, setUserInfo } = useContext(UserContext);

  const handleChange = (e) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({
          ...userInfo,
          profileImage: reader.result
        });
      };
      reader.readAsDataURL(file)
    }
  }

  // Exact styles to match the provided layout image
  const styles = {
    container: {
      color: "var(--foreground)",
      backgroundColor: "var(--background)",
      minHeight: "100vh",
      padding: "32px",
      fontFamily: "system-ui, sans-serif"
    },
    headerSection: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "32px"
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
      border: "1px solid var(--border)"
    },
    title: {
      fontSize: "22px",
      fontWeight: "700",
      margin: "0 0 6px 0"
    },
    subtitle: {
      fontSize: "14px",
      color: "var(--muted-foreground)",
      fontWeight: "400",
      margin: 0
    },
    mainLayout: {
      display: "grid",
      gridTemplateColumns: "1fr 280px",
      gap: "24px",
      alignItems: "start"
    },
    cardLeft: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "32px"
    },
    cardRight: {
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "32px",
      display: "flex",
      flexDirection: "column"
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      margin: "0 0 24px 0"
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px"
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "var(--foreground)"
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
      boxSizing: "border-box"
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
      boxSizing: "border-box"
    },
    imageContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px"
    },
    logoBox: {
      width: "140px",
      height: "140px",
      borderRadius: "16px",
      backgroundColor: "var(--input)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    fallbackText: {
      fontSize: "36px",
      fontWeight: "700",
      color: "var(--primary)"
    },
    metaText: {
      fontSize: "12px",
      color: "var(--muted-foreground)",
      margin: "4px 0 12px 0"
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
      transition: "background-color 0.2s"
    }
  };

  // Safe helper to extract initial letter
  const getInitial = () => {
    return userInfo.institution ? userInfo.institution.trim().charAt(0).toUpperCase() : "P";
  };

  return (
    <div className="dashboard-page" style={styles.container}>
        <div style={styles.headerSection}>
          <h2 style={styles.headerIcon}><Building2 size={22} /></h2>
          <div>
            <h3 style={styles.title}>School Profile</h3>
            <h4 style={styles.subtitle}>Manage your school's identity and contact information</h4>
          </div>
        </div>

        <div className="" style={styles.mainLayout}>

        <div style={styles.cardLeft}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          <div>
              <div>
                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>School Name</label>
                    <input 
                      name="institution" 
                      type="text" 
                      value={userInfo.institution || ""} 
                      onChange={handleChange} 
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>School Code</label>
                    <input name="schoolCode" type="text" value={userInfo.schoolCode || ""} onChange={handleChange} style={styles.input} />
                  </div>
                </div>
              </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input type="text" name="phoneNumber" value={userInfo.phoneNumber || ""} onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input type="email" name="email" value={userInfo.email || ""} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          <div style={{ ...styles.inputGroup, marginBottom: "20px" }}>
            <label style={styles.label}>Address</label>
            <textarea name="address" value={userInfo.address || ""} placeholder="Type your school address here..." onChange={handleChange} style={styles.textarea} />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>State</label>
              <input type="text" name="state" value={userInfo.state || ""} onChange={handleChange} style={styles.input}  />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Country</label>
              <input type="text" name="country" value={userInfo.country || ""} onChange={handleChange} style={styles.input} />
            </div>
          </div>
        </div>

        <div style={styles.cardRight}>
          <h2 style={styles.sectionTitle}>School Logo</h2>
          <div className="" style={styles.imageContainer}>
            <div style={styles.logoBox}>
              {userInfo.profileImage ? (
                <img 
                  src={userInfo.profileImage}
                  alt="school logo" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ): (
                <div style={styles.fallbackText}>
                  {getInitial()}
                </div>
              )}
            </div>

            <div style={styles.imageContainer}>
              <span style={styles.metaText}>PNG or JPG, max 2MB</span>
              <label style={styles.uploadBtn}>
                <Upload size={14} /> Upload Logo
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        </div>
        </div>
    </div>
  );
}
