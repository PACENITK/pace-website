import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StatusBridge } from '../components/StatusBridge';
import { PlateTag } from '../components/PlateTag';
import { mockApplications } from '../mocks/fixtures';

export const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState(mockApplications);
  const [animatedAppId, setAnimatedAppId] = useState(null);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Check prefers-reduced-motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldAnimate(!mediaQuery.matches);
  }, []);

  const handleDetailsClick = (id) => {
    navigate(`/portal/internships/${id}`);
  };

  const handleWithdraw = (appId) => {
    setApplications(applications.filter((a) => a._id !== appId));
    console.log(`[MOCK] Application ${appId} withdrawn`);
  };

  // Simulated status advance trigger
  const advanceStatus = (appId) => {
    const statusCycle = ['applied', 'shortlisted', 'selected', 'rejected'];
    setApplications(
      applications.map((app) => {
        if (app._id === appId) {
          const currentIndex = statusCycle.indexOf(app.status);
          const nextIndex = (currentIndex + 1) % statusCycle.length;
          const nextStatus = statusCycle[nextIndex];
          
          console.log(`[MOCK] Simulating status advance for ${appId}: ${app.status} -> ${nextStatus}`);
          
          // Trigger scale animation
          if (shouldAnimate) {
            setAnimatedAppId(appId);
            setTimeout(() => setAnimatedAppId(null), 450);
          }

          return {
            ...app,
            status: nextStatus
          };
        }
        return app;
      })
    );
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
          Track the status and milestones of your submitted applications. You can use the mock "Advance Status" buttons below to preview badge animations.
        </p>
      </div>

      <div className="space-y-6">
        {applications.length > 0 ? (
          applications.map((app) => {
            const formattedDate = new Date(app.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const isDeadlinePassed = new Date(app.internshipId.deadline) < new Date();
            const isAnimating = animatedAppId === app._id;

            return (
              <div 
                key={app._id} 
                className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-concrete/45 transition-colors"
              >
                {/* Internship Info */}
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-3">
                    <PlateTag text={app.internshipId.plateId} type="plate" />
                    <span className="font-mono text-[10px] text-concrete uppercase tracking-wider">Applied {formattedDate}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold hover:text-blueprint transition-colors">
                    {app.internshipId.title}
                  </h3>
                  <p className="text-xs text-concrete font-medium">
                    offered by {app.internshipId.professorId.name}
                  </p>
                  <div className="flex gap-4 font-mono text-[11px] text-concrete pt-1">
                    <span>Stipend: <strong className="text-ink">{app.internshipId.stipend}</strong></span>
                    <span>Deadline: <strong className="text-ink">{new Date(app.internshipId.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong></span>
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
                <div className="flex flex-col gap-2 self-stretch md:self-center">
                  <button
                    onClick={() => handleDetailsClick(app.internshipId._id)}
                    className="rounded border border-concrete/40 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-concrete hover:border-blueprint hover:text-blueprint transition-colors text-center w-full"
                  >
                    View Proposal
                  </button>

                  <div className="flex gap-1.5 w-full">
                    {/* Advance Status simulator button */}
                    <button
                      onClick={() => advanceStatus(app._id)}
                      className="rounded bg-blueprint/15 text-blueprint px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-blueprint/25 transition-colors flex-1"
                    >
                      Advance Status (Mock)
                    </button>

                    {/* Withdraw (disabled if deadline passed) */}
                    <button
                      onClick={() => handleWithdraw(app._id)}
                      disabled={isDeadlinePassed}
                      className={`rounded px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider flex-1 text-center border ${
                        isDeadlinePassed 
                          ? 'border-concrete/20 bg-concrete/5 text-concrete/40 cursor-not-allowed' 
                          : 'border-signal text-signal hover:bg-signal/5'
                      }`}
                      title={isDeadlinePassed ? "Cannot withdraw once the proposal deadline has passed." : "Withdraw Application"}
                    >
                      Withdraw
                    </button>
                  </div>
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
