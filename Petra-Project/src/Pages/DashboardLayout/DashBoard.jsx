import { useState } from "react";
import { NavLink } from "react-router-dom";

function MenuItem({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-section">
      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}
      >
        {title}
      </div>

      {open && <div style={{ paddingLeft: "15px" }}>{children}</div>}
    </div>
  );
}

export default function DashboardSidebar() {
  return (
    <div
      style={{
        width: "260px",
        height: "100vh",
        background: "#111827",
        color: "white",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>PETRA</h2>

      {/* DASHBOARD */}
      <MenuItem title="Dashboard">
        <NavLink to="/dashboard" style={{ display: "block", color: "white" }}>
          Get Started
        </NavLink>
        <NavLink to="/" style={{ display: "block", color: "white" }}>
          Home
        </NavLink>
      </MenuItem>

      {/* SETUP */}
      <MenuItem title="Setup">
        <NavLink to="/enrollments">All Enrollments</NavLink>
        <NavLink to="/classes">All Classes</NavLink>
        <NavLink to="/bus">School Bus</NavLink>
        <NavLink to="/parents">Parent Management</NavLink>
        <NavLink to="/cbt">CBT Exams</NavLink>
      </MenuItem>

      {/* STUDENT MANAGEMENT */}
      <MenuItem title="Student Management">
        <NavLink to="/students">Student Management</NavLink>
        <NavLink to="/gate">Gate Monitoring</NavLink>
      </MenuItem>

      {/* STAFF MANAGEMENT */}
      <MenuItem title="Staff Management">
        <NavLink to="/teachers">Teacher Management</NavLink>
        <NavLink to="/attendance">Teacher Attendance</NavLink>
        <NavLink to="/admins">Admin Management</NavLink>
      </MenuItem>

      {/* PAYMENT */}
      <MenuItem title="Payment">
        <NavLink to="/payments">View All Payments</NavLink>
        <NavLink to="/invoice">Student Invoice</NavLink>
        <NavLink to="/fees">Extra Fees</NavLink>
      </MenuItem>

      {/* FLEXPAY */}
      <MenuItem title="Flexpay">
        <NavLink to="/flexpay">Flexpay</NavLink>
      </MenuItem>

      {/* FINANCING */}
      <MenuItem title="Financing">
        <NavLink to="/cashflow">Cashflow</NavLink>
      </MenuItem>

      {/* PAYOUTS */}
      <MenuItem title="Payouts">
        <NavLink to="/withdraw">Withdraw</NavLink>
        <NavLink to="/transfer">Transfer</NavLink>
      </MenuItem>

      {/* HELP */}
      <MenuItem title="Help">
        <NavLink to="/support">Support</NavLink>
      </MenuItem>

      {/* PERSONALIZATION */}
      <MenuItem title="Personalization">
        <NavLink to="/billing">Billing</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </MenuItem>
    </div>
  );
}