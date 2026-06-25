import React from 'react'
import Navbar from './Pages/components/Navbar'
import Footer from './Pages/components/Footer'
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <>
    <BrowserRouter>
    <Navbar />
    <Footer />
    </BrowserRouter>
    </>
  )
}

export default App