import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlateTag } from '../components/PlateTag';
import { mockInternships, mockApplications } from '../mocks/fixtures';

export const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState(mockInternships);

  const getApplicantCount = (intId) => {
    return mockApplications.filter((a) => a.internshipId._id === intId).length;
  };

  const toggleStatus = (id) => {
    setInternships(
      internships.map((item) => {
        if (item._id === id) {
          const newStatus = item.status === 'open' ? 'closed' : 'open';
          console.log(`[MOCK] Toggled status for internship ${id} to ${newStatus}`);
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6 font-body text-ink">
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Professor Workspace</h1>
          <p className="text-sm text-concrete">Manage your project proposals, review student details, and message applicants.</p>
        </div>
        <Link
          to="/portal/professor/post"
          className="rounded bg-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
        >
          + Post New Position
        </Link>
      </div>

      {/* Internships List */}
      <div className="space-y-4">
        {internships.map((item) => {
          const count = getApplicantCount(item._id);
          const isExpired = new Date(item.deadline) < new Date();

          return (
            <div 
              key={item._id}
              className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-concrete/40 transition-colors"
            >
              {/* Info Column */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <PlateTag text={item.plateId} type="plate" />
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    item.status === 'open' ? 'text-structural border-structural/30' : 'text-signal border-signal/30'
                  }`}>
                    {item.status}
                  </span>
                  {isExpired && (
                    <span className="text-[10px] font-mono bg-signal/10 text-signal border border-signal/30 px-1.5 py-0.5 rounded uppercase font-bold">
                      Expired
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold">{item.title}</h3>
                <p className="text-xs text-concrete">
                  Scope: {item.scope.toUpperCase()} • Stipend: {item.stipend} • Duration: {item.duration}
                </p>
              </div>

              {/* Applicant Count & Controls */}
              <div className="flex items-center gap-6 self-stretch md:self-center justify-between md:justify-end">
                <div className="text-right">
                  <span className="block font-display text-xl font-bold text-blueprint">{count}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-concrete">Applicants</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/portal/professor/internships/${item._id}/applicants`)}
                    className="rounded bg-blueprint px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors"
                  >
                    View Applicants
                  </button>

                  <button
                    onClick={() => toggleStatus(item._id)}
                    className={`rounded border px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      item.status === 'open' 
                        ? 'border-signal text-signal hover:bg-signal/5' 
                        : 'border-structural text-structural hover:bg-structural/5'
                    }`}
                  >
                    {item.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ProfessorDashboard;
