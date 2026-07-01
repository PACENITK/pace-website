import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBridge } from '../components/StatusBridge';
import { PlateTag } from '../components/PlateTag';
import { mockApplications } from '../mocks/fixtures';

export const Applications = () => {
  const navigate = useNavigate();

  const handleDetailsClick = (id) => {
    navigate(`/portal/internships/${id}`);
  };

  return (
    <div className="space-y-6 font-body text-ink">
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-2">My Applications</h1>
        <p className="text-sm text-concrete leading-relaxed">
          Track the status and timeline parameters of your submitted internship applications. 
        </p>
      </div>

      <div className="space-y-6">
        {mockApplications.length > 0 ? (
          mockApplications.map((app) => {
            const formattedDate = new Date(app.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div 
                key={app._id} 
                className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
              >
                {/* Internship Info */}
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-3">
                    <PlateTag text={app.internshipId.plateId} type="plate" />
                    <span className="font-mono text-xs text-concrete">Applied on {formattedDate}</span>
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

                {/* Status Bridge Stepper */}
                <div className="w-full md:w-80 pr-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-concrete block mb-2 text-center md:text-left">
                    Application Milestone
                  </span>
                  <StatusBridge status={app.status} />
                </div>

                {/* Action */}
                <div className="self-end md:self-center">
                  <button
                    onClick={() => handleDetailsClick(app.internshipId._id)}
                    className="rounded border border-concrete/40 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-concrete hover:border-blueprint hover:text-blueprint transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50">
            <div className="text-concrete text-3xl font-mono mb-2">📥</div>
            <h3 className="font-display font-bold text-lg text-ink">No Applications</h3>
            <p className="text-xs text-concrete mt-1">You have not submitted any applications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Applications;
