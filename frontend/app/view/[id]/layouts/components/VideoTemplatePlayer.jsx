'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, AlertCircle, Loader2 } from 'lucide-react';
import ResponsiveTextOverlay from '@/components/video/ResponsiveTextOverlay';

export default function VideoTemplatePlayer({ videoTemplate, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [renderedVideoSize, setRenderedVideoSize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  console.log('[VideoTemplatePlayer] Rendering with:', {
    hasVideoTemplate: !!videoTemplate,
    video_url: videoTemplate?.video_url,
    overlaysCount: videoTemplate?.text_overlays?.length || 0,
    referenceResolution: videoTemplate?.reference_resolution
  });
  
  // Early return for invalid video template
  if (!videoTemplate || !videoTemplate.video_url) {
    console.log('[VideoTemplatePlayer] No video template or URL - rendering null');
    return null;
  }

  const overlays = videoTemplate.text_overlays || [];
  // Use reference resolution from template, with sensible defaults for portrait videos
  const referenceResolution = videoTemplate.reference_resolution || { width: 720, height: 1280 };
  // Calculate default aspect ratio from reference resolution
  const defaultAspectRatio = referenceResolution.width / referenceResolution.height;

  /**
   * Calculate the actual rendered size of the video within its container
   * Accounts for object-fit: contain which may add letterboxing/pillarboxing
   */
  const calculateRenderedVideoSize = useCallback(() => {
    const container = containerSize;
    const video = videoSize;
    
    // If container has no size, return zero
    if (!container.width || !container.height) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }
    
    // Use video dimensions if available, otherwise use reference resolution
    const effectiveVideoWidth = video.width || referenceResolution.width;
    const effectiveVideoHeight = video.height || referenceResolution.height;
    
    const containerAspect = container.width / container.height;
    const videoAspect = effectiveVideoWidth / effectiveVideoHeight;

    let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;

    // object-fit: contain logic
    if (videoAspect > containerAspect) {
      // Video is wider - fit to width, add letterboxing top/bottom
      renderedWidth = container.width;
      renderedHeight = container.width / videoAspect;
      offsetY = (container.height - renderedHeight) / 2;
    } else {
      // Video is taller - fit to height, add pillarboxing left/right
      renderedHeight = container.height;
      renderedWidth = container.height * videoAspect;
      offsetX = (container.width - renderedWidth) / 2;
    }

    return { 
      width: renderedWidth, 
      height: renderedHeight, 
      offsetX, 
      offsetY 
    };
  }, [containerSize, videoSize, referenceResolution]);

  // Update time using requestAnimationFrame for smooth overlay transitions
  const updateTimeFrame = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused && !video.ended) {
      setCurrentTime(video.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTimeFrame);
    }
  }, []);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('[VideoTemplatePlayer] Video load started');
      setIsLoading(true);
      setVideoError(null);
    };

    const handleLoadedData = () => {
      console.log('[VideoTemplatePlayer] Video data loaded');
      setIsLoading(false);
    };

    const handleLoadedMetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      setVideoSize({ width, height });
      setDuration(video.duration);
      setVideoLoaded(true);
      setIsLoading(false);
      
      // Calculate and set dynamic aspect ratio
      if (width && height) {
        const ratio = width / height;
        setAspectRatio(ratio);
        console.log('[VideoTemplatePlayer] Video metadata loaded:', {
          width, height, 
          aspectRatio: ratio.toFixed(3),
          duration: video.duration
        });
      }
    };

    const handleCanPlay = () => {
      console.log('[VideoTemplatePlayer] Video can play');
      setVideoLoaded(true);
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Start frame-by-frame time tracking
      animationFrameRef.current = requestAnimationFrame(updateTimeFrame);
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Stop frame tracking
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setCurrentTime(video.currentTime);
    };

    const handleTimeUpdate = () => {
      // Fallback for paused states
      if (video.paused || video.ended) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      video.currentTime = 0;
    };

    const handleError = (e) => {
      console.error('[VideoTemplatePlayer] Video error:', e);
      console.error('[VideoTemplatePlayer] Error details:', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src
      });
      setVideoError(`Failed to load video (networkState: ${video.networkState}, readyState: ${video.readyState})`);
      setIsLoading(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // If video is already loaded, trigger metadata handler
    if (video.readyState >= 1 && video.videoWidth > 0) {
      handleLoadedMetadata();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [updateTimeFrame, videoTemplate?.video_url]);

  // Monitor container size changes for responsive scaling
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
        console.log('[VideoTemplatePlayer] Container size updated:', { width: rect.width, height: rect.height });
      }
    };

    // Initial size
    updateContainerSize();

    // Use ResizeObserver for efficient updates
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize as backup
    window.addEventListener('resize', updateContainerSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // Recalculate rendered video size when container or video dimensions change
  useEffect(() => {
    const rendered = calculateRenderedVideoSize();
    setRenderedVideoSize(rendered);
    console.log('[VideoTemplatePlayer] Rendered video size calculated:', rendered);
  }, [containerSize, videoSize, calculateRenderedVideoSize]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(err => {
          console.error('[VideoTemplatePlayer] Play failed:', err);
          // Some browsers block autoplay - show play button
        });
      }
    }
  };

  // Filter visible overlays based on current time with epsilon tolerance
  const visibleOverlays = overlays.filter(overlay => {
    const startTime = overlay.timing?.start_time ?? 0;
    const endTime = overlay.timing?.end_time ?? duration;
    
    // Use epsilon for floating-point precision (~1 frame at 60fps)
    const epsilon = 0.016;
    const isInTimeRange = currentTime >= (startTime - epsilon) && currentTime <= (endTime + epsilon);
    const isActive = overlay.is_active !== false;
    
    return isInTimeRange && isActive;
  });

  // Sort by layer_index for correct z-order
  const sortedOverlays = [...visibleOverlays].sort((a, b) => 
    (a.layer_index || 0) - (b.layer_index || 0)
  );

  console.log('[VideoTemplatePlayer] Overlay state:', {
    totalOverlays: overlays.length,
    visibleOverlays: sortedOverlays.length,
    currentTime: currentTime.toFixed(3),
    duration: duration.toFixed(3),
    videoLoaded,
    renderedVideoSize
  });

  // Calculate animation style for overlay based on video time
  const getAnimationStyle = (overlay) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const entranceAnim = overlay.animation?.entrance || { type: 'fade-in', duration: 1, easing: 'ease-in-out' };
    const exitAnim = overlay.animation?.exit || { type: 'fade-out', duration: 1, easing: 'ease-in-out' };
    
    let opacity = 1;
    let transform = '';

    // Entrance animation
    if (currentTime < startTime + entranceAnim.duration) {
      const progress = Math.max(0, Math.min(1, (currentTime - startTime) / entranceAnim.duration));
      
      switch (entranceAnim.type) {
        case 'fade-in':
          opacity = progress;
          break;
        case 'slide-up':
          opacity = progress;
          transform = `translateY(${(1 - progress) * 10}%)`;
          break;
        case 'slide-down':
          opacity = progress;
          transform = `translateY(${-(1 - progress) * 10}%)`;
          break;
        case 'slide-left':
          opacity = progress;
          transform = `translateX(${(1 - progress) * 10}%)`;
          break;
        case 'slide-right':
          opacity = progress;
          transform = `translateX(${-(1 - progress) * 10}%)`;
          break;
        case 'scale-up':
        case 'zoom-in':
          opacity = progress;
          transform = `scale(${0.5 + (progress * 0.5)})`;
          break;
        case 'bounce-in':
          opacity = progress;
          const bounce = Math.abs(Math.sin(progress * Math.PI * 2)) * (1 - progress) * 2;
          transform = `translateY(${-bounce}%)`;
          break;
        case 'fade-slide-up':
          opacity = progress;
          transform = `translateY(${(1 - progress) * 8}%)`;
          break;
        default:
          opacity = progress;
      }
    }
    // Exit animation
    else if (currentTime > endTime - exitAnim.duration) {
      const progress = 1 - Math.max(0, Math.min(1, (currentTime - (endTime - exitAnim.duration)) / exitAnim.duration));
      
      switch (exitAnim.type) {
        case 'fade-out':
          opacity = progress;
          break;
        case 'slide-up':
          opacity = progress;
          transform = `translateY(${-(1 - progress) * 10}%)`;
          break;
        case 'slide-down':
          opacity = progress;
          transform = `translateY(${(1 - progress) * 10}%)`;
          break;
        default:
          opacity = progress;
      }
    }

    return { opacity, transform };
  };

  // Calculate effective size for overlay positioning
  // Use rendered video size if available, otherwise use container size with reference aspect ratio
  const effectiveContainerSize = renderedVideoSize.width > 0 
    ? renderedVideoSize 
    : containerSize.width > 0 
      ? {
          // Calculate based on container with proper aspect ratio
          width: Math.min(containerSize.width, containerSize.height * defaultAspectRatio),
          height: Math.min(containerSize.height, containerSize.width / defaultAspectRatio),
          offsetX: Math.max(0, (containerSize.width - Math.min(containerSize.width, containerSize.height * defaultAspectRatio)) / 2),
          offsetY: Math.max(0, (containerSize.height - Math.min(containerSize.height, containerSize.width / defaultAspectRatio)) / 2)
        }
      : { width: 0, height: 0, offsetX: 0, offsetY: 0 };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{
        // Use aspect ratio from video or reference resolution
        aspectRatio: aspectRatio || defaultAspectRatio,
        maxWidth: '100%',
        margin: '0 auto'
      }}
    >
      {/* Video Container with proper aspect ratio */}
      <div 
        className="relative w-full h-full overflow-hidden" 
        style={{ 
          backgroundColor: '#000',
          position: 'relative'
        }}
      >
        {/* Loading State */}
        {isLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <span className="text-white text-sm">Loading video...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
            <div className="flex flex-col items-center gap-2 text-white text-center p-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <span className="text-sm">{videoError}</span>
              <button 
                onClick={() => {
                  setVideoError(null);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="mt-2 px-4 py-2 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoTemplate.video_url}
          poster={videoTemplate.thumbnail_url}
          className="w-full h-full"
          style={{ 
            objectFit: 'contain',
            backgroundColor: 'transparent',
            display: 'block'
          }}
          loop
          playsInline
          preload="auto"
        />
        
        {/* Text Overlays Container - Positioned to match rendered video */}
        {effectiveContainerSize.width > 0 && (
          <div 
            className="absolute pointer-events-none" 
            style={{ 
              left: `${effectiveContainerSize.offsetX}px`,
              top: `${effectiveContainerSize.offsetY}px`,
              width: `${effectiveContainerSize.width}px`,
              height: `${effectiveContainerSize.height}px`,
              zIndex: 10,
              // Debug border - uncomment to visualize overlay container
              // border: '2px solid lime',
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
                  containerSize={effectiveContainerSize}
                  referenceResolution={referenceResolution}
                  animationState={animStyle}
                />
              );
            })}
          </div>
        )}
        
        {/* Play/Pause Button Overlay - Show when not playing and no error */}
        {!isPlaying && !videoError && !isLoading && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all group z-20"
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" />
            </div>
          </button>
        )}
        
        {/* Pause button - invisible but clickable when playing */}
        {isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 z-20"
            style={{ backgroundColor: 'transparent' }}
            aria-label="Pause video"
          />
        )}
      </div>
    </div>
  );
}
