import React from 'react';
import { Calendar, Activity } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div 
      onClick={() => onClick(project)}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
    >
      <div className="relative">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center space-x-4 text-blue-400 mb-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <span>{project.date}</span>
          </div>
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            <span>{project.status}</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
      </div>
    </div>
  );
};

export default ProjectCard;