import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from httpOnly cookie by calling GET /auth/me
  const restoreSession = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.user);
        setAccessToken(res.data.accessToken);
      }
    } catch (err) {
      console.log('[AUTH] No active session found or cookie expired.');
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();

    // Listen for custom logout event emitted by the API client on refresh failures
    const handleForcedLogout = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('pace-auth-logout', handleForcedLogout);
    return () => {
      window.removeEventListener('pace-auth-logout', handleForcedLogout);
    };
  }, []);

  // Standard password login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        setUser(res.data.user);
        setAccessToken(res.data.accessToken);
        return res.data.user;
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up NITK student
  const signupStudent = async (name, email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      if (res.data && res.data.success) {
        setUser(res.data.user);
        setAccessToken(res.data.accessToken);
        return res.data.user;
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up pending Professor
  const signupProfessor = async (name, email, password, department) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/professor/signup', { name, email, password, department });
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout invalidates session
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Failed to log out cleanly on backend:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    try {
      const res = await api.post('/auth/refresh');
      if (res.data && res.data.success) {
        setAccessToken(res.data.accessToken);
      }
    } catch (err) {
      console.error('Manual refresh call failed:', err);
    }
  };

  const value = {
    user,
    role: user ? user.role : null,
    isAuthenticated: !!user,
    isLoading,
    login,
    signupStudent,
    signupProfessor,
    logout,
    refresh,
    restoreSession
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
export default AuthContext;
