import React, { useState, useEffect } from 'react';
import DiscoverPACE from './DiscoverPACE';
import ActivityCard from './ActivityCard';
import AnnouncementToolbox from './AnnouncementToolbox';
import a3 from '../../../assets/AboutUs/a3.jpg'; //image as well in component
import GeoInnovate1 from '../../../assets/Projects/Hosted/GeoInnovate1.jpg';
import Stability1 from '../../../assets/Projects/Hosted/Stability/Stability1.jpg';


const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const styles = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }, []);

  const activities = [
    {
      id: 1,
      title: "Workshop - GeoInnovate: Pioneering Sustainable Geotextile Solutions",
      date: "14th March 2025",
      description: `Gain insights into geotextiles' role in sustainable construction, soil stabilization with eco-friendly materials, real-world applications, advanced testing methods, and 
      performance evaluation in this workshop by Prof. Sreevalsa K.`,
      image: GeoInnovate1,
      instagramLink: "http://localhost:5173/projects/hosted-projects/hosted-1"
    },
    {
      id: 2,
      title: "Workshop on Stability of Industrial Racks",
      date: "5th March 2025",
      description: `Learn the fundamentals of industrial rack stability and failure modes, understand design considerations for safe and efficient storage systems, explore real-world case studies and best 
      practices, get insights into GBTUL and CUFSM tools, and engage in an interactive Q&A session with Vijay Sir.`,
      image: Stability1,
      instagramLink: "http://localhost:5173/projects/hosted-projects/hosted-2"
},
    {
      id: 3,
      title: "Workshop : AI-Integrated Advanced Surveying & GIS for Disaster Management",
      date: "4th Febraury 2025",
      description: "An innovative workshop for civil engineers to learn AI-Integrated advanced Surveying & GIS for Disaster management",
      image: a3,
      instagramLink: "http://localhost:5173/projects/hosted-projects/hosted-2"
    }
  ];

  const currentActivity = activities[currentPage - 1];

  return (
    <div className="w-full">
      {/* White background section for DiscoverPACE */}
      <div className="w-full bg-blue-50/70 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <DiscoverPACE />
        </div>
      </div>
      
      {/* Light blue background section for activities */}
      <div className="w-full bg-blue-50/70 py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div id="activity-log" className="w-full">
            <div className="flex items-center mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 underline decoration-blue-600 underline-offset-8">
                Recent Activities
              </h2>
              <span 
                className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 mb-2" 
                style={{ animation: 'blink 2s infinite' }}
              >
                New
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-6">
                    <ActivityCard 
                      activity={currentActivity} 
                      currentPage={currentPage}
                      totalPages={activities.length}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <AnnouncementToolbox />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;