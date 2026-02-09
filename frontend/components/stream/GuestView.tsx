'use client';
import React from 'react';
import { useTracks, ParticipantTile, TrackRefContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Radio, Users, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GuestViewProps {
  weddingId: string;
  brideName: string;
  groomName: string;
  isLive?: boolean;
  viewerCount?: number;
}

/**
 * GuestView Component
 * 
 * Optimized viewing experience for wedding guests.
 * 
 * Features:
 * - Multi-camera grid layout
 * - Live status badges
 * - Viewer count display
 * - Waiting state UI
 * - Automatic quality adaptation
 * - Low-latency WebRTC playback
 * 
 * @param {string} weddingId - Wedding identifier
 * @param {string} brideName - Bride's name
 * @param {string} groomName - Groom's name
 * @param {boolean} isLive - Whether stream is live
 * @param {number} viewerCount - Number of viewers
 */
export function GuestView({
  weddingId,
  brideName,
  groomName,
  isLive = false,
  viewerCount = 0
}: GuestViewProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const [connectionQuality, setConnectionQuality] = React.useState<'good' | 'poor' | 'offline'>('good');

  return (
    <div className="guest-view w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="guest-view-header bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {brideName} & {groomName}
            </h2>
            <p className="text-gray-400 text-sm">Wedding Live Stream</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Status */}
            {isLive && (
              <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>LIVE</span>
              </Badge>
            )}
            
            {/* Viewer Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-full">
              <Users className="w-4 h-4 text-gray-300" />
              <span className="text-gray-300 text-sm">{viewerCount}</span>
            </div>

            {/* Connection Quality */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-full">
              {connectionQuality === 'good' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : connectionQuality === 'poor' ? (
                <Wifi className="w-4 h-4 text-yellow-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="guest-view-grid flex-1 p-4">
        {tracks.length > 0 ? (
          <div className={`grid gap-4 h-full ${
            tracks.length === 1 ? 'grid-cols-1' :
            tracks.length === 2 ? 'grid-cols-2' :
            tracks.length <= 4 ? 'grid-cols-2 grid-rows-2' :
            'grid-cols-3 grid-rows-2'
          }`}>
            {tracks.map((trackRef) => (
              <div key={trackRef.publication.trackSid} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <ParticipantTile
                  trackRef={trackRef}
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          // Waiting State
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <Radio className="w-16 h-16 text-gray-600 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Waiting for the stream to start...
              </h3>
              <p className="text-gray-400">
                The wedding will begin shortly. Thank you for your patience!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Optional Chat or Additional Info */}
      <div className="guest-view-footer bg-gray-800 border-t border-gray-700 p-3">
        <p className="text-center text-gray-400 text-sm">
          💝 Celebrating {brideName} & {groomName}
        </p>
      </div>
    </div>
  );
}

export default GuestView;
