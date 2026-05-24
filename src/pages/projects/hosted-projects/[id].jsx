import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hostedProjectsData } from '../../../components/Projects/HostedProjectsData';
import ProjectDetail from '../../../components/Projects/ProjectDetail';
import TeamNavbar from '../../../components/Team/TeamNavbar';
import Footer from '../../../components/Home/Footer';
import Navbar from '../../../components/Home/Navbar';

const HostedProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const foundProject = hostedProjectsData.find(project => project.id === id);
    if (foundProject) {
      setProject(foundProject);
    } else {
      navigate('/projects/hosted-projects');
    }
  }, [id, navigate]);

  const handleBackClick = () => {
    navigate('/projects/hosted-projects');
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
              <span>← Return to Hosted Projects</span>
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

export default HostedProjectDetail;