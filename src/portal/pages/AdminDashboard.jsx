import React, { useState } from 'react';
import { PlateTag } from '../components/PlateTag';

// Mock database faculty email list
const mockFacultyEmails = [
  'suresh@nitk.edu.in',
  'ramesh@nitk.edu.in',
  'swaminathan@nitk.edu.in'
];

export const AdminDashboard = () => {
  const [professors, setProfessors] = useState([
    { id: 'p-1', name: 'Dr. Suresh Kumar', email: 'suresh@nitk.edu.in', status: 'pending', department: 'Civil Engineering' },
    { id: 'p-2', name: 'Dr. Neha Sharma', email: 'neha@nitk.edu.in', status: 'pending', department: 'Mining Engineering' },
    { id: 'p-3', name: 'Dr. R. Swaminathan', email: 'swamy@nitk.edu.in', status: 'pending', department: 'Civil Engineering' }
  ]);
  
  const [reports, setReports] = useState([
    { id: 'rep-1', reporter: 'Abhijith Student', targetType: 'Internship', targetPlate: 'PACE-001', targetId: 'i-1', reason: 'Incorrect eligibility details listed.' },
    { id: 'rep-2', reporter: 'Abhijith Student', targetType: 'User', targetPlate: 'Prof. Ramesh Rao', targetId: 'u-prof-1', reason: 'Spamming candidate inbox messages.' }
  ]);

  const [toastMsg, setToastMsg] = useState('');
  const [reportsCount, setReportsCount] = useState(2);
  const [takedownActionTarget, setTakedownActionTarget] = useState(null);
  const [takedownReason, setTakedownReason] = useState('');

  const approveProfessor = (id, name) => {
    setProfessors(professors.filter((p) => p.id !== id));
    setToastMsg(`Approved registration for ${name}!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const rejectProfessor = (id, name) => {
    const reason = prompt(`Specify the rejection reason for ${name}:`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    setProfessors(professors.filter((p) => p.id !== id));
    setToastMsg(`Registration rejected for ${name}. Reason: ${reason}`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const initiateTakedown = (report) => {
    setTakedownActionTarget(report);
  };

  const handleTakedownSubmit = (e) => {
    e.preventDefault();
    if (!takedownReason.trim()) {
      alert('Takedown reason is required.');
      return;
    }

    console.log(`[MOCK] Administrative Takedown executed for ${takedownActionTarget.targetType} (${takedownActionTarget.targetPlate}). Audit entry logged. Reason: ${takedownReason}`);
    
    // Clear report
    setReports(reports.filter((r) => r.id !== takedownActionTarget.id));
    setToastMsg(`Takedown completed for ${takedownActionTarget.targetPlate}!`);
    setReportsCount(prev => prev - 1);
    setTakedownActionTarget(null);
    setTakedownReason('');
    
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Banner */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Administrative Moderation Portal</h1>
        <p className="text-sm text-concrete">Moderate pending faculty registrations, review flagged listings, and track platform metrics.</p>
      </div>

      {toastMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium animate-pulse">
          {toastMsg}
        </div>
      )}

      {/* Aggregate Analytics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Proposals Created</span>
          <span className="font-display text-2xl font-bold text-ink">45</span>
        </div>
        <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Active Applications</span>
          <span className="font-display text-2xl font-bold text-blueprint">124</span>
        </div>
        <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Flagged Reports</span>
          <span className="font-display text-2xl font-bold text-signal">{reportsCount}</span>
        </div>
        <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Conversion / Drop-off</span>
          <span className="font-display text-2xl font-bold text-structural">12%</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Verification queue */}
        <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Pending Professor Approvals</h3>
          {professors.length > 0 ? (
            <div className="space-y-4">
              {professors.map((p) => {
                // Cross-check match status
                const exactMatch = mockFacultyEmails.includes(p.email);
                const partialMatch = !exactMatch && mockFacultyEmails.some(email => email.split('@')[0] === p.email.split('@')[0]);
                
                let checkBadge = 'border-signal bg-signal/5 text-signal';
                let checkLabel = 'No Match';
                if (exactMatch) {
                  checkBadge = 'border-structural bg-structural/5 text-structural';
                  checkLabel = 'Match Found';
                } else if (partialMatch) {
                  checkBadge = 'border-blueprint bg-blueprint/5 text-blueprint';
                  checkLabel = 'Partial Match';
                }

                return (
                  <div key={p.id} className="p-4 border border-concrete/15 rounded bg-paper/50 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="text-xs space-y-1">
                        <h4 className="font-bold text-ink text-sm">{p.name}</h4>
                        <p className="text-concrete font-mono">{p.email}</p>
                        <span className="text-[10px] bg-concrete/10 px-1.5 py-0.5 rounded font-mono block w-max">
                          Dept: {p.department}
                        </span>
                      </div>
                      
                      {/* Faculty database match validation indicator */}
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded font-semibold ${checkBadge}`}>
                        {checkLabel}
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-concrete/10 pt-3">
                      <button
                        onClick={() => rejectProfessor(p.id, p.name)}
                        className="rounded border border-signal text-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-signal/5"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveProfessor(p.id, p.name)}
                        className="rounded bg-structural px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-structural/90"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-concrete italic py-4 text-center">No pending professor registrations.</p>
          )}
        </div>

        {/* Flagged content */}
        <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Compliance Flag Reports</h3>
          {reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((r) => (
                <div key={r.id} className="flex justify-between items-start gap-4 p-3 border border-concrete/15 rounded bg-paper/50 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] bg-signal/15 text-signal px-1.5 py-0.5 rounded uppercase font-bold">
                        {r.targetType}
                      </span>
                      <strong className="text-ink">{r.targetPlate}</strong>
                    </div>
                    <p className="text-ink leading-relaxed">{r.reason}</p>
                    <p className="text-[10px] text-concrete font-mono">Reported by {r.reporter}</p>
                  </div>
                  <button
                    onClick={() => initiateTakedown(r)}
                    className="rounded bg-signal px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-signal/90"
                  >
                    Takedown
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-concrete italic py-4 text-center">All flags are resolved.</p>
          )}
        </div>
      </div>

      {/* Takedown Reason Dialog Overlay */}
      {takedownActionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper p-6 rounded-md border border-concrete/20 shadow-lg space-y-4 font-body">
            <h3 className="font-display font-bold text-lg text-signal">Confirm Administrative Takedown</h3>
            <p className="text-xs text-concrete">
              You are taking down {takedownActionTarget.targetType} "{takedownActionTarget.targetPlate}". This action will log a takedown event on the system audit trail.
            </p>
            
            <form onSubmit={handleTakedownSubmit} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Reason for Takedown</label>
                <textarea
                  rows="3"
                  required
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                  placeholder="Specify violation description..."
                  className="w-full rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setTakedownActionTarget(null)}
                  className="rounded border border-concrete/40 px-3 py-1.5 font-mono font-bold uppercase tracking-wider text-concrete hover:bg-concrete/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-signal px-4 py-1.5 font-mono font-bold uppercase tracking-wider text-white hover:bg-signal/90"
                >
                  Execute Takedown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
