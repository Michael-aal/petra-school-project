import { X, Menu, Bell, User, ChevronDown } from "lucide-react";
import { useContext, useState } from "react"; // Combined imports
import { UserContext } from "../../context/UserContext";
import "../../Styles/DashBoardLayout/TopNavbar.css";

export default function TopNavbar({ onToggle }) {
  const { userInfo } = useContext(UserContext);
  const [showButton, setShowBtn] = useState(true);

  // Combined click handler to handle both sidebar toggle and icon swap
  const handleMenuClick = () => {
    setShowBtn(!showButton);
    if (onToggle) onToggle(); 
  };

  return (
    <header className="top-navbar">
      <div className="top-left">
        <button className="menu-btn" onClick={handleMenuClick} aria-label="Toggle menu">
          {/* Conditional rendering determines which icon to show */}
          {!showButton ? <Menu /> : <X />}
        </button>
        <div className="top-welcome">Welcome, {userInfo?.firstName}</div>
      </div>

      <div className="top-right">
        <button className="icon-btn" aria-label="Notifications">
          <Bell />
        </button>
        <div className="user-info">
          <div className="avatar">
            <User />
          </div>
          <div className="user-meta">
            <div className="user-name">
              {userInfo?.firstName} {userInfo?.lastName}
            </div>
            <div className="user-caret">
              <ChevronDown />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
