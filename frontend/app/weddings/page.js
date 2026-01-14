'use client';
import { useState, useEffect } from 'react';
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
import MediaGallery from '@/components/MediaGallery';
import StreamVideoPlayer from '@/components/StreamVideoPlayer';
import ThemeRenderer from '@/components/ThemeRenderer';
import CommentsSection from '@/components/CommentsSection';
import { SocketProvider } from '@/contexts/SocketContext';

function WeddingViewPageContent({ params }) {
  const router = useRouter();
  const weddingId = params.id;
  
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [showTheme, setShowTheme] = useState(null); // null = checking, true = show theme, false = skip theme

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
      const weddingData = response.data;
      
      // CRITICAL FIX: Validate wedding data before setting state
      if (!weddingData || typeof weddingData !== 'object') {
        console.error('Invalid wedding data received');
        toast.error('Invalid wedding data');
        setLoading(false);
        return;
      }
      
      // Ensure theme_settings exists with ALL nested objects properly initialized
      if (!weddingData.theme_settings || typeof weddingData.theme_settings !== 'object') {
        weddingData.theme_settings = {
          theme_id: 'floral_garden',
          custom_font: 'Great Vibes',
          primary_color: '#f43f5e',
          secondary_color: '#a855f7',
          pre_wedding_video: '',
          cover_photos: [],
          studio_details: {
            studio_id: '',
            name: '',
            logo_url: '',
            contact: ''
          },
          custom_messages: {
            welcome_text: 'Welcome to our big day',
            description: ''
          }
        };
      } else {
        // Ensure nested objects exist even if theme_settings exists
        if (!weddingData.theme_settings.studio_details || typeof weddingData.theme_settings.studio_details !== 'object') {
          weddingData.theme_settings.studio_details = {
            studio_id: '',
            name: '',
            logo_url: '',
            contact: ''
          };
        }
        if (!weddingData.theme_settings.custom_messages || typeof weddingData.theme_settings.custom_messages !== 'object') {
          weddingData.theme_settings.custom_messages = {
            welcome_text: 'Welcome to our big day',
            description: ''
          };
        }
        if (!Array.isArray(weddingData.theme_settings.cover_photos)) {
          weddingData.theme_settings.cover_photos = [];
        }
      }
      
      setWedding(weddingData);
      setViewerCount(weddingData.viewers_count || 0);
      
      // Determine if we should show theme preview
      // Check if the wedding creator is a premium user
      // Premium users → Show theme preview first with "Go to Wedding" button
      // Free plan users → Skip theme preview and go directly to wedding page
      const creatorPlan = weddingData.creator_subscription_plan || 'free';
      const isPremium = creatorPlan === 'monthly' || creatorPlan === 'yearly';
      
      // Show theme preview for premium users with theme settings configured, skip for free users
      // Also check that theme_settings exists and is not empty
      const hasThemeSettings = weddingData.theme_settings && 
                               typeof weddingData.theme_settings === 'object' &&
                               Object.keys(weddingData.theme_settings).length > 0;
      setShowTheme(isPremium && hasThemeSettings);
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

  const handleEnterWedding = () => {
    setShowTheme(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading wedding...</p>
        </div>
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

  // Show theme landing page first (only for premium users)
  if (showTheme === null) {
    // Still checking - show loading
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading wedding...</p>
        </div>
      </div>
    );
  }
  
  // CRITICAL FIX: Double-check theme_settings exists before showing theme
  if (showTheme && wedding && wedding.theme_settings && typeof wedding.theme_settings === 'object') {
    return (
      <ThemeRenderer 
        wedding={wedding} 
        onEnter={handleEnterWedding}
      />
    );
  }

  // Main wedding stream view
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
                    <StreamVideoPlayer
                      playbackUrl={wedding.playback_url}
                    />
                  </div>
                ) : wedding.status === 'recorded' && wedding.recording_url ? (
                  <div className="absolute inset-0">
                    <StreamVideoPlayer
                      playbackUrl={wedding.recording_url}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold mb-2">
                        {wedding.status === 'scheduled' ? 'Stream Not Started Yet' : 'Stream Ended'}
                      </p>
                      <p className="text-sm opacity-75">
                        {wedding.status === 'scheduled' 
                          ? `Scheduled for ${format(new Date(wedding.scheduled_date), 'PPP p')}`
                          : 'This wedding stream has ended'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Wedding Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{wedding.title}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {wedding.bride_name} & {wedding.groom_name}
                    </CardDescription>
                  </div>
                  {getStatusBadge(wedding.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {wedding.description && (
                  <>
                    <p className="text-gray-700">{wedding.description}</p>
                    <Separator />
                  </>
                )}
                
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-5 h-5 text-rose-500" />
                    <span>{format(new Date(wedding.scheduled_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="w-5 h-5 text-rose-500" />
                    <span>{format(new Date(wedding.scheduled_date), 'h:mm a')}</span>
                  </div>
                  {wedding.location && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-5 h-5 text-rose-500" />
                      <span>{wedding.location}</span>
                    </div>
                  )}
                  {wedding.status === 'live' && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Users className="w-5 h-5 text-rose-500" />
                      <span>{viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'} watching</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Media Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Photo & Video Gallery</CardTitle>
                <CardDescription>Memories from the celebration</CardDescription>
              </CardHeader>
              <CardContent>
                <MediaGallery weddingId={weddingId} publicView={true} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Comments */}
          <div className="space-y-6">
            {/* Creator Info */}
            {wedding.creator_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hosted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-white">
                        {wedding.creator_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{wedding.creator_name}</p>
                      <p className="text-sm text-gray-500">Wedding Host</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Wedding
                </Button>
                {wedding.recording_url && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={wedding.recording_url} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Recording
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Premium Locked Message */}
            {wedding.is_locked && (
              <Card className="border-rose-200 bg-rose-50">
                <CardHeader>
                  <CardTitle className="text-lg text-rose-900">Premium Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-rose-800 mb-4">
                    This wedding content is currently locked. The host needs to upgrade to Premium to unlock streaming.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comments Section - Replaces Live Chat */}
            <CommentsSection weddingId={weddingId} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with SocketProvider for real-time features
export default function WeddingViewPage({ params }) {
  return (
    <SocketProvider weddingId={params.id}>
      <WeddingViewPageContent params={params} />
    </SocketProvider>
  );
}
