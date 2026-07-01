import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FilterBar } from '../components/FilterBar';
import { InternshipCard } from '../components/InternshipCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const Discovery = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    duration: '',
    stipend: ''
  });
  const [filteredInternships, setFilteredInternships] = useState([]);

  // Check prefers-reduced-motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldAnimate(!mediaQuery.matches);
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.branch) params.branch = filters.branch;
      if (filters.duration) params.duration = filters.duration;

      const res = await api.get('/internships', { params });
      let data = res.data.data || [];

      // Client-side text keyword search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        data = data.filter(
          (i) =>
            i.title.toLowerCase().includes(query) ||
            (i.description && i.description.toLowerCase().includes(query)) ||
            (i.plateId && i.plateId.toLowerCase().includes(query))
        );
      }

      // Client-side stipend filter mapping
      if (filters.stipend) {
        data = data.filter((i) => {
          if (!i.stipend) return filters.stipend === 'Unpaid';
          const isPaid = i.stipend.includes('₹') || 
            (i.stipend.toLowerCase().includes('paid') && !i.stipend.toLowerCase().includes('unpaid'));
          return filters.stipend === 'Paid' ? isPaid : !isPaid;
        });
      }

      setFilteredInternships(data);
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError(err.response?.data?.message || 'Failed to connect to the backend server. Please verify connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [filters]);

  const handleCardClick = (id) => {
    navigate(`/portal/internships/${id}`);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      branch: '',
      duration: '',
      stipend: ''
    });
  };

  const activeProposalsCount = filteredInternships.filter(i => i.status !== 'closed').length;

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Welcome / Hero Banner */}
      <div className={`rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-700 ${
        shouldAnimate ? 'translate-y-0 opacity-100 ease-out' : ''
      }`}>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isAuthenticated ? `Welcome, ${user.name}!` : 'PACE Internship Discovery'}
          </h1>
          <p className="text-sm text-concrete max-w-2xl leading-relaxed">
            {isAuthenticated
              ? 'Explore active internships offered by professors across civil engineering fields. Click on any proposal plate to check criteria, questions, and submit your application.'
              : 'Explore public listings for civil engineering internships. Sign in with your NITK IRIS account to view eligibility details, stipends, and custom field application parameters.'}
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/portal/login')}
              className="mt-2 rounded bg-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-all shadow-sm"
            >
              Sign In to Apply
            </button>
          )}
        </div>

        {/* Hero stat counter strip with entrance animation */}
        <div className={`p-5 rounded border border-blueprint/20 bg-blueprint/5 flex flex-col items-center justify-center text-center w-full md:w-44 transition-all duration-1000 delay-200 ${
          shouldAnimate ? 'scale-100 opacity-100' : ''
        }`}>
          <span className="font-display text-4xl font-extrabold text-blueprint leading-none mb-1">
            {loading ? '...' : activeProposalsCount}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-blueprint font-semibold">
            Active Proposals
          </span>
          <span className="text-[10px] text-concrete font-mono mt-2">NITK Civil Engineering</span>
        </div>
      </div>

      {/* Controlled Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Scoped failure banner */}
      {error && (
        <PortalError message={error} onRetry={fetchInternships} />
      )}

      {/* Listings Grid */}
      {!error && (
        loading ? (
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
          <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50 font-body">
            <div className="text-concrete text-3xl font-mono mb-2">📭</div>
            <h3 className="font-display font-bold text-lg text-ink">No Internships Found</h3>
            <p className="text-xs text-concrete mt-1 mb-4">No listings match your current filters. Try resetting the options.</p>
            <button
              onClick={clearFilters}
              className="rounded bg-blueprint px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors"
            >
              Clear Search Filters
            </button>
          </div>
        )
      )}
    </div>
  );
};
export default Discovery;
