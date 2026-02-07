'use client';
import React from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles/prefabs';
import { Loader2, AlertCircle } from 'lucide-react';

interface WeddingLiveStreamProps {
  weddingId: string;
  token: string;
  serverUrl: string;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WeddingLiveStream Component
 * 
 * LiveKit-based streaming component for wedding live streams.
 * Replaces NGINX-RTMP HLS player with WebRTC-based LiveKit.
 * 
 * Features:
 * - Low latency WebRTC streaming (<500ms)
 * - Automatic quality adaptation
 * - Built-in participant management
 * - Multi-camera support via LiveKit tracks
 * 
 * @param {string} weddingId - Wedding ID for tracking
 * @param {string} token - LiveKit access token from Pulse API
 * @param {string} serverUrl - LiveKit server WebSocket URL
 * @param {function} onDisconnected - Callback when disconnected
 * @param {function} onError - Callback on error
 */
export function WeddingLiveStream({
  weddingId,
  token,
  serverUrl,
  onDisconnected,
  onError
}: WeddingLiveStreamProps) {
  if (!token || !serverUrl) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg">No stream credentials available</p>
          <p className="text-sm text-gray-400 mt-2">Please contact support if this persists</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
        onDisconnected={onDisconnected}
        onError={onError}
        className="h-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

export default WeddingLiveStream;
