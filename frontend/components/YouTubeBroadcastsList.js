'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Youtube,
  ExternalLink,
  Calendar,
  Eye,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function YouTubeBroadcastsList({ weddingId, wedding }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (wedding?.youtube_settings?.auth_connected && expanded) {
      fetchBroadcasts();
    }
  }, [expanded, wedding?.youtube_settings?.auth_connected]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/youtube/broadcasts');
      setBroadcasts(response.data.broadcasts || []);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Failed to load YouTube broadcasts');
    } finally {
      setLoading(false);
    }
  };

  if (!wedding?.youtube_settings?.auth_connected) {
    return null;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'ready': { color: 'bg-blue-500', text: 'Ready' },
      'testing': { color: 'bg-yellow-500', text: 'Testing' },
      'live': { color: 'bg-red-500', text: 'Live' },
      'complete': { color: 'bg-green-500', text: 'Completed' },
      'revoked': { color: 'bg-gray-500', text: 'Cancelled' }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-400', text: status };
    
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              Your YouTube Broadcasts
            </CardTitle>
            <CardDescription>
              View and manage your previous YouTube Live streams
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExpanded(!expanded);
              if (!expanded) {
                fetchBroadcasts();
              }
            }}
          >
            {expanded ? 'Hide' : 'Show'} Broadcasts
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : broadcasts.length === 0 ? (
            <Alert>
              <Youtube className="h-4 w-4" />
              <AlertDescription>
                No previous broadcasts found. Create your first YouTube broadcast to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((broadcast) => (
                <div
                  key={broadcast.broadcast_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {broadcast.thumbnail_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={broadcast.thumbnail_url}
                          alt={broadcast.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Broadcast Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm line-clamp-2">
                            {broadcast.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {broadcast.description}
                          </p>
                        </div>
                        {getStatusBadge(broadcast.life_cycle_status)}
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                        {broadcast.scheduled_start_time && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(broadcast.scheduled_start_time), 'MMM d, yyyy')}
                          </div>
                        )}
                        {broadcast.actual_start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Started: {format(new Date(broadcast.actual_start_time), 'p')}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(broadcast.youtube_video_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View on YouTube
                        </Button>
                        
                        {broadcast.life_cycle_status === 'complete' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.post(`/api/youtube/save-video-to-media/${weddingId}`, {
                                  broadcast_id: broadcast.broadcast_id
                                });
                                toast.success('Video added to media gallery!');
                              } catch (error) {
                                toast.error('Failed to add video to gallery');
                              }
                            }}
                          >
                            <Youtube className="w-3 h-3 mr-1" />
                            Add to Gallery
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          {broadcasts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBroadcasts}
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Refresh List
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
