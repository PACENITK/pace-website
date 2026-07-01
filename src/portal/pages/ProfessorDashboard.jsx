import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlateTag } from '../components/PlateTag';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countsMap, setCountsMap] = useState({});
  const [shortlistedMap, setShortlistedMap] = useState({});

  const fetchPostings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/internships');
      const allListings = res.data.data || [];
      
      // Filter for professor's own postings
      const own = allListings.filter(
        (i) => i.professorId?._id === user?._id || i.professorId === user?._id
      );

      // Fetch applicant counts for each posting
      const counts = {};
      const shortlists = {};
      for (const listing of own) {
        try {
          const appRes = await api.get(`/internships/${listing._id}/applicants`);
          const apps = appRes.data.data || [];
          counts[listing._id] = apps.length;
          shortlists[listing._id] = apps.filter((a) => a.status === 'shortlisted').length;
        } catch (appErr) {
          counts[listing._id] = 0;
          shortlists[listing._id] = 0;
        }
      }

      setCountsMap(counts);
      setShortlistedMap(shortlists);
      setPostings(own);
    } catch (err) {
      console.error('Error loading professor dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to retrieve your internship postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchPostings();
    }
  }, [user]);

  const handleCloseListing = async (id) => {
    if (!window.confirm('Are you sure you want to close this internship listing? This action is irreversible.')) return;
    try {
      await api.patch(`/internships/${id}/close`);
      setPostings(
        postings.map((p) => (p._id === id ? { ...p, status: 'closed' } : p))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close internship listing.');
    }
  };

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Header Banner */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex justify-between items-center gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Faculty Workspace</h1>
          <p className="text-sm text-concrete">Manage your project proposals, review student candidacies, and post new internship openings.</p>
        </div>
        <Link
          to="/portal/professor/post"
          className="rounded bg-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-all shadow-sm shrink-0"
        >
          + Post New Listing
        </Link>
      </div>

      {error && (
        <PortalError message={error} onRetry={fetchPostings} />
      )}

      {/* Main List */}
      {!error && (
        loading ? (
          <div className="flex h-32 items-center justify-center font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
            Retrieving Workspace Proposals...
          </div>
        ) : postings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {postings.map((posting) => {
              const appCount = countsMap[posting._id] || 0;
              const shortlistedCount = shortlistedMap[posting._id] || 0;
              const deadlineDate = new Date(posting.deadline).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div 
                  key={posting._id} 
                  className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col justify-between hover:border-concrete/45 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex gap-2">
                        <PlateTag text={posting.plateId} type="plate" />
                        <PlateTag text={posting.scope} type={posting.scope} />
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                        posting.status === 'open' ? 'text-structural border-structural/30 bg-structural/5' : 'text-signal border-signal/30 bg-signal/5'
                      }`}>
                        {posting.status}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink leading-snug">
                      {posting.title}
                    </h3>
                    <p className="text-xs text-concrete font-body line-clamp-3">
                      {posting.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-concrete border-t border-concrete/10 pt-3">
                      <div>Stipend: <strong className="text-ink">{posting.stipend}</strong></div>
                      <div>Deadline: <strong className="text-ink">{deadlineDate}</strong></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-concrete/10 pt-4 mt-6 gap-3">
                    {/* Applicant metrics */}
                    <Link
                      to={`/portal/professor/internships/${posting._id}/applicants`}
                      className="text-xs text-blueprint font-mono uppercase tracking-wider font-bold hover:underline flex items-center gap-1.5"
                    >
                      Candidates ({appCount}) • Shortlisted ({shortlistedCount}) →
                    </Link>

                    {/* Quick controls */}
                    <div className="flex gap-2 text-xs font-mono font-bold uppercase tracking-wider">
                      <Link
                        to={`/portal/professor/post/${posting._id}`}
                        className="rounded border border-concrete/40 px-3 py-1.5 text-concrete hover:border-ink hover:text-ink transition-colors"
                      >
                        Edit
                      </Link>
                      {posting.status === 'open' && (
                        <button
                          onClick={() => handleCloseListing(posting._id)}
                          className="rounded border border-signal text-signal px-3 py-1.5 hover:bg-signal/5 transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50 font-body">
            <div className="text-concrete text-3xl font-mono mb-2">📄</div>
            <h3 className="font-display font-bold text-lg text-ink">No Project Proposals</h3>
            <p className="text-xs text-concrete mt-1 mb-6">You haven't posted any internship opportunities yet.</p>
            <Link
              to="/portal/professor/post"
              className="rounded bg-signal px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors shadow-sm"
            >
              Post Your First Listing
            </Link>
          </div>
        )
      )}
    </div>
  );
};
export default ProfessorDashboard;
