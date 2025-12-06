'use client';
import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Video, 
  Heart,
  Share2,
  Download,
  Play,
  Loader2,
  ArrowLeft,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function WeddingViewPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const weddingId = resolvedParams.id;
  
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (weddingId) {
      loadWedding();
      
      // Update viewer count every 10 seconds for live streams
      const interval = setInterval(() => {
        if (wedding?.status === 'live') {
          updateViewerCount();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [weddingId]);

  const loadWedding = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}`);
      setWedding(response.data);
      setViewerCount(response.data.viewers_count || 0);
    } catch (error) {
      toast.error('Failed to load wedding details');
      console.error('Error loading wedding:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateViewerCount = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}`);
      setViewerCount(response.data.viewers_count || 0);
    } catch (error) {
      console.error('Failed to update viewer count:', error);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: wedding.title,
        text: `Watch ${wedding.bride_name} & ${wedding.groom_name}'s wedding live!`,
        url: url
      }).catch(() => {
        // Fallback to clipboard
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-500 text-white animate-pulse text-lg px-4 py-1" data-testid="status-live">
            <Video className="w-4 h-4 mr-2" />LIVE
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="secondary" className="text-lg px-4 py-1" data-testid="status-scheduled">
            <Clock className="w-4 h-4 mr-2" />Upcoming
          </Badge>
        );
      case 'ended':
      case 'recorded':
        return (
          <Badge variant="outline" className="text-lg px-4 py-1" data-testid="status-recorded">
            Recording Available
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Wedding Not Found</CardTitle>
            <CardDescription>This wedding event doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/weddings">
              <Button>Browse All Weddings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                  WedLive
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
                data-testid="share-button"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player Card */}
            <Card className="overflow-hidden">
              <div className="relative bg-black" style={{ paddingTop: '56.25%' }}>
                {wedding.status === 'live' && wedding.playback_url ? (
                  <div className="absolute inset-0">
                    <iframe
                      src={wedding.playback_url}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      data-testid="live-stream-player"
                    />
                  </div>
                ) : (wedding.status === 'recorded' || wedding.status === 'ended') && wedding.recording_url ? (
                  <div className="absolute inset-0">
                    <video
                      src={wedding.recording_url}
                      controls
                      className="w-full h-full"
                      data-testid="recording-player"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    {wedding.cover_image ? (
                      <img 
                        src={wedding.cover_image} 
                        alt={wedding.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-purple-600 opacity-50" />
                    )}
                    <div className="relative z-10 text-center">
                      <Heart className="w-20 h-20 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">
                        {wedding.status === 'scheduled' ? 'Coming Soon' : 'Not Available'}
                      </h3>
                      <p className="text-lg">
                        {wedding.status === 'scheduled' 
                          ? `Starts on ${format(new Date(wedding.scheduled_date), 'PPP')}` 
                          : 'Stream has ended'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Wedding Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CardTitle className="text-3xl">{wedding.title}</CardTitle>
                      {getStatusBadge(wedding.status)}
                    </div>
                    <CardDescription className="text-xl flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                      {wedding.bride_name} & {wedding.groom_name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {wedding.description && (
                  <>
                    <p className="text-gray-700 leading-relaxed">{wedding.description}</p>
                    <Separator />
                  </>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-rose-500 mt-1" />
                    <div>
                      <div className="font-semibold text-sm text-gray-500">Date & Time</div>
                      <div className="text-gray-900">{format(new Date(wedding.scheduled_date), 'PPP')}</div>
                      <div className="text-sm text-gray-600">{format(new Date(wedding.scheduled_date), 'p')}</div>
                    </div>
                  </div>

                  {wedding.location && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-rose-500 mt-1" />
                      <div>
                        <div className="font-semibold text-sm text-gray-500">Location</div>
                        <div className="text-gray-900">{wedding.location}</div>
                      </div>
                    </div>
                  )}

                  {wedding.status === 'live' && (
                    <div className="flex items-start space-x-3">
                      <Eye className="w-5 h-5 text-rose-500 mt-1" />
                      <div>
                        <div className="font-semibold text-sm text-gray-500">Viewers</div>
                        <div className="text-gray-900 font-bold">{viewerCount} watching now</div>
                      </div>
                    </div>
                  )}

                  {wedding.creator_name && (
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-rose-500 mt-1" />
                      <div>
                        <div className="font-semibold text-sm text-gray-500">Host</div>
                        <div className="text-gray-900">{wedding.creator_name}</div>
                      </div>
                    </div>
                  )}
                </div>

                {(wedding.status === 'recorded' || wedding.status === 'ended') && wedding.recording_url && (
                  <>
                    <Separator />
                    <Button 
                      className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      onClick={() => window.open(wedding.recording_url, '_blank')}
                      data-testid="download-recording-button"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Recording
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-6">
            {/* Live Chat / Comments (Future) */}
            {wedding.status === 'live' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>Chat feature coming soon!</p>
                    <p className="text-sm mt-2">Connect with other guests watching live</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Card */}
            <Card>
              <CardHeader>
                <CardTitle>Share This Wedding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
                <p className="text-sm text-gray-600">
                  Invite friends and family to join the celebration
                </p>
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-rose-50 to-purple-50 border-rose-200">
              <CardHeader>
                <CardTitle className="text-rose-900">Host Your Own Wedding</CardTitle>
                <CardDescription>Share your special day with the world</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/register">
                  <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 WedLive. Built with ❤️ for making every wedding moment accessible.
          </p>
        </div>
      </footer>
    </div>
  );
}
