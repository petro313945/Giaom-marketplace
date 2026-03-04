import axios from 'axios';

// Use network IP if accessing from network, otherwise localhost
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Check if we're accessing from network IP
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Use the same hostname as the frontend
    return `http://${hostname}:5000/api`;
  }
  
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Format error message for better user experience
    const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'An unexpected error occurred';
    
    // Create a formatted error object
    const formattedError = new Error(errorMessage);
    (formattedError as any).status = error.response?.status;
    (formattedError as any).response = error.response;
    
    return Promise.reject(formattedError);
  }
);

export default api;
