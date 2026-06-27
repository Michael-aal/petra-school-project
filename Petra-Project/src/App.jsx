import Footer from "./Pages/components/Footer"
import ForSchool from "./Pages/Forschool";
import ForStudents from "./Pages/Forstusents";
import Solution from "./Pages/Solution";
import Company from "./Pages/Company";
import Navbar from "./Pages/components/Navbar";
import Forparents from "./Pages/Forparents"
import Home from "./Pages/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solution" element={<Solution />} />
        <Route path="/company" element={<Company />} />
        <Route path="/schools" element={<ForSchool />} />
        <Route path="/parents" element={<Forparents />} />
        <Route path="/students" element={<ForStudents />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;