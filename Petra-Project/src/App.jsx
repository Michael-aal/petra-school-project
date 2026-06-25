import React from 'react'
import Navbar from './Pages/components/Navbar'
import Footer from './Pages/components/Footer'
import Home from './Pages/Home';
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <>
    <BrowserRouter>
    <Navbar />
    <Home />
    <Footer />
    </BrowserRouter>
    </>
  )
}

export default App