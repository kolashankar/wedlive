'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import ResponsiveTextOverlay from '@/components/video/ResponsiveTextOverlay';

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

    const handleError = (e) => {
      console.error('[VideoTemplatePlayer] Video load error:', e);
      console.error('[VideoTemplatePlayer] Video URL:', videoTemplate?.video_url);
      console.error('[VideoTemplatePlayer] Error details:', {
        error: e.target.error,
        networkState: e.target.networkState,
        readyState: e.target.readyState
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('resize', handleResize);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('resize', handleResize);
      video.removeEventListener('error', handleError);
    };
  }, [videoTemplate]);

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

  // Recalculate rendered video size when container or video dimensions change
  useEffect(() => {
    const rendered = calculateRenderedVideoSize();
    setRenderedVideoSize(rendered);
    console.log('Rendered video size:', rendered);
  }, [containerSize, videoSize]);

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

  // Calculate animation style for overlay based on video time
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
        
        {/* Text Overlays - Positioned relative to ACTUAL rendered video, not container */}
        {sortedOverlays.length > 0 && renderedVideoSize.width > 0 && (
          <div 
            className="absolute pointer-events-none" 
            style={{ 
              // Position overlay container to match the rendered video exactly
              left: `${renderedVideoSize.offsetX}px`,
              top: `${renderedVideoSize.offsetY}px`,
              width: `${renderedVideoSize.width}px`,
              height: `${renderedVideoSize.height}px`,
              position: 'absolute',
              zIndex: 10
            }}
          >
            {sortedOverlays.map((overlay, index) => {
              const animStyle = getAnimationStyle(overlay);
              
              return (
                <ResponsiveTextOverlay
                  key={overlay.id || index}
                  overlay={overlay}
                  currentTime={currentTime}
                  duration={duration}
                  containerSize={renderedVideoSize}
                  referenceResolution={referenceResolution}
                  animationState={animStyle}
                />
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
