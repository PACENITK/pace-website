import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hostedProjectsData } from '../../components/Projects/HostedProjectsData';
import ProjectCard from '../../components/Projects/ProjectCard';
import TeamNavbar from '../../components/Team/TeamNavbar';
import Footer from '../../components/Home/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HostedProjects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Pagination state - 9 projects per page
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(9);

  // Get page from URL query parameter if it exists
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const page = parseInt(queryParams.get('page'));
    if (page && page > 0 && page <= Math.ceil(hostedProjectsData.length / projectsPerPage)) {
      setCurrentPage(page);
    } else {
      setCurrentPage(1);
    }
  }, [location.search, projectsPerPage]);

  // Get current projects for pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = hostedProjectsData.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(hostedProjectsData.length / projectsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      navigate(`/projects/hosted-projects?page=${pageNumber}`);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/projects/hosted-projects/${project.id}`);
    // Scroll to top when viewing project detail
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination display helper
  const getPaginationRange = () => {
    const delta = 1; // Number of pages to show before and after current page
    let range = [];
    
    // Always show first page
    range.push(1);
    
    // Calculate range around current page
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }
    
    // Always show last page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    // Add ellipses where needed
    let result = [];
    let prev = 0;
    
    for (const page of range.sort((a, b) => a - b)) {
      if (prev && page - prev > 1) {
        result.push('...');
      }
      result.push(page);
      prev = page;
    }
    
    return result;
  };

  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-36 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-20">
          <h1 className="text-4xl font-bold mb-4">Hosted Projects</h1>
          <p className="text-lg text-gray-700">
            Discover our collection of ongoing and completed projects hosted by PACE in collaboration with various departments and organizations.
          </p>
        </div>

        {/* Grid of project cards - 3 columns on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={handleProjectClick}
            />
          ))}
        </div>
        
        {/* Empty state for no projects on current page */}
        {currentProjects.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-medium text-gray-700">Coming Soon</h2>
            {/* <button 
              onClick={() => paginate(1)} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Back to first page
            </button> */}
          </div>
        )}
        
        {/* Enhanced Pagination */}
        {hostedProjectsData.length > projectsPerPage && (
          <div className="mt-16">
            <div className="flex justify-center items-center">
              <nav className="flex items-center justify-center space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-700 hover:bg-blue-100 bg-white shadow'
                  }`}
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Page numbers with ellipses */}
                {getPaginationRange().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => paginate(page)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        currentPage === page
                          ? 'bg-blue-600 text-white font-medium shadow-md'
                          : 'bg-white text-gray-700 hover:bg-blue-100 shadow'
                      } transition-colors`}
                    >
                      {page}
                    </button>
                  )
                ))}
                
                {/* Next button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                    currentPage === totalPages || totalPages === 0
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-700 hover:bg-blue-100 bg-white shadow'
                  }`}
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </nav>
            </div>
            
            {/* Page indicator */}
            <div className="text-center mt-4 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HostedProjects;