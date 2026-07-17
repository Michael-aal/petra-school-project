import Footer from "./Pages/components/Footer"
import ForSchool from "./Pages/Forschool";
import ForStudents from "./Pages/Forstusents";
import Solution from "./Pages/Solution";
import {SidebarNav} from "./Pages/DashboardLayout/SidebarNav";
import Company from "./Pages/Company";
import Navbar from "./Pages/components/Navbar";
import Forparents from "./Pages/Forparents";
import About from "./Pages/About";
import Home from "./Pages/Home";
import HomeDashBoard from "./Pages/DashboardLayout/homeDahboard";
import GetStarted from "./Pages/Sigin/GetStarted"
import Contact from "./Pages/Contact";
import UserInfo from "./Pages/DashboardLayout/TopNavbar";
import { BrowserRouter as Router, Routes, Route, Outlet} from "react-router-dom";

function PublicLayout(){

  return(
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}

function DashboardLay() {
  return (
    <div style={{ display: "flex" }}>
      <SidebarNav />
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>
      <UserInfo />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/solution" element={<Solution />} />
        <Route path="/company" element={<Company />} />
        <Route path="/schools" element={<ForSchool />} />
        <Route path="/parents" element={<Forparents />} />
        <Route path="/students" element={<ForStudents />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/get-started" element={<GetStarted />} />
        </Route>

        {/* Dashboard */}
<Route element={<DashboardLay />}>
  <Route path="/dashboard" element={<h1>Dashboard Home</h1>} />
  <Route path="//dashboardHome" element={<HomeDashBoard />} />
  <Route path="/enrollments" element={<h1>Enrollments</h1>} />
  <Route path="/classes" element={<h1>Classes</h1>} />
  <Route path="/bus" element={<h1>Bus</h1>} />
  <Route path="/parents" element={<h1>Parents</h1>} />
  <Route path="/cbt" element={<h1>CBT Exams</h1>} />

  <Route path="/students" element={<h1>Students</h1>} />
  <Route path="/gate" element={<h1>Gate Monitoring</h1>} />

  <Route path="/teachers" element={<h1>Teachers</h1>} />
  <Route path="/attendance" element={<h1>Attendance</h1>} />
  <Route path="/admins" element={<h1>Admins</h1>} />

  <Route path="/payments" element={<h1>Payments</h1>} />
  <Route path="/invoice" element={<h1>Invoice</h1>} />
  <Route path="/fees" element={<h1>Fees</h1>} />

  <Route path="/flexpay" element={<h1>Flexpay</h1>} />
  <Route path="/cashflow" element={<h1>Cashflow</h1>} />

  <Route path="/withdraw" element={<h1>Withdraw</h1>} />
  <Route path="/transfer" element={<h1>Transfer</h1>} />

  <Route path="/support" element={<h1>Support</h1>} />
  <Route path="/billing" element={<h1>Billing</h1>} />
  <Route path="/settings" element={<h1>Settings</h1>} />
</Route>

      </Routes>
    </Router>
  );
}

export default App;