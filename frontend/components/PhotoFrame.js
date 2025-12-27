'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PhotoFrame - Exact scaling & placement component for photos with borders
 * 
 * Features:
 * - Fixed aspect ratio wrapper (4:5, 1:1, or custom)
 * - Relative positioning with overflow hidden
 * - Absolute positioning for photo and border layers
 * - CSS masking support for irregular shapes
 * - Responsive scaling using CSS aspect-ratio
 * - Coordinated scaling of mask and border
 */

export default function PhotoFrame({ 
  photoUrl, 
  src, // Support both prop names
  borderUrl, 
  maskUrl, // Support both prop names  
  maskData, // SVG path and polygon mask data
  aspectRatio = '4:5', // Default aspect ratio
  width, // Optional exact width (e.g., 300)
  height, // Optional exact height (e.g., 400)
  className = '',
  alt = 'Photo',
  onLoad,
  onError,
  shadow = true,
  position = 'center'
}) {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const frameRef = useRef(null);

  // Define final URLs from props with fallback handling
  const finalPhotoUrl = photoUrl || src;
  const finalMaskUrl = borderUrl || maskUrl;

  // Normalize photo URL - handle multiple field name variations
  const normalizePhotoUrl = (url) => {
    if (!url) return null;
    
    // Handle empty strings and undefined
    if (typeof url !== 'string' || url.trim() === '') return null;
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      // Use config for consistent URL handling
      const CONFIG = require('@/lib/config').default;
      return `${CONFIG.API.BASE_URL}${url}`;
    }
    
    // Handle absolute URLs (Telegram CDN, etc.)
    return url;
  };

  const normalizedPhotoUrl = normalizePhotoUrl(finalPhotoUrl);
  const normalizedMaskUrl = normalizePhotoUrl(finalMaskUrl);

  // Convert aspect ratio to CSS value
  const getAspectRatioValue = (ratio) => {
    const ratioMap = {
      '4:5': '4/5',
      '1:1': '1/1',
      '16:9': '16/9',
      '3:4': '3/4',
      '2:3': '2/3'
    };
    return ratioMap[ratio] || ratio;
  };

  // Convert aspect ratio to CSS value or use exact dimensions - Enhanced for transparent overlay
  const getContainerStyle = () => {
    const baseStyle = {
      // CRITICAL: Allow border to extend beyond container (border is 3px larger)
      overflow: 'visible',
      position: 'relative',
      // Ensure container maintains exact dimensions
      minWidth: 0,
      minHeight: 0,
      // CRITICAL: Transparent background to allow layout background to show
      backgroundColor: 'transparent',
      // Prevent content from escaping (except border overlay)
      isolation: 'isolate',
      // Create stacking context for proper layering
      transform: 'translateZ(0)',
      // Enhanced container constraints for transparent overlay
      display: 'block',
      width: '100%',
      // Ensure proper aspect ratio behavior
      objectFit: 'contain',
    };

    // Use exact dimensions if provided (highest priority)
    if (width && height) {
      return {
        ...baseStyle,
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: '100%',
        // Maintain aspect ratio within constraints
        aspectRatio: `${width}/${height}`,
      };
    }

    // Fall back to aspect ratio with enhanced support
    const aspectRatioValue = getAspectRatioValue(aspectRatio);
    return {
      ...baseStyle,
      aspectRatio: aspectRatioValue,
      // Ensure container fills available space while maintaining ratio
      width: '100%',
      height: 'auto',
      // Prevent overflow in all directions
      maxHeight: '100vh',
    };
  };

  // Generate CSS mask style from SVG path or polygon points
  const getMaskStyle = () => {
    // Debug logging for mask data
    if (process.env.NODE_ENV === 'development' && maskData) {
      console.log('[PhotoFrame] Mask data:', {
        hasSvgPath: !!maskData.svg_path,
        hasPolygonPoints: maskData.polygon_points?.length || 0,
        featherRadius: maskData.feather_radius,
        innerArea: {
          x: maskData.inner_x,
          y: maskData.inner_y,
          width: maskData.inner_width,
          height: maskData.inner_height
        }
      });
    }
    
    if (!maskData?.svg_path && !maskData?.polygon_points) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PhotoFrame] No mask data available');
      }
      return {};
    }
    
    // Use SVG path if available (primary method) - Enhanced for irregular shapes
    if (maskData?.svg_path) {
      // Create enhanced SVG data URL with feathering support for irregular shapes
      const featherRadius = maskData.feather_radius || 0;
      const svgContent = `
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="photo-mask" maskUnits="objectBoundingBox">
              <rect width="100%" height="100%" fill="black"/>
              ${featherRadius > 0 ? `
                <filter id="feather">
                  <feGaussianBlur stdDeviation="${featherRadius / 100}"/>
                </filter>
                <path d="${maskData.svg_path}" fill="white" filter="url(#feather)"/>
              ` : `
                <path d="${maskData.svg_path}" fill="white"/>
              `}
            </mask>
          </defs>
        </svg>
      `;
      
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PhotoFrame] Applied enhanced SVG mask:', {
          pathLength: maskData.svg_path.length,
          featherRadius,
          innerArea: {
            x: maskData.inner_x,
            y: maskData.inner_y,
            width: maskData.inner_width,
            height: maskData.inner_height
          }
        });
      }
      
      return {
        maskImage: `url(${svgDataUrl})`,
        WebkitMaskImage: `url(${svgDataUrl})`,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskMode: 'alpha',
        WebkitMaskMode: 'alpha',
        // Enhanced mask properties for irregular shapes
        maskClip: 'border-box',
        WebkitMaskClip: 'border-box',
        maskOrigin: 'border-box',
        WebkitMaskOrigin: 'border-box',
      };
    }
    
    // Use polygon points as clip-path if SVG path not available (fallback method)
    if (maskData?.polygon_points && maskData.polygon_points.length > 0) {
      const polygonString = maskData.polygon_points
        .map(point => `${point.x}% ${point.y}%`)
        .join(', ');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PhotoFrame] Applied polygon clip-path with points:', maskData.polygon_points.length);
      }
      
      return {
        clipPath: `polygon(${polygonString})`,
        WebkitClipPath: `polygon(${polygonString})`,
      };
    }
    
    return {};
  };

  // Handle photo load
  const handlePhotoLoad = (e) => {
    setLoading(false);
    setImageError(false);
    if (onLoad) onLoad(e);
  };

  // Handle photo error with better logging
  const handlePhotoError = (e) => {
    setLoading(false);
    setImageError(true);
    
    // Enhanced error logging for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[PhotoFrame] Photo failed to load:', {
        url: normalizedPhotoUrl,
        originalUrl: finalPhotoUrl,
        error: e,
        alt: alt
      });
    }
    
    if (onError) onError(e);
  };

  // Handle border load with logging
  const handleBorderLoad = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PhotoFrame] Border loaded successfully:', normalizedMaskUrl);
    }
    // Border loaded successfully
  };

  // Handle border error with logging
  const handleBorderError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PhotoFrame] Border failed to load:', normalizedMaskUrl);
    }
    // Border failed to load but don't block photo
  };

  return (
    <div 
      ref={frameRef}
      className={`photo-frame relative w-full ${className}`}
      style={getContainerStyle()}
    >
      {/* Photo Layer - BACKGROUND (z-index: 1) - fills container */}
      {normalizedPhotoUrl && (
        <div 
          className="absolute inset-0" 
          style={{ 
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <img
            src={normalizedPhotoUrl}
            alt={alt}
            className="w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: position,
              display: 'block',
            }}
            onLoad={handlePhotoLoad}
            onError={handlePhotoError}
          />
        </div>
      )}
      
      {/* Border Layer - FOREGROUND overlay (z-index: 10) - Transparent PNG */}
      {normalizedMaskUrl && (
        <img
          src={normalizedMaskUrl}
          alt="Border"
          className="absolute pointer-events-none"
          style={{ 
            position: 'absolute',
            // Border extends 3px beyond container
            top: '-3px',
            left: '-3px',
            right: '-3px',
            bottom: '-3px',
            width: 'calc(100% + 6px)',
            height: 'calc(100% + 6px)',
            // CRITICAL: Higher z-index to be on top
            zIndex: 10,
            // Use contain to preserve aspect ratio without distortion
            objectFit: 'contain',
            objectPosition: 'center',
            pointerEvents: 'none',
            // NO backgrounds - pure transparent overlay
            background: 'none',
            backgroundColor: 'transparent',
            mixBlendMode: 'normal',
            display: 'block',
          }}
          onLoad={handleBorderLoad}
          onError={handleBorderError}
        />
      )}
      
      {/* Loading state */}
      {loading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-10 p-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-gray-400 text-sm">Photo unavailable</span>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-gray-500">
                <p>URL: {normalizedPhotoUrl}</p>
                <p>Check console for details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
