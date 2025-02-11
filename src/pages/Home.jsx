import React, { useRef } from 'react';
import Navbar from '../components/Home/Navbar';
import Hero from '../components/Home/Hero';
import ActivityLog from '../components/Home/ActivityLog/ActivityLog';
import Footer from '../components/Home/Footer';
import AboutUs from '../components/Home/AboutUs/AboutUs';

function Home() {
  const aboutUsRef = useRef(null);
  const footerRef = useRef(null);

  const scrollToAboutUs = () => {
    if (aboutUsRef.current) {
      aboutUsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar scrollToFooter={scrollToFooter} />
      <main className="flex-grow">
        <Hero scrollToAboutUs={scrollToAboutUs} scrollToFooter={scrollToFooter} />
        <ActivityLog />
        <div ref={aboutUsRef}>
          <AboutUs />
        </div>
      </main>
      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
}

export default Home;