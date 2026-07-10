import { useState } from "react";
import "../../Styles/DashBoardLayout/Dashboard.css"
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

function MenuItem({ title, children }) {
  return (
    <div className="menu-section">
      <h4 className="menu-title">{title}</h4>

      <div className="menu-links">
        {children}
      </div>
    </div>
  );
}

export default function DashboardSidebar({ sidebarOpen, setSidebarOpen }) {

   const schoolName = "PETRA"


  return (
    <>

    {sidebarOpen && (
        <div 
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
        ></div>
    )}


    <aside className={`sidebar ${sidebarOpen ? "show-sidebar" : ""}`}>


      <div className="sidebar-header">

        <h2>{schoolName}</h2>

        <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
        >
            <X size={22}/>
        </button>

      </div>


      {/* KEEP ALL YOUR MENU ITEMS HERE */}

<MenuItem title="Dashboard">
        <NavLink to="/dashboard">
          <img src="https://school.acceede.com/static/media/more.505d298ccead783ac815adfdf5ed6b85.svg" alt="" />
          <span>Get Started</span>
        </NavLink>

        <NavLink to="/dashboardHome">
          <img src="https://school.acceede.com/static/media/home-11.1cffcc3bd9cba2dbf0f182ba581c062a.svg" alt="" />
          <span>Home</span>
        </NavLink>
      </MenuItem>

      {/* Setup */}
      <MenuItem title="Setup">
        <NavLink to="/enrollments">
          <img src="https://school.acceede.com/static/media/coupon-02.9b72e679245a18555efffbc5d15903b5.svg" alt="" />
          <span>All Enrollments</span>
        </NavLink>

        <NavLink to="/classes">
          <img src="https://school.acceede.com/static/media/user-multiple.51bae1554cc728ff36a8281ce7b7e691.svg" alt="" />
          <span>All Classes</span>
        </NavLink>

        <NavLink to="/bus">
          <img src="https://school.acceede.com/static/media/bus-03.bbc4877d45c51a5c5b0c0b1d88527154.svg" alt="" />
          <span>School Bus</span>
        </NavLink>

        <NavLink to="/parents">
          <img src="https://school.acceede.com/static/media/user-multiple.51bae1554cc728ff36a8281ce7b7e691.svg" alt="" />
          <span>Parent Management</span>
        </NavLink>

        <NavLink to="/resultManagement">
          <img src="https://school.acceede.com/static/media/document-attachment.4b7eaad8d51e4644fbc009440c323aaa.svg" alt="" />
          <span>Result Management</span>
        </NavLink>

        <NavLink to="/cbtExam">
          <img src="https://school.acceede.com/static/media/coupon-02.9b72e679245a18555efffbc5d15903b5.svg" alt="" />
          <span>CBT Exams</span>
        </NavLink>
      </MenuItem>

      {/* Student Management */}
      <MenuItem title="Student Management">
        <NavLink to="/students">
          <img src="https://school.acceede.com/static/media/tick-double-04.2056db7c56e5d274d163c498d3978e4e.svg" alt="" />
          <span>Student Management</span>
        </NavLink>

        <NavLink to="/gate">
          <span>🚪</span>
          <span>Gate Monitoring</span>
        </NavLink>
      </MenuItem>

      {/* Staff Management */}
      <MenuItem title="Staff Management">
        <NavLink to="/teachers">
          <img src="https://school.acceede.com/static/media/teacher.d62252657344ece567a8e92198d356db.svg" alt="" />
          <span>Teacher Management</span>
        </NavLink>

        <NavLink to="/attendance">
          <img src="https://school.acceede.com/static/media/teacher.d62252657344ece567a8e92198d356db.svg" alt="" />
          <span>Teacher Attendance</span>
        </NavLink>

        <NavLink to="/admins">
          <img src="https://school.acceede.com/static/media/teacher.d62252657344ece567a8e92198d356db.svg" alt="" />
          <span>Admin Management</span>
        </NavLink>
      </MenuItem>

      {/* Payment */}
      <MenuItem title="Payment">
        <NavLink to="/payments">
          <img src="https://school.acceede.com/static/media/credit-card-pos.6e02ba4308750e972fb67dfe35227397.svg" alt="" />
          <span>View All Payments</span>
        </NavLink>

        <NavLink to="/invoice">
          <img src="https://school.acceede.com/static/media/payment-02.d969907bca0abb534d56344a48ebf6bb.svg" alt="" />
          <span>Student Invoice</span>
        </NavLink>

        <NavLink to="/fees">
          <img src="https://school.acceede.com/static/media/invoice-01.627853ebc5194a0fc17f0ccdbdec7807.svg" alt="" />
          <span>Extra Fees</span>
        </NavLink>
      </MenuItem>

      {/* Flexpay */}
      <MenuItem title="Flexpay">
        <NavLink to="/flexpay">
          <img src="https://school.acceede.com/static/media/invoice-01.627853ebc5194a0fc17f0ccdbdec7807.svg" alt="" />
          <span>Flexpay</span>
        </NavLink>
      </MenuItem>

      {/* Financing */}
      <MenuItem title="Financing">
        <NavLink to="/cashflow">
          <img src="https://school.acceede.com/static/media/hugeicons_cash-02.9aa91752494ae591d721c0f9376c2286.svg" alt="" />
          <span>Cashflow</span>
        </NavLink>
      </MenuItem>

      {/* Payouts */}
      <MenuItem title="Payouts">
        <NavLink to="/withdraw">
          <img src="https://school.acceede.com/static/media/uil_money-withdraw.0a05c0f0555c1edcd14e2132cdf6f83b.svg" alt="" />
          <span>Withdraw</span>
        </NavLink>

        <NavLink to="/transfer">
          <span>💸</span>
          <span>Transfer</span>
        </NavLink>
      </MenuItem>

      {/* Help */}
      <MenuItem title="Help">
        <NavLink to="/support">
          <img src="https://school.acceede.com/static/media/message-question.d963351e22715dff43b576a9da979a85.svg" alt="" />
          <span>Support</span>
        </NavLink>
      </MenuItem>

      {/* Personalization */}
      <MenuItem title="Personalization">
        <NavLink to="/billing">
          <span>💳</span>
          <span>Billing</span>
        </NavLink>

        <NavLink to="/settings">
          <img src="https://school.acceede.com/static/media/settings-02.e44546f37de353d0b9f2f1f2818a9f57.svg" alt="" />
          <span>Settings</span>
        </NavLink>
      </MenuItem>

    </aside>

    </>
  );
}


