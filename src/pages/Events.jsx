import React, { useState } from 'react';
import { eventsData } from '../components/Events/data';
import EventCard from '../components/Events/EventCard';
import EventDetail from '../components/Events/EventDetail';
import TeamNavbar from '../components/Team/TeamNavbar';
import Footer from '../components/Home/Footer';

const Events = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-36 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {selectedEvent ? (
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelectedEvent(null)}
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {eventsData.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={handleEventClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Events;