import React from 'react';
import { Calendar, Activity } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div 
      onClick={() => onClick(project)}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] h-full flex flex-col"
    >
      {project.image ? (
        <div className="relative h-48">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
          <h3 className="text-2xl text-white font-bold px-4 text-center">
            {project.title}
          </h3>
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center space-x-4 text-blue-400 mb-4">
          {project.date && (
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{project.date}</span>
            </div>
          )}
          {project.status && (
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              <span>{project.status}</span>
            </div>
          )}
        </div>
        
        {project.image && (
          <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
        )}
        
        <p className="text-gray-300 line-clamp-2 mb-4 flex-grow">
          {project.description ? project.description.split('\n')[0] : 'Project details coming soon'}
        </p>
        
        {/* { {project.category && (
          <div className="mt-auto">
            <span className="inline-block bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
              {project.category}
            </span>
          </div>
        )} }  */}

        <div className="mt-auto">
    {/* Buttons */}
    <div className="flex gap-3 mb-4">
    
      {project.report && (
        <a
          href={project.report}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition duration-300"
        >
          View Report
        </a>
      )}

      {project.ppt && (
        <a
          href={project.ppt}
          download
          onClick={(e) => e.stopPropagation()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition duration-300"
        >
          Download PPT
        </a>
      )}
    </div>

  {/* Category */}
  {project.category && (
    <span className="inline-block bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
      {project.category}
    </span>
  )}
</div>
      </div>
    </div>
  );
};

export default ProjectCard;