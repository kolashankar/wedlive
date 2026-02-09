/**
 * StreamVideoPlayer - Compatibility component
 * Replaces old HLS-based player with HTML5 video player
 * For live streaming, use WeddingLiveStream.tsx component instead
 */
import React from 'react';

export default function StreamVideoPlayer({ 
  playbackUrl, 
  autoPlay = false, 
  controls = true,
  muted = false,
  className = ''
}) {
  return (
    <div className={`w-full ${className}`}>
      <video
        src={playbackUrl}
        autoPlay={autoPlay}
        controls={controls}
        muted={muted}
        playsInline
        className="w-full h-full object-contain bg-black"
      />
    </div>
  );
}
