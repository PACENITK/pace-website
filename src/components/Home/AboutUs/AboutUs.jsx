import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import icons

import h2 from '../../../assets/Home/h2.jpg';
import a2 from '../../../assets/AboutUs/a2.jpg';
import a5 from '../../../assets/AboutUs/a5.jpg';

const AboutUs = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [h2, a2, a5];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Next & Previous functions
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div id="about-us" className="bg-gray-100 py-16 pb-24 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center underline decoration-blue-600 underline-offset-8">
          About Us
        </h2>
        <p className="text-xl text-gray-700 font-semibold text-center mb-12 py-4 font-sans">
          Welcome to Professional Association For Civil Engineering Of NITK SURATHKAL
        </p>

        {/* Slideshow Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div 
            className="relative w-full h-[350px] rounded-2xl overflow-hidden shadow-lg lg:order-first order-last"
          >
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Civil Engineering Team ${index + 1}`}
                className={`absolute w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  currentImageIndex === index ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            {/* Left Button */}
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
              onClick={prevImage}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Right Button */}
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
              onClick={nextImage}
            >
              <ChevronRight size={24} />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentImageIndex === index ? "bg-blue-500 scale-110" : "bg-gray-400"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <div className="space-y-5 self-start">
            <h3 className="text-2xl font-bold text-gray-900">
            Professional Association For Civil Engineering
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
            PACE NITK is a student-driven club bridging academia and industry incivil engineering. We offer hands-onlearning, industry exposure, 
            and expert mentorship to equipstudents with real-world skills and innovation opportunities.
            </p>
            <h1 className="text-xl font-bold  text-gray-900"> Our Vision</h1>
            <p className="text-gray-700 text-base leading-relaxed"> 
              To empower the next generation ofcivil engineers by bridging the gap between academia and industry, fostering innovation, and 
              creating a collaborative platform for hands-on learning, research, and sustainable development. </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
