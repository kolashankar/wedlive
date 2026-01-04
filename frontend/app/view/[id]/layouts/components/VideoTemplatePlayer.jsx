'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VideoTemplatePlayer({ videoTemplate, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  
  console.log('VideoTemplatePlayer - videoTemplate:', videoTemplate);
  console.log('VideoTemplatePlayer - video_url:', videoTemplate?.video_url);
  console.log('VideoTemplatePlayer - overlays:', videoTemplate?.text_overlays);
  
  if (!videoTemplate || !videoTemplate.video_url) {
    console.log('VideoTemplatePlayer - returning null (no video template or URL)');
    return null;
  }

  const overlays = videoTemplate.text_overlays || [];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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

  // Convert pixel position to percentage
  // Video standard canvas is 1920x1080
  const convertPositionToPercentage = (position) => {
    const CANVAS_WIDTH = 1920;
    const CANVAS_HEIGHT = 1080;
    
    // If position values are already percentages (< 100), return as is
    if (position.x <= 100 && position.y <= 100) {
      return { x: position.x, y: position.y };
    }
    
    // Convert pixels to percentage
    return {
      x: (position.x / CANVAS_WIDTH) * 100,
      y: (position.y / CANVAS_HEIGHT) * 100
    };
  };

  // Calculate animation progress
  const getAnimationStyle = (overlay) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const animDuration = overlay.animation?.duration || 1;
    
    let opacity = 1;
    let transform = '';

    // Entrance animation
    if (currentTime < startTime + animDuration) {
      const progress = Math.max(0, Math.min(1, (currentTime - startTime) / animDuration));
      const animType = overlay.animation?.entrance?.type || overlay.animation?.type || 'fade-in';
      
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
    // Exit animation
    else if (currentTime > endTime - animDuration) {
      const progress = 1 - Math.max(0, Math.min(1, (currentTime - (endTime - animDuration)) / animDuration));
      const animType = overlay.animation?.exit?.type || 'fade-out';
      
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
    <div className={`relative w-full ${className}`}>
      <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: 'transparent' }}>
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoTemplate.video_url}
          poster={videoTemplate.thumbnail_url}
          className="w-full h-full object-contain"
          style={{ backgroundColor: 'transparent' }}
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Text Overlays */}
        {sortedOverlays.length > 0 && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            {sortedOverlays.map((overlay, index) => {
              const position = overlay.position || { x: 50, y: 50 };
              const percentagePos = convertPositionToPercentage(position);
              const styling = overlay.styling || {};
              const animStyle = getAnimationStyle(overlay);
              
              const fontSize = styling.font_size || 48;
              const fontFamily = styling.font_family || 'Playfair Display';
              const fontWeight = styling.font_weight || 'bold';
              const color = styling.color || '#ffffff';
              const textAlign = styling.text_align || 'center';
              const letterSpacing = styling.letter_spacing || 2;
              const lineHeight = styling.line_height || 1.2;
              const textShadow = styling.text_shadow || '0 2px 4px rgba(0,0,0,0.5)';
              
              // Handle stroke
              const stroke = styling.stroke || {};
              const textStroke = stroke.enabled 
                ? `-webkit-text-stroke: ${stroke.width || 2}px ${stroke.color || '#000000'};`
                : '';
              
              return (
                <div
                  key={overlay.id || index}
                  className="absolute whitespace-pre-wrap"
                  style={{
                    left: `${percentagePos.x}%`,
                    top: `${percentagePos.y}%`,
                    transform: `translate(-50%, -50%) ${animStyle.transform}`,
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: color,
                    textAlign: textAlign,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight,
                    textShadow: textShadow,
                    opacity: animStyle.opacity,
                    maxWidth: '90%',
                    zIndex: overlay.layer_index || 1,
                    transition: 'opacity 0.1s ease-out',
                    WebkitTextStroke: stroke.enabled ? `${stroke.width || 2}px ${stroke.color || '#000000'}` : 'none',
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
