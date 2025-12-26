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
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 404) {
      console.error('Resource not found - check API endpoint');
    }
    
    return Promise.reject(error);
  }
);

export default api;
