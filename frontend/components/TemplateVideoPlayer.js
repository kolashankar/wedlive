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
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadTemplateAssignment();
  }, [weddingId]);

  const loadTemplateAssignment = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      // Get the assigned template with populated overlays
      const response = await api.get(`/api/weddings/${weddingId}/template-assignment`);
      
      if (response.data.assignment_id && response.data.template) {
        console.log('[TemplateVideoPlayer] Template assignment loaded:', response.data);
        console.log('[TemplateVideoPlayer] Video URL:', response.data.template.video_data?.original_url);
        console.log('[TemplateVideoPlayer] Overlays count:', response.data.populated_overlays?.length || 0);
        setTemplateData(response.data);
      } else {
        console.log('[TemplateVideoPlayer] No template assigned to this wedding');
        setTemplateData(null);
      }
    } catch (error) {
      console.error('[TemplateVideoPlayer] Failed to load template:', error);
      setError('Failed to load video template');
    } finally {
      setLoading(false);
    }
  };

  // Monitor video dimensions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
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

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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

  if (!videoUrl) {
    return null;
  }

  // Reference resolution for the template (default: 1920x1080)
  const referenceResolution = template.reference_resolution || { width: 1920, height: 1080 };

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
        className="w-full h-full object-contain"
        style={{
          backgroundColor: 'transparent',
          mixBlendMode: 'normal',
        }}
      />

      {/* Dynamic Overlays - Positioned relative to rendered video */}
      {overlays.length > 0 && renderedVideoSize.width > 0 && (
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
          {overlays.map((overlay, index) => (
            <ResponsiveTextOverlay
              key={overlay.id || index}
              overlay={overlay}
              currentTime={0} // Auto-play mode - always show
              duration={999}  // Effectively always visible
              containerSize={renderedVideoSize}
              referenceResolution={referenceResolution}
            />
          ))}
        </div>
      )}
    </div>
  );
}
