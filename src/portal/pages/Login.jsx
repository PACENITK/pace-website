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
  const [institution, setInstitution] = useState('');
  const [proofOfStatus, setProofOfStatus] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
        const res = await signupStudent(name, email, password);
        if (res.accessToken) {
          setSuccessMsg('Student registration successful! Logging in...');
          setTimeout(() => {
            const dest = ROLE_DEFAULTS[res.user.role] || '/portal';
            navigate(dest);
          }, 1500);
        } else {
          setSuccessMsg(res.message || 'Student registration successful! Please verify your email address via the link sent to your inbox.');
          setName('');
          setEmail('');
          setPassword('');
        }
      } else {
        // Professor signup
        const res = await signupProfessor(name, email, password, dept, institution, proofOfStatus);
        setSuccessMsg(res.message || 'Registration submitted! Please verify your email and await administrator approval.');
        setName('');
        setEmail('');
        setPassword('');
        setInstitution('');
        setProofOfStatus('');
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

      {/* Space divider */}
      <div className="mb-2"></div>

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
              <option value="student">Student Account</option>
              <option value="professor">Professor / Faculty Account</option>
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
              placeholder="e.g. name@university.edu"
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

          {/* Professor specific onboarding details */}
          {signupRole === 'professor' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Institution / College</label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. NITK Surathkal"
                  className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
                />
              </div>

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

              <div className="flex flex-col gap-1">
                <label className="font-mono uppercase tracking-wider text-concrete text-[10px]">Proof of Faculty Status</label>
                <textarea
                  rows="2"
                  required
                  value={proofOfStatus}
                  onChange={(e) => setProofOfStatus(e.target.value)}
                  placeholder="e.g. Link to institutional profile page or statement of credentials..."
                  className="rounded border border-concrete/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blueprint"
                />
              </div>
            </>
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
