'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Pause, Clock, Heart } from 'lucide-react';

export default function ViewerLiveStatus({ weddingId, onStatusChange }) {
  const [liveStatus, setLiveStatus] = useState('idle');
  const [streamStartedAt, setStreamStartedAt] = useState(null);
  const [pauseCount, setPauseCount] = useState(0);

  useEffect(() => {
    if (weddingId) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [weddingId]);

  const fetchStatus = async () => {
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
      setStreamStartedAt(data.stream_started_at);
      setPauseCount(data.pause_count || 0);
      
      if (onStatusChange) {
        onStatusChange(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  // Status-specific messages and UI
  const renderStatusCard = () => {
    switch (liveStatus) {
      case 'idle':
      case 'waiting':
        return (
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="py-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Live Stream Not Started Yet
              </h3>
              <p className="text-gray-500">
                The ceremony hasn't started. Please check back soon!
              </p>
            </CardContent>
          </Card>
        );

      case 'live':
        return (
          <div className="animate-fadeIn">
            <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
              <CardContent className="py-6 text-center">
                <div className="animate-pulse">
                  <Badge className="mb-4 px-4 py-2 text-lg bg-red-500 text-white">
                    <Radio className="w-5 h-5 mr-2 inline" />
                    LIVE NOW
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  🎊 The Ceremony is Live! 🎊
                </h3>
                <p className="text-gray-600">
                  Join us in celebrating this beautiful moment
                </p>
                {pauseCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Stream has resumed after brief pause
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'paused':
        return (
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="py-8 text-center">
              <Pause className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Stream Paused - We'll Be Right Back! 💖
              </h3>
              <p className="text-gray-600 mb-4">
                The live stream will resume shortly. Please stay tuned!
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-pulse">
                  <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
                </div>
                <span className="text-sm text-gray-500">Waiting for hosts...</span>
              </div>
            </CardContent>
          </Card>
        );

      case 'ended':
        return (
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                ✨ Live Stream Has Ended ✨
              </h3>
              <p className="text-gray-600 mb-4">
                Thank you for joining us! The recorded video is available below.
              </p>
              <Badge variant="outline" className="text-sm">
                Recording Available
              </Badge>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderStatusCard()}
    </div>
  );
}
