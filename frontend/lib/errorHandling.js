/**
 * Phase 6: Frontend Error Handling & UX Improvements
 * Comprehensive error handling, loading states, and user feedback
 */

import { toast } from 'sonner';

// ==================== ERROR TYPES ====================
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UPLOAD: 'UPLOAD_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// ==================== ERROR HANDLER ====================
export class ErrorHandler {
  /**
   * Handle API errors with user-friendly messages
   */
  static handleError(error, context = {}) {
    console.error('[ErrorHandler]', error, context);

    // Network errors
    if (!navigator.onLine) {
      toast.error('No internet connection', {
        description: 'Please check your internet connection and try again',
        action: {
          label: 'Retry',
          onClick: () => context.retry?.()
        }
      });
      return;
    }

    // HTTP errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          this.handle400Error(data, context);
          break;
        case 401:
          this.handle401Error(data, context);
          break;
        case 403:
          this.handle403Error(data, context);
          break;
        case 404:
          this.handle404Error(data, context);
          break;
        case 413:
          this.handle413Error(data, context);
          break;
        case 500:
          this.handle500Error(data, context);
          break;
        default:
          this.handleUnknownError(error, context);
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('No response from server', {
        description: 'The server is not responding. Please try again later.',
        action: {
          label: 'Retry',
          onClick: () => context.retry?.()
        }
      });
    } else {
      // Error in request setup
      this.handleUnknownError(error, context);
    }
  }

  static handle400Error(data, context) {
    const message = data?.detail?.message || data?.detail || 'Invalid request';
    const suggestions = data?.detail?.suggestions || [];
    
    toast.error('Validation Error', {
      description: message,
      action: suggestions[0] ? {
        label: 'Help',
        onClick: () => toast.info('Suggestion', { description: suggestions[0] })
      } : undefined
    });
  }

  static handle401Error(data, context) {
    toast.error('Authentication Required', {
      description: 'Please log in to continue',
      action: {
        label: 'Log In',
        onClick: () => window.location.href = '/login'
      }
    });
  }

  static handle403Error(data, context) {
    toast.error('Permission Denied', {
      description: 'You don\'t have permission to perform this action'
    });
  }

  static handle404Error(data, context) {
    const message = data?.detail?.message || 'Resource not found';
    toast.error('Not Found', {
      description: message
    });
  }

  static handle413Error(data, context) {
    toast.error('File Too Large', {
      description: 'Please upload a smaller file (max 10MB)',
      action: {
        label: 'Learn More',
        onClick: () => toast.info('Tip', {
          description: 'Compress your image before uploading'
        })
      }
    });
  }

  static handle500Error(data, context) {
    toast.error('Server Error', {
      description: 'Something went wrong on our end. Please try again.',
      action: {
        label: 'Retry',
        onClick: () => context.retry?.()
      }
    });
  }

  static handleUnknownError(error, context) {
    toast.error('Unexpected Error', {
      description: 'An unexpected error occurred. Please try again.',
      action: {
        label: 'Retry',
        onClick: () => context.retry?.()
      }
    });
  }
}

// ==================== LOADING STATES ====================
export class LoadingState {
  constructor() {
    this.states = new Map();
  }

  start(key) {
    this.states.set(key, true);
  }

  stop(key) {
    this.states.set(key, false);
  }

  isLoading(key) {
    return this.states.get(key) || false;
  }

  clear() {
    this.states.clear();
  }
}

// ==================== RETRY MECHANISM ====================
export class RetryManager {
  static async retry(fn, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      onRetry = () => {}
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          const waitTime = delay * Math.pow(backoff, attempt - 1);
          onRetry(attempt, waitTime);
          
          toast.info('Retrying...', {
            description: `Attempt ${attempt + 1} of ${maxAttempts}`
          });
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  }
}

// ==================== FILE VALIDATION ====================
export class FileValidator {
  static validateImage(file) {
    const errors = [];

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        type: 'INVALID_TYPE',
        message: 'Please upload a JPEG, PNG, or WebP image',
        suggestions: ['Convert your image to a supported format']
      });
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      errors.push({
        type: 'FILE_TOO_LARGE',
        message: `File size (${sizeMB}MB) exceeds maximum (10MB)`,
        suggestions: [
          'Compress your image before uploading',
          'Reduce image dimensions',
          'Use an online image compressor'
        ]
      });
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push({
        type: 'INVALID_NAME',
        message: 'File name is too long',
        suggestions: ['Rename the file to something shorter']
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static showValidationErrors(errors) {
    errors.forEach(error => {
      toast.error(error.message, {
        description: error.suggestions?.[0],
        action: error.suggestions?.length > 1 ? {
          label: 'More tips',
          onClick: () => {
            error.suggestions.forEach((tip, i) => {
              setTimeout(() => toast.info(`Tip ${i + 1}`, { description: tip }), i * 100);
            });
          }
        } : undefined
      });
    });
  }
}

// ==================== SUCCESS FEEDBACK ====================
export class SuccessFeedback {
  static show(message, options = {}) {
    const {
      description,
      duration = 3000,
      action
    } = options;

    toast.success(message, {
      description,
      duration,
      action
    });
  }

  static showPhotoUploaded(placeholder) {
    this.show('Photo uploaded successfully', {
      description: `${placeholder} has been updated`,
      action: {
        label: 'View',
        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    });
  }

  static showPhotoDeleted() {
    this.show('Photo deleted', {
      description: 'The photo has been removed successfully'
    });
  }

  static showBackgroundUpdated() {
    this.show('Background updated', {
      description: 'Your changes have been saved'
    });
  }

  static showBorderApplied() {
    this.show('Border applied', {
      description: 'The border has been applied to your photos'
    });
  }
}

// ==================== PROGRESS TRACKER ====================
export class ProgressTracker {
  constructor(total) {
    this.total = total;
    this.completed = 0;
    this.listeners = [];
  }

  increment() {
    this.completed++;
    this.notify();
  }

  setCompleted(count) {
    this.completed = count;
    this.notify();
  }

  getProgress() {
    return (this.completed / this.total) * 100;
  }

  isComplete() {
    return this.completed >= this.total;
  }

  onProgress(callback) {
    this.listeners.push(callback);
  }

  notify() {
    const progress = this.getProgress();
    this.listeners.forEach(callback => callback(progress, this.completed, this.total));
  }

  reset() {
    this.completed = 0;
    this.notify();
  }
}

// ==================== NETWORK STATUS ====================
export class NetworkStatus {
  static isOnline() {
    return navigator.onLine;
  }

  static onStatusChange(callback) {
    window.addEventListener('online', () => {
      toast.success('Back online', {
        description: 'Your connection has been restored'
      });
      callback(true);
    });

    window.addEventListener('offline', () => {
      toast.error('Connection lost', {
        description: 'Please check your internet connection'
      });
      callback(false);
    });
  }
}

// ==================== FORM VALIDATION ====================
export class FormValidator {
  static validateRequired(value, fieldName) {
    if (!value || value.trim() === '') {
      return {
        valid: false,
        message: `${fieldName} is required`
      };
    }
    return { valid: true };
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: 'Please enter a valid email address'
      };
    }
    return { valid: true };
  }

  static validateURL(url) {
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return {
        valid: false,
        message: 'Please enter a valid URL'
      };
    }
  }

  static showValidationError(field, message) {
    toast.error('Validation Error', {
      description: `${field}: ${message}`
    });
  }
}

// ==================== DEBOUNCE HELPER ====================
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== LOCAL STORAGE HELPERS ====================
export class StorageHelper {
  static save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      toast.error('Failed to save locally', {
        description: 'Your changes are saved on the server'
      });
      return false;
    }
  }

  static load(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  }
}

// ==================== EXPORTS ====================
export default {
  ErrorHandler,
  LoadingState,
  RetryManager,
  FileValidator,
  SuccessFeedback,
  ProgressTracker,
  NetworkStatus,
  FormValidator,
  debounce,
  StorageHelper
};
