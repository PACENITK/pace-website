import React from 'react';
import { Calendar, Activity } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  // Normalize tags array
  const displayTags =
    project.tags || (project.category ? [project.category] : []);

  return (
    <div
      onClick={() => onClick(project)} 
      className="group bg-white border border-blue-300 rounded-lg overflow-hidden hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-md hover:shadow-[0_18px_45px_rgba(37,99,235,0.45)] hover:-translate-y-2"
      >
      {/* Project Image */}
      {project.image ? (
        <div className="relative h-48 border-b border-black">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>
      ) : (
        <div className="w-full h-48 bg-black flex items-center justify-center border-b border-black">
          <h3 className="text-2xl text-white font-bold px-6 text-center">
            {project.title}
          </h3>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Meta Info */}
        <div className="flex items-center space-x text-blue-900/60 mb-4 text-sm font-medium">
          {project.date && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              <span>{project.date}</span>
            </div>
          )}

          {project.status && (
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-1.5" />
              <span>{project.status}</span>
            </div>
          )}
        </div>

        {/* Title */}
        {project.image && (
          <h3 className="text-xl font-bold text-black mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
            {project.title}
          </h3>
        )}

        {/* Description */}
        <p className="text-black/70 text-sm line-clamp-2 mb-6 flex-grow">
          {project.description
            ? project.description.split('\n')[0]
            : 'Project details coming soon'}
        </p>

        {/* reports and ppts below description section */}
            {/* <div className="flex flex-wrap gap-3 mt-10">
              {project.report && (
                <a
                  href={project.report}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
                >
                  View Report
                </a>
              )}

            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              {project.pptx && (
                <a
                  href={project.pptx}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
                >
                  View Report
                </a>
              )}
              
            </div> */}

        {/* Bottom Section */}
        <div className="mt-auto">

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-400 text-black border border-black px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProjectCard;