import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlateTag } from '../components/PlateTag';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const ApplicantList = () => {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Local Filter & Sort state
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sortByCgpa, setSortByCgpa] = useState('');

  const fetchApplicants = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Internship Details
      const intRes = await api.get(`/internships/${id}`);
      setInternship(intRes.data.data);

      // 2. Fetch Applicants list
      const appRes = await api.get(`/internships/${id}/applicants`);
      setApplicants(appRes.data.data || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setError(err.response?.data?.message || 'Failed to retrieve applicants list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const handleStatusTransition = async (appId, nextStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/applications/${appId}/status`, { status: nextStatus });
      if (res.data && res.data.success) {
        setSuccessMsg(`Candidate status successfully updated to ${nextStatus}!`);
        // Update local list state
        setApplicants(
          applicants.map((a) => (a._id === appId ? { ...a, status: nextStatus } : a))
        );
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error updating candidate status:', err);
      setError(err.response?.data?.message || 'Failed to transition candidate status.');
    }
  };

  const handleMessage = async (appId, studentName) => {
    const text = prompt(`Send a secure message to ${studentName} (your email remains private):`);
    if (text === null) return;
    if (!text.trim()) {
      alert('Message content is required.');
      return;
    }

    try {
      await api.post(`/applications/${appId}/message`, { message: text });
      setSuccessMsg(`Message sent to ${studentName}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  // Apply filters and sorting in-memory
  let filtered = [...applicants];

  if (statusFilter) {
    filtered = filtered.filter((a) => a.status === statusFilter);
  }

  if (branchFilter) {
    filtered = filtered.filter(
      (a) => a.studentId?.profile?.branch === branchFilter
    );
  }

  if (sortByCgpa === 'asc') {
    filtered.sort((a, b) => (a.studentId?.profile?.cgpa || 0) - (b.studentId?.profile?.cgpa || 0));
  } else if (sortByCgpa === 'desc') {
    filtered.sort((a, b) => (b.studentId?.profile?.cgpa || 0) - (a.studentId?.profile?.cgpa || 0));
  }

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Header */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to="/portal/professor" className="text-xs text-blueprint font-mono uppercase tracking-wider hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-2">
            Candidates Pipeline
          </h1>
          {internship && (
            <p className="text-sm text-concrete mt-1">
              Reviewing applications for <strong className="text-ink">"{internship.title}"</strong> ({internship.plateId})
            </p>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium animate-pulse">
          {successMsg}
        </div>
      )}

      {error && (
        <PortalError message={error} onRetry={fetchApplicants} />
      )}

      {/* Filter toolbar */}
      {!error && !loading && (
        <div className="grid gap-3 sm:grid-cols-3 p-4 border border-concrete/15 rounded bg-paper shadow-sm text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-concrete">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-concrete">Filter by Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 outline-none"
            >
              <option value="">All Branches</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mining Engineering">Mining Engineering</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] uppercase tracking-wider text-concrete">Sort by CGPA</label>
            <select
              value={sortByCgpa}
              onChange={(e) => setSortByCgpa(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 outline-none"
            >
              <option value="">Default order</option>
              <option value="desc">CGPA: High to Low</option>
              <option value="asc">CGPA: Low to High</option>
            </select>
          </div>
        </div>
      )}

      {/* Candidates List */}
      {!error && (
        loading ? (
          <div className="flex h-32 items-center justify-center font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
            Retrieving Candidate Pipeline...
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((app) => {
              const student = app.studentId || {};
              const profile = student.profile || {};
              
              return (
                <div 
                  key={app._id} 
                  className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 hover:border-concrete/45 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-lg font-bold text-ink">{student.name || 'Student Candidate'}</h3>
                      
                      {/* Status indicator */}
                      <span className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border rounded ${
                        app.status === 'selected'
                          ? 'border-structural bg-structural/5 text-structural'
                          : app.status === 'shortlisted'
                            ? 'border-blueprint bg-blueprint/5 text-blueprint'
                            : app.status === 'rejected'
                              ? 'border-signal bg-signal/5 text-signal'
                              : 'border-concrete bg-concrete/5 text-concrete'
                      }`}>
                        {app.status}
                      </span>

                      {/* Warning tags */}
                      {app.eligibilityWarning && (
                        <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-signal bg-signal/5 text-signal">
                          Criteria Warning
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-concrete">
                      <div>Branch: <strong className="text-ink">{profile.branch || 'Civil Engineering'}</strong></div>
                      <div>CGPA: <strong className="text-ink">{profile.cgpa || '0.0'}</strong></div>
                      <div>College: <strong className="text-ink">{profile.college || 'NITK Surathkal'}</strong></div>
                      <div>Email: <strong className="text-ink">{student.email}</strong></div>
                    </div>

                    {app.coverNote && (
                      <p className="text-xs bg-concrete/5 p-3 rounded border border-concrete/10 italic text-concrete max-w-2xl">
                        "{app.coverNote}"
                      </p>
                    )}

                    {/* Custom fields responses */}
                    {app.responses && app.responses.length > 0 && (
                      <div className="pt-2">
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-concrete mb-1">Custom Answers</span>
                        <div className="space-y-1 bg-concrete/5 p-3 rounded border border-concrete/10 text-xs">
                          {app.responses.map((ans, idx) => {
                            // Find question label from customFields if populated
                            const fieldDef = internship?.customFields?.find(f => f.fieldId === ans.fieldId);
                            const label = fieldDef ? fieldDef.label : `Question ${idx + 1}`;
                            return (
                              <div key={ans.fieldId} className="flex gap-2">
                                <span className="font-bold text-concrete">{label}:</span>
                                <span className="text-ink font-semibold">{ans.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col gap-2 self-stretch md:self-center w-full md:w-44">
                    {/* Resume PDF link opens in new tab */}
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-concrete/40 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-concrete hover:border-blueprint hover:text-blueprint transition-colors text-center block"
                      >
                        Open Resume ↗
                      </a>
                    )}

                    {/* Status Transitions conditional buttons */}
                    {app.status === 'applied' && (
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => handleStatusTransition(app._id, 'shortlisted')}
                          className="rounded bg-blueprint text-white px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-blueprint/90 transition-colors flex-1"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleStatusTransition(app._id, 'rejected')}
                          className="rounded bg-signal text-white px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-signal/90 transition-colors flex-1"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {app.status === 'shortlisted' && (
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => handleStatusTransition(app._id, 'selected')}
                          className="rounded bg-structural text-white px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-structural/90 transition-colors flex-1"
                        >
                          Select
                        </button>
                        <button
                          onClick={() => handleStatusTransition(app._id, 'rejected')}
                          className="rounded bg-signal text-white px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-signal/90 transition-colors flex-1"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-concrete/30 rounded-md bg-paper/50 font-body">
            <div className="text-concrete text-3xl font-mono mb-2">👥</div>
            <h3 className="font-display font-bold text-lg text-ink">No Candidates Yet</h3>
            <p className="text-xs text-concrete mt-1">No applications have been submitted for this listing yet.</p>
          </div>
        )
      )}
    </div>
  );
};
export default ApplicantList;
