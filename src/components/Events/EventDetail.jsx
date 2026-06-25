import React from 'react';
import { Calendar, Clock, MapPin, Users, Link as LinkIcon } from 'lucide-react';

const EventDetail = ({ event }) => {
  // Function to render description with proper paragraph breaks
  const renderDescription = () => {
    if (!event.description) return null;
    
    // Split the description by new lines and render paragraphs
    return event.description.split('\n\n').map((paragraph, index) => (
      <p key={index} className="text-gray-300 mb-4">
        {paragraph.trim()}
      </p>
    ));
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="relative h-[400px]">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
            <h2 className="text-3xl text-white font-bold px-6 text-center">
              {event.title}
            </h2>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center space-x-4 text-blue-400 mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{event.time}</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">About the Event</h2>
              {renderDescription()}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-300">
                <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Users className="w-5 h-5 mr-3 text-blue-400" />
                <span>{event.mode}</span>
              </div>
            </div>

            {/* LinkedIn Post Button */}
            {event.resources && event.resources.length > 0 && (
            <a
              href={event.resources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              LinkedIn Post
            </a>
            )}

            {event.gmeetLink && (
            <a
              href={event.gmeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mt-3"
            >
              Join Google Meet
            </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;