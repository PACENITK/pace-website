import React, { useState, useEffect } from 'react';
import { PlateTag } from '../components/PlateTag';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const AdminDashboard = () => {
  const [professors, setProfessors] = useState([]);
  const [facultyEmails, setFacultyEmails] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [takedownTarget, setTakedownTarget] = useState(null);
  const [takedownReason, setTakedownReason] = useState('');

  const fetchModerationData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch pending faculty sign-ups
      const profsRes = await api.get('/admin/professors/pending');
      setProfessors(profsRes.data.data || []);

      // 2. Fetch pre-approved faculty list for identity verification checks
      try {
        const facRes = await api.get('/faculty-list');
        const emails = (facRes.data.data || []).map((item) => item.email.toLowerCase());
        setFacultyEmails(emails);
      } catch (facErr) {
        console.warn('Failed to load faculty pre-approved list for checks:', facErr);
      }

      // 3. Fetch flagged content logs
      const reportsRes = await api.get('/admin/flagged');
      setReports(reportsRes.data.data || []);

      // 4. Fetch metrics report summary
      const analyticsRes = await api.get('/admin/analytics');
      setAnalytics(analyticsRes.data.data);

    } catch (err) {
      console.error('Error fetching admin dashboard content:', err);
      setError(err.response?.data?.message || 'Failed to load administrative portals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, []);

  const approveProfessor = async (id, name) => {
    try {
      setError('');
      await api.patch(`/admin/professors/${id}/approve`);
      setProfessors(professors.filter((p) => p._id !== id));
      setToastMsg(`Approved faculty registration for ${name}!`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve professor.');
    }
  };

  const rejectProfessor = async (id, name) => {
    const reason = prompt(`Specify the rejection reason for ${name}:`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    try {
      setError('');
      await api.patch(`/admin/professors/${id}/reject`, { reason });
      setProfessors(professors.filter((p) => p._id !== id));
      setToastMsg(`Registration rejected for ${name}.`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject professor.');
    }
  };

  const executeTakedown = async (e) => {
    e.preventDefault();
    if (!takedownReason.trim()) {
      alert('Takedown reason is required.');
      return;
    }

    try {
      setError('');
      // Perform takedown on the flagged listing
      await api.patch(`/admin/internships/${takedownTarget.targetId?._id || takedownTarget.targetId}/takedown`, {
        reason: takedownReason
      });

      // Clear report locally
      setReports(reports.filter((r) => r._id !== takedownTarget._id));
      setToastMsg(`Takedown completed for flagged internship listing!`);
      setTakedownTarget(null);
      setTakedownReason('');
      
      // Refresh analytics metrics
      const analyticsRes = await api.get('/admin/analytics');
      setAnalytics(analyticsRes.data.data);

      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to execute takedown.');
      setTakedownTarget(null);
      setTakedownReason('');
    }
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

      {error && (
        <PortalError message={error} onRetry={fetchModerationData} />
      )}

      {/* Analytics Summary */}
      {!error && !loading && analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
            <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Proposals Created</span>
            <span className="font-display text-2xl font-bold text-ink">{analytics.totalInternships}</span>
          </div>
          <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
            <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Active Applications</span>
            <span className="font-display text-2xl font-bold text-blueprint">{analytics.totalApplications}</span>
          </div>
          <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
            <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Compliance Reports</span>
            <span className="font-display text-2xl font-bold text-signal">{reports.length}</span>
          </div>
          <div className="p-4 border border-concrete/20 rounded bg-paper shadow-sm">
            <span className="font-mono text-[9px] uppercase tracking-wider text-concrete block">Conversion / Drop-off</span>
            <span className="font-display text-2xl font-bold text-structural">
              {analytics.totalApplications > 0 
                ? `${Math.round((analytics.totalSelected / analytics.totalApplications) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </div>
      )}

      {!error && (
        loading ? (
          <div className="flex h-32 items-center justify-center font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
            Retrieving Moderation Details...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Approvals Queue */}
            <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Pending Professor Approvals</h3>
              {professors.length > 0 ? (
                <div className="space-y-4">
                  {professors.map((p) => {
                    const profEmail = p.email.toLowerCase();
                    const exactMatch = facultyEmails.includes(profEmail);
                    const partialMatch = !exactMatch && facultyEmails.some(
                      (email) => email.split('@')[0] === profEmail.split('@')[0]
                    );

                    let badgeStyle = 'border-signal bg-signal/5 text-signal';
                    let badgeLabel = 'No Match';
                    if (exactMatch) {
                      badgeStyle = 'border-structural bg-structural/5 text-structural';
                      badgeLabel = 'Match Found';
                    } else if (partialMatch) {
                      badgeStyle = 'border-blueprint bg-blueprint/5 text-blueprint';
                      badgeLabel = 'Partial Match';
                    }

                    return (
                      <div key={p._id} className="p-4 border border-concrete/15 rounded bg-paper/50 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-xs space-y-1">
                            <h4 className="font-bold text-ink text-sm">{p.name}</h4>
                            <p className="text-concrete font-mono">{p.email}</p>
                            {p.profile?.college && (
                              <p className="text-ink font-semibold mt-1">
                                Institution: {p.profile.college}
                              </p>
                            )}
                            {p.profile?.branch && (
                              <p className="text-concrete mt-0.5">
                                Department: {p.profile.branch}
                              </p>
                            )}
                            {p.proofOfStatus && (
                              <div className="mt-2 bg-concrete/5 border border-concrete/10 p-2 rounded text-[11px] max-w-full">
                                <span className="font-bold text-concrete block uppercase tracking-wider text-[8px] font-mono mb-1">Proof of Faculty Status:</span>
                                {/^(https?:\/\/)/i.test(p.proofOfStatus.trim()) ? (
                                  <a 
                                    href={p.proofOfStatus.trim()} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blueprint hover:underline break-all block"
                                  >
                                    {p.proofOfStatus.trim()}
                                  </a>
                                ) : (
                                  <p className="text-ink mt-0.5 whitespace-pre-wrap">{p.proofOfStatus}</p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded font-semibold ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </div>

                        <div className="flex gap-2 justify-end border-t border-concrete/10 pt-3">
                          <button
                            onClick={() => rejectProfessor(p._id, p.name)}
                            className="rounded border border-signal text-signal px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-signal/5 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => approveProfessor(p._id, p.name)}
                            className="rounded bg-structural px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-structural/90 transition-colors"
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

            {/* Flagged content review */}
            <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Compliance Flag Reports</h3>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((r) => {
                    const targetPlate = r.targetId?.plateId || r.targetId?.name || 'Item';
                    return (
                      <div key={r._id} className="flex justify-between items-start gap-4 p-3 border border-concrete/15 rounded bg-paper/50 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] bg-signal/15 text-signal px-1.5 py-0.5 rounded uppercase font-bold">
                              {r.targetType}
                            </span>
                            <strong className="text-ink">{targetPlate}</strong>
                          </div>
                          <p className="text-ink leading-relaxed mt-1">{r.reason}</p>
                          <p className="text-[10px] text-concrete font-mono">Reported by {r.reporterId?.name || 'Anonymous'}</p>
                        </div>
                        {r.targetType === 'Internship' && (
                          <button
                            onClick={() => setTakedownTarget(r)}
                            className="rounded bg-signal px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors shrink-0"
                          >
                            Takedown
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-concrete italic py-4 text-center">All flags are resolved.</p>
              )}
            </div>
          </div>
        )
      )}

      {/* Takedown Reason modal overlay */}
      {takedownTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-paper p-6 rounded-md border border-concrete/20 shadow-lg space-y-4 font-body">
            <h3 className="font-display font-bold text-lg text-signal">Confirm Administrative Takedown</h3>
            <p className="text-xs text-concrete">
              You are taking down the flagged internship listing "{takedownTarget.targetId?.plateId || 'PACE-XXX'}". This action will log a takedown event in the system audit trail.
            </p>
            
            <form onSubmit={executeTakedown} className="space-y-3">
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
                  onClick={() => setTakedownTarget(null)}
                  className="rounded border border-concrete/40 px-3 py-1.5 font-mono font-bold uppercase tracking-wider text-concrete hover:bg-concrete/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-signal px-4 py-1.5 font-mono font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
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
