'use client';
import { useState, useEffect } from 'react';
import CONFIG from '@/lib/config';

/**
 * TelegramImageLoader Component
 * Handles loading Telegram images with retry logic and error handling
 * Uses backend proxy to avoid CORS issues and NS_BINDING_ABORTED errors
 */
export default function TelegramImageLoader({ 
  telegramUrl, 
  alt = 'Image', 
  className = '', 
  fallbackComponent = null,
  maxRetries = 3,
  retryDelay = 1000,
  onLoad = null,
  onError = null
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Helper function to convert Telegram URL to proxy URL
  const getProxyUrl = (url) => {
    if (!url) return null;
    
    const apiUrl = CONFIG.API.BASE_URL;
    
    // If it's already a proxy URL, return as-is
    if (url.includes('/api/media/telegram-proxy/')) {
      return url;
    }
    
    // If it's a Telegram URL, proxy it through our backend
    if (url.includes('api.telegram.org/file/')) {
      // Extract the file path from Telegram URL
      const pathMatch = url.match(/\/file\/bot[^\/]+\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        // Use our backend as a proxy
        return `${apiUrl}/api/media/telegram-proxy/${pathMatch[1]}`;
      }
    }
    
    return url;
  };

  const loadImage = async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const proxyUrl = getProxyUrl(telegramUrl);
      if (!proxyUrl) {
        throw new Error('Invalid image URL');
      }
      
      // Create a new image to test loading
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000); // 10 second timeout
        
        img.onload = () => {
          clearTimeout(timeout);
          setImageUrl(proxyUrl);
          setLoading(false);
          setError(null);
          setRetryCount(0);
          if (onLoad) onLoad(proxyUrl);
          resolve(proxyUrl);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          const errorMsg = `Failed to load image (attempt ${attempt})`;
          
          if (attempt < maxRetries) {
            console.log(`Retrying image load, attempt ${attempt + 1}/${maxRetries}`);
            setTimeout(() => {
              loadImage(attempt + 1);
            }, retryDelay * attempt); // Exponential backoff
          } else {
            setError(errorMsg);
            setLoading(false);
            setImageUrl(null);
            if (onError) onError(errorMsg);
            reject(errorMsg);
          }
        };
        
        // Start loading the image
        img.src = proxyUrl;
      });
      
    } catch (err) {
      console.error('Error in loadImage:', err);
      setError(err.message);
      setLoading(false);
      setImageUrl(null);
      if (onError) onError(err.message);
    }
  };

  useEffect(() => {
    if (telegramUrl) {
      loadImage();
    }
  }, [telegramUrl]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        <span className="ml-2 text-sm text-gray-500">Loading image...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="text-red-500 text-sm mb-2">Failed to load image</div>
        <button
          onClick={() => loadImage(1)}
          className="px-3 py-1 bg-rose-500 text-white text-sm rounded hover:bg-rose-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Success state
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={() => {
        if (onLoad) onLoad(imageUrl);
      }}
      onError={() => {
        console.error('Image failed to render in DOM');
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          loadImage(retryCount + 1);
        }
      }}
    />
  );
}
