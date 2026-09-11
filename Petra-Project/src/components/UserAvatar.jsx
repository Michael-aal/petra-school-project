import { useState } from "react";
import { User } from "lucide-react";
import { getFirstName, getUserInitials } from "../utils/userProfile";

export default function UserAvatar({
  user,
  size = 40,
  className = "",
  alt = "Profile picture",
}) {
  const [erroredSrc, setErroredSrc] = useState(null);
  const initials = getUserInitials(user);
  const label = user?.fullName || user?.email || getFirstName(user) || "Profile";
  const profileImage = user?.profileImage || user?.profilePicture;
  const showImage = profileImage && profileImage !== erroredSrc;

  return (
    <div
      className={`user-avatar ${className}`.trim()}
      title={label}
      aria-label={label}
      role="img"
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "999px",
      }}
    >
      {showImage ? (
        <img
          src={profileImage}
          alt={alt}
          className="user-avatar-image"
          onError={() => setErroredSrc(profileImage)}
        />
      ) : initials ? (
        <span className="user-avatar-initials">{initials}</span>
      ) : (
        <User size={Math.max(16, Math.floor(size * 0.45))} />
      )}
    </div>
  );
}
