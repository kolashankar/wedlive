'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Play, 
  Square, 
  CheckCircle, 
  Radio,
  Youtube,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function YouTubeBroadcastControls({ weddingId, wedding, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (wedding?.streaming_type === 'youtube' && wedding?.youtube_settings?.broadcast_id) {
      fetchBroadcastStatus();
      // Poll status every 10 seconds when broadcast exists
      const interval = setInterval(fetchBroadcastStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [wedding?.youtube_settings?.broadcast_id]);

  const fetchBroadcastStatus = async () => {
    try {
      setPolling(true);
      const response = await api.get(`/api/youtube/status/${weddingId}`);
      setBroadcastStatus(response.data);
    } catch (error) {
      console.error('Error fetching broadcast status:', error);
    } finally {
      setPolling(false);
    }
  };

  const transitionBroadcast = async (status) => {
    try {
      setLoading(true);
      
      await api.post('/api/youtube/transition', {
        broadcast_id: wedding.youtube_settings.broadcast_id,
        status: status
      });

      toast.success(`Broadcast transitioned to ${status}`);
      
      // Refresh status
      await fetchBroadcastStatus();
      
      if (onStatusChange) {
        onStatusChange();
      }

      // If transitioning to complete, save video to media
      if (status === 'complete') {
        try {
          await api.post(`/api/youtube/save-video-to-media/${weddingId}`);
          toast.success('YouTube video saved to media gallery!');
        } catch (error) {
          console.error('Error saving video to media:', error);
          toast.error('Broadcast ended but failed to save video to gallery');
        }
      }

    } catch (error) {
      console.error('Error transitioning broadcast:', error);
      toast.error(error.response?.data?.detail || `Failed to transition to ${status}`);
    } finally {
      setLoading(false);
    }
  };

  if (!wedding?.youtube_settings?.broadcast_id) {
    return null;
  }

  const lifeCycleStatus = broadcastStatus?.life_cycle_status || 'unknown';
  const isLive = lifeCycleStatus === 'live';
  const isTesting = lifeCycleStatus === 'testing';
  const isComplete = lifeCycleStatus === 'complete';

  const getStatusColor = () => {
    switch (lifeCycleStatus) {
      case 'live': return 'bg-red-500 animate-pulse';
      case 'testing': return 'bg-yellow-500';
      case 'complete': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    switch (lifeCycleStatus) {
      case 'ready': return 'Ready to Go Live';
      case 'testing': return 'Testing (Private)';
      case 'live': return 'LIVE';
      case 'complete': return 'Ended';
      case 'revoked': return 'Cancelled';
      default: return lifeCycleStatus;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          YouTube Broadcast Controls
        </CardTitle>
        <CardDescription>
          Manage your YouTube Live broadcast status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <div>
              <p className="font-semibold">{getStatusText()}</p>
              <p className="text-sm text-gray-500">
                {isLive ? 'Your stream is live on YouTube' :
                 isTesting ? 'Stream is in testing mode (not visible to public)' :
                 isComplete ? 'Broadcast has ended' :
                 'Broadcast is ready to start'}
              </p>
            </div>
          </div>
          {polling && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>

        {/* Broadcast Info */}
        {wedding.youtube_settings?.youtube_video_url && (
          <Alert>
            <Youtube className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">View on YouTube</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(wedding.youtube_settings.youtube_video_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-1 gap-3 pt-4 border-t">
          {/* Start Testing */}
          {(lifeCycleStatus === 'ready') && (
            <Button
              onClick={() => transitionBroadcast('testing')}
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Start Testing (Private)
            </Button>
          )}

          {/* Go Live */}
          {(lifeCycleStatus === 'testing' || lifeCycleStatus === 'ready') && (
            <Button
              onClick={() => transitionBroadcast('live')}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Radio className="w-4 h-4 mr-2" />}
              Go Live on YouTube
            </Button>
          )}

          {/* End Broadcast */}
          {(lifeCycleStatus === 'live' || lifeCycleStatus === 'testing') && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to end the YouTube broadcast? This will make it available as a video on your channel.')) {
                  transitionBroadcast('complete');
                }
              }}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
              End Broadcast
            </Button>
          )}

          {/* Broadcast Complete */}
          {isComplete && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Broadcast ended successfully. Video is now available on your YouTube channel.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Instructions */}
        {!isComplete && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Testing:</strong> Start OBS and test privately before going live</li>
                <li><strong>Go Live:</strong> Make your stream visible to the public on YouTube</li>
                <li><strong>End:</strong> Finish the broadcast and save the recording</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
