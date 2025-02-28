import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { expoProjectsData } from '../../components/Projects/ExpoProjectsData';
import ProjectCard from '../../components/Projects/ProjectCard';
import TeamNavbar from '../../components/Team/TeamNavbar';
import Footer from '../../components/Home/Footer';

const Expo = () => {
  const navigate = useNavigate();

  const handleProjectClick = (project) => {
    navigate(`/projects/expo/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-32 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-20">
          <h1 className="text-4xl font-bold mb-4">Project Expo</h1>
          <p className="text-lg text-gray-700">
            Explore our showcase of innovative civil engineering projects presented at our annual expo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {expoProjectsData.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={handleProjectClick}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Expo;