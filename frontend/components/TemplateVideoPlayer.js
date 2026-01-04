'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

/**
 * TemplateVideoPlayer - Renders assigned video template with overlays
 * 
 * SECTION 1 FIXED TEMPLATE MODE:
 * - Auto-plays and loops continuously
 * - No controls, play button, or progress bar
 * - Transparent background to show layout background
 * - Overlays always visible with wedding data
 * - Behaves like an animated design template, not a video player
 */
export default function TemplateVideoPlayer({ weddingId, className = '' }) {
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 opacity-50" />
      </div>
    );
  }

  if (error || !templateData || !templateData.template) {
    return null; // Don't show anything if no template is assigned
  }

  const template = templateData.template;
  const overlays = templateData.populated_overlays || [];
  const videoUrl = template.video_data?.original_url;

  if (!videoUrl) {
    return null;
  }

  // Convert pixel position to percentage
  // Video standard canvas is 1920x1080
  const convertPositionToPercentage = (position) => {
    if (!position) return { x: 50, y: 50 };
    
    const CANVAS_WIDTH = 1920;
    const CANVAS_HEIGHT = 1080;
    
    // If EITHER position value is greater than 100, treat as pixels and convert
    // This handles the case where coordinates are stored in pixels (e.g., x: 960, y: 336)
    if (position.x > 100 || position.y > 100) {
      const converted = {
        x: (position.x / CANVAS_WIDTH) * 100,
        y: (position.y / CANVAS_HEIGHT) * 100
      };
      console.log('[TemplateVideoPlayer] Converted position from pixels to percentage:', position, '->', converted);
      return converted;
    }
    
    // Already in percentage format
    return { x: position.x, y: position.y };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Video Player - Auto-play, Loop, No Controls */}
      <video
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
        onError={(e) => {
          console.error('[TemplateVideoPlayer] Video load error:', e);
        }}
      />

      {/* Dynamic Overlays - Always Visible */}
      {overlays.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {overlays.map((overlay, index) => {
            const position = overlay.position || { x: 50, y: 50 };
            const percentagePos = convertPositionToPercentage(position);
            const styling = overlay.styling || overlay.style || {};
            
            return (
              <div
                key={overlay.id || index}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${percentagePos.x}%`,
                  top: `${percentagePos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${styling.font_size || 24}px`,
                  fontFamily: styling.font_family || 'Arial',
                  color: styling.color || '#FFFFFF',
                  fontWeight: styling.font_weight || 'normal',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  textAlign: 'center',
                  maxWidth: '80%',
                  zIndex: overlay.layer_index || 1,
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
