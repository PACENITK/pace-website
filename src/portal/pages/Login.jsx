import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFAULTS } from '../components/RoleGuard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Login = () => {
  const { login, signupStudent, signupProfessor } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [signupRole, setSignupRole] = useState('student'); // 'student' | 'professor'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('Civil Engineering');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIrisLogin = () => {
    console.log('[OAUTH] Initiating full page navigation to backend IRIS OAuth endpoint');
    window.location.href = `${API_URL}/auth/iris/login`;
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const dest = ROLE_DEFAULTS[user.role] || '/portal';
      navigate(dest);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (signupRole === 'student') {
        const user = await signupStudent(name, email, password);
        setSuccessMsg('Student registration successful! Logging in...');
        setTimeout(() => {
          const dest = ROLE_DEFAULTS[user.role] || '/portal';
          navigate(dest);
        }, 1500);
      } else {
        // Professor signup
        const res = await signupProfessor(name, email, password, dept);
        setSuccessMsg(res.message || 'Registration submitted! Awaiting administrator approval.');
        setName('');
        setEmail('');
        setPassword('');
        setTimeout(() => {
          setActiveTab('signin');
          setSuccessMsg('');
        }, 5000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(err.response?.data?.message || 'Registration failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md my-8 p-8 bg-paper border border-concrete/20 rounded shadow-md font-body text-ink">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight mb-1">PACE Portal Access</h2>
        <p className="text-xs text-concrete">NITK Civil Engineering Internship Platform</p>
      </div>

      {errorMsg && (
        <div className="rounded bg-signal/10 border border-signal/30 p-3 text-xs text-signal font-mono font-medium mb-4">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded bg-structural/10 border border-structural/30 p-3 text-xs text-structural font-mono font-medium mb-4">
          {successMsg}
        </div>
      )}

      {/* Primary: Sign in with IRIS */}
      <div className="mb-6">
        <button
          onClick={handleIrisLogin}
          className="w-full flex items-center justify-center gap-3 rounded bg-blueprint px-5 py-2.5 font-display text-xs font-bold tracking-wide uppercase text-white hover:bg-blueprint/90 transition-all hover:shadow-sm"
        >
          <span className="font-mono bg-white text-blueprint px-1.5 py-0.5 rounded text-[10px] font-black">IRIS</span>
          Sign In with IRIS (NITK ID)
        </button>
        
        <div className="relative my-5 text-center">
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-concrete/20" />
          <span className="relative z-10 bg-paper px-3 font-mono text-[10px] uppercase text-concrete">Or Email credentials</span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-concrete/25 mb-4 text-xs font-mono">
        <button
          onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex-1 pb-2 border-b-2 font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'signin' ? 'border-blueprint text-blueprint' : 'border-transparent text-concrete'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex-1 pb-2 border-b-2 font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'signup' ? 'border-blueprint text-blueprint' : 'border-transparent text-concrete'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Tab: SIGN IN */}
      {activeTab === 'signin' && (
        <form onSubmit={handleSignInSubmit} className="space-y-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-signal py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors shadow-sm"
          >
            {loading ? 'Signing In...' : 'Access Portal'}
          </button>
        </form>
      )}

      {/* Tab: SIGN UP */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignUpSubmit} className="space-y-4 text-xs">
          {/* Role selector */}
          <div className="flex flex-col gap-1">
            <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Onboarding Role</label>
            <select
              value={signupRole}
              onChange={(e) => setSignupRole(e.target.value)}
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            >
              <option value="student">Student (External Student)</option>
              <option value="professor">Professor (NITK Domain)</option>
            </select>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={signupRole === 'professor' ? 'must-be-name@nitk.edu.in' : 'name@example.com'}
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
            />
          </div>

          {/* Department (Conditional Professor field) */}
          {signupRole === 'professor' && (
            <div className="flex flex-col gap-1">
              <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Faculty Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
              >
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mining Engineering">Mining Engineering</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blueprint py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors shadow-sm"
          >
            {loading ? 'Submitting Registration...' : 'Register Profile'}
          </button>
        </form>
      )}
    </div>
  );
};
export default Login;
