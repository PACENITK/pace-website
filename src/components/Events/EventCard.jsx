import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const EventCard = ({ event, onClick }) => {
  return (
    <div 
      onClick={() => onClick(event)}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
    >
      <div className="relative">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
      </div>
      <div className="p-6">
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
        <p className="text-gray-300 line-clamp-2">{event.description}</p>
      </div>
    </div>
  );
};

export default EventCard;