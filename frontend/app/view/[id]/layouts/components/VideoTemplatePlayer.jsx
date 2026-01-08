'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VideoTemplatePlayer({ videoTemplate, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [renderedVideoSize, setRenderedVideoSize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  console.log('VideoTemplatePlayer - videoTemplate:', videoTemplate);
  console.log('VideoTemplatePlayer - video_url:', videoTemplate?.video_url);
  console.log('VideoTemplatePlayer - overlays:', videoTemplate?.text_overlays);
  
  if (!videoTemplate || !videoTemplate.video_url) {
    console.log('VideoTemplatePlayer - returning null (no video template or URL)');
    return null;
  }

  const overlays = videoTemplate.text_overlays || [];
  // Default to 9:16 for wedding videos (portrait), fallback to 16:9
  const referenceResolution = videoTemplate.reference_resolution || { width: 1080, height: 1920 };

  /**
   * Calculate the actual rendered size of the video within its container
   * Accounts for object-fit: contain which may add letterboxing/pillarboxing
   * This is the KEY to proper overlay positioning on all screen sizes
   */
  const calculateRenderedVideoSize = () => {
    if (!containerSize.width || !containerSize.height || !videoSize.width || !videoSize.height) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

    const containerAspect = containerSize.width / containerSize.height;
    const videoAspect = videoSize.width / videoSize.height;

    let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;

    // object-fit: contain logic
    if (videoAspect > containerAspect) {
      // Video is wider - fit to width, add letterboxing top/bottom
      renderedWidth = containerSize.width;
      renderedHeight = containerSize.width / videoAspect;
      offsetY = (containerSize.height - renderedHeight) / 2;
    } else {
      // Video is taller - fit to height, add pillarboxing left/right
      renderedHeight = containerSize.height;
      renderedWidth = containerSize.height * videoAspect;
      offsetX = (containerSize.width - renderedWidth) / 2;
    }

    return { 
      width: renderedWidth, 
      height: renderedHeight, 
      offsetX, 
      offsetY 
    };
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      setVideoSize({ width, height });
      
      // Calculate and set dynamic aspect ratio
      if (width && height) {
        const ratio = width / height;
        setAspectRatio(ratio);
        console.log('Video aspect ratio:', ratio, `${width}x${height}`);
      }
    };

    const handleResize = () => {
      if (video && video.videoWidth && video.videoHeight) {
        const width = video.videoWidth;
        const height = video.videoHeight;
        setVideoSize({ width, height });
        const ratio = width / height;
        setAspectRatio(ratio);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('resize', handleResize);
    };
  }, []);

  // Monitor container size changes for responsive scaling
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size
    updateContainerSize();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Filter visible overlays based on current time - strict timing enforcement
  const visibleOverlays = overlays.filter(overlay => {
    const startTime = overlay.timing?.start_time ?? 0;
    const endTime = overlay.timing?.end_time ?? duration;
    
    // Strict timing check - overlay must be within its time range
    const isInTimeRange = currentTime >= startTime && currentTime <= endTime;
    const isActive = overlay.is_active !== false;
    
    return isInTimeRange && isActive;
  });

  // Sort by layer_index to render in correct order
  const sortedOverlays = [...visibleOverlays].sort((a, b) => 
    (a.layer_index || 0) - (b.layer_index || 0)
  );

  console.log('VideoTemplatePlayer - sortedOverlays:', sortedOverlays);

  // Calculate animation progress based on video time
  const getAnimationStyle = (overlay) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const entranceAnim = overlay.animation?.entrance || { type: 'fade-in', duration: 1, easing: 'ease-in-out' };
    const exitAnim = overlay.animation?.exit || { type: 'fade-out', duration: 1, easing: 'ease-in-out' };
    
    let opacity = 1;
    let transform = '';

    // Entrance animation - synced to video time
    if (currentTime < startTime + entranceAnim.duration) {
      const progress = Math.max(0, Math.min(1, (currentTime - startTime) / entranceAnim.duration));
      const animType = entranceAnim.type;
      
      switch (animType) {
        case 'fade-in':
          opacity = progress;
          break;
        case 'slide-up':
          opacity = progress;
          transform = `translateY(${(1 - progress) * 50}px)`;
          break;
        case 'slide-down':
          opacity = progress;
          transform = `translateY(${-(1 - progress) * 50}px)`;
          break;
        case 'slide-left':
          opacity = progress;
          transform = `translateX(${(1 - progress) * 50}px)`;
          break;
        case 'slide-right':
          opacity = progress;
          transform = `translateX(${-(1 - progress) * 50}px)`;
          break;
        case 'scale-up':
        case 'zoom-in':
          opacity = progress;
          const scale = 0.5 + (progress * 0.5);
          transform = `scale(${scale})`;
          break;
        case 'bounce-in':
          opacity = progress;
          const bounce = Math.abs(Math.sin(progress * Math.PI * 2)) * (1 - progress) * 10;
          transform = `translateY(${-bounce}px)`;
          break;
        case 'fade-slide-up':
          opacity = progress;
          transform = `translateY(${(1 - progress) * 40}px)`;
          break;
        case 'scale-fade':
          opacity = progress;
          const scaleFade = 0.3 + (progress * 0.7);
          transform = `scale(${scaleFade})`;
          break;
        default:
          opacity = progress;
      }
    }
    // Exit animation - synced to video time
    else if (currentTime > endTime - exitAnim.duration) {
      const progress = 1 - Math.max(0, Math.min(1, (currentTime - (endTime - exitAnim.duration)) / exitAnim.duration));
      const animType = exitAnim.type;
      
      switch (animType) {
        case 'fade-out':
          opacity = progress;
          break;
        case 'slide-up':
          opacity = progress;
          transform = `translateY(${-(1 - progress) * 50}px)`;
          break;
        case 'slide-down':
          opacity = progress;
          transform = `translateY(${(1 - progress) * 50}px)`;
          break;
        default:
          opacity = progress;
      }
    }

    return { opacity, transform };
  };

  // Calculate scale factor for responsive overlay sizing
  // This ensures overlays scale proportionally with video container
  const getOverlayScale = () => {
    if (!containerSize.width || !referenceResolution.width) return 1;
    
    // Calculate scale factor based on container width vs reference width
    const scale = containerSize.width / referenceResolution.width;
    
    console.log('Overlay scale:', scale, `container: ${containerSize.width}px, reference: ${referenceResolution.width}px`);
    
    // Return scale without minimum - let it scale naturally
    return scale;
  };
  
  const overlayScale = getOverlayScale();
  
  // Calculate responsive font scale to ensure text remains readable on all devices
  // This prevents text from becoming too small on mobile or too large on desktop
  const getResponsiveFontScale = () => {
    // Base scale on actual container width
    if (!containerSize.width) return 1;
    
    // Calculate base scale from container vs reference
    const baseScale = containerSize.width / referenceResolution.width;
    
    // For mobile devices (< 768px), ensure minimum readable size
    if (containerSize.width < 768) {
      // Use mobile-specific font size if available
      const mobileScale = Math.max(0.5, Math.min(1.0, baseScale));
      return mobileScale;
    }
    
    // For tablets (768px - 1024px), use proportional scaling with constraints
    if (containerSize.width < 1024) {
      return Math.max(0.7, Math.min(1.2, baseScale));
    }
    
    // For desktop, use natural scale with reasonable bounds
    return Math.max(0.8, Math.min(1.5, baseScale));
  };
  
  const fontScale = getResponsiveFontScale();

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* 
        Fixed aspect-ratio container locks video dimensions
        Uses actual video aspect ratio instead of hardcoded 16:9
        This ensures overlays scale correctly across all devices
      */}
      <div 
        className="relative w-full overflow-hidden" 
        style={{ 
          aspectRatio: aspectRatio || `${referenceResolution.width} / ${referenceResolution.height}`,
          backgroundColor: 'transparent',
          // Remove any flex/grid interference
          display: 'block',
          margin: 0,
          padding: 0
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoTemplate.video_url}
          poster={videoTemplate.thumbnail_url}
          className="w-full h-full"
          style={{ 
            backgroundColor: 'transparent',
            objectFit: 'contain',
            display: 'block'
          }}
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Text Overlays - Responsive positioning and sizing for all devices */}
        {sortedOverlays.length > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              zIndex: 10,
              // Use full container size - we'll scale individual elements
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {sortedOverlays.map((overlay, index) => {
              const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
              const styling = overlay.styling || {};
              const dimensions_data = overlay.dimensions || {};
              const animStyle = getAnimationStyle(overlay);
              
              // Convert positions to percentages for responsive layout
              let xPercent, yPercent;
              
              // Check if position is in pixels (values > 100 or explicit unit)
              if (position.unit === 'pixels' || position.x > 100 || position.y > 100) {
                // Convert pixels to percentage using reference resolution
                xPercent = (position.x / referenceResolution.width) * 100;
                yPercent = (position.y / referenceResolution.height) * 100;
              } else {
                // Already in percentage
                xPercent = position.x;
                yPercent = position.y;
              }
              
              // Get text box dimensions
              const boxWidthPercent = dimensions_data.width || null;
              const boxHeightPercent = dimensions_data.height || null;
              
              // Scale font size and spacing responsively
              const baseFontSize = styling.font_size || 48;
              const scaledFontSize = baseFontSize * fontScale;
              const fontFamily = styling.font_family || 'Playfair Display';
              const fontWeight = styling.font_weight || 'bold';
              const color = styling.color || '#ffffff';
              const textAlign = styling.text_align || 'center';
              const baseLetterSpacing = styling.letter_spacing || 2;
              const scaledLetterSpacing = baseLetterSpacing * fontScale;
              const lineHeight = styling.line_height || 1.2;
              const textShadow = styling.text_shadow || '0 2px 4px rgba(0,0,0,0.5)';
              
              // Handle stroke with scaled width
              const stroke = styling.stroke || {};
              const scaledStrokeWidth = stroke.width ? stroke.width * fontScale : 2 * fontScale;
              
              return (
                <div
                  key={overlay.id || index}
                  className="absolute"
                  style={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: `translate(-50%, -50%) ${animStyle.transform}`,
                    // Apply text box dimensions if defined
                    width: boxWidthPercent ? `${boxWidthPercent}%` : 'auto',
                    height: boxHeightPercent ? `${boxHeightPercent}%` : 'auto',
                    maxWidth: boxWidthPercent ? `${boxWidthPercent}%` : '90%',
                    minWidth: boxWidthPercent ? `${boxWidthPercent}%` : 'auto',
                    fontSize: `${scaledFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: color,
                    textAlign: textAlign,
                    letterSpacing: `${scaledLetterSpacing}px`,
                    lineHeight: lineHeight,
                    textShadow: textShadow,
                    opacity: animStyle.opacity,
                    zIndex: overlay.layer_index || 1,
                    transition: 'none', // No CSS transitions - animations synced to video time
                    WebkitTextStroke: stroke.enabled ? `${scaledStrokeWidth}px ${stroke.color || '#000000'}` : 'none',
                    willChange: 'opacity, transform', // Optimize rendering
                    // Ensure no padding/margin interference
                    margin: 0,
                    padding: 0,
                    // Enable automatic word wrapping with proper word boundaries
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'normal', // Changed from 'break-word' to preserve word boundaries
                    hyphens: 'auto', // Enable hyphenation for long words
                    // Vertical text overflow handling
                    overflow: 'hidden',
                    // Remove flex to prevent interference with text-align
                    display: 'block',
                    // Box sizing to include padding in width calculations
                    boxSizing: 'border-box'
                  }}
                >
                  {overlay.text_value || overlay.placeholder_text || 'Sample Text'}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Play/Pause Button Overlay - Only show when not playing */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all group z-20"
            style={{ zIndex: 20 }}
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" />
            </div>
          </button>
        )}
        
        {/* Invisible click area when playing */}
        {isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 z-20"
            style={{ zIndex: 20, backgroundColor: 'transparent' }}
            aria-label="Pause video"
          />
        )}
      </div>
    </div>
  );
}
