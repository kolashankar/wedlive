'use client';
import { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

export default function VideoPlayerWithOverlays({ videoUrl, overlays, weddingData }) {
  const playerRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load custom fonts
  useEffect(() => {
    loadCustomFonts();
  }, [overlays]);

  useEffect(() => {
    renderOverlays();
  }, [currentTime, overlays, fontsLoaded, isMobile]);

  const renderOverlays = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter overlays visible at current time
    const visibleOverlays = overlays.filter(overlay => {
      const startTime = overlay.timing?.start_time || 0;
      const endTime = overlay.timing?.end_time || duration;
      return currentTime >= startTime && currentTime <= endTime;
    });

    // Sort by layer index
    visibleOverlays.sort((a, b) => (a.layer_index || 0) - (b.layer_index || 0));

    // Render each visible overlay
    visibleOverlays.forEach(overlay => {
      const text = overlay.text || overlay.placeholder_text || 'Sample Text';
      const position = overlay.position || { x: 960, y: 540 };
      const styling = overlay.styling || {};

      // Save context state
      ctx.save();

      // Set font
      const fontSize = styling.font_size || 48;
      const fontWeight = styling.font_weight || 'normal';
      const fontFamily = styling.font_family || 'Arial';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      
      // Set color
      ctx.fillStyle = styling.color || '#ffffff';
      ctx.textAlign = styling.text_align || 'center';
      ctx.textBaseline = 'middle';

      // Add text shadow
      if (styling.text_shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      // Calculate animation progress
      const progress = calculateAnimationProgress(overlay, currentTime);
      
      // Apply animation effects
      applyAnimation(ctx, overlay.animation, progress, position, fontSize);

      // Render text
      ctx.fillText(text, position.x, position.y);

      // Restore context state
      ctx.restore();
    });
  };

  const calculateAnimationProgress = (overlay, time) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const animDuration = overlay.animation?.duration || 1;

    // Entrance animation
    if (time < startTime + animDuration) {
      const progress = (time - startTime) / animDuration;
      return Math.max(0, Math.min(1, progress));
    }

    // Exit animation
    if (time > endTime - animDuration) {
      const progress = 1 - ((time - (endTime - animDuration)) / animDuration);
      return Math.max(0, Math.min(1, progress));
    }

    return 1; // Fully visible
  };

  const applyAnimation = (ctx, animation, progress, position, fontSize) => {
    if (!animation) {
      ctx.globalAlpha = progress;
      return;
    }

    const type = animation.type || 'fade';

    switch (type) {
      case 'fade':
        ctx.globalAlpha = progress;
        break;

      case 'slide-up':
        ctx.globalAlpha = progress;
        ctx.translate(0, (1 - progress) * 100);
        break;

      case 'slide-down':
        ctx.globalAlpha = progress;
        ctx.translate(0, -(1 - progress) * 100);
        break;

      case 'slide-left':
        ctx.globalAlpha = progress;
        ctx.translate((1 - progress) * 100, 0);
        break;

      case 'slide-right':
        ctx.globalAlpha = progress;
        ctx.translate(-(1 - progress) * 100, 0);
        break;

      case 'scale':
      case 'zoom':
        ctx.globalAlpha = progress;
        const scale = 0.5 + (progress * 0.5);
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.translate(-position.x, -position.y);
        break;

      case 'bounce':
        ctx.globalAlpha = progress;
        const bounce = Math.abs(Math.sin(progress * Math.PI * 2)) * (1 - progress) * 20;
        ctx.translate(0, -bounce);
        break;

      case 'rotate':
        ctx.globalAlpha = progress;
        const rotation = (1 - progress) * Math.PI * 2;
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.translate(-position.x, -position.y);
        break;

      default:
        ctx.globalAlpha = progress;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Card className="overflow-hidden bg-black">
        <div className="relative aspect-video">
          {/* React Player */}
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            controls={false}
            width="100%"
            height="100%"
            volume={volume}
            muted={muted}
            onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
            onDuration={setDuration}
            onEnded={() => setPlaying(false)}
          />

          {/* Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />

          {/* Custom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPlaying(!playing)}
                className="text-white hover:bg-white/20"
                data-testid="play-pause-btn"
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              {/* Timeline */}
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    if (playerRef.current) {
                      playerRef.current.seekTo(time);
                    }
                  }}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  data-testid="video-timeline"
                />
                <div className="flex justify-between text-xs text-white/80 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMuted(!muted)}
                className="text-white hover:bg-white/20"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              {/* Fullscreen */}
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
