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
          {overlays.map((overlay, index) => (
            <div
              key={overlay.id || index}
              className="absolute whitespace-nowrap"
              style={{
                left: `${overlay.position?.x || 50}%`,
                top: `${overlay.position?.y || 50}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${overlay.style?.font_size || 24}px`,
                fontFamily: overlay.style?.font_family || 'Arial',
                color: overlay.style?.color || '#FFFFFF',
                fontWeight: overlay.style?.font_weight || 'normal',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                textAlign: 'center',
                maxWidth: '80%',
                animation: overlay.animation?.type ? `${overlay.animation.type} ${overlay.animation.duration}s ${overlay.animation.delay}s` : 'none'
              }}
            >
              {overlay.text_value || overlay.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
