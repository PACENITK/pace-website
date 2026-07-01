import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFAULTS } from '../components/RoleGuard';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');

  const handleIrisLogin = () => {
    // Phase 3 OAuth login redirect simulation
    console.log('[OAUTH] Initiating full page navigation to backend IRIS OAuth endpoint');
    window.location.href = 'http://localhost:5000/auth/iris/login';
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    const user = await login(email, selectedRole);
    const dest = ROLE_DEFAULTS[user.role] || '/portal';
    navigate(dest);
  };

  return (
    <div className="mx-auto max-w-md my-12 p-8 bg-paper border border-concrete/20 rounded shadow-md font-body text-ink">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">PACE Portal Access</h2>
        <p className="text-sm text-concrete">Sign in to apply for internships, manage postings, or perform administrative tasks.</p>
      </div>

      {/* Primary: Sign in with IRIS */}
      <div className="mb-8">
        <button
          onClick={handleIrisLogin}
          className="w-full flex items-center justify-center gap-3 rounded bg-blueprint px-5 py-3 font-display text-sm font-bold tracking-wide uppercase text-white hover:bg-blueprint/90 transition-all hover:shadow"
        >
          <span className="font-mono bg-white text-blueprint px-1.5 py-0.5 rounded text-xs font-black">IRIS</span>
          Sign In with IRIS (NITK)
        </button>
        <div className="relative my-6 text-center">
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-concrete/20" />
          <span className="relative z-10 bg-paper px-3 font-mono text-xs uppercase text-concrete">Or Local Bypass (Mock Mode)</span>
        </div>
      </div>

      {/* Secondary: Mock bypass signup / login */}
      <form onSubmit={handleLocalSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-name@nitk.edu.in"
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-wider text-concrete">Role Profile</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
          >
            <option value="student">Student (NITK)</option>
            <option value="professor">Professor</option>
            <option value="admin">Administrator</option>
            <option value="super_admin">Super Administrator</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded bg-signal py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
        >
          Access Portal
        </button>
      </form>
    </div>
  );
};
export default Login;
