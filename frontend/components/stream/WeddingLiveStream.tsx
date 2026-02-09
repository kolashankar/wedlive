'use client';
import React, { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, ControlBar, useTracks } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { toast } from 'sonner';

interface WeddingLiveStreamProps {
  weddingId: string;
  token: string;
  serverUrl: string;
  roomName: string;
  participantName?: string;
  isHost?: boolean;
  onDisconnect?: () => void;
}

/**
 * WeddingLiveStream Component
 * 
 * LiveKit-based streaming component that replaces HLS/RTMP player.
 * Provides WebRTC low-latency streaming (<500ms) with automatic quality adaptation.
 * 
 * Features:
 * - WebRTC streaming via LiveKit
 * - Automatic quality adaptation (SVC)
 * - Built-in participant management
 * - Host controls (camera/mic toggle)
 * - Guest view (watch-only mode)
 * - Multi-camera support
 * 
 * @param {string} weddingId - Wedding identifier
 * @param {string} token - LiveKit access token from Pulse API
 * @param {string} serverUrl - LiveKit WebSocket URL
 * @param {string} roomName - LiveKit room name
 * @param {string} participantName - Display name for participant
 * @param {boolean} isHost - Whether user is the host (can publish)
 * @param {function} onDisconnect - Callback when disconnected
 */
export function WeddingLiveStream({
  weddingId,
  token,
  serverUrl,
  roomName,
  participantName = 'Guest',
  isHost = false,
  onDisconnect
}: WeddingLiveStreamProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🎥 WeddingLiveStream: Initializing', {
      weddingId,
      roomName,
      serverUrl,
      isHost,
      participantName
    });
  }, []);

  const handleConnected = () => {
    console.log('✅ Connected to LiveKit room:', roomName);
    setIsConnected(true);
    toast.success('Connected to wedding stream');
  };

  const handleDisconnected = () => {
    console.log('❌ Disconnected from LiveKit room:', roomName);
    setIsConnected(false);
    toast.info('Disconnected from wedding stream');
    onDisconnect?.();
  };

  const handleError = (error: Error) => {
    console.error('❌ LiveKit error:', error);
    toast.error(`Stream error: ${error.message}`);
  };

  return (
    <div className="wedding-live-stream w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={isHost}
        video={isHost}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={handleError}
        className="h-full"
      >
        {/* Audio Renderer for remote tracks */}
        <RoomAudioRenderer />
        
        {/* Video Conference UI */}
        <VideoConference
          chatMessageFormatter={(message) => `${message.from?.name}: ${message.message}`}
        />
        
        {/* Custom controls can be added here */}
        {isHost && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <ControlBar variation="minimal" />
          </div>
        )}
      </LiveKitRoom>

      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to wedding stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeddingLiveStream;
