'use client';
import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VideoTemplatePlayer({ videoTemplate, className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  console.log('VideoTemplatePlayer - videoTemplate:', videoTemplate);
  console.log('VideoTemplatePlayer - video_url:', videoTemplate?.video_url);
  
  if (!videoTemplate || !videoTemplate.video_url) {
    console.log('VideoTemplatePlayer - returning null (no video template or URL)');
    return null;
  }

  const handlePlayPause = () => {
    const video = document.getElementById('template-video');
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative aspect-video bg-black overflow-hidden rounded-lg">
        <video
          id="template-video"
          src={videoTemplate.video_url}
          poster={videoTemplate.thumbnail_url}
          className="w-full h-full object-cover"
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause Button Overlay */}
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-all group"
        >
          {!isPlaying && (
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
