import React from 'react';

const Hero = () => {
  return (
    <div className="relative h-[70vh] flex flex-col items-center justify-center">
      {/* This div will be replaced with your Three.js animation */}
      <div className="absolute inset-0 -z-10" id="hero-animation">
        {/* Three.js animation will be mounted here */}
      </div>

      <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <h1 className="text-6xl font-extrabold text-gray-800 tracking-tight">
          Professional Association of Civil Engineers
        </h1>
        <p className="text-xl text-gray-600">
          Building the future through excellence in civil engineering
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold 
          hover:bg-blue-700 transition-colors duration-300 shadow-lg">
          About Us
        </button>
      </div>
    </div>
  );
};

export default Hero;