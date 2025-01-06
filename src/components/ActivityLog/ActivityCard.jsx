import { ArrowRightCircle } from 'lucide-react';

const ActivityCard = ({ activity }) => {
  return (
    <div className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
      <div className="aspect-video mb-3 overflow-hidden rounded-md">
        <img 
          src={activity.image} 
          alt={activity.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="space-y-2">
        <span className="text-xs text-blue-600 font-medium">{activity.date}</span>
        <h3 className="font-semibold text-gray-800 line-clamp-1">{activity.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
        <button className="text-sm text-gray-700 hover:text-blue-600 inline-flex items-center gap-1 group">
          Read more 
          <ArrowRightCircle className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ActivityCard;