'use client';
import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

/**
 * TemplateVideoPlayer - Renders assigned video template with overlays
 * 
 * This component:
 * 1. Fetches the assigned template for a wedding
 * 2. Loads populated overlays with wedding data
 * 3. Displays the video with text overlays on top
 */
export default function TemplateVideoPlayer({ weddingId, className = '' }) {
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
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
      {/* Video Player */}
      <ReactPlayer
        url={videoUrl}
        width="100%"
        height="100%"
        playing={isPlaying}
        controls={true}
        light={template.preview_thumbnail?.url || false}
        playIcon={
          <div 
            className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <svg className="w-10 h-10 text-rose-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        }
        onPlay={() => setIsPlaying(true)}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload'
            }
          }
        }}
      />

      {/* Dynamic Overlays */}
      {isPlaying && overlays.length > 0 && (
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
