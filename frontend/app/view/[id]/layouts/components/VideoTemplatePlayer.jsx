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

  // Filter visible overlays based on current time
  const visibleOverlays = overlays.filter(overlay => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    return currentTime >= startTime && currentTime <= endTime && overlay.is_active !== false;
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
        
        {/* Text Overlays - Positioned with CSS percentages for proper scaling */}
        {sortedOverlays.length > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              zIndex: 10,
              // Scale entire overlay container to match video size
              transform: `scale(${overlayScale})`,
              transformOrigin: 'top left',
              // Ensure overlay container matches reference dimensions
              width: `${referenceResolution.width}px`,
              height: `${referenceResolution.height}px`,
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {sortedOverlays.map((overlay, index) => {
              const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
              const styling = overlay.styling || {};
              const animStyle = getAnimationStyle(overlay);
              
              // Convert pixel positions to absolute pixels if needed
              let xPixels, yPixels;
              
              // Check if position is in pixels (values > 100 or explicit unit)
              if (position.unit === 'pixels' || position.x > 100 || position.y > 100) {
                // Already in pixels
                xPixels = position.x;
                yPixels = position.y;
              } else {
                // Convert percentage to pixels using reference resolution
                xPixels = (position.x / 100) * referenceResolution.width;
                yPixels = (position.y / 100) * referenceResolution.height;
              }
              
              const baseFontSize = styling.font_size || 48;
              const fontFamily = styling.font_family || 'Playfair Display';
              const fontWeight = styling.font_weight || 'bold';
              const color = styling.color || '#ffffff';
              const textAlign = styling.text_align || 'center';
              const letterSpacing = styling.letter_spacing || 2;
              const lineHeight = styling.line_height || 1.2;
              const textShadow = styling.text_shadow || '0 2px 4px rgba(0,0,0,0.5)';
              
              // Handle stroke
              const stroke = styling.stroke || {};
              
              return (
                <div
                  key={overlay.id || index}
                  className="absolute whitespace-pre-wrap"
                  style={{
                    left: `${xPixels}px`,
                    top: `${yPixels}px`,
                    transform: `translate(-50%, -50%) ${animStyle.transform}`,
                    fontSize: `${baseFontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: color,
                    textAlign: textAlign,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight,
                    textShadow: textShadow,
                    opacity: animStyle.opacity,
                    maxWidth: `${referenceResolution.width * 0.9}px`,
                    zIndex: overlay.layer_index || 1,
                    transition: 'none', // No CSS transitions - animations synced to video time
                    WebkitTextStroke: stroke.enabled ? `${stroke.width || 2}px ${stroke.color || '#000000'}` : 'none',
                    willChange: 'opacity, transform', // Optimize rendering
                    // Ensure no padding/margin interference
                    margin: 0,
                    padding: 0
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
