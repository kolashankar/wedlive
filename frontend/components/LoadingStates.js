import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

/**
 * Enhanced loading state components for better UX feedback
 */

export const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-4">
    <Loader2 className={`animate-spin text-blue-500 ${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'}`} />
    {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
  </div>
);

export const ImageLoadingState = ({ 
  isLoading, 
  isLoaded, 
  hasError, 
  retryCount = 0,
  maxRetries = 2,
  size = 'md',
  alt = 'Image'
}) => {
  const getStatusIcon = () => {
    if (hasError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else if (isLoaded) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (isLoading) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    } else {
      return <div className="w-4 h-4 bg-gray-200 rounded" />;
    }
  };

  const getStatusText = () => {
    if (hasError) {
      return `Failed after ${retryCount} attempt${retryCount > 1 ? 's' : ''}`;
    } else if (isLoaded) {
      return 'Loaded successfully';
    } else if (isLoading) {
      return 'Loading...';
    } else {
      return 'Ready';
    }
  };

  const getStatusColor = () => {
    if (hasError) return 'text-red-600';
    if (isLoaded) return 'text-green-600';
    if (isLoading) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className={`flex items-center space-x-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>{getStatusText()}</span>
    </div>
  );
};

export const ConnectionStateIndicator = ({ 
  isOnline, 
  hasConnectionIssues, 
  lastErrorTime = null 
}) => {
  if (hasConnectionIssues) {
    return (
      <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Connection issues detected</span>
        {lastErrorTime && (
          <span className="text-xs text-amber-500 ml-2">
            Last error: {new Date(lastErrorTime).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded p-2">
      <Wifi className="w-4 h-4" />
      <span className="text-sm">Connected</span>
    </div>
  );
};

export const ProgressIndicator = ({ 
  current = 0, 
  total = 0, 
  showPercentage = true,
  size = 'md' 
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <div className={`w-full ${size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2'}`}>
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs text-gray-600 ml-2">
          {current}/{total} ({percentage}%)
        </span>
      )}
    </div>
  );
};

export const ErrorBoundary = ({ 
  children, 
  fallback = null, 
  onError = null 
}) => {
  return (
    <div className="error-boundary">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
        </div>
        <p className="text-red-600 mt-2">
          {children || 'An unexpected error occurred while loading this content.'}
        </p>
        {fallback && (
          <div className="mt-4">
            {fallback}
          </div>
        )}
        {onError && (
          <button
            onClick={onError}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
