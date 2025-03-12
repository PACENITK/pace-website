import React from 'react';
import { Calendar, Activity, Users, Building, Link as LinkIcon } from 'lucide-react';

const ProjectDetail = ({ project }) => {
  // Function to properly display text with line breaks
  const formatDescription = (text) => {
    if (!text) return null;
    
    // Split the text by newline characters and create paragraph elements
    return text.split('\n').map((paragraph, index) => {
      // Skip empty paragraphs (consecutive newlines)
      if (!paragraph.trim()) return null;
      
      // Check if paragraph is a bullet point
      if (paragraph.trim().startsWith('-')) {
        return (
          <li key={index} className="ml-5 text-gray-300 my-2">
            {paragraph.trim().substring(1)}
          </li>
        );
      }
      
      return (
        <p key={index} className="text-gray-300 mb-4">
          {paragraph.trim()}
        </p>
      );
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="relative h-[400px]">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
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
          <h1 className="text-4xl font-bold text-white">{project.title}</h1>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">About the Project</h2>
              <div className="text-gray-300">
                {formatDescription(project.description)}
              </div>
            </div>

            {project.resources && project.resources.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Resources</h2>
                <div className="space-y-3">
                  {project.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <LinkIcon className="w-5 h-5 mr-2" />
                      {resource.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-white mb-4">Project Details</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <Building className="w-5 h-5 mr-3 text-blue-400" />
                <span>{project.category}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Users className="w-5 h-5 mr-3 text-blue-400" />
                <span>{project.team}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;