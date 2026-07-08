import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleGuard, ROLE_DEFAULTS } from './components/RoleGuard';
import { PortalLayout } from './components/PortalLayout';
import Login from './pages/Login';
import Discovery from './pages/Discovery';
import Detail from './pages/Detail';
import Applications from './pages/Applications';
import ProfessorDashboard from './pages/ProfessorDashboard';
import PostListing from './pages/PostListing';
import ApplicantList from './pages/ApplicantList';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Profile from './pages/Profile';

const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) {
    const dest = ROLE_DEFAULTS[role] || '/portal';
    return <Navigate to={dest} replace />;
  }
  return children;
};

const PortalRouterContent = () => {
  return (
    <PortalLayout>
      <Routes>
        {/* Unauthenticated Login page */}
        <Route 
          path="login" 
          element={
            <GuestOnlyRoute>
              <Login />
            </GuestOnlyRoute>
          } 
        />
        
        {/* Student default & Guest Discovery Board */}
        <Route 
          path="" 
          element={
            <RoleGuard allow={['student']} allowGuest={true}>
              <Discovery />
            </RoleGuard>
          } 
        />

        {/* Internship Detail page */}
        <Route 
          path="internships/:id" 
          element={
            <RoleGuard allow={['student']} allowGuest={true}>
              <Detail />
            </RoleGuard>
          } 
        />

        {/* My Applications page */}
        <Route 
          path="applications" 
          element={
            <RoleGuard allow={['student']}>
              <Applications />
            </RoleGuard>
          } 
        />

        {/* Student Profile page */}
        <Route 
          path="profile" 
          element={
            <RoleGuard allow={['student']}>
              <Profile />
            </RoleGuard>
          } 
        />

        {/* Professor Workspace Dashboard */}
        <Route 
          path="professor" 
          element={
            <RoleGuard allow={['professor']}>
              <ProfessorDashboard />
            </RoleGuard>
          } 
        />

        {/* Professor Post Internship proposal */}
        <Route 
          path="professor/post" 
          element={
            <RoleGuard allow={['professor']}>
              <PostListing />
            </RoleGuard>
          } 
        />
        <Route 
          path="professor/post/:id" 
          element={
            <RoleGuard allow={['professor']}>
              <PostListing />
            </RoleGuard>
          } 
        />

        {/* Professor applicants pipeline details */}
        <Route 
          path="professor/internships/:id/applicants" 
          element={
            <RoleGuard allow={['professor']}>
              <ApplicantList />
            </RoleGuard>
          } 
        />

        {/* Admin Dashboard */}
        <Route 
          path="admin" 
          element={
            <RoleGuard allow={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          } 
        />

        {/* Super Admin Panel */}
        <Route 
          path="super-admin" 
          element={
            <RoleGuard allow={['super_admin']}>
              <SuperAdminDashboard />
            </RoleGuard>
          } 
        />

        {/* Fallback to discovery */}
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </PortalLayout>
  );
};

export const PortalRoutes = () => {
  return (
    <AuthProvider>
      <PortalRouterContent />
    </AuthProvider>
  );
};

export default PortalRoutes;
