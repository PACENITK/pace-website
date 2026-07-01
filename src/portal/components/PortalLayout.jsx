import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_MAP = {
  guest: [
    { label: 'Discovery Board', path: '/portal' },
    { label: 'Sign In / Sign Up', path: '/portal/login', highlight: true }
  ],
  student: [
    { label: 'Discovery Board', path: '/portal' },
    { label: 'My Applications', path: '/portal/applications' }
  ],
  professor: [
    { label: 'Dashboard', path: '/portal/professor' },
    { label: 'Post Internship', path: '/portal/professor/post' }
  ],
  admin: [
    { label: 'Moderation Portal', path: '/portal/admin' }
  ],
  super_admin: [
    { label: 'Super Admin Portal', path: '/portal/super-admin' }
  ]
};

export const PortalLayout = ({ children }) => {
  const { user, role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = isAuthenticated ? role : 'guest';
  const navItems = NAV_MAP[currentRole] || NAV_MAP.guest;

  const handleLogout = async () => {
    await logout();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-body">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-concrete/20 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Wordmark logo */}
            <div className="flex items-center gap-6">
              <Link to="/portal" className="flex items-center gap-2 group">
                <span className="bg-signal text-white font-mono text-sm px-2 py-0.5 font-bold rounded-sm group-hover:scale-105 transition-transform duration-300">
                  PACE
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-ink group-hover:text-blueprint transition-colors duration-300">
                  Portal
                </span>
              </Link>

              {/* Dynamic Nav Items */}
              <nav className="hidden md:flex items-center gap-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  if (item.highlight) {
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        className="rounded bg-signal px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-signal/90 hover:shadow-md"
                      >
                        {item.label}
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`font-display text-sm font-semibold tracking-wide uppercase transition-all hover:text-blueprint ${
                        isActive ? 'text-blueprint border-b-2 border-blueprint' : 'text-concrete'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile / Session Indicator */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-sm font-bold text-ink leading-tight">{user.name}</span>
                    <span className="font-mono text-[10px] text-concrete uppercase tracking-wider">
                      {role.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded border border-concrete/40 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-concrete hover:border-signal hover:text-signal transition-colors duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                location.pathname !== '/portal/login' && (
                  <Link
                    to="/portal/login"
                    className="rounded bg-blueprint px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-blueprint/90 transition-colors"
                  >
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-concrete/10 py-6 text-center text-xs font-mono text-concrete bg-paper">
        <p>© 2026 Professional Association for Civil Engineering, NITK Surathkal.</p>
      </footer>
    </div>
  );
};
export default PortalLayout;
