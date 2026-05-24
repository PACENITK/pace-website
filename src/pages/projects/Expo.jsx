import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { expoProjectsData } from '../../components/Projects/ExpoProjectsData';
import ProjectCard from '../../components/Projects/ProjectCard';
import Navbar from '../../components/Home/Navbar';
import Footer from '../../components/Home/Footer';
import { ChevronLeft, ChevronRight, Search, XCircle, ChevronDown } from 'lucide-react';
const Expo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(9);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);

  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const uniqueYears = useMemo(() => {
    const years = expoProjectsData.map(project => project.date);
    return ['All', ...new Set(years)];
  }, []);

  const uniqueTags = useMemo(() => {
    const tagsSet = new Set();
    expoProjectsData.forEach(project => {
      if (project.tags && Array.isArray(project.tags)) {
        project.tags.forEach(tag => tagsSet.add(tag));
      } else if (project.category) {
        tagsSet.add(project.category);
      }
    });
    return Array.from(tagsSet).sort();
  }, []);

  const filteredProjects = useMemo(() => {
    return expoProjectsData.filter((project) => {
      const searchLower = searchTerm.toLowerCase();
      const searchableText = `${project.title} ${project.description} ${project.category || ''} ${(project.tags || []).join(' ')}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchLower);

      const matchesStatus = statusFilter === 'All' || project.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesYear = yearFilter === 'All' || project.date === yearFilter;

      const projectTags = project.tags || (project.category ? [project.category] : []);
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => projectTags.includes(tag));

      return matchesSearch && matchesStatus && matchesYear && matchesTags;
    });
  }, [searchTerm, statusFilter, yearFilter, selectedTags]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, yearFilter, selectedTags]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const page = parseInt(queryParams.get('page'));
    const maxPages = Math.ceil(filteredProjects.length / projectsPerPage);

    if (page && page > 0 && page <= maxPages) {
      setCurrentPage(page);
    }
  }, [location.search, filteredProjects.length, projectsPerPage]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setYearFilter('All');
    setSelectedTags([]);
  };

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      navigate(`/projects/expo?page=${pageNumber}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/projects/expo/${project.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const delta = 1;
    let range = [1];
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) range.push(i);
    }
    if (totalPages > 1) range.push(totalPages);

    let result = [];
    let prev = 0;
    for (const page of range.sort((a, b) => a - b)) {
      if (prev && page - prev > 1) result.push('...');
      result.push(page);
      prev = page;
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Navbar />

      <div className="pt-36 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Project Expo</h1>
          <p className="text-lg text-black/80 max-w-3xl">
            Explore our showcase of innovative civil engineering projects. Use the filters below to find specific research and developments.
          </p>
        </div>

        {/* Controls Section */}
        <div className="mb-12 bg-white border border-black p-4 md:p-6 rounded-lg shadow-sm">
          {/* Top Row: Search & Dropdowns */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-black/50" />
              </div>
              <input
                type="text"
                placeholder="Search by title, description, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 border border-black bg-white text-black placeholder-black/50 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 rounded-md transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <select
                className="w-full py-2.5 px-3 border border-black bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 rounded-md cursor-pointer transition-colors"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-48">
              <select
                className="w-full py-2.5 px-3 border border-black bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 rounded-md cursor-pointer transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Tag Dropdown Filter */}
          <div className="relative w-full md:w-64">
            <button
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="w-full flex justify-between items-center py-2.5 px-3 border border-black bg-white text-black rounded-md focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
            >
              <span className="truncate text-sm">
                {selectedTags.length === 0
                  ? 'Filter by Tags...'
                  : `${selectedTags.length} Tag${selectedTags.length > 1 ? 's' : ''} Selected`}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isTagDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full md:w-72 bg-white border border-black rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 flex flex-col gap-1">
                  {uniqueTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <label
                        key={tag}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-black/5 rounded cursor-pointer transition-colors text-sm text-black"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTag(tag)}
                          className="accent-red-600 w-4 h-4 cursor-pointer"
                        />
                        <span className={isSelected ? "font-medium" : ""}>{tag}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Metadata & Clear Filters */}
        <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
          <p className="text-sm font-medium text-black/70">
            Showing {currentProjects.length > 0 ? indexOfFirstProject + 1 : 0} - {Math.min(indexOfLastProject, filteredProjects.length)} of {filteredProjects.length} projects
          </p>
          {(searchTerm !== '' || statusFilter !== 'All' || yearFilter !== 'All' || selectedTags.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium underline underline-offset-2 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Grid of project cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
            />
          ))}
        </div>

        {/* Empty state */}
        {currentProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-4 border border-black border-dashed rounded-lg mt-8">
            <XCircle className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">No projects found</h2>
            <p className="text-black/70 text-center mb-6 max-w-md">
              We couldn't find any projects matching your current search and filter criteria.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-black text-white font-medium rounded-md hover:bg-red-600 transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredProjects.length > projectsPerPage && (
          <div className="mt-16">
            <div className="flex justify-center items-center">
              <nav className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors border ${currentPage === 1
                      ? 'border-black/20 text-black/30 cursor-not-allowed bg-white'
                      : 'border-black text-black hover:border-red-600 hover:text-red-600 bg-white'
                    }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {getPaginationRange().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-black/50 font-medium">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => paginate(page)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center font-medium border transition-colors ${currentPage === page
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-black border-black hover:border-red-600 hover:text-red-600'
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors border ${currentPage === totalPages || totalPages === 0
                      ? 'border-black/20 text-black/30 cursor-not-allowed bg-white'
                      : 'border-black text-black hover:border-red-600 hover:text-red-600 bg-white'
                    }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Expo;