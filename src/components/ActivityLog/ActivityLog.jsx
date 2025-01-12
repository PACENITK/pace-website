import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityCard from './ActivityCard';

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewBadgeVisible, setIsNewBadgeVisible] = useState(true);
  const [activities] = useState([
    {
      id: 1,
      title: "Concrete Testing Workshop",
      date: "15 March 2024",
      description: "This is a innovative event for civil engineers to learn about concrete testing!",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
      instagramLink: "https://www.instagram.com/your-profile"
    },
    {
        id: 1,
        title: "Concrete Testing Workshop",
        date: "15 March 2024",
        description: "This is a innovative event for civil engineers to learn about concrete testing!",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
        instagramLink: "https://www.instagram.com/your-profile"
      },
      {
        id: 1,
        title: "Concrete Testing Workshop",
        date: "15 March 2024",
        description: "This is a innovative event for civil engineers to learn about concrete testing!",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800",
        instagramLink: "https://www.instagram.com/your-profile"
      }
    // ... other activities
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNewBadgeVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const currentActivity = activities[currentPage - 1];
  
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-[80vh] w-full bg-gray-50 py-8 sm:py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Activity log
            {isNewBadgeVisible && (
              <motion.sup
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full animate-pulse"
              >
                NEW
              </motion.sup>
            )}
          </h2>
        </div>
        
        {/* Outer border container */}
        <div className="p-1 relative">
          {/* Base border with gradient */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative bg-white shadow-lg min-h-[60vh] rounded-xl overflow-hidden border-2 border-transparent"
              style={{ margin: '2px' }}  // To prevent border overflow
            >
              <div className="p-6 sm:p-8">
                <ActivityCard 
                  activity={currentActivity} 
                  currentPage={currentPage}
                  totalPages={activities.length}
                  onPageChange={setCurrentPage}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
