import React, { useState } from 'react';
import { PlateTag } from '../components/PlateTag';

export const AdminDashboard = () => {
  const [professors, setProfessors] = useState([
    { id: 'p-1', name: 'Dr. Suresh Kumar', email: 'suresh@nitk.edu.in', status: 'pending', department: 'Civil Engineering' },
    { id: 'p-2', name: 'Dr. Neha Sharma', email: 'neha@nitk.edu.in', status: 'pending', department: 'Mining Engineering' }
  ]);
  const [reports, setReports] = useState([
    { id: 'rep-1', reporter: 'Student User', targetType: 'Internship', targetPlate: 'PACE-001', reason: 'Incorrect eligibility details listed.' },
    { id: 'rep-2', reporter: 'Student User', targetType: 'User', targetPlate: 'Prof. Ramesh Rao', reason: 'Spamming candidate inbox messages.' }
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const approveProfessor = (id, name) => {
    setProfessors(professors.filter((p) => p.id !== id));
    setToastMsg(`Approved registration for ${name}!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const resolveReport = (id) => {
    setReports(reports.filter((r) => r.id !== id));
    setToastMsg('Report resolved and cleared!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Banner */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Administrative Moderation Portal</h1>
        <p className="text-sm text-concrete">Moderate pending faculty accounts, review flagged listings, and track platform metrics.</p>
      </div>

      {toastMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium">
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
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Total Applications</span>
          <span className="font-display text-2xl font-bold text-blueprint">124</span>
        </div>
        <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Flagged Reports</span>
          <span className="font-display text-2xl font-bold text-signal">{reports.length}</span>
        </div>
        <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
          <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Candidacy Selects</span>
          <span className="font-display text-2xl font-bold text-structural">12%</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Verification queue */}
        <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Pending Professor Approvals</h3>
          {professors.length > 0 ? (
            <div className="space-y-4">
              {professors.map((p) => (
                <div key={p.id} className="flex justify-between items-start gap-4 p-3 border border-concrete/15 rounded bg-paper/50 text-xs">
                  <div>
                    <h4 className="font-bold text-ink text-sm">{p.name}</h4>
                    <p className="text-concrete font-mono mt-0.5">{p.email}</p>
                    <span className="text-[10px] bg-concrete/10 px-1.5 py-0.5 rounded font-mono block mt-2 w-max">
                      Dept: {p.department}
                    </span>
                  </div>
                  <button
                    onClick={() => approveProfessor(p.id, p.name)}
                    className="rounded bg-structural px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-structural/90"
                  >
                    Approve
                  </button>
                </div>
              ))}
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
                    <p className="text-ink">{r.reason}</p>
                    <p className="text-[10px] text-concrete font-mono">Reported by {r.reporter}</p>
                  </div>
                  <button
                    onClick={() => resolveReport(r.id)}
                    className="rounded border border-concrete/40 text-concrete px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:border-blueprint hover:text-blueprint"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-concrete italic py-4 text-center">All flags are resolved.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
