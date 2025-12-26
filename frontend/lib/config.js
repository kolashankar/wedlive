// Centralized configuration management
export const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 
      (typeof window !== 'undefined' && window.location.origin === 'https://wedlive.vercel.app' 
        ? 'https://wedlive.onrender.com' 
        : 'http://localhost:8001'),
    TIMEOUT: 90000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000,
  },
  
  // Media Configuration
  MEDIA: {
    PROXY_ENDPOINT: '/api/media/telegram-proxy/photos/',
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },
  
  // Image Loading Configuration
  IMAGE: {
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000,
    FALLBACK_TIMEOUT: 5000,
    LOADING_PLACEHOLDER: '/images/placeholder.jpg',
  }
};

// Get current API base URL with validation
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('localhost:3000') || currentOrigin.includes('127.0.0.1:3000')) {
      return CONFIG.API.BASE_URL;
    }
  }
  return CONFIG.API.BASE_URL;
};

// Validate configuration
export const validateConfig = () => {
  console.log('🔧 Configuration Validation:', {
    apiBaseUrl: getApiBaseUrl(),
    mediaProxy: CONFIG.MEDIA.PROXY_ENDPOINT,
    environment: process.env.NODE_ENV,
  });
  
  // Warn if configuration seems inconsistent
  if (getApiBaseUrl().includes('8000')) {
    console.warn('⚠️ WARNING: API base URL is using port 8000, expected 8001');
  }
  
  return true;
};

export default CONFIG;
