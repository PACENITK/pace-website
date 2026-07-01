import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlateTag } from '../components/PlateTag';
import { mockInternships, mockApplications } from '../mocks/fixtures';

export const ApplicantList = () => {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortByCGPA, setSortByCGPA] = useState('desc'); // 'desc' | 'asc'
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageBody, setMessageBody] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const found = mockInternships.find((i) => i._id === id);
    if (found) {
      setInternship(found);
      
      // Load apps for this internship
      const apps = mockApplications.filter((a) => a.internshipId._id === id);
      setApplicants(apps);
    }
  }, [id]);

  const handleStatusTransition = (appId, nextStatus) => {
    setApplicants(
      applicants.map((a) => {
        if (a._id === appId) {
          console.log(`[MOCK] Transitioning Application ${appId} to status: ${nextStatus}`);
          setToastMsg(`Application status updated to ${nextStatus}!`);
          setTimeout(() => setToastMsg(''), 3000);
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    console.log(`[MOCK] Messaging Student ${messageTarget.studentId.name} (${messageTarget.studentId.email}): ${messageBody}`);
    setMessageTarget(null);
    setMessageBody('');
    setToastMsg('Message sent successfully (simulated stub)!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Perform filtering & sorting in memory
  let processed = [...applicants];
  if (filterStatus) {
    processed = processed.filter((a) => a.status === filterStatus);
  }
  processed.sort((a, b) => {
    const cgpaA = a.studentId.profile?.cgpa || 0;
    const cgpaB = b.studentId.profile?.cgpa || 0;
    return sortByCGPA === 'desc' ? cgpaB - cgpaA : cgpaA - cgpaB;
  });

  if (!internship) {
    return (
      <div className="text-center py-12 bg-paper border border-concrete/20 rounded">
        <h3 className="font-display font-bold text-lg mb-2">Listing Not Found</h3>
        <p className="text-sm text-concrete">Could not load applicants pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Header */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <PlateTag text={internship.plateId} type="plate" />
            <Link to="/portal/professor" className="text-xs text-blueprint hover:underline">
              ← Dashboard
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{internship.title} — Applicant Pipeline</h1>
        </div>
      </div>

      {toastMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium">
          {toastMsg}
        </div>
      )}

      {/* Filter and sorting toolbar */}
      <div className="rounded-md border border-concrete/20 bg-paper p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Filter Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border border-concrete/30 bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-blueprint"
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Sort by CGPA</label>
          <select
            value={sortByCGPA}
            onChange={(e) => setSortByCGPA(e.target.value)}
            className="rounded border border-concrete/30 bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-blueprint"
          >
            <option value="desc">Highest CGPA First</option>
            <option value="asc">Lowest CGPA First</option>
          </select>
        </div>
      </div>

      {/* Candidate Pipeline Rows */}
      <div className="space-y-4">
        {processed.length > 0 ? (
          processed.map((app) => {
            // Check eligibility warning
            const cgpa = app.studentId.profile?.cgpa || 0;
            const branch = app.studentId.profile?.branch || '';
            const minCgpa = internship.eligibility?.minCGPA || 0;
            const eligibleBranches = internship.eligibility?.branches || [];
            
            const hasWarning = cgpa < minCgpa || (eligibleBranches.length > 0 && !eligibleBranches.includes(branch));

            return (
              <div 
                key={app._id}
                className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4 hover:border-concrete/35 transition-colors"
              >
                {/* Candidate Info card */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-base font-bold text-ink">{app.studentId.name}</h3>
                      <span className="font-mono text-[10px] bg-blueprint/10 text-blueprint px-1.5 py-0.5 rounded font-bold">
                        CGPA: {cgpa}
                      </span>
                      <span className="font-mono text-[10px] bg-concrete/10 text-concrete px-1.5 py-0.5 rounded">
                        {branch}
                      </span>
                      {hasWarning && (
                        <span className="font-mono text-[10px] bg-signal/10 text-signal border border-signal/30 px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">
                          ⚠ Ineligible
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-concrete mt-1">Contact: {app.studentId.email}</p>
                  </div>

                  {/* Status Indicator & Transitions */}
                  <div className="flex items-center gap-3 self-stretch md:self-center justify-between md:justify-end">
                    <span className={`font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
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

                    {/* Transition actions */}
                    <div className="flex items-center gap-1.5">
                      {app.status === 'applied' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition(app._id, 'shortlisted')}
                            className="rounded bg-blueprint px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-blueprint/90"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleStatusTransition(app._id, 'rejected')}
                            className="rounded border border-signal text-signal px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-signal/5"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {app.status === 'shortlisted' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition(app._id, 'selected')}
                            className="rounded bg-structural px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-structural/90"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => handleStatusTransition(app._id, 'rejected')}
                            className="rounded border border-signal text-signal px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-signal/5"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Candidate answers and cover note */}
                <div className="border-t border-concrete/10 pt-3 text-xs space-y-2">
                  {app.coverNote && (
                    <p className="text-ink leading-relaxed">
                      <strong className="font-mono uppercase tracking-wider text-concrete mr-1.5 text-[10px]">Cover Note:</strong>
                      {app.coverNote}
                    </p>
                  )}

                  {app.responses && app.responses.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="block font-mono uppercase tracking-wider text-concrete text-[10px] font-bold">Custom Responses:</span>
                      {app.responses.map((resp) => {
                        const originalField = internship.customFields?.find((cf) => cf.fieldId === resp.fieldId);
                        return (
                          <div key={resp.fieldId} className="flex gap-2 pl-3">
                            <span className="text-concrete font-medium">{originalField?.label || 'Question'}:</span>
                            <span className="text-ink font-semibold">{resp.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Resume Action */}
                <div className="flex gap-3 pt-2">
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-blueprint/15 text-blueprint px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-blueprint/25 transition-colors"
                  >
                    📄 View Resume
                  </a>
                  <button
                    onClick={() => setMessageTarget(app)}
                    className="rounded border border-concrete/40 text-concrete px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider hover:border-blueprint hover:text-blueprint transition-colors"
                  >
                    ✉ Message Student
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50 font-mono text-xs text-concrete">
            No applicants match current filter settings.
          </div>
        )}
      </div>

      {/* Message Modal Overlay stub */}
      {messageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper p-6 rounded-md border border-concrete/20 shadow-lg space-y-4">
            <h3 className="font-display font-bold text-lg">Message to {messageTarget.studentId.name}</h3>
            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                rows="4"
                required
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMessageTarget(null)}
                  className="rounded border border-concrete/40 px-3 py-1.5 font-mono font-bold uppercase tracking-wider text-concrete"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blueprint px-4 py-1.5 font-mono font-bold uppercase tracking-wider text-white"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicantList;
