import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StatusBridge } from '../components/StatusBridge';
import { PlateTag } from '../components/PlateTag';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animatedAppId, setAnimatedAppId] = useState(null);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Store previous statuses to diff updates
  const prevStatusesRef = useRef({});

  // Check prefers-reduced-motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldAnimate(!mediaQuery.matches);
  }, []);

  const fetchApplications = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      const res = await api.get('/applications/mine');
      const fetched = res.data.data || [];

      // Diff statuses to trigger animations only on actual changes
      let changedId = null;
      const nextStatuses = {};

      fetched.forEach((app) => {
        nextStatuses[app._id] = app.status;
        const prevStatus = prevStatusesRef.current[app._id];
        if (prevStatus && prevStatus !== app.status) {
          changedId = app._id;
        }
      });

      prevStatusesRef.current = nextStatuses;

      if (changedId && shouldAnimate) {
        setAnimatedAppId(changedId);
        setTimeout(() => setAnimatedAppId(null), 450);
      }

      setApplications(fetched);
    } catch (err) {
      console.error('Error fetching student applications:', err);
      if (!isPoll) {
        setError(err.response?.data?.message || 'Failed to fetch your applications list.');
      }
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  // Initial load and periodic polling (every 8 seconds)
  useEffect(() => {
    fetchApplications(false);

    const interval = setInterval(() => {
      fetchApplications(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleDetailsClick = (id) => {
    navigate(`/portal/internships/${id}`);
  };

  const handleWithdraw = async (internshipId, appId) => {
    try {
      setError('');
      await api.patch(`/internships/${internshipId}/withdraw`);
      setApplications(applications.filter((a) => a._id !== appId));
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError(err.response?.data?.message || 'Failed to withdraw application.');
    }
  };

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Stylesheet injector for scale-up-and-settle animation */}
      {shouldAnimate && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes badgeScaleSettle {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .animate-badge-settle {
            animation: badgeScaleSettle 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}} />
      )}

      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-2">My Applications</h1>
        <p className="text-sm text-concrete leading-relaxed">
          Track the status and milestones of your submitted applications. Live status changes will trigger highlight badge animations.
        </p>
      </div>

      {error && (
        <PortalError message={error} onRetry={() => fetchApplications(false)} />
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
            Retrieving Applications...
          </div>
        ) : applications.length > 0 ? (
          applications.map((app) => {
            const formattedDate = new Date(app.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const isDeadlinePassed = app.internshipId?.deadline 
              ? new Date(app.internshipId.deadline) < new Date() 
              : false;

            const isAnimating = animatedAppId === app._id;
            const internshipTitle = app.internshipId?.title || 'Unknown Internship';
            const professorName = app.internshipId?.professorId?.name || 'Professor';

            return (
              <div 
                key={app._id} 
                className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-concrete/45 transition-colors"
              >
                {/* Internship Info */}
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-3">
                    <PlateTag text={app.internshipId?.plateId || 'PACE-XXX'} type="plate" />
                    <span className="font-mono text-[10px] text-concrete uppercase tracking-wider">Applied {formattedDate}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold hover:text-blueprint transition-colors">
                    {internshipTitle}
                  </h3>
                  <p className="text-xs text-concrete font-medium">
                    offered by {professorName}
                  </p>
                  <div className="flex gap-4 font-mono text-[11px] text-concrete pt-1">
                    <span>Stipend: <strong className="text-ink">{app.internshipId?.stipend || 'Unspecified'}</strong></span>
                    <span>Deadline: <strong className="text-ink">{app.internshipId?.deadline ? new Date(app.internshipId.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Unspecified'}</strong></span>
                  </div>
                </div>

                {/* Status Bridge progress tracker */}
                <div className="w-full md:w-80 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-concrete">
                      Milestone
                    </span>
                    <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border transition-transform ${
                      isAnimating ? 'animate-badge-settle' : ''
                    } ${
                      app.status === 'selected' 
                        ? 'bg-structural/10 border-structural text-structural' 
                        : app.status === 'shortlisted'
                          ? 'bg-blueprint/10 border-blueprint text-blueprint'
                          : app.status === 'rejected'
                            ? 'bg-signal/10 border-signal text-signal'
                            : 'bg-concrete/10 border-concrete text-concrete'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <StatusBridge status={app.status} />
                </div>

                {/* Actions Panel */}
                <div className="flex flex-col gap-2 self-stretch md:self-center w-full md:w-44">
                  <button
                    onClick={() => handleDetailsClick(app.internshipId?._id)}
                    className="rounded border border-concrete/40 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-concrete hover:border-blueprint hover:text-blueprint transition-colors text-center w-full"
                  >
                    View Proposal
                  </button>

                  {/* Withdraw (disabled/hidden if deadline passed) */}
                  {!isDeadlinePassed && (
                    <button
                      onClick={() => handleWithdraw(app.internshipId?._id, app._id)}
                      className="rounded border border-signal text-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-signal/5 transition-colors text-center w-full"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50 font-body">
            <div className="text-concrete text-3xl font-mono mb-2">📭</div>
            <h3 className="font-display font-bold text-lg text-ink">No Active Applications</h3>
            <p className="text-xs text-concrete mt-1 mb-4">You have not submitted any proposals yet.</p>
            <Link
              to="/portal"
              className="inline-block rounded bg-blueprint px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors"
            >
              Explore Internships
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
export default Applications;
