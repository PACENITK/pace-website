import React from 'react';
import { Calendar, Users, MapPin } from 'lucide-react';

const ProjectDetail = ({ project }) => {
  const renderDescription = () => {
    if (!project.description) return null;
    return project.description.split('\n\n').map((paragraph, index) => (
      <p key={index} className="text-black/80 mb-4 leading-relaxed">
        {paragraph.trim()}
      </p>
    ));
  };

  const displayTags = project.tags || (project.category ? [project.category] : []);

  return (
    <div className="bg-white border border-black rounded-xl overflow-hidden shadow-sm">
      {/* Image / Header Section */}
      <div className="relative h-[400px] border-b border-black">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <h2 className="text-3xl text-white font-bold px-6 text-center">
              {project.title}
            </h2>
          </div>
        )}
        {/* Black gradient overlay so the white title text pops */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            {/* {project.title} */}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Main Description Column */}
          <div className="md:col-span-2">
            <div className="border border-black rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-black mb-4 pb-2 border-b border-black/10">
                About the Project
              </h2>
              {renderDescription()}
            </div>
          </div>

          {/* Sidebar / Details Column */}
          <div className="border border-black rounded-lg p-6 h-fit bg-white">
            <h2 className="text-xl font-bold text-black mb-4 pb-2 border-b border-black/10">
              Project Details
            </h2>
            <div className="space-y-4 font-medium">
              {project.date && (
                <div className="flex items-center  text-blue-900">
                  <Calendar className="w-5 h-5 mr-3 text-blue-900" />
                  <span>{project.date}</span>
                </div>
              )}
              {project.venue && (
                <div className="flex items-center text-blue-900">
                  <MapPin className="w-5 h-5 mr-3 text-blue-900" />
                  <span>{project.venue}</span>
                </div>
              )}
              {project.team && (
                <div className="flex items-center text-blue-900">
                  <Users className="w-5 h-5 mr-3 text-blue-900" />
                  <span>{project.team}</span>
                </div>
              )}
              {project.mentors && (
                <div className="flex items-center text-black">
                  <span className="pl-8">{project.mentors}</span>
                </div>
              )}
              {/* Tags Section */}
              {displayTags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-black/10">
                  <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wider">Tags</h3>
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
                </div>
              )}
            </div>

              {/* reports and ppts inside description section */}
            <div className="flex flex-wrap gap-3 mt-10">
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
              
            </div>

            {/* LinkedIn Post as a Button */}
            {project.resources && project.resources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-black/10">
                {project.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-black hover:bg-red-600 text-white font-medium py-2.5 rounded-md transition-colors duration-300"
                  >
                    LinkedIn Post
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;