'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';
import ResponsiveTextOverlay from '@/components/video/ResponsiveTextOverlay';

/**
 * VideoTemplatePlayerV2 - Enhanced video template player with fully responsive text overlays
 * 
 * RESPONSIVE DESIGN PRINCIPLES:
 * 1. Text overlays scale proportionally based on rendered video size
 * 2. All dimensions are percentage-based relative to video, not viewport
 * 3. Single unified scaling factor ensures consistent appearance
 * 4. Text wrapping is automatic and respects box constraints
 * 5. Behavior is identical across all screen sizes and devices
 */

export default function VideoTemplatePlayerV2({ videoTemplate, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [renderedVideoSize, setRenderedVideoSize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [aspectRatio, setAspectRatio] = useState(null);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // Reference resolution - default for wedding videos
  const referenceResolution = videoTemplate?.reference_resolution || { width: 1080, height: 1920 };
  const overlays = videoTemplate?.text_overlays || [];

  /**
   * Calculate actual rendered video dimensions
   * Accounts for object-fit: contain which may add letterboxing/pillarboxing
   */
  const calculateRenderedVideoSize = useCallback(() => {
    if (!containerSize.width || !containerSize.height || !videoSize.width || !videoSize.height) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

    const containerAspect = containerSize.width / containerSize.height;
    const videoAspect = videoSize.width / videoSize.height;

    let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;

    if (videoAspect > containerAspect) {
      // Video is wider - fit to width, add letterboxing
      renderedWidth = containerSize.width;
      renderedHeight = containerSize.width / videoAspect;
      offsetY = (containerSize.height - renderedHeight) / 2;
    } else {
      // Video is taller - fit to height, add pillarboxing
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
  }, [containerSize, videoSize]);

  // Monitor video metadata and dimensions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      setVideoSize({ width, height });
      
      if (width && height) {
        const ratio = width / height;
        setAspectRatio(ratio);
        console.log('[VideoTemplatePlayerV2] Video loaded:', { width, height, ratio });
      }
    };

    const handleError = (e) => {
      console.error('[VideoTemplatePlayerV2] Video error:', {
        error: e.target.error,
        networkState: e.target.networkState,
        readyState: e.target.readyState,
        src: e.target.src
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [videoTemplate]);

  // Monitor container size changes (responsive)
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();

    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Recalculate rendered video size when dimensions change
  useEffect(() => {
    const rendered = calculateRenderedVideoSize();
    setRenderedVideoSize(rendered);
    console.log('[VideoTemplatePlayerV2] Rendered video size:', rendered);
  }, [calculateRenderedVideoSize]);

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

  if (!videoTemplate || !videoTemplate.video_url) {
    console.log('[VideoTemplatePlayerV2] No video template or URL');
    return null;
  }

  // Sort overlays by layer index
  const sortedOverlays = [...overlays].sort((a, b) => 
    (a.layer_index || 0) - (b.layer_index || 0)
  );

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div 
        className="relative w-full overflow-hidden" 
        style={{ 
          aspectRatio: aspectRatio || `${referenceResolution.width} / ${referenceResolution.height}`,
          backgroundColor: 'transparent',
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
        
        {/* Text Overlays Container - Positioned over rendered video */}
        {sortedOverlays.length > 0 && renderedVideoSize.width > 0 && (
          <div 
            className="absolute pointer-events-none" 
            style={{ 
              left: `${renderedVideoSize.offsetX}px`,
              top: `${renderedVideoSize.offsetY}px`,
              width: `${renderedVideoSize.width}px`,
              height: `${renderedVideoSize.height}px`,
              position: 'absolute',
              zIndex: 10
            }}
          >
            {sortedOverlays.map((overlay, index) => (
              <ResponsiveTextOverlay
                key={overlay.id || index}
                overlay={overlay}
                currentTime={currentTime}
                duration={duration}
                containerSize={renderedVideoSize}
                referenceResolution={referenceResolution}
              />
            ))}
          </div>
        )}
        
        {/* Play/Pause Button */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all group z-20"
            aria-label="Play video"
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" />
            </div>
          </button>
        )}
        
        {/* Pause overlay (invisible) */}
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
