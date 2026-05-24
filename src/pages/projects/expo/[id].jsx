import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expoProjectsData } from '../../../components/Projects/ExpoProjectsData';
import ProjectDetail from '../../../components/Projects/ProjectDetail';
import Footer from '../../../components/Home/Footer';
import Navbar from '../../../components/Home/Navbar';

const ExpoProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const foundProject = expoProjectsData.find(project => project.id === id);
    if (foundProject) {
      setProject(foundProject);
    } else {
      navigate('/projects/expo');
    }
  }, [id, navigate]);

  const handleBackClick = () => {
    navigate('/projects/expo');
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />
      <div className="pt-36 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {project ? (
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBackClick}
              className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            >
              <span>← Back to Project Expo</span>
            </button>
            <ProjectDetail project={project} />
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-lg">Loading project...</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ExpoProjectDetail;