'use client';
import React from 'react';
import { useLocalParticipant, useRoomContext, useTracks } from '@livekit/components-react';
import { Track, Room } from 'livekit-client';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Users, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HostControlsProps {
  onEndStream?: () => void;
  weddingId: string;
}

/**
 * HostControls Component
 * 
 * Provides controls for the wedding host to manage their stream.
 * 
 * Features:
 * - Toggle camera on/off
 * - Toggle microphone on/off
 * - End stream
 * - Participant count display
 * - Live status indicator
 * 
 * @param {function} onEndStream - Callback when host ends the stream
 * @param {string} weddingId - Wedding identifier
 */
export function HostControls({ onEndStream, weddingId }: HostControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  const [isCameraEnabled, setIsCameraEnabled] = React.useState(true);
  const [isMicEnabled, setIsMicEnabled] = React.useState(true);
  const [participantCount, setParticipantCount] = React.useState(0);

  React.useEffect(() => {
    if (!room) return;

    const updateParticipantCount = () => {
      setParticipantCount(room.participants.size);
    };

    updateParticipantCount();
    room.on('participantConnected', updateParticipantCount);
    room.on('participantDisconnected', updateParticipantCount);

    return () => {
      room.off('participantConnected', updateParticipantCount);
      room.off('participantDisconnected', updateParticipantCount);
    };
  }, [room]);

  const toggleCamera = async () => {
    if (!localParticipant) return;

    try {
      const enabled = !isCameraEnabled;
      await localParticipant.setCameraEnabled(enabled);
      setIsCameraEnabled(enabled);
      toast.success(enabled ? 'Camera turned on' : 'Camera turned off');
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      toast.error('Failed to toggle camera');
    }
  };

  const toggleMicrophone = async () => {
    if (!localParticipant) return;

    try {
      const enabled = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(enabled);
      setIsMicEnabled(enabled);
      toast.success(enabled ? 'Microphone turned on' : 'Microphone turned off');
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      toast.error('Failed to toggle microphone');
    }
  };

  const handleEndStream = () => {
    if (window.confirm('Are you sure you want to end the stream?')) {
      onEndStream?.();
      toast.info('Ending stream...');
    }
  };

  return (
    <div className="host-controls bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        {/* Live Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
            <Radio className="w-4 h-4 text-white animate-pulse" />
            <span className="text-white text-sm font-medium">LIVE</span>
          </div>
          
          {/* Participant Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-full">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">{participantCount}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Camera Toggle */}
          <Button
            variant={isCameraEnabled ? "default" : "destructive"}
            size="icon"
            onClick={toggleCamera}
            title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraEnabled ? (
              <Camera className="w-5 h-5" />
            ) : (
              <CameraOff className="w-5 h-5" />
            )}
          </Button>

          {/* Microphone Toggle */}
          <Button
            variant={isMicEnabled ? "default" : "destructive"}
            size="icon"
            onClick={toggleMicrophone}
            title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>

          {/* End Stream */}
          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndStream}
            title="End stream"
            className="ml-2"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default HostControls;
