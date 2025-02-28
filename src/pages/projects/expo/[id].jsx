import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { expoProjectsData } from '../../../components/Projects/ExpoProjectsData';
import ProjectDetail from '../../../components/Projects/ProjectDetail';
import TeamNavbar from '../../../components/Team/TeamNavbar';
import Footer from '../../../components/Home/Footer';

const ExpoProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const foundProject = expoProjectsData.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
    } else {
      // Redirect to expo page if project not found
      navigate('/projects/expo');
    }
  }, [id, navigate]);

  if (!project) {
    return <div className="min-h-screen bg-sky-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-32 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/projects/expo')}
            className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold bg-blue-100 px-4 py-2 rounded-lg transition-colors"
          >
            <span>← Back to Project Expo</span>
          </button>
          <ProjectDetail project={project} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ExpoProjectDetail;