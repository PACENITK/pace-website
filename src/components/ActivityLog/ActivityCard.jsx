import React from 'react';

const ActivityCard = ({ activity, currentPage, totalPages, onPageChange }) => {
  const handleReadMore = () => {
    window.open(activity.instagramLink, '_blank');
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[200px] lg:h-[300px] rounded-lg overflow-hidden">
          <img 
            src={activity.image} 
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
              {activity.title}
            </h3>
            <p className="text-xs text-white font-medium bg-purple-500 px-2 py-1 rounded-md inline-block">
              {activity.date}
            </p>
          </div>
          <div className="space-y-2 flex-grow">
            <p className="text-gray-600 text-base">
              {activity.description}
            </p>
            <button 
              onClick={handleReadMore}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-md"
            >
              Read more
            </button>
          </div>
        </div>
      </div>

      {/* Simple pagination */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={`px-3 py-1 text-xs font-medium rounded-lg
              ${currentPage > 1 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-gray-400 cursor-not-allowed'}`}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  w-6 h-6 flex items-center justify-center rounded-full 
                  text-xs font-medium
                  ${currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'} 
                `}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={`px-3 py-1 text-xs font-medium rounded-lg
              ${currentPage < totalPages 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-gray-400 cursor-not-allowed'}`}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;