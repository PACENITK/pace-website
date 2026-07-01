import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFAULTS } from '../components/RoleGuard';

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding JWT token:', err);
    return null;
  }
};

export const AuthComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const pending = searchParams.get('pending');

    if (pending === 'true') {
      setIsPending(true);
      return;
    }

    if (!token) {
      setErrorMsg('No authentication token received from identity provider.');
      return;
    }

    const completeHandoff = async () => {
      const decoded = decodeJwt(token);
      if (!decoded) {
        setErrorMsg('Invalid token format received.');
        return;
      }

      // Log in using context helper and cache locally
      const role = decoded.role || 'student';
      const mockEmail = decoded.email || `${role}@nitk.edu.in`;
      
      const userObj = {
        _id: decoded.id || 'u-iris',
        role,
        name: decoded.name || `IRIS User (${role})`,
        email: mockEmail,
        token
      };

      localStorage.setItem('pace_portal_user', JSON.stringify(userObj));
      
      // Perform session login
      await login(mockEmail, role);

      // Redirect to landing dashboard based on role
      const dest = ROLE_DEFAULTS[role] || '/portal';
      navigate(dest);
    };

    completeHandoff();
  }, [searchParams, navigate, login]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-md my-12 p-8 bg-paper border border-concrete/20 rounded shadow-md font-body text-ink text-center">
        <div className="mb-4 text-structural text-3xl font-mono">✓</div>
        <h2 className="font-display text-xl font-bold tracking-tight mb-2">Registration Submitted</h2>
        <p className="text-sm text-concrete mb-6">
          Your professor account has been created via IRIS verification. It is currently awaiting review by administrative staff. You will be notified once approved.
        </p>
        <Link
          to="/"
          className="inline-block rounded bg-blueprint px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="mx-auto max-w-md my-12 p-8 bg-paper border border-signal/30 rounded shadow-md font-body text-ink text-center">
        <div className="mb-4 text-signal text-3xl font-mono">⚠</div>
        <h2 className="font-display text-xl font-bold tracking-tight mb-2">Authentication Failed</h2>
        <p className="text-sm text-concrete mb-6">{errorMsg}</p>
        <Link
          to="/portal/login"
          className="inline-block rounded bg-signal px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-signal/90 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-paper font-body text-ink">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-concrete border-t-blueprint mb-4" />
      <h3 className="font-display font-bold text-lg mb-1">Finalizing Authentication</h3>
      <p className="text-xs font-mono text-concrete tracking-widest uppercase">Writing session parameters...</p>
    </div>
  );
};
export default AuthComplete;
