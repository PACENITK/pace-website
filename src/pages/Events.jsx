import React, { useState, useEffect } from 'react';
import { eventsData } from '../components/Events/data';
import EventCard from '../components/Events/EventCard';
import EventDetail from '../components/Events/EventDetail';
import TeamNavbar from '../components/Team/TeamNavbar';
import Footer from '../components/Home/Footer';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams();
  
  // Pagination state - 9 cards per page
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(9);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Find the event from URL if eventId exists
  useEffect(() => {
    if (eventId) {
      const event = eventsData.find(event => event.id === eventId);
      if (event) {
        setSelectedEvent(event);
      } else {
        navigate('/events');
      }
    } else {
      setSelectedEvent(null);
      // Get page from URL query parameter if it exists
      const queryParams = new URLSearchParams(location.search);
      const page = parseInt(queryParams.get('page'));
      if (page && page > 0 && page <= Math.ceil(eventsData.length / eventsPerPage)) {
        setCurrentPage(page);
      } else {
        setCurrentPage(1);
      }
    }
  }, [eventId, navigate, location.search, eventsPerPage]);

  // Get current events for pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = eventsData.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(eventsData.length / eventsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      navigate(`/events?page=${pageNumber}`);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    navigate(`/events/${event.id}`);
    // Scroll to top when viewing event detail
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackClick = () => {
    setSelectedEvent(null);
    navigate('/events');
  };

  // Pagination display helper
  const getPaginationRange = () => {
    const delta = 1; // Number of pages to show before and after current page
    let range = [];
    
    // Always show first page
    range.push(1);
    
    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }
    
    // Always show last page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    // Add ellipses where needed
    let result = [];
    let prev = 0;
    
    for (const page of range.sort((a, b) => a - b)) {
      if (prev && page - prev > 1) {
        result.push('...');
      }
      result.push(page);
      prev = page;
    }
    
    return result;
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-36 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {selectedEvent ? (
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBackClick}
              className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            >
              <span>← Back to Events</span>
            </button>
            <EventDetail event={selectedEvent} />
          </div>
        ) : (
          <>
            <div className="mb-20">
              <h1 className="text-4xl font-bold mb-4">Events</h1>
              <p className="text-gray-600">Explore our upcoming and past events</p>
            </div>
            
            {/* Grid of event cards - 3 columns on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {currentEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={handleEventClick}
                />
              ))}
            </div>
            
            {/* Empty state for no events on current page */}
            {currentEvents.length === 0 && (
              <div className="text-center py-16">
                <h2 className="text-2xl font-medium text-gray-700">No events found on this page.</h2>
                <button 
                  onClick={() => paginate(1)} 
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Back to first page
                </button>
              </div>
            )}
            
            {/* Enhanced Pagination */}
            {eventsData.length > eventsPerPage && (
              <div className="mt-16">
                <div className="flex justify-center items-center">
                  <nav className="flex items-center justify-center space-x-2">
                    {/* Previous button */}
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                          : 'text-gray-700 hover:bg-blue-100 bg-white shadow'
                      }`}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    {/* Page numbers with ellipses */}
                    {getPaginationRange().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => paginate(page)}
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${
                            currentPage === page
                              ? 'bg-blue-600 text-white font-medium shadow-md'
                              : 'bg-white text-gray-700 hover:bg-blue-100 shadow'
                          } transition-colors`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                    
                    {/* Next button */}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                        currentPage === totalPages || totalPages === 0
                          ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                          : 'text-gray-700 hover:bg-blue-100 bg-white shadow'
                      }`}
                      aria-label="Next Page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
                
                {/* Page indicator */}
                <div className="text-center mt-4 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Events;