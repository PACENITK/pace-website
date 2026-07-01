import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => {
  return inMemoryToken;
};

// Request interceptor to attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('[API] 401 encountered, attempting token refresh...');
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        
        // Update in-memory state
        setAccessToken(newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('[API] Refresh failed. Logging out...');
        setAccessToken(null);
        // Trigger a custom event so AuthContext can clean state and redirect
        window.dispatchEvent(new Event('pace-auth-logout'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
