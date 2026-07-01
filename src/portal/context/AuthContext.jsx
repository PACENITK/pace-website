import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../mocks/fixtures';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = localStorage.getItem('pace_portal_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        // Add a tiny delay to simulate network latency
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, role = 'student') => {
    setIsLoading(true);
    // Find matching mock user
    let loggedUser = mockUsers[role];
    if (!loggedUser) {
      // Fallback fallback if requested role doesn't exist
      loggedUser = {
        _id: 'u-custom',
        role,
        name: `Mock ${role.replace('_', ' ')}`,
        email: email || `${role}@nitk.edu.in`
      };
    }

    localStorage.setItem('pace_portal_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setIsLoading(false);
    return loggedUser;
  };

  const logout = async () => {
    setIsLoading(true);
    localStorage.removeItem('pace_portal_user');
    setUser(null);
    setIsLoading(false);
  };

  const refresh = async () => {
    console.log('[MOCK] Session refresh triggered');
  };

  const value = {
    user,
    role: user ? user.role : null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
