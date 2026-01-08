// Centralized configuration management with proper environment detection

// Detect environment
const isProduction = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || hostname.includes('wedlive.vercel.app');
  }
  return process.env.NODE_ENV === 'production';
};

// Get backend URL based on environment
const getBackendUrl = () => {
  // Priority 1: Use environment variables if set (check all possible names)
  // Check both NEXT_PUBLIC_ and REACT_APP_ prefixes for compatibility
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                 process.env.REACT_APP_BACKEND_URL || 
                 process.env.NEXT_PUBLIC_API_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Priority 2: Auto-detect based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Emergent platform deployment
    if (hostname.includes('emergentagent.com') || hostname.includes('preview.emergentagent.com')) {
      // Use same domain for API calls (handled by Kubernetes ingress)
      return window.location.origin;
    }
    
    // Production: Vercel → Render
    if (hostname.includes('vercel.app') || hostname.includes('wedlive.vercel.app')) {
      return 'https://wedlive.onrender.com';
    }
    
    // Local development
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'http://localhost:8001';
    }
  }
  
  // Fallback
  return 'http://localhost:8001';
};

export const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: getBackendUrl(),
    TIMEOUT: 300000, // 5 minutes - increased for large video uploads
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
  return CONFIG.API.BASE_URL;
};

// Validate configuration
export const validateConfig = () => {
  const apiBaseUrl = getApiBaseUrl();
  const isLocal = apiBaseUrl.includes('localhost');
  const isProd = isProduction();
  
  console.log('🔧 Configuration Validation:', {
    apiBaseUrl,
    environment: isProd ? 'production' : 'development',
    isLocal,
    mediaProxy: CONFIG.MEDIA.PROXY_ENDPOINT,
  });
  
  // Warn if configuration seems inconsistent
  if (isProd && isLocal) {
    console.error('❌ ERROR: Production frontend using localhost backend URL!');
    console.error('Update NEXT_PUBLIC_API_URL in Vercel environment variables to: https://wedlive.onrender.com');
  }
  
  if (apiBaseUrl.includes('8000')) {
    console.warn('⚠️ WARNING: API base URL is using port 8000, expected 8001 for local or 443 for production');
  }
  
  return true;
};

export default CONFIG;
