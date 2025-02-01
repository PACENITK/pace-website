import React, { useState, useEffect } from 'react';

const AboutUs = () => {
 const [currentImageIndex, setCurrentImageIndex] = useState(0);
 
 const images = [
   'https://images.unsplash.com/photo-1517836357641-59dc1f04f129?auto=format&fit=crop&q=80&w=800',
   'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800',
   'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800',
   'https://images.unsplash.com/photo-1512187849-463fdb898f21?auto=format&fit=crop&q=80&w=800'
 ];

 useEffect(() => {
   const timer = setInterval(() => {
     setCurrentImageIndex((prevIndex) => 
       (prevIndex + 1) % images.length
     );
   }, 3000);

   return () => clearInterval(timer);
 }, []);

 return (
   <div id="about-us" className="bg-white py-16 pb-24">
     <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
       <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center underline decoration-blue-600 underline-offset-8">
         About Us
       </h2>
       <p className="text-xl text-gray-600 text-center mb-12 py-4">
         Welcome to Professional Association of Civil Engineers Of NITK SURATHKAL
       </p>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="rounded-xl overflow-hidden shadow-md lg:order-first order-last relative h-[350px]">
           {images.map((image, index) => (
             <img 
               key={image}
               src={image} 
               alt={`Civil Engineering Team ${index + 1}`}
               className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${
                 currentImageIndex === index ? 'opacity-100' : 'opacity-0'
               }`}
             />
           ))}
         </div>
         
         <div className="space-y-5 self-start">
           <h3 className="text-3xl font-bold text-gray-800">
             Professional Association of Civil Engineers
           </h3>
           <p className="text-gray-600 text-base leading-relaxed">
             We are a dedicated association committed to advancing civil engineering through innovation, education, and professional development.
           </p>
           <div className="space-y-4">
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default AboutUs;