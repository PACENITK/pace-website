import React from 'react';
import { Calendar, Users, MapPin } from 'lucide-react';

const ProjectDetail = ({ project }) => {
  const renderDescription = () => {
    if (!project.description) return null;
    return project.description.split('\n\n').map((paragraph, index) => (
      <p key={index} className="text-gray-300 mb-4">{paragraph.trim()}</p>
    ));
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="relative h-[400px]">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
            <h2 className="text-3xl text-white font-bold px-6 text-center">{project.title}</h2>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl font-bold text-white">{project.title}</h1>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">About the Project</h2>
              {renderDescription()}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-white mb-4">Project Details</h2>
            <div className="space-y-4">
              {project.date && (
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-3 text-blue-400" />
                  <span>{project.date}</span>
                </div>
              )}
              {project.location && (
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                  <span>{project.location}</span>
                </div>
              )}
              {project.team && (
                <div className="flex items-center text-gray-300">
                  <Users className="w-5 h-5 mr-3 text-blue-400" />
                  <span>{project.team}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
