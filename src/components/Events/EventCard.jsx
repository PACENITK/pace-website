import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const EventCard = ({ event, onClick }) => {
  return (
    <div 
      onClick={() => onClick(event)}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] h-full flex flex-col"
    >
      <div className="relative h-48">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
            <h3 className="text-xl text-white font-bold px-4 text-center">
              {event.title}
            </h3>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
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
        <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
        <p className="text-gray-300 line-clamp-2 mb-4 flex-grow">
          {event.description ? event.description.split('\n')[0] : 'Event details coming soon'}
        </p>
        <div className="mt-auto">
          <span className="inline-block bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
            {event.venue}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;