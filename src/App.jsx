import React, { useRef } from 'react';
import Navbar from './components/Home/Navbar';
import Hero from './components/Home/Hero';
import ActivityLog from './components/ActivityLog/ActivityLog';
import Footer from './components/Home/Footer';
import AboutUs from './components/AboutUs/AboutUs';

function App() {
  const aboutUsRef = useRef(null); // Ref for AboutUs section
  const footerRef = useRef(null); // Ref for Footer section

  // Function to scroll to the AboutUs section
  const scrollToAboutUs = () => {
    if (aboutUsRef.current) {
      aboutUsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to scroll to the Footer section
  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar scrollToFooter={scrollToFooter} />
      <main className="flex-grow">
        <Hero scrollToAboutUs={scrollToAboutUs} />
        <ActivityLog />
        <AboutUs ref={aboutUsRef} />
      </main>
      <Footer ref={footerRef} />
    </div>
  );
}

export default App;