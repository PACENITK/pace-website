import React, { useState, useEffect } from 'react';
import { PortalError } from '../components/PortalError';
import api from '../utils/api';

export const SuperAdminDashboard = () => {
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  
  // 1. Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logFilterActor, setLogFilterActor] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('');
  const [logFilterStartDate, setLogFilterStartDate] = useState('');
  const [logFilterEndDate, setLogFilterEndDate] = useState('');

  // 2. Platform Users state
  const [users, setUsers] = useState([]);

  // 3. Faculty register list CRUD state
  const [facultyList, setFacultyList] = useState([]);
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyDept, setNewFacultyDept] = useState('Civil Engineering');

  // Deletion Queue
  const [deletionRequests, setDeletionRequests] = useState([]);

  // Loading & alerts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const fetchSuperAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch platform users list
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.data || []);

      // 2. Fetch pre-approved faculty register
      const facultyRes = await api.get('/faculty-list');
      setFacultyList(facultyRes.data.data || []);

      // 3. Fetch system logs
      const logsRes = await api.get('/audit-log');
      setAuditLogs(logsRes.data.data || []);

      // 4. Fetch DPDP Deletion Queue
      const delRes = await api.get('/admin/delete-requests');
      setDeletionRequests(delRes.data.data || []);

      // Check current maintenance state
      const match = logsRes.data.data?.find((log) => log.action === 'TOGGLE_KILL_SWITCH');
      if (match) {
        setMaintenanceActive(!!match.metadata?.active);
      }

    } catch (err) {
      console.error('Error loading super admin portal data:', err);
      setError(err.response?.data?.message || 'Failed to load Super Admin control panels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  // Platform Maintenance Toggle
  const toggleMaintenance = async () => {
    const nextState = !maintenanceActive;
    try {
      setError('');
      const res = await api.post('/admin/kill-switch', { active: nextState });
      if (res.data && res.data.success) {
        setMaintenanceActive(nextState);
        setToastMsg(`Maintenance Mode (Kill Switch) turned ${nextState ? 'ON' : 'OFF'}!`);
        
        // Refresh logs list
        const logsRes = await api.get('/audit-log');
        setAuditLogs(logsRes.data.data || []);
        
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle maintenance mode.');
    }
  };

  // Promotion / Demotion permissions update
  const updateUserRole = async (userId, userName, currentRole, targetRole) => {
    try {
      setError('');
      if (targetRole === 'admin' || targetRole === 'super_admin') {
        await api.patch(`/admin/promote/${userId}`, { role: targetRole });
      } else {
        await api.patch(`/admin/demote/${userId}`, { role: targetRole });
      }

      setToastMsg(`User ${userName} successfully updated to role ${targetRole}!`);
      
      // Refresh state
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.data || []);
      const logsRes = await api.get('/audit-log');
      setAuditLogs(logsRes.data.data || []);

      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user authorization role.');
    }
  };

  // Faculty CRUD Operations
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!newFacultyEmail.trim() || !newFacultyName.trim()) {
      alert('Name and pre-approved Email are required.');
      return;
    }
    
    try {
      setError('');
      await api.post('/faculty-list', {
        name: newFacultyName,
        email: newFacultyEmail.toLowerCase().trim(),
        department: newFacultyDept
      });

      setNewFacultyName('');
      setNewFacultyEmail('');
      setToastMsg('Faculty added to the pre-approved register database!');

      // Refresh list & logs
      const facultyRes = await api.get('/faculty-list');
      setFacultyList(facultyRes.data.data || []);
      const logsRes = await api.get('/audit-log');
      setAuditLogs(logsRes.data.data || []);

      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add faculty record.');
    }
  };

  const handleDeleteFaculty = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the pre-approved register?`)) return;
    try {
      setError('');
      await api.delete(`/faculty-list/${id}`);
      setToastMsg('Faculty record deleted.');

      // Refresh state
      const facultyRes = await api.get('/faculty-list');
      setFacultyList(facultyRes.data.data || []);
      const logsRes = await api.get('/audit-log');
      setAuditLogs(logsRes.data.data || []);

      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete faculty record.');
    }
  };

  const executeWipe = async (userId, userName) => {
    if (!window.confirm(`WARNING: You are about to permanently delete student profile ${userName} and all their internship applications. This action is DPDP-compliant and completely irreversible. Proceed?`)) {
      return;
    }

    try {
      setError('');
      await api.delete(`/admin/delete-requests/${userId}`);
      setToastMsg(`Successfully wiped all data associated with ${userName}!`);
      
      // Refresh states
      const delRes = await api.get('/admin/delete-requests');
      setDeletionRequests(delRes.data.data || []);
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.data || []);
      const logsRes = await api.get('/audit-log');
      setAuditLogs(logsRes.data.data || []);

      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to execute account deletion.');
    }
  };

  // Filter logs locally
  let filteredLogs = [...auditLogs];

  if (logFilterActor) {
    const actorQuery = logFilterActor.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (log) => log.actorId?.name?.toLowerCase().includes(actorQuery)
    );
  }

  if (logFilterAction) {
    filteredLogs = filteredLogs.filter((log) => log.action === logFilterAction);
  }

  if (logFilterStartDate) {
    const start = new Date(logFilterStartDate);
    filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= start);
  }

  if (logFilterEndDate) {
    const end = new Date(logFilterEndDate);
    if (logFilterEndDate.length === 10) {
      end.setHours(23, 59, 59, 999);
    }
    filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) <= end);
  }

  return (
    <div className="space-y-6 font-body text-ink">
      {/* Banner */}
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Super Admin Panel</h1>
        <p className="text-sm text-concrete">Manage user roles, configure the faculty verification database, and inspect audit trails.</p>
      </div>

      {toastMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium animate-pulse">
          {toastMsg}
        </div>
      )}

      {error && (
        <PortalError message={error} onRetry={fetchSuperAdminData} />
      )}

      {/* Kill Switch Toggle */}
      {!error && !loading && (
        <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="max-w-md">
            <h3 className="font-display text-lg font-bold text-ink">Platform Maintenance Mode</h3>
            <p className="text-xs text-concrete leading-relaxed mt-1">
              Activating maintenance mode (Kill Switch) restricts access to all Secure routes for all students, guests, and professors. Super Admins bypass this.
            </p>
          </div>

          <button
            onClick={toggleMaintenance}
            className={`rounded px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all shadow ${
              maintenanceActive 
                ? 'bg-structural hover:bg-structural/90' 
                : 'bg-signal hover:bg-signal/90 animate-pulse'
            }`}
          >
            {maintenanceActive ? 'Deactivate Kill Switch' : 'Activate Kill Switch'}
          </button>
        </div>
      )}

      {!error && (
        loading ? (
          <div className="flex h-32 items-center justify-center font-mono text-xs text-concrete uppercase tracking-widest animate-pulse">
            Retrieving Administrative Controls...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* User permission controls */}
            <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4 h-max">
              <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">User Permission Control</h3>
              <div className="space-y-4 max-h-[35rem] overflow-y-auto pr-1">
                {users.map((u) => (
                  <div key={u._id} className="p-3 border border-concrete/15 rounded bg-paper/50 space-y-2 text-xs">
                    <div>
                      <h4 className="font-bold text-ink">{u.name}</h4>
                      <p className="text-concrete font-mono mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u._id, u.name, u.role, e.target.value)}
                        className="w-full rounded border border-concrete/30 bg-white px-2 py-1 text-xs text-ink outline-none"
                      >
                        <option value="student">Student</option>
                        <option value="professor">Professor</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty List Editor CRUD */}
            <div className="lg:col-span-2 rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4 h-max">
              <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Faculty Verification List</h3>
              
              {/* Add form */}
              <form onSubmit={handleAddFaculty} className="grid gap-2 sm:grid-cols-4 p-3 border border-concrete/15 rounded bg-paper/50 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Faculty Name"
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  className="rounded border border-concrete/30 bg-white px-2 py-1.5 outline-none focus:border-blueprint"
                />
                <input
                  type="email"
                  required
                  placeholder="email@nitk.edu.in"
                  value={newFacultyEmail}
                  onChange={(e) => setNewFacultyEmail(e.target.value)}
                  className="rounded border border-concrete/30 bg-white px-2 py-1.5 outline-none focus:border-blueprint"
                />
                <select
                  value={newFacultyDept}
                  onChange={(e) => setNewFacultyDept(e.target.value)}
                  className="rounded border border-concrete/30 bg-white px-2 py-1.5 outline-none"
                >
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mining Engineering">Mining Engineering</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
                <button
                  type="submit"
                  className="rounded bg-blueprint text-white font-mono uppercase tracking-wider font-bold text-[10px] hover:bg-blueprint/90 transition-colors"
                >
                  + Add Faculty
                </button>
              </form>

              {/* CRUD Table */}
              <div className="overflow-x-auto max-h-[25rem]">
                <table className="w-full text-left font-body text-xs text-ink border-collapse">
                  <thead>
                    <tr className="border-b border-concrete/20 text-concrete uppercase text-[10px] tracking-wider">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Dept</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyList.map((item) => (
                      <tr key={item._id} className="border-b border-concrete/10 hover:bg-paper/50">
                        <td className="py-3 font-semibold">{item.name}</td>
                        <td className="py-3 font-mono text-concrete">{item.email}</td>
                        <td className="py-3 text-concrete">{item.department}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteFaculty(item._id, item.email)}
                            className="text-signal hover:underline font-mono text-[10px] uppercase font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* DPDP Compliance Deletion Queue */}
      {!error && !loading && (
        <div className="rounded-md border border-signal/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold text-signal border-b border-signal/10 pb-2 font-bold uppercase tracking-wider text-[11px] font-mono">DPDP Compliance Deletion Queue</h3>
          {deletionRequests.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {deletionRequests.map((reqUser) => (
                <div key={reqUser._id} className="p-4 border border-signal/15 rounded bg-signal/[0.02] flex flex-col justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono text-[9px] bg-signal/15 text-signal px-1.5 py-0.5 rounded uppercase font-bold block w-max mb-1">Pending Wipe</span>
                    <h4 className="font-bold text-ink">{reqUser.name}</h4>
                    <p className="text-concrete font-mono mt-0.5">{reqUser.email}</p>
                  </div>
                  <button
                    onClick={() => executeWipe(reqUser._id, reqUser.name)}
                    className="w-full rounded bg-signal px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
                  >
                    Confirm Wipe & Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-concrete italic py-4 text-center">No pending deletion requests.</p>
          )}
        </div>
      )}

      {/* Audit log viewer */}
      {!error && !loading && (
        <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">System Audit Logs Viewer</h3>

          {/* Audit filters */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 p-4 border border-concrete/15 rounded bg-paper/50 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Search Actor</label>
              <input
                type="text"
                placeholder="e.g. Prasad, Asha"
                value={logFilterActor}
                onChange={(e) => setLogFilterActor(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 text-xs text-ink outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Filter Action</label>
              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 text-xs text-ink outline-none"
              >
                <option value="">All Actions</option>
                <option value="TOGGLE_KILL_SWITCH">TOGGLE_KILL_SWITCH</option>
                <option value="PROMOTE_USER">PROMOTE_USER</option>
                <option value="DEMOTE_USER">DEMOTE_USER</option>
                <option value="ADD_FACULTY_ENTRY">ADD_FACULTY_ENTRY</option>
                <option value="REMOVE_FACULTY_ENTRY">REMOVE_FACULTY_ENTRY</option>
                <option value="CREATE_INTERNSHIP">CREATE_INTERNSHIP</option>
                <option value="APPROVE_PROFESSOR">APPROVE_PROFESSOR</option>
                <option value="REJECT_PROFESSOR">REJECT_PROFESSOR</option>
                <option value="TAKEDOWN_LISTING">TAKEDOWN_LISTING</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">Start Date</label>
              <input
                type="date"
                value={logFilterStartDate}
                onChange={(e) => setLogFilterStartDate(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 text-xs text-ink outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-concrete">End Date</label>
              <input
                type="date"
                value={logFilterEndDate}
                onChange={(e) => setLogFilterEndDate(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-2.5 py-1.5 text-xs text-ink outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-concrete/15 rounded max-h-[30rem]">
            <table className="w-full text-left font-mono text-[11px] text-ink border-collapse">
              <thead>
                <tr className="bg-paper border-b border-concrete/20 text-concrete uppercase text-[9px] tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Metadata</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="border-b border-concrete/10 hover:bg-paper/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-ink">{log.actorId?.name || 'System'}</td>
                      <td className="py-3 px-3 text-blueprint font-bold">{log.action}</td>
                      <td className="py-3 px-3">
                        <span className="bg-concrete/10 text-concrete border border-concrete/20 px-1 py-0.5 rounded text-[10px]">
                          {log.targetType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-concrete truncate max-w-xs" title={JSON.stringify(log.metadata)}>
                        {JSON.stringify(log.metadata)}
                      </td>
                      <td className="py-3 px-3 text-concrete">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-concrete italic">
                      No matching audit logs found.
                  </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default SuperAdminDashboard;
