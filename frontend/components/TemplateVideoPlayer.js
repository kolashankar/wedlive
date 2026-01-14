'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import ResponsiveTextOverlay from '@/components/video/ResponsiveTextOverlay';

/**
 * TemplateVideoPlayer - Renders assigned video template with overlays
 * 
 * SECTION 1 FIXED TEMPLATE MODE:
 * - Auto-plays and loops continuously
 * - No controls, play button, or progress bar
 * - Transparent background to show layout background
 * - Overlays always visible with wedding data
 * - Behaves like an animated design template, not a video player
 * - MOBILE RESPONSIVE: Overlays scale proportionally based on actual rendered video size
 */
export default function TemplateVideoPlayer({ weddingId, className = '' }) {
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [renderedVideoSize, setRenderedVideoSize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadTemplateAssignment();
  }, [weddingId]);

  const loadTemplateAssignment = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // FIXED: Use public viewer endpoint instead of authenticated endpoint
      // This endpoint returns video_template with populated overlays without requiring auth
      const response = await api.get(`/api/viewer/wedding/${weddingId}/all`);
      
      const videoTemplate = response.data.video_template;
      
      if (videoTemplate && videoTemplate.id) {
        console.log('[TemplateVideoPlayer] ========== VIDEO TEMPLATE DEBUG ==========');
        console.log('[TemplateVideoPlayer] Video template loaded from viewer endpoint:', videoTemplate);
        console.log('[TemplateVideoPlayer] Video URL:', videoTemplate.video_url);
        console.log('[TemplateVideoPlayer] Overlays count:', videoTemplate.text_overlays?.length || 0);
        
        // CRITICAL DEBUG: Log each overlay to verify text data
        if (videoTemplate.text_overlays && videoTemplate.text_overlays.length > 0) {
          console.log('[TemplateVideoPlayer] ========== OVERLAY DEBUG ==========');
          videoTemplate.text_overlays.forEach((overlay, idx) => {
            console.log(`[TemplateVideoPlayer] Overlay ${idx}:`, {
              id: overlay.id,
              label: overlay.label,
              text: overlay.text,
              text_value: overlay.text_value,
              position: overlay.position,
              timing: overlay.timing,
              hasText: !!(overlay.text || overlay.text_value)
            });
          });
        } else {
          console.warn('[TemplateVideoPlayer] ⚠️ NO OVERLAYS FOUND IN RESPONSE!');
        }
        
        // Map the data structure to match what the component expects
        // The viewer endpoint returns: { video_template: { id, name, video_url, text_overlays, reference_resolution } }
        // Component expects: { template: { video_data: { original_url }, reference_resolution }, populated_overlays: [] }
        const mappedData = {
          assignment_id: videoTemplate.id,
          template: {
            id: videoTemplate.id,
            name: videoTemplate.name,
            video_data: {
              original_url: videoTemplate.video_url,
              width: videoTemplate.resolution ? parseInt(videoTemplate.resolution.split('x')[0]) : null,
              height: videoTemplate.resolution ? parseInt(videoTemplate.resolution.split('x')[1]) : null
            },
            reference_resolution: videoTemplate.reference_resolution || (videoTemplate.resolution ? {
              width: parseInt(videoTemplate.resolution.split('x')[0]),
              height: parseInt(videoTemplate.resolution.split('x')[1])
            } : { width: 720, height: 1280 }),
            duration: videoTemplate.duration || 0 // Store template duration from API
          },
          populated_overlays: videoTemplate.text_overlays || []
        };
        
        console.log('[TemplateVideoPlayer] Mapped data:', {
          hasTemplate: !!mappedData.template,
          overlaysCount: mappedData.populated_overlays.length,
          firstOverlay: mappedData.populated_overlays[0]
        });
        
        setTemplateData(mappedData);
      } else {
        console.log('[TemplateVideoPlayer] No template assigned to this wedding');
        setTemplateData(null);
      }
    } catch (error) {
      console.error('[TemplateVideoPlayer] Failed to load template:', error);
      console.error('[TemplateVideoPlayer] Error details:', error.response?.data || error.message);
      setError('Failed to load video template');
    } finally {
      setLoading(false);
    }
  };

  // Monitor video dimensions and time updates with frame-perfect sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId = null;
    
    // Use requestAnimationFrame for smooth, frame-synced overlay updates
    const updateTimeFromVideoFrame = () => {
      if (video && !video.paused && !video.ended) {
        setCurrentTime(video.currentTime);
        animationFrameId = requestAnimationFrame(updateTimeFromVideoFrame);
      }
    };

    const handlePlay = () => {
      animationFrameId = requestAnimationFrame(updateTimeFromVideoFrame);
    };

    const handlePause = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
      setDuration(video.duration);
      console.log('[TemplateVideoPlayer] Video metadata loaded:', {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
    };

    const handleTimeUpdate = () => {
      // Fallback time update for when video is paused or seeking
      if (video.paused || video.ended) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleError = (e) => {
      console.error('[TemplateVideoPlayer] Video load error:', e);
      console.error('[TemplateVideoPlayer] Error details:', {
        error: e.target.error,
        networkState: e.target.networkState,
        readyState: e.target.readyState,
        currentSrc: e.target.currentSrc,
        src: e.target.src
      });
      
      // Set error state to show user-friendly message
      setError('Video failed to load. The video file may be unavailable or the URL is invalid.');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    // Start frame tracking if video is already playing
    if (!video.paused && !video.ended) {
      animationFrameId = requestAnimationFrame(updateTimeFromVideoFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [templateData]);

  // Monitor container size changes
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

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate actual rendered video size (accounts for object-fit: contain)
  useEffect(() => {
    if (!containerSize.width || !containerSize.height || !videoSize.width || !videoSize.height) {
      return;
    }

    const containerAspect = containerSize.width / containerSize.height;
    const videoAspect = videoSize.width / videoSize.height;

    let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;

    if (videoAspect > containerAspect) {
      // Video is wider - fit to width
      renderedWidth = containerSize.width;
      renderedHeight = containerSize.width / videoAspect;
      offsetY = (containerSize.height - renderedHeight) / 2;
    } else {
      // Video is taller - fit to height
      renderedHeight = containerSize.height;
      renderedWidth = containerSize.height * videoAspect;
      offsetX = (containerSize.width - renderedWidth) / 2;
    }

    setRenderedVideoSize({ width: renderedWidth, height: renderedHeight, offsetX, offsetY });
  }, [containerSize, videoSize]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 opacity-50" />
      </div>
    );
  }

  if (error || !templateData || !templateData.template) {
    return null;
  }

  const template = templateData.template;
  const overlays = templateData.populated_overlays || [];
  const videoUrl = template.video_data?.original_url;
  const templateDuration = template.duration || 0; // Get template duration from API

  if (!videoUrl) {
    return null;
  }

  // Reference resolution for the template
  const referenceResolution = template.reference_resolution || 
    (template.video_data?.width && template.video_data?.height 
      ? { width: template.video_data.width, height: template.video_data.height }
      : { width: 1920, height: 1080 });

  // DEBUG: Log critical rendering state
  console.log('[TemplateVideoPlayer] Render state:', {
    overlaysCount: overlays.length,
    renderedVideoSize,
    videoSize,
    containerSize,
    currentTime,
    duration,
    canRenderOverlays: overlays.length > 0 && renderedVideoSize.width > 0
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Video Player - Auto-play, Loop, No Controls */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-contain"
        style={{
          backgroundColor: 'transparent',
          mixBlendMode: 'normal',
        }}
        onError={(e) => {
          console.error('[TemplateVideoPlayer] Video element error:', {
            videoUrl,
            error: e.currentTarget.error,
            networkState: e.currentTarget.networkState
          });
        }}
        onLoadStart={() => {
          console.log('[TemplateVideoPlayer] Video load started:', videoUrl);
        }}
        onCanPlay={() => {
          console.log('[TemplateVideoPlayer] Video can play');
        }}
      />

      {/* Dynamic Overlays - Positioned relative to rendered video */}
      {overlays.length > 0 && (
        renderedVideoSize.width > 0 ? (
          // Normal rendering with calculated video size
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
            {overlays.map((overlay, index) => {
              console.log('[TemplateVideoPlayer] Rendering overlay:', {
                id: overlay.id,
                text_value: overlay.text_value,
                position: overlay.position,
                timing: overlay.timing,
                currentTime,
                duration
              });
              
              return (
                <ResponsiveTextOverlay
                  key={overlay.id || index}
                  overlay={overlay}
                  currentTime={currentTime}
                  duration={duration}
                  containerSize={renderedVideoSize}
                  referenceResolution={referenceResolution}
                  templateDuration={templateDuration}
                />
              );
            })}
          </div>
        ) : (
          // Fallback: render overlays using full container size if video size not calculated yet
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              position: 'absolute',
              zIndex: 10,
              width: '100%',
              height: '100%'
            }}
          >
            {overlays.map((overlay, index) => {
              console.log('[TemplateVideoPlayer] Rendering overlay (fallback mode):', {
                id: overlay.id,
                text_value: overlay.text_value,
                currentTime,
                duration
              });
              
              // Use container size as fallback
              const fallbackSize = {
                width: containerSize.width || 720,
                height: containerSize.height || 1280,
                offsetX: 0,
                offsetY: 0
              };
              
              return (
                <ResponsiveTextOverlay
                  key={overlay.id || index}
                  overlay={overlay}
                  currentTime={currentTime}
                  duration={duration}
                  containerSize={fallbackSize}
                  referenceResolution={referenceResolution}
                  templateDuration={templateDuration}
                />
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
