import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFAULTS } from '../components/RoleGuard';

export const AuthComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { restoreSession, user, isAuthenticated } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pending = searchParams.get('pending');

    if (pending === 'true') {
      setIsPending(true);
      setLoading(false);
      return;
    }

    const completeHandoff = async () => {
      try {
        // Query /auth/me using the cookie (sent automatically by axios/browser)
        await restoreSession();
      } catch (err) {
        setErrorMsg('Failed to establish session credentials. Please try signing in again.');
      } finally {
        setLoading(false);
      }
    };

    completeHandoff();
  }, [searchParams, restoreSession]);

  // Once authenticated, redirect immediately based on role
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const dest = ROLE_DEFAULTS[user.role] || '/portal';
      navigate(dest);
    } else if (!loading && !isAuthenticated && !isPending && !errorMsg) {
      setErrorMsg('Not authorized. No active session established.');
    }
  }, [loading, isAuthenticated, user, navigate, isPending, errorMsg]);

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
      <p className="text-xs font-mono text-concrete tracking-widest uppercase">Verifying session token cookies...</p>
    </div>
  );
};
export default AuthComplete;
