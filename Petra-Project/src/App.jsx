import Footer from "./Pages/components/Footer"
import ForSchool from "./Pages/Forschool";
import ForStudents from "./Pages/Forstusents";
import Solution from "./Pages/Solution";
import DashboardSidebar from "./Pages/DashboardLayout/DashBoard";
import Company from "./Pages/Company";
import Navbar from "./Pages/components/Navbar";
import Forparents from "./Pages/Forparents";
import About from "./Pages/About";
import Home from "./Pages/Home";
import GetStarted from "./Pages/Sigin/GetStarted"
import Contact from "./Pages/Contact";
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

function DashboardLay(){

  return(
    <>
      <DashboardSidebar />
      <Outlet />
    </>
  )
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

        </Route>

      </Routes>
    </Router>
  );
}

export default App;