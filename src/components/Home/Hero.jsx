import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Hero = ({ scrollToAboutUs }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80',
    'https://images.unsplash.com/photo-1512187849-463fdb898f21?q=80'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center mb-16">
      {/* Background images with staggered transition */}
      <div className="absolute inset-0 overflow-hidden">
        {images.map((image, index) => (
          <motion.div
            key={image}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: currentImageIndex === index ? 1 : 0, scale: currentImageIndex === index ? 1 : 1.1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        ))}
      </div>

      <div className="relative text-center space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.h1 
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Professional Association of Civil Engineers
        </motion.h1>
        <motion.p 
          className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Building the future through excellence in civil engineering
        </motion.p>
        <motion.button 
          className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold 
            hover:bg-blue-700 transition-colors duration-300 shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToAboutUs} // Call the scroll function
        >
          About Us
        </motion.button>
      </div>
    </div>
  );
};

export default Hero;