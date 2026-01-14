import axios from 'axios';
import CONFIG, { getApiBaseUrl, validateConfig } from './config';

// Validate configuration on import
validateConfig();

console.log('API Base URL:', getApiBaseUrl());

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: CONFIG.API.TIMEOUT,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add retry logic for failed requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    console.error('API Error:', error);
    
    // Retry logic for timeout or network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      if (!config.__retryCount) {
        config.__retryCount = 0;
      }
      
      if (config.__retryCount < CONFIG.API.RETRY_ATTEMPTS) {
        config.__retryCount += 1;
        console.warn(`Retrying request (${config.__retryCount}/${CONFIG.API.RETRY_ATTEMPTS})...`);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, CONFIG.API.RETRY_DELAY * config.__retryCount));
        
        return api(config);
      }
      
      console.error('Request timeout after retries - API might be down');
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.error('❌ Authentication failed - token expired or invalid');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        // Show a user-friendly message
        if (typeof window.toast !== 'undefined') {
          window.toast?.error('Your session has expired. Please log in again.');
        }
        window.location.href = '/login?expired=true';
      }
    }
    
    // Handle 403 Forbidden - insufficient permissions or token issue
    if (error.response?.status === 403) {
      console.error('❌ Access forbidden - you may not have permission or your session expired');
      const errorDetail = error.response?.data?.detail || '';
      
      // If it's an authorization error, might be expired token
      if (errorDetail.toLowerCase().includes('not authorized') || 
          errorDetail.toLowerCase().includes('permission')) {
        console.warn('⚠️ Token may be expired - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          if (typeof window.toast !== 'undefined') {
            window.toast?.error('Your session has expired. Please log in again.');
          }
          window.location.href = '/login?expired=true';
        }
      }
    }
    
    if (error.response?.status === 404) {
      console.error('Resource not found - check API endpoint');
    }
    
    return Promise.reject(error);
  }
);

export default api;
