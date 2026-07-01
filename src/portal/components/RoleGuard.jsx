import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ROLE_DEFAULTS = {
  student: '/portal',
  professor: '/portal/professor',
  admin: '/portal/admin',
  super_admin: '/portal/super-admin'
};

export const RoleGuard = ({ children, allow = [], allowGuest = false }) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper text-ink font-body">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-concrete border-t-signal" />
          <span className="font-mono text-sm tracking-wider uppercase text-concrete animate-pulse">Loading Portal Session...</span>
        </div>
      </div>
    );
  }

  // Guest access allowed
  if (allowGuest && !isAuthenticated) {
    return children;
  }

  // Not logged in -> Go to login page
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  // Logged in but doesn't have required role -> redirect to default route for their role
  if (allow.length > 0 && !allow.includes(role)) {
    const defaultRedirect = ROLE_DEFAULTS[role] || '/portal';
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};
