'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ExactFitPhotoFrame - Auto-fit photo frame component
 * 
 * Features:
 * - Dimension-agnostic auto-fit using CSS object-fit
 * - Photos use object-fit: cover (fill container)
 * - Borders use object-fit: contain (overlay without distortion)
 * - Responsive to any container size
 * - No aspect ratio calculations needed
 */

export default function ExactFitPhotoFrame({ 
  photoUrl, 
  src, // Support both prop names
  borderUrl, 
  maskUrl, // Support both prop names  
  maskData, // SVG path and polygon mask data
  className = '',
  alt = 'Photo',
  onLoad,
  onError,
  shadow = true,
  position = 'center'
}) {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Define final URLs from props
  const finalPhotoUrl = photoUrl || src;
  const finalMaskUrl = borderUrl || maskUrl;

  // Generate CSS mask style from SVG path
  const getMaskStyle = () => {
    if (!maskData?.svg_path) return {};
    
    // Create SVG data URL from path
    const svgContent = `
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="photo-mask">
            <rect width="100%" height="100%" fill="white"/>
            <path d="${maskData.svg_path}" fill="black"/>
          </mask>
        </defs>
      </svg>
    `;
    
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    
    return {
      maskImage: `url(${svgDataUrl})`,
      WebkitMaskImage: `url(${svgDataUrl})`,
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
    };
  };

  // Handle photo load
  const handlePhotoLoad = (e) => {
    setLoading(false);
    setImageError(false);
    if (onLoad) onLoad(e);
  };

  // Handle photo error
  const handlePhotoError = (e) => {
    setLoading(false);
    setImageError(true);
    if (onError) onError(e);
  };

  // Handle border load (don't block photo display)
  const handleBorderLoad = () => {
    // Border loaded successfully
  };

  const handleBorderError = () => {
    // Border failed to load but don't block photo
  };

  return (
    <div className={`exact-fit-photo-frame relative w-full h-full ${className}`} style={{ backgroundColor: 'transparent', overflow: 'visible' }}>
      {/* Inner container for photo - clips photo to container bounds */}
      <div className="absolute inset-0" style={{ overflow: 'hidden', zIndex: 1, borderRadius: 'inherit' }}>
        {/* Photo Layer - Uses object-fit: cover to fill container with optional masking */}
        {finalPhotoUrl && (
          <img
            src={finalPhotoUrl}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: position,
              filter: shadow ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none',
              backgroundColor: 'transparent',
              ...getMaskStyle(), // Apply CSS masking if maskData is provided
            }}
            onLoad={handlePhotoLoad}
            onError={handlePhotoError}
          />
        )}
      </div>
      
      {/* Border Overlay - Border stretches to fit placeholder + 5% extension on all sides */}
      {finalMaskUrl && (
        <img
          src={finalMaskUrl}
          alt="Border"
          className="absolute pointer-events-none"
          style={{ 
            position: 'absolute',
            // Border extends 5% beyond photo on all sides
            // Stretches automatically to match placeholder aspect ratio
            top: '-5%',
            left: '-5%',
            right: '-5%',
            bottom: '-5%',
            // Using calc for more explicit sizing
            width: 'calc(100% + 10%)',  // 5% + 100% + 5%
            height: 'calc(100% + 10%)', // 5% + 100% + 5%
            // CRITICAL: Override any global max-width constraints
            maxWidth: 'none',
            maxHeight: 'none',
            // FILL stretches border to fit dimensions (no aspect ratio preservation)
            objectFit: 'fill',
            objectPosition: 'center',
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            zIndex: 50,
          }}
          onLoad={handleBorderLoad}
          onError={handleBorderError}
        />
      )}
      
      {/* Loading state */}
      {loading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <span className="text-gray-400">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
