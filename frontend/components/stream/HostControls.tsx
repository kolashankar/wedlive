'use client';
import React from 'react';
import { 
  useLocalParticipant, 
  useTracks,
  TrackToggle
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Cast, Users } from 'lucide-react';

interface HostControlsProps {
  roomName: string;
  onEndStream?: () => void;
}

/**
 * HostControls Component
 * 
 * Control panel for wedding stream host (broadcaster)
 * Provides camera/mic controls and participant management.
 * 
 * Features:
 * - Camera on/off toggle
 * - Microphone on/off toggle
 * - Active participant count
 * - End stream button
 * 
 * @param {string} roomName - LiveKit room name
 * @param {function} onEndStream - Callback when host ends stream
 */
export function HostControls({ roomName, onEndStream }: HostControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks();

  const participantCount = tracks.length;
  const isPublishing = localParticipant.isCameraEnabled || localParticipant.isMicrophoneEnabled;

  return (
    <Card className="border-2 border-gray-800 bg-gray-950">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cast className="w-5 h-5" />
            <span>Host Controls</span>
          </div>
          {isPublishing && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Controls */}
        <div className="flex gap-2">
          <TrackToggle
            source={Track.Source.Camera}
            className="flex-1"
          >
            {({ enabled }) => (
              <Button variant={enabled ? 'default' : 'outline'} className="w-full">
                {enabled ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                {enabled ? 'Camera On' : 'Camera Off'}
              </Button>
            )}
          </TrackToggle>
          
          <TrackToggle
            source={Track.Source.Microphone}
            className="flex-1"
          >
            {({ enabled }) => (
              <Button variant={enabled ? 'default' : 'outline'} className="w-full">
                {enabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                {enabled ? 'Mic On' : 'Mic Off'}
              </Button>
            )}
          </TrackToggle>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{participantCount} participants</span>
          </div>
        </div>

        {/* End Stream */}
        {onEndStream && (
          <Button 
            onClick={onEndStream}
            variant="destructive"
            className="w-full"
          >
            End Stream
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default HostControls;
