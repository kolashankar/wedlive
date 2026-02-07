'use client';
import React from 'react';
import { 
  useRemoteParticipants, 
  useTracks,
  ParticipantTile
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Radio } from 'lucide-react';

interface GuestViewProps {
  showParticipantCount?: boolean;
}

/**
 * GuestView Component
 * 
 * Viewer experience for wedding guests
 * Displays all active camera streams from the wedding.
 * 
 * Features:
 * - Grid layout for multiple camera angles
 * - Automatic switching to active camera
 * - Participant count badge
 * - Low latency WebRTC playback
 * 
 * @param {boolean} showParticipantCount - Show number of viewers
 */
export function GuestView({ showParticipantCount = true }: GuestViewProps) {
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="w-full h-full relative">
      {/* Status Badge */}
      {showParticipantCount && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Badge variant="destructive" className="animate-pulse">
            <Radio className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
          <Badge variant="secondary">
            <Users className="w-3 h-3 mr-1" />
            {remoteParticipants.length} cameras
          </Badge>
        </div>
      )}

      {/* Video Grid */}
      <div className="w-full h-full grid gap-2 p-4">
        {tracks.map((track) => (
          <ParticipantTile
            key={track.participant.identity}
            participant={track.participant}
            className="rounded-lg overflow-hidden"
          />
        ))}
        
        {tracks.length === 0 && (
          <Card className="flex items-center justify-center h-full bg-black border-gray-800">
            <div className="text-center text-white p-8">
              <Radio className="w-16 h-16 mx-auto mb-4 text-gray-500 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Waiting for stream...</h3>
              <p className="text-gray-400">The wedding stream will start soon</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default GuestView;
