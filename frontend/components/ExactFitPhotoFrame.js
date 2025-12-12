'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ExactFitPhotoFrame - Renders photos with exact-fit inside borders
 * 
 * Features:
 * - Automatic aspect ratio detection from border
 * - Photo cropping/scaling to fit exactly without distortion
 * - CSS masking/clipping for exact fit
 * - Soft edges and natural blending
 * - Support for various border shapes
 */

export default function ExactFitPhotoFrame({ 
  photoUrl, 
  borderUrl, 
  aspectRatio = '1:1',
  className = '',
  alt = 'Photo',
  onLoad,
  onError,
  feather = 0,
  shadow = true,
  scale = 1.1,
  position = 'center'
}) {
  const [loading, setLoading] = useState(true);
  const [borderDimensions, setBorderDimensions] = useState({ width: 0, height: 0 });
  const [photoDimensions, setPhotoDimensions] = useState({ width: 0, height: 0 });
  const [maskUrl, setMaskUrl] = useState(null);
  const containerRef = useRef(null);
  const borderImgRef = useRef(null);
  const photoImgRef = useRef(null);

  // Calculate aspect ratio as decimal
  const getAspectRatioDecimal = (ratio) => {
    if (typeof ratio === 'number') return ratio;
    if (typeof ratio === 'string') {
      const [w, h] = ratio.split(':').map(Number);
      return w && h ? w / h : 1;
    }
    return 1;
  };

  // Generate mask from border image
  const generateMask = async (borderImg) => {
    if (!borderImg) return null;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = borderImg.width;
      canvas.height = borderImg.height;
      
      // Draw border image
      ctx.drawImage(borderImg, 0, 0);
      
      // Get image data and create mask
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Create mask by detecting transparent areas
      for (let i = 0; i < data.length; i += 4) {
        // If pixel is not transparent (alpha > 0), make it white in mask
        // If transparent, make it black
        const alpha = data[i + 3];
        if (alpha > 0) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G  
          data[i + 2] = 255; // B
          data[i + 3] = 255; // A
        } else {
          data[i] = 0;       // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0;   // B
          data[i + 3] = 255; // A
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Apply feather effect if specified
      if (feather > 0) {
        ctx.filter = `blur(${feather}px)`;
        ctx.drawImage(canvas, 0, 0);
      }
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating mask:', error);
      return null;
    }
  };

  // Calculate photo dimensions to fit exactly in border
  const calculatePhotoDimensions = () => {
    if (!borderDimensions.width || !borderDimensions.height) return;
    
    const aspectRatioDecimal = getAspectRatioDecimal(aspectRatio);
    const borderAspect = borderDimensions.width / borderDimensions.height;
    
    let photoWidth, photoHeight;
    
    if (aspectRatioDecimal > borderAspect) {
      // Photo is wider than border - fit to width
      photoWidth = borderDimensions.width * scale;
      photoHeight = photoWidth / aspectRatioDecimal;
    } else {
      // Photo is taller than border - fit to height  
      photoHeight = borderDimensions.height * scale;
      photoWidth = photoHeight * aspectRatioDecimal;
    }
    
    setPhotoDimensions({ width: photoWidth, height: photoHeight });
  };

  // Handle border image load
  const handleBorderLoad = async (e) => {
    const img = e.target;
    setBorderDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    
    // Generate mask
    const mask = await generateMask(img);
    setMaskUrl(mask);
    
    setLoading(false);
  };

  // Handle photo image load
  const handlePhotoLoad = (e) => {
    if (onLoad) onLoad(e);
  };

  // Handle photo error
  const handlePhotoError = (e) => {
    if (onError) onError(e);
    setLoading(false);
  };

  // Recalculate when aspect ratio or border dimensions change
  useEffect(() => {
    calculatePhotoDimensions();
  }, [aspectRatio, borderDimensions, scale]);

  // Calculate positioning for photo
  const getPhotoPosition = () => {
    if (!photoDimensions.width || !borderDimensions.width) return {};
    
    const offsetX = (photoDimensions.width - borderDimensions.width) / 2;
    const offsetY = (photoDimensions.height - borderDimensions.height) / 2;
    
    let left = -offsetX;
    let top = -offsetY;
    
    if (position === 'top') {
      top = 0;
    } else if (position === 'bottom') {
      top = -(photoDimensions.height - borderDimensions.height);
    } else if (position === 'left') {
      left = 0;
    } else if (position === 'right') {
      left = -(photoDimensions.width - borderDimensions.width);
    }
    
    return { left, top };
  };

  const photoPosition = getPhotoPosition();

  const photoStyle = {
    width: `${photoDimensions.width}px`,
    height: `${photoDimensions.height}px`,
    objectFit: 'cover',
    objectPosition: position,
    maskImage: maskUrl ? `url(${maskUrl})` : undefined,
    WebkitMaskImage: maskUrl ? `url(${maskUrl})` : undefined,
    filter: shadow ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none',
    ...photoPosition
  };

  const containerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div 
      ref={containerRef}
      className={`exact-fit-photo-frame ${className}`}
      style={containerStyle}
    >
      {/* Border Image (as background) */}
      {borderUrl && (
        <img
          ref={borderImgRef}
          src={borderUrl}
          alt="Border frame"
          className="absolute inset-0 w-full h-full object-contain z-10"
          onLoad={handleBorderLoad}
          onError={() => setLoading(false)}
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Photo with exact fit */}
      {photoUrl && !loading && (
        <img
          ref={photoImgRef}
          src={photoUrl}
          alt={alt}
          className="absolute z-0"
          style={photoStyle}
          onLoad={handlePhotoLoad}
          onError={handlePhotoError}
        />
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* CSS for mask blending */}
      <style jsx>{`
        .exact-fit-photo-frame img {
          transition: all 0.3s ease;
        }
        
        .exact-fit-photo-frame:hover img.z-0 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
