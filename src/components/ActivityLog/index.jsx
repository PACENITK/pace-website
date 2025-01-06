import React, { useState } from 'react';
import ActivityCard from './ActivityCard';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 3; 

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activities] = useState([
    {
      id: 1,
      title: "Annual Civil Engineering Conference 2024",
      description: "Join us for our annual conference featuring industry leaders and innovative discussions.",
      date: "Mar 15",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 2,
      title: "Bridge Design Workshop",
      description: "Hands-on workshop focusing on modern bridge design techniques and sustainability.",
      date: "Mar 10",
      image: "https://images.unsplash.com/photo-1545630478-cf62cdd247d1?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 3,
      title: "Student Mentorship Program",
      description: "Supporting the next generation of civil engineers through our mentorship initiative.",
      date: "Mar 5",
      image: "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&q=80&w=800"
    }
  ]);

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentActivities = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
          <a href="/activities" className="text-sm text-blue-600 hover:text-blue-800">
            View all activities →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ActivityLog;