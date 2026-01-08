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
      // Get the assigned template with populated overlays
      const response = await api.get(`/api/weddings/${weddingId}/template-assignment`);
      
      if (response.data.assignment_id && response.data.template) {
        console.log('[TemplateVideoPlayer] Template assignment loaded:', response.data);
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
        readyState: e.target.readyState
      });
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

  // Calculate unified scale factor based on rendered video vs reference
  const unifiedScale = renderedVideoSize.width > 0 ? renderedVideoSize.width / referenceResolution.width : 1;

  // Convert pixel position to percentage
  const convertPositionToPercentage = (position) => {
    if (!position) return { x: 50, y: 50 };
    
    // If EITHER position value is greater than 100, treat as pixels and convert
    if (position.x > 100 || position.y > 100) {
      const converted = {
        x: (position.x / referenceResolution.width) * 100,
        y: (position.y / referenceResolution.height) * 100
      };
      return converted;
    }
    
    return { x: position.x, y: position.y };
  };

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
          {overlays.map((overlay, index) => {
            const position = overlay.position || { x: 50, y: 50 };
            const percentagePos = convertPositionToPercentage(position);
            const styling = overlay.styling || overlay.style || {};
            const dimensions_data = overlay.dimensions || {};
            
            // Scale all properties uniformly
            const baseFontSize = styling.font_size || 24;
            const scaledFontSize = baseFontSize * unifiedScale;
            const baseLetterSpacing = styling.letter_spacing || 0;
            const scaledLetterSpacing = baseLetterSpacing * unifiedScale;
            const stroke = styling.stroke || {};
            const baseStrokeWidth = stroke.width || 0;
            const scaledStrokeWidth = baseStrokeWidth * unifiedScale;
            
            // Get text box dimensions
            const boxWidthPercent = dimensions_data.width || null;
            const boxHeightPercent = dimensions_data.height || null;
            
            return (
              <div
                key={overlay.id || index}
                className="absolute"
                style={{
                  left: `${percentagePos.x}%`,
                  top: `${percentagePos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: boxWidthPercent ? `${boxWidthPercent}%` : 'auto',
                  height: boxHeightPercent ? `${boxHeightPercent}%` : 'auto',
                  maxWidth: boxWidthPercent ? `${boxWidthPercent}%` : '90%',
                  fontSize: `${scaledFontSize}px`,
                  fontFamily: styling.font_family || 'Arial',
                  color: styling.color || '#FFFFFF',
                  fontWeight: styling.font_weight || 'normal',
                  textAlign: styling.text_align || 'center',
                  letterSpacing: `${scaledLetterSpacing}px`,
                  lineHeight: styling.line_height || 1.2,
                  textShadow: styling.text_shadow || '2px 2px 4px rgba(0,0,0,0.8)',
                  WebkitTextStroke: stroke.enabled ? `${scaledStrokeWidth}px ${stroke.color || '#000000'}` : 'none',
                  zIndex: overlay.layer_index || 1,
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'normal',
                  hyphens: 'auto',
                  overflow: 'hidden',
                  display: 'block',
                  boxSizing: 'border-box',
                  margin: 0,
                  padding: 0
                }}
              >
                {overlay.text_value || overlay.text || overlay.placeholder_text || 'Sample Text'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
