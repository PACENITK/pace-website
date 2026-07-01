import React, { useState } from 'react';
import { mockAuditLogs } from '../mocks/fixtures';

export const SuperAdminDashboard = () => {
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // 1. Audit Logs State & Filters
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [logFilterActor, setLogFilterActor] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('');
  const [logFilterStartDate, setLogFilterStartDate] = useState('');
  const [logFilterEndDate, setLogFilterEndDate] = useState('');

  // 2. Admins list
  const [users, setUsers] = useState([
    { id: 'u-1', name: 'Nithin Bhat', email: 'nithin@nitk.edu.in', role: 'student' },
    { id: 'u-2', name: 'Dr. Prasad', email: 'prasad@nitk.edu.in', role: 'super_admin' },
    { id: 'u-3', name: 'Asha Hegde', email: 'asha@nitk.edu.in', role: 'admin' },
    { id: 'u-4', name: 'Prof. Ramesh Rao', email: 'ramesh@nitk.edu.in', role: 'professor' }
  ]);

  // 3. Faculty List Editor (CRUD table)
  const [facultyList, setFacultyList] = useState([
    { id: 'f-1', name: 'Prof. Ramesh Rao', email: 'ramesh@nitk.edu.in', department: 'Civil Engineering' },
    { id: 'f-2', name: 'Dr. R. Swaminathan', email: 'swaminathan@nitk.edu.in', department: 'Civil Engineering' },
    { id: 'f-3', name: 'Dr. Suresh Kumar', email: 'suresh@nitk.edu.in', department: 'Civil Engineering' }
  ]);
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyDept, setNewFacultyDept] = useState('');
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingDept, setEditingDept] = useState('');

  // Platform Maintenance Toggle
  const toggleMaintenance = () => {
    const nextState = !maintenanceActive;
    setMaintenanceActive(nextState);
    console.log(`[MOCK] Super Admin toggled Maintenance Mode to: ${nextState}`);
    
    // Add audit entry
    const newLog = {
      _id: `mock-audit-${Date.now()}`,
      actorId: { name: 'Dr. Prasad (Super Admin)' },
      action: 'TOGGLE_KILL_SWITCH',
      targetType: 'System',
      metadata: { active: nextState },
      timestamp: new Date().toISOString()
    };
    setAuditLogs([newLog, ...auditLogs]);

    setToastMsg(`Maintenance Mode turned ${nextState ? 'ON' : 'OFF'}!`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Promotion / Demotion controls
  const updateUserRole = (userId, newRole, userName) => {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          console.log(`[MOCK] Role updated for ${userName} to ${newRole}`);
          
          // Add audit entry
          const newLog = {
            _id: `mock-audit-${Date.now()}`,
            actorId: { name: 'Dr. Prasad (Super Admin)' },
            action: 'PROMOTE_USER',
            targetType: 'User',
            metadata: { targetUserId: userId, newRole },
            timestamp: new Date().toISOString()
          };
          setAuditLogs([newLog, ...auditLogs]);
          
          setToastMsg(`User ${userName} updated to role ${newRole}!`);
          setTimeout(() => setToastMsg(''), 3000);
          return { ...u, role: newRole };
        }
        return u;
      })
    );
  };

  // Faculty CRUD Operations
  const handleAddFaculty = (e) => {
    e.preventDefault();
    if (!newFacultyEmail.trim() || !newFacultyName.trim()) {
      alert('Name and Email are required.');
      return;
    }
    const newEntry = {
      id: `f-new-${Date.now()}`,
      name: newFacultyName,
      email: newFacultyEmail.toLowerCase().trim(),
      department: newFacultyDept || 'Civil Engineering'
    };
    setFacultyList([...facultyList, newEntry]);
    
    // Log audit
    const newLog = {
      _id: `mock-audit-${Date.now()}`,
      actorId: { name: 'Dr. Prasad (Super Admin)' },
      action: 'ADD_FACULTY_ENTRY',
      targetType: 'FacultyList',
      metadata: { email: newFacultyEmail },
      timestamp: new Date().toISOString()
    };
    setAuditLogs([newLog, ...auditLogs]);

    setNewFacultyName('');
    setNewFacultyEmail('');
    setNewFacultyDept('');
    setToastMsg('Faculty entry added successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const startEditFaculty = (item) => {
    setEditingFacultyId(item.id);
    setEditingName(item.name);
    setEditingEmail(item.email);
    setEditingDept(item.department);
  };

  const handleSaveFacultyEdit = (id) => {
    if (!editingName.trim() || !editingEmail.trim()) {
      alert('Name and email are required.');
      return;
    }
    setFacultyList(
      facultyList.map((f) => {
        if (f.id === id) {
          return { ...f, name: editingName, email: editingEmail, department: editingDept };
        }
        return f;
      })
    );
    setEditingFacultyId(null);
    setToastMsg('Faculty list updated!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleDeleteFaculty = (id, email) => {
    setFacultyList(facultyList.filter((f) => f.id !== id));
    
    // Log audit
    const newLog = {
      _id: `mock-audit-${Date.now()}`,
      actorId: { name: 'Dr. Prasad (Super Admin)' },
      action: 'REMOVE_FACULTY_ENTRY',
      targetType: 'FacultyList',
      metadata: { email },
      timestamp: new Date().toISOString()
    };
    setAuditLogs([newLog, ...auditLogs]);

    setToastMsg('Faculty entry deleted.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Filter audit logs in memory
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
    // Add end of day buffer if only date is selected
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

      {/* Kill Switch Toggle */}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User permissions */}
        <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4 h-max">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">User Permission Control</h3>
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="p-3 border border-concrete/15 rounded bg-paper/50 space-y-2">
                <div className="text-xs">
                  <h4 className="font-bold text-ink">{u.name}</h4>
                  <p className="text-concrete font-mono mt-0.5">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value, u.name)}
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

        {/* Faculty verification table CRUD */}
        <div className="lg:col-span-2 rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">Faculty Verification List</h3>
          
          {/* Add entry form */}
          <form onSubmit={handleAddFaculty} className="grid gap-2 sm:grid-cols-3 p-3 border border-concrete/15 rounded bg-paper/50 text-xs">
            <input
              type="text"
              required
              placeholder="Faculty Name"
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-2 py-1.5 outline-none"
            />
            <input
              type="email"
              required
              placeholder="email@nitk.edu.in"
              value={newFacultyEmail}
              onChange={(e) => setNewFacultyEmail(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-2 py-1.5 outline-none"
            />
            <button
              type="submit"
              className="rounded bg-blueprint text-white font-mono uppercase tracking-wider font-bold text-[10px] hover:bg-blueprint/90"
            >
              + Add Faculty
            </button>
          </form>

          {/* CRUD Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-xs text-ink border-collapse">
              <thead>
                <tr className="border-b border-concrete/20 text-concrete uppercase text-[10px] tracking-wider">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.map((item) => (
                  <tr key={item.id} className="border-b border-concrete/10 hover:bg-paper/50">
                    {editingFacultyId === item.id ? (
                      <>
                        <td className="py-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="rounded border border-concrete/35 bg-white px-2 py-1 text-xs outline-none focus:border-blueprint"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="email"
                            value={editingEmail}
                            onChange={(e) => setEditingEmail(e.target.value)}
                            className="rounded border border-concrete/35 bg-white px-2 py-1 text-xs outline-none focus:border-blueprint"
                          />
                        </td>
                        <td className="py-2 text-right space-x-1.5">
                          <button
                            onClick={() => handleSaveFacultyEdit(item.id)}
                            className="text-structural hover:underline font-mono text-[10px] uppercase font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFacultyId(null)}
                            className="text-concrete hover:underline font-mono text-[10px] uppercase"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 font-semibold">{item.name}</td>
                        <td className="py-3 font-mono text-concrete">{item.email}</td>
                        <td className="py-3 text-right space-x-3">
                          <button
                            onClick={() => startEditFaculty(item)}
                            className="text-blueprint hover:underline font-mono text-[10px] uppercase font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFaculty(item.id, item.email)}
                            className="text-signal hover:underline font-mono text-[10px] uppercase font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Log list */}
      <div className="rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
        <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">System Audit Logs Viewer</h3>

        {/* Audit Filter Toolbar */}
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
              <option value="ADD_FACULTY_ENTRY">ADD_FACULTY_ENTRY</option>
              <option value="REMOVE_FACULTY_ENTRY">REMOVE_FACULTY_ENTRY</option>
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

        {/* Dense scannable table layout */}
        <div className="overflow-x-auto border border-concrete/15 rounded">
          <table className="w-full text-left font-mono text-[11px] text-ink border-collapse">
            <thead>
              <tr className="bg-paper border-b border-concrete/20 text-concrete uppercase text-[9px] tracking-wider">
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
    </div>
  );
};
export default SuperAdminDashboard;
