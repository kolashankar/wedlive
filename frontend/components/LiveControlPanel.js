'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Square, RotateCcw, Radio, Clock, AlertCircle, Copy, CheckCircle2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function LiveControlPanel({ 
  weddingId, 
  isCreator = false,
  onStatusChange 
}) {
  const [liveStatus, setLiveStatus] = useState('idle');
  const [rtmpCredentials, setRtmpCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [copiedField, setCopiedField] = useState(null);
  const [canGoLive, setCanGoLive] = useState(true);

  // Poll live status every 5 seconds
  useEffect(() => {
    if (weddingId) {
      fetchLiveStatus();
      const interval = setInterval(fetchLiveStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [weddingId]);

  const fetchLiveStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/weddings/${weddingId}/live/status`
      );
      
      if (!response.ok) {
        console.error('Failed to fetch live status');
        return;
      }
      
      const data = await response.json();
      setLiveStatus(data.status || 'idle');
      setPauseCount(data.pause_count || 0);
      setStreamDuration(data.total_duration || 0);
      setCanGoLive(data.can_go_live !== false);
      
      if (onStatusChange) {
        onStatusChange(data);
      }
    } catch (error) {
      console.error('Error fetching live status:', error);
    }
  };

  const handleGoLive = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/weddings/${weddingId}/live/go-live`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setRtmpCredentials({
          rtmp_url: data.rtmp_url,
          stream_key: data.stream_key,
          hls_playback_url: data.hls_playback_url
        });
        setLiveStatus('waiting');
        await fetchLiveStatus();
      } else {
        alert(data.detail || 'Failed to start live');
      }
    } catch (error) {
      alert('Error starting live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/weddings/${weddingId}/live/pause`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        await fetchLiveStatus();
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to pause live');
      }
    } catch (error) {
      alert('Error pausing live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/weddings/${weddingId}/live/resume`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchLiveStatus();
      } else {
        alert(data.message || 'Cannot resume. Please start OBS first.');
      }
    } catch (error) {
      alert('Error resuming live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndLive = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/weddings/${weddingId}/live/end`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        await fetchLiveStatus();
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to end live');
      }
    } catch (error) {
      alert('Error ending live: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Only show to creator/admin
  if (!isCreator) {
    return null;
  }

  // Status badge
  const getStatusBadge = () => {
    const badges = {
      idle: <Badge variant="secondary" className="bg-gray-100 text-gray-700">Not Started</Badge>,
      waiting: (
        <Badge className="bg-yellow-500 text-white animate-pulse">
          <Clock className="w-3 h-3 mr-1" />
          Waiting for OBS...
        </Badge>
      ),
      live: (
        <Badge className="bg-red-500 text-white animate-pulse">
          <Radio className="w-3 h-3 mr-1" />
          LIVE
        </Badge>
      ),
      paused: (
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          <Pause className="w-3 h-3 mr-1" />
          PAUSED
        </Badge>
      ),
      ended: <Badge variant="outline" className="bg-gray-50">ENDED</Badge>
    };
    return badges[liveStatus] || badges.idle;
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-800">Live Stream Controls</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Status Info */}
        {liveStatus !== 'idle' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pause Count</p>
              <p className="text-2xl font-bold text-gray-800">{pauseCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Stream Duration</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatDuration(streamDuration)}
              </p>
            </div>
          </div>
        )}

        {/* RTMP Credentials (when waiting) */}
        {liveStatus === 'waiting' && rtmpCredentials && (
          <div className="bg-blue-50 p-5 rounded-lg space-y-3 border-2 border-blue-200">
            <h4 className="font-bold text-blue-900 flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5" />
              Configure OBS Studio
            </h4>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">RTMP Server URL:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(rtmpCredentials.rtmp_url, 'rtmp_url')}
                    className="h-7"
                  >
                    {copiedField === 'rtmp_url' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block overflow-x-auto">
                  {rtmpCredentials.rtmp_url}
                </code>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Stream Key:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(rtmpCredentials.stream_key, 'stream_key')}
                    className="h-7"
                  >
                    {copiedField === 'stream_key' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block overflow-x-auto break-all">
                  {rtmpCredentials.stream_key}
                </code>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded">
              <p className="text-sm text-blue-900 font-medium">
                📹 Steps to Go Live:
              </p>
              <ol className="text-xs text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Open OBS Studio</li>
                <li>Go to Settings → Stream</li>
                <li>Select "Custom" as Service</li>
                <li>Copy and paste the Server URL and Stream Key above</li>
                <li>Click "Start Streaming" in OBS</li>
              </ol>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-col gap-3">
          {/* Go Live Button */}
          {liveStatus === 'idle' && canGoLive && (
            <Button
              onClick={handleGoLive}
              disabled={loading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Go Live
            </Button>
          )}

          {/* Cannot Go Live Message */}
          {liveStatus === 'idle' && !canGoLive && (
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600 font-medium">
                This wedding has already ended. Cannot go live again.
              </p>
            </div>
          )}

          {/* Pause Button */}
          {liveStatus === 'live' && (
            <Button
              onClick={handlePause}
              disabled={loading}
              variant="outline"
              className="w-full h-12 text-lg font-semibold border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause Live
            </Button>
          )}

          {/* Resume Button */}
          {liveStatus === 'paused' && (
            <Button
              onClick={handleResume}
              disabled={loading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Resume Live
            </Button>
          )}

          {/* End Live Button (with confirmation) */}
          {(liveStatus === 'live' || liveStatus === 'paused') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full h-12 text-lg font-semibold"
                  disabled={loading}
                >
                  <Square className="w-5 h-5 mr-2" />
                  End Live (Final)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl">End Live Stream?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3 text-base">
                    <p className="font-semibold text-red-600">
                      ⚠️ This action is PERMANENT and cannot be undone!
                    </p>
                    <p>
                      This will:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Permanently end the live stream</li>
                      <li>Finalize and upload the recording</li>
                      <li>Prevent going live again for this wedding</li>
                    </ul>
                    <p className="font-semibold mt-4">
                      Are you absolutely sure you want to end the live stream?
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleEndLive}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, End Live Stream
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Info Messages */}
        {liveStatus === 'waiting' && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              Waiting for OBS stream to start...
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Once you start streaming in OBS, the status will automatically change to LIVE.
            </p>
          </div>
        )}

        {liveStatus === 'live' && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium flex items-center gap-2">
              <Radio className="w-4 h-4" />
              You are LIVE! Stream is active.
            </p>
            <p className="text-xs text-green-700 mt-1">
              Recording is in progress. You can pause the stream if needed.
            </p>
          </div>
        )}

        {liveStatus === 'paused' && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
              <Pause className="w-4 h-4" />
              Stream is paused. Recording continues in background.
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Click Resume when ready to continue, or End Live to finish permanently.
            </p>
          </div>
        )}

        {liveStatus === 'ended' && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-800 font-medium">
              ✅ Live stream has ended successfully.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Recording is being processed and will be available shortly in the Media tab.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
