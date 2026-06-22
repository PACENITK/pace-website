import React, { useState, useEffect } from 'react';

// Import images correctly

import h1 from '../../assets/Home/h1.jpg';
import h2 from '../../assets/Home/h2.jpg';
import h3 from '../../assets/Home/h3.jpg';
import prestressing from '../../assets/Events/prestressing.jpg';
import h4 from '../../assets/Home/h4.jpg';
import h5 from '../../assets/Home/h5.jpg';
import h6 from '../../assets/Home/h6.jpg';
import h7 from '../../assets/Home/h7.jpg';
import h8 from '../../assets/Home/h8.jpeg';
import h9 from '../../assets/Home/h9.jpg';
import h10 from '../../assets/Home/h10.jpeg';
import a4 from '../../assets/AboutUs/a4.jpeg';

import { Heading6Icon } from 'lucide-react';


const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Store images in an array
  const images = [ h1, h10, prestressing, a4, h4, h2, h3, h5, h6, h7, h9];

  const titleWords = "Professional Association for Civil Engineering".split(" ");

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about-us');
    if (aboutSection) {
      aboutSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handlePrev = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center mb-0 bg-blue-50/70">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className={`
                w-full h-full flex-shrink-0 bg-cover bg-center relative
                animate-slowZoom
              `}
              style={{ backgroundImage: `url(${image})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative text-center space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-snug pb-2">
          <div className="flex flex-wrap justify-center gap-x-3">
            {titleWords.map((word, index) => (
              <span
                key={index}
                className={`
                  inline-block transform transition-all duration-700 ease-out
                  ${isVisible 
                    ? 'translate-y-0 opacity-100 scale-100'
                    : 'translate-y-full opacity-0 scale-95'
                  }
                `}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {word}
              </span>
            ))}
          </div>
        </h1>
        
        <p 
          className={`
            text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto
            transform transition-all duration-700 delay-500 ease-out
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}
        >
          Building the future through excellence in civil engineering
        </p>
        <button 
          onClick={scrollToAbout}
          className={`
            bg-[#EAF3FF] text-black px-5 sm:px-6 py-2.5 rounded-md font-medium text-base sm:text-lg 
            transition-all duration-200 ease-in-out shadow-lg transform
            hover:bg-[#d4e7ff] hover:shadow-xl hover:scale-105 
            focus:ring-2 focus:ring-blue-300 active:scale-95
          `}
        >
          About Us
        </button>
      </div>

      {/* Manual Controls */}
      <div className="absolute bottom-6 flex gap-3 z-10">
        <button 
          onClick={handlePrev} 
          className="bg-white/80 hover:bg-white text-black px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out focus:outline-none active:opacity-90 active:scale-95"
        >
          ◀
        </button>
        <button 
          onClick={handleNext} 
          className="bg-white/80 hover:bg-white text-black px-4 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out focus:outline-none active:opacity-90 active:scale-95"
        >
          ▶
        </button>
      </div>

      {/* Scroll to Explore Indicator */}
      <div className="absolute bottom-5 right-1/4 flex flex-col items-center text-white animate-bounce">
        <span className="text-sm font-medium">Scroll to Explore</span>
        <span className="text-2xl">↓</span>
      </div>
    </div>
  );
};

export default Hero;