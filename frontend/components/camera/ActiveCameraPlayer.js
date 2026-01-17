'use client';
import React, { useMemo } from 'react';
import StreamVideoPlayer from '@/components/StreamVideoPlayer';
import { getApiBaseUrl } from '@/lib/config';

const ActiveCameraPlayer = ({ weddingId, activeCameraId, cameras }) => {
  // Construct the Composition HLS URL
  // This URL serves the composed stream from FFmpeg
  const playbackUrl = useMemo(() => {
    if (!weddingId) return null;
    
    // In Phase 1.3 we defined output path as: /hls_output/output_{wedding_id}/output.m3u8
    // We need to make sure this is accessible via API or static serve.
    // Assuming backend serves /hls_output static files or via a route
    // Using the same base URL as API
    return `${getApiBaseUrl()}/hls_output/output_${weddingId}/output.m3u8`;
  }, [weddingId]);

  return (
    <div className="w-full h-full bg-black">
      <StreamVideoPlayer
        playbackUrl={playbackUrl}
        autoPlay={true}
        controls={true}
        muted={true} // Mute by default for admin panel to avoid echo
      />
    </div>
  );
};

export default ActiveCameraPlayer;
