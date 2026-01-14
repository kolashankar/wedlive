import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../lib/config';

/**
 * SmartImage component with advanced loading, error handling, and retry logic
 */
const SmartImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = null,
  onLoad,
  onError,
  maxRetries = CONFIG.IMAGE.MAX_RETRIES,
  retryDelay = CONFIG.IMAGE.RETRY_DELAY,
  ...props 
}) => {
  const [imageState, setImageState] = useState({
    status: 'loading', // loading, loaded, error, failed
    retryCount: 0,
    currentSrc: src,
    hasError: false,
    errorMessage: ''
  });

  const imgRef = useRef(null);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Handle image loading with timeout and abort
  const loadImage = (imageSrc) => {
    if (!imageSrc) {
      setImageState(prev => ({ ...prev, status: 'error', hasError: true }));
      if (onError) onError(new Error('No src provided'));
      return;
    }

    cleanup(); // Cancel previous requests

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Set timeout for loading
    timeoutRef.current = setTimeout(() => {
      console.warn(`Image loading timeout: ${imageSrc}`);
      setImageState(prev => ({ 
        ...prev, 
        status: 'error', 
        hasError: true 
      }));
      if (onError) onError(new Error('Loading timeout'));
    }, CONFIG.IMAGE.FALLBACK_TIMEOUT);

    setImageState(prev => ({ ...prev, status: 'loading', currentSrc: imageSrc }));

    const img = new Image();
    
    img.onload = () => {
      cleanup();
      setImageState(prev => ({ ...prev, status: 'loaded', hasError: false }));
      if (onLoad) onLoad(img);
      console.log(`✅ Image loaded successfully: ${imageSrc}`);
    };

    img.onerror = (error) => {
      cleanup();
      
      const newRetryCount = imageState.retryCount + 1;
      const shouldRetry = newRetryCount < maxRetries;
      
      console.error(`❌ Image failed to load: ${imageSrc}`, error);
      
      // Check if this is an invalid file reference error
      const isInvalidFileRef = imageSrc.includes('/file_') && error.message?.includes('500');
      
      if (isInvalidFileRef) {
        console.warn(`🚫 Invalid file reference detected: ${imageSrc}`);
        setImageState(prev => ({ 
          ...prev, 
          status: 'failed', 
          hasError: true,
          errorMessage: 'Invalid file reference'
        }));
        if (onError) onError(new Error('Invalid file reference'));
        return;
      }
      
      if (shouldRetry && fallbackSrc) {
        console.log(`🔄 Retrying with fallback (${newRetryCount}/${maxRetries}): ${fallbackSrc}`);
        setImageState(prev => ({ 
          ...prev, 
          retryCount: newRetryCount,
          currentSrc: fallbackSrc,
          status: 'loading' 
        }));
        
        // Schedule retry with fallback
        setTimeout(() => {
          loadImage(fallbackSrc);
        }, retryDelay * newRetryCount);
        
      } else if (shouldRetry && !fallbackSrc) {
        console.log(`🔄 Retrying same source (${newRetryCount}/${maxRetries}): ${imageSrc}`);
        setImageState(prev => ({ 
          ...prev, 
          retryCount: newRetryCount,
          status: 'loading' 
        }));
        
        // Schedule retry with same source
        setTimeout(() => {
          loadImage(imageSrc);
        }, retryDelay * newRetryCount);
        
      } else {
        console.error(`💥 Image failed after ${maxRetries} attempts: ${imageSrc}`);
        setImageState(prev => ({ 
          ...prev, 
          status: 'failed', 
          hasError: true,
          errorMessage: `Failed after ${maxRetries} retries`
        }));
        if (onError) onError(new Error(`Failed after ${maxRetries} retries`));
      }
    };

    // Set up abort handling
    img.addEventListener('abort', () => {
      console.log(`🛑 Image loading aborted: ${imageSrc}`);
    });

    // Start loading with signal
    try {
      img.src = imageSrc;
    } catch (error) {
      cleanup();
      console.error(`💥 Error setting image src: ${imageSrc}`, error);
      setImageState(prev => ({ 
        ...prev, 
        status: 'failed', 
        hasError: true 
      }));
      if (onError) onError(error);
    }
  };

  // Load initial image
  useEffect(() => {
    loadImage(src);
    
    return cleanup;
  }, [src]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const renderContent = () => {
    switch (imageState.status) {
      case 'loading':
        return (
          <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        );
      
      case 'loaded':
        return (
          <img
            ref={imgRef}
            src={imageState.currentSrc}
            alt={alt}
            className={className}
            {...props}
          />
        );
      
      case 'error':
      case 'failed':
        return (
          <div className={`flex items-center justify-center bg-red-50 border border-red-200 ${className}`}>
            <div className="text-center p-4">
              <div className="w-8 h-8 bg-red-200 rounded mx-auto mb-2"></div>
              <p className="text-red-600 text-sm">
                {imageState.errorMessage || 'Failed to load'}
              </p>
              {imageState.retryCount > 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Tried {imageState.retryCount} time{imageState.retryCount > 1 ? 's' : ''}
                </p>
              )}
              {imageState.errorMessage === 'Invalid file reference' && (
                <p className="text-red-400 text-xs mt-2">
                  Please re-upload this photo
                </p>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return renderContent();
};

export default SmartImage;
