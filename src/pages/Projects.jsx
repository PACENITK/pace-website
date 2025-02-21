import React, { useState } from 'react';
import { projectsData } from '../components/Projects/data';
import ProjectCard from '../components/Projects/ProjectCard';
import ProjectDetail from '../components/Projects/ProjectDetail';
import TeamNavbar from '../components/Team/TeamNavbar';
import Footer from '../components/Home/Footer';

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-32 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {selectedProject ? (
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelectedProject(null)}
              className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            >
              <span>← Back to Projects</span>
            </button>
            <ProjectDetail project={selectedProject} />
          </div>
        ) : (
          <>
            <div className="mb-20">
              <h1 className="text-4xl font-bold mb-4">Projects</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsData.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={handleProjectClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Projects;