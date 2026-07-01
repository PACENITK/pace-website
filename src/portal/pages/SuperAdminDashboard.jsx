import React, { useState } from 'react';
import { mockAuditLogs } from '../mocks/fixtures';

export const SuperAdminDashboard = () => {
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [users, setUsers] = useState([
    { id: 'u-1', name: 'Nithin Bhat', email: 'nithin@nitk.edu.in', role: 'student' },
    { id: 'u-2', name: 'Dr. Prasad', email: 'prasad@nitk.edu.in', role: 'super_admin' },
    { id: 'u-3', name: 'Asha Hegde', email: 'asha@nitk.edu.in', role: 'admin' },
    { id: 'u-4', name: 'Prof. Ramesh Rao', email: 'ramesh@nitk.edu.in', role: 'professor' }
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const toggleMaintenance = () => {
    const nextState = !maintenanceActive;
    setMaintenanceActive(nextState);
    console.log(`[MOCK] Super Admin toggled Maintenance Mode to: ${nextState}`);
    
    // Append to audit logs list
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

  const updateUserRole = (userId, newRole, userName) => {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          console.log(`[MOCK] Role updated for ${userName} to ${newRole}`);
          
          // Append audit log
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

  return (
    <div className="space-y-6 font-body text-ink">
      <div className="rounded-md border border-concrete/20 bg-paper p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Super Admin Panel</h1>
        <p className="text-sm text-concrete">Manage global configurations, inspect the immutable audit logs, and escalate user permissions.</p>
      </div>

      {toastMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-4 text-xs text-structural font-mono font-medium">
          {toastMsg}
        </div>
      )}

      {/* Kill Switch panel */}
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* User permissions */}
        <div className="md:col-span-1 rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
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

        {/* Audit Log list */}
        <div className="md:col-span-2 rounded-md border border-concrete/20 bg-paper p-5 shadow-sm space-y-4">
          <h3 className="font-display text-base font-bold border-b border-concrete/10 pb-2">System Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-ink border-collapse">
              <thead>
                <tr className="border-b border-concrete/20 text-concrete uppercase text-[10px] tracking-wider">
                  <th className="py-2">Actor</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Scope</th>
                  <th className="py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} className="border-b border-concrete/10 hover:bg-paper/50">
                    <td className="py-3 font-semibold">{log.actorId?.name || 'System'}</td>
                    <td className="py-3 text-blueprint font-bold">{log.action}</td>
                    <td className="py-3 text-concrete">{log.targetType}</td>
                    <td className="py-3 text-concrete">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SuperAdminDashboard;
