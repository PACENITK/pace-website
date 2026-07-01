import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FilterBar } from '../components/FilterBar';
import { InternshipCard } from '../components/InternshipCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { mockInternships } from '../mocks/fixtures';

export const Discovery = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    duration: '',
    stipend: ''
  });
  const [filteredInternships, setFilteredInternships] = useState([]);

  // Simulate network load
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...mockInternships];

      // 1. Search term
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.title.toLowerCase().includes(query) ||
            i.description.toLowerCase().includes(query) ||
            i.plateId.toLowerCase().includes(query)
        );
      }

      // 2. Branch Filter
      if (filters.branch) {
        filtered = filtered.filter((i) =>
          i.eligibility.branches.includes(filters.branch)
        );
      }

      // 3. Duration Filter
      if (filters.duration) {
        filtered = filtered.filter((i) => i.duration === filters.duration);
      }

      // 4. Stipend Filter
      if (filters.stipend) {
        filtered = filtered.filter((i) => {
          const isPaid = i.stipend.includes('₹') || i.stipend.toLowerCase().includes('paid') && !i.stipend.toLowerCase().includes('unpaid');
          return filters.stipend === 'Paid' ? isPaid : !isPaid;
        });
      }

      setFilteredInternships(filtered);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleCardClick = (id) => {
    navigate(`/portal/internships/${id}`);
  };

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Welcome / Guest Banner */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-2">
          {isAuthenticated ? `Welcome back, ${user.name}!` : 'PACE Internship Discovery'}
        </h1>
        <p className="text-sm text-concrete max-w-2xl leading-relaxed">
          {isAuthenticated
            ? 'Explore active internships offered by professors across various departments. Click on any listing to view custom questions, check structural warnings, or apply.'
            : 'Explore public listings for civil engineering internships. Sign in with your NITK IRIS account to view eligibility criteria, stipends, and custom field application parameters.'}
        </p>
        {!isAuthenticated && (
          <button
            onClick={() => navigate('/portal/login')}
            className="mt-4 rounded bg-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-all"
          >
            Sign In to Apply
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Listings Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredInternships.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredInternships.map((internship) => (
            <InternshipCard
              key={internship._id}
              internship={internship}
              onClick={() => handleCardClick(internship._id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50">
          <div className="text-concrete text-3xl font-mono mb-2">📭</div>
          <h3 className="font-display font-bold text-lg text-ink">No Internships Found</h3>
          <p className="text-xs text-concrete mt-1">Try modifying your filter settings or clear the query search.</p>
        </div>
      )}
    </div>
  );
};
export default Discovery;
