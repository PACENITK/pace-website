import React from 'react';
import { motion } from 'framer-motion';

const ActivityCard = ({ activity, currentPage, totalPages, onPageChange }) => {
  const handleReadMore = () => {
    window.open(activity.instagramLink, '_blank');
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 flex-grow">
        <div className="h-[300px] sm:h-[400px] lg:h-[50vh] rounded-lg overflow-hidden shadow-md">
          <motion.img 
            src={activity.image} 
            alt={activity.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex flex-col space-y-4 sm:space-y-6 lg:space-y-8 py-2 sm:py-4">
          <div className="space-y-2 sm:space-y-4">
            <motion.h3 
              className="text-xl sm:text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {activity.title}
            </motion.h3>
            <p className="text-sm text-gray-500 font-medium">{activity.date}</p>
          </div>
          <div className="space-y-4 sm:space-y-6 flex-grow">
            <motion.p 
              className="text-gray-600 text-base sm:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {activity.description}
            </motion.p>
            <motion.button 
              onClick={handleReadMore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 transition-colors duration-300 
                       text-sm font-semibold shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Read more
            </motion.button>
          </div>
        </div>
      </div>

      {/* Pagination section remains unchanged */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors
              ${currentPage > 1 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-gray-400 cursor-not-allowed'}`}
            disabled={currentPage === 1}
            whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
            whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
          >
            Previous
          </motion.button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <motion.button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full 
                  text-sm font-medium transition-all duration-300
                  ${currentPage === page 
                    ? 'bg-blue-600 text-white scale-110' 
                    : 'text-gray-600 hover:bg-gray-100'} 
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Page ${page}`}
              >
                {page}
              </motion.button>
            ))}
          </div>
          <motion.button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors
              ${currentPage < totalPages 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-gray-400 cursor-not-allowed'}`}
            disabled={currentPage === totalPages}
            whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
            whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
          >
            Next
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;