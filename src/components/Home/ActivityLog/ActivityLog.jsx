import React, { useState, useEffect } from 'react';
import DiscoverPACE from './DiscoverPACE';
import ActivityCard from './ActivityCard';
import AnnouncementToolbox from './AnnouncementToolbox';
import catapult from '../../../assets/Annoucements/catapult.jpg';
import civilsaga from '../../../assets/Annoucements/civilsaga.jpeg';
import revit from '../../../assets/Annoucements/revit-athon.jpeg';

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
  title: "Revit-athon: Model. Innovate. Build.",
  date: "26th October | 2 PM – 5 PM",
  description: `Turn your ideas into 3D reality and win exciting prizes worth ₹10,000!`,
  image:  revit ,
  instagramLink: "https://www.instagram.com/p/DQJosWXkopM/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
},

{     
  id: 2,
  title: "the civil saga",
  date: "27th September, 2025",
  description: `Join the ultimate civil engineering challenge! Form a team, tackle exciting tasks, and compete to build the best structure. Who will rise as the Master Builders?`,
  image: civilsaga ,  
  instagramLink: "/events/10"
}
,
{
      id: 3, 
      title: "THE ULTIMATE CATAPULT CHALLENGE",
      date: "17th March, 2025",
      description: `Unleash your inner engineer and build the ultimate catapult! Test your precision, strategy, and creativity in this high-stakes showdown. Are you ready to dominate?`,
      image: catapult,
      instagramLink: "/events/7"
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