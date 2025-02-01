import React, { useState } from 'react';
import ActivityCard from './ActivityCard';
import AnnouncementToolbox from './AnnouncementToolbox';

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const activities = [
    {
      id: 1,
      title: "Concrete Testing Workshop",
      date: "15 March 2024",
      description: "An innovative event for civil engineers to learn about concrete testing!",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
      instagramLink: "https://www.instagram.com/your-profile"
    },
    {
      id: 2,
      title: "Concrete Testing Workshop",
      date: "15 March 2024",
      description: "An innovative event for civil engineers to learn about concrete testing!",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
      instagramLink: "https://www.instagram.com/your-profile"
    },
    {
      id: 3,
      title: "Concrete Testing Workshop",
      date: "15 March 2024",
      description: "An innovative event for civil engineers to learn about concrete testing!",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
      instagramLink: "https://www.instagram.com/your-profile"
    }
  ];

  const currentActivity = activities[currentPage - 1];

  return (
    <div id="activity-log" className="w-full bg-white-50 py-8 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 underline decoration-blue-600 underline-offset-8">
            Recent Activities
          </h2>
          <span 
            className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 mb-2"
            style={{
              animation: 'blink 2s infinite' // Set to blink every 2 seconds
            }}
          >
            New
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              <ActivityCard 
                activity={currentActivity} 
                currentPage={currentPage}
                totalPages={activities.length}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <AnnouncementToolbox />
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this CSS globally in a suitable file or at the top of this component file
const styles = `
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`;
document.head.appendChild(document.createElement("style")).textContent = styles;

export default ActivityLog;