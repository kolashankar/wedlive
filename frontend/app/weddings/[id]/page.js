'use client';
import { useState, useEffect, useCallback } from 'react';
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
import LayoutRenderer from '@/components/LayoutRenderer';
import CommentsSection from '@/components/CommentsSection';
import { SocketProvider } from '@/contexts/SocketContext';
import ErrorBoundary from '@/components/ErrorBoundary';

function WeddingViewPageContent({ params, searchParams }) {
  const router = useRouter();
  const weddingId = params.id;
  
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [showTheme, setShowTheme] = useState(null); // null = checking, true = show theme, false = skip theme
  const [isMounted, setIsMounted] = useState(false); // Fix hydration mismatch
  const [videoTemplate, setVideoTemplate] = useState(null); // Video template data

  // Check if live=true parameter is present to skip theme
  const skipTheme = searchParams?.live === 'true';

  // FIX 2 & 3: Stream Page Background with fixed attachment
  // Use resolved background URL from backend (wedding.backgrounds)
  const streamBackgroundUrl = wedding?.backgrounds?.stream_page_background_url || null;

  const streamBackgroundStyle = streamBackgroundUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.22)), url(${streamBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // FIX 4: Fixed to viewport for parallax effect
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh', // FIX 4: Ensure background covers full viewport height
        width: '100%',
      }
    : { minHeight: '100vh', width: '100%' }; // Ensure consistent sizing even without background
  
  // Enhanced debug for stream background
  console.log('[STREAM_VIEW] Stream Background Debug:', {
    hasBackgroundsObject: !!wedding?.backgrounds,
    streamBackgroundUrl,
    hasStyle: !!streamBackgroundStyle,
    wedding_backgrounds: wedding?.backgrounds
  });
  
  // Log warning if background is expected but not found
  if (!streamBackgroundUrl && wedding?.backgrounds?.stream_page_background_id) {
    console.warn('[STREAM_VIEW] Stream background ID exists but URL is missing!', {
      id: wedding.backgrounds.stream_page_background_id,
      backgrounds: wedding.backgrounds
    });
  } else if (!streamBackgroundUrl) {
    console.info('[STREAM_VIEW] No stream background configured (this is normal if not set)');
  }

  // Fix hydration mismatch by detecting client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadWedding = useCallback(async () => {
    try {
      console.log('Loading wedding with ID:', weddingId);
      const response = await api.get(`/api/weddings/${weddingId}`);
      const weddingData = response.data;
      
      console.log('Wedding data loaded:', weddingData);
      
      // FIX 3: Enhanced logging for backgrounds on initial load
      if (weddingData.backgrounds) {
        console.log('[FIX 3] Initial backgrounds loaded:', {
          layout_page_background_id: weddingData.backgrounds.layout_page_background_id,
          layout_page_background_url: weddingData.backgrounds.layout_page_background_url,
          stream_page_background_id: weddingData.backgrounds.stream_page_background_id,
          stream_page_background_url: weddingData.backgrounds.stream_page_background_url
        });
      } else {
        console.warn('[FIX 3] No backgrounds data in wedding response');
      }
      
      // CRITICAL FIX: Validate wedding data before setting state
      if (!weddingData || typeof weddingData !== 'object') {
        console.error('Invalid wedding data received:', weddingData);
        toast.error('Invalid wedding data received');
        setLoading(false);
        return;
      }
      
      // Ensure theme_settings exists with ALL nested objects properly initialized
      if (!weddingData.theme_settings || typeof weddingData.theme_settings !== 'object') {
        console.log('Initializing default theme_settings');
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
            default_image_url: '',
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
      
      // Fetch video template if assigned
      try {
        const viewerResponse = await api.get(`/api/viewer/wedding/${weddingId}/all`);
        if (viewerResponse.data?.video_template) {
          setVideoTemplate(viewerResponse.data.video_template);
          console.log('Video template loaded:', viewerResponse.data.video_template);
        } else {
          setVideoTemplate(null);
          console.log('No video template assigned to this wedding');
        }
      } catch (error) {
        console.error('Error loading video template:', error);
        setVideoTemplate(null);
      }
      
      // Determine if we should show theme based on live parameter
      // FIX 2: Properly check theme settings and subscription before showing layout
      const hasThemeSettings = weddingData.theme_settings && 
                               typeof weddingData.theme_settings === 'object' &&
                               Object.keys(weddingData.theme_settings).length > 0;
      const isPremium = weddingData.creator_subscription_plan && weddingData.creator_subscription_plan !== 'free';
      
      // If live=true, always show stream view (skipTheme = true, showTheme = false)
      // If no live param, show layout only if premium and has theme settings
      if (skipTheme) {
        setShowTheme(false); // Force streaming view when live=true
      } else {
        setShowTheme(isPremium && hasThemeSettings); // Show layout only if conditions met
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load wedding details');
      console.error('Error loading wedding:', error);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  const updateViewerCount = useCallback(async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}`);
      setViewerCount(response.data.viewers_count || 0);
      
      // Also update wedding data to get latest theme settings
      if (response.data.theme_settings) {
        setWedding(prev => ({
          ...prev,
          theme_settings: response.data.theme_settings
        }));
      }
      
      // FIX 3: Improved background update detection with better logging
      if (response.data.backgrounds) {
        const currentBgUrl = wedding?.backgrounds?.stream_page_background_url;
        const newBgUrl = response.data.backgrounds?.stream_page_background_url;
        
        if (currentBgUrl !== newBgUrl) {
          console.log('[FIX 3] Background change detected in updateViewerCount:', { 
            old: currentBgUrl, 
            new: newBgUrl 
          });
          setWedding(prev => ({
            ...prev,
            backgrounds: response.data.backgrounds
          }));
          console.log('[FIX 3] Stream page background updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  }, [wedding]);

  // useEffect hooks - all must be called unconditionally at the top level
  useEffect(() => {
    if (weddingId) {
      loadWedding();
    }
  }, [weddingId, loadWedding]);

  useEffect(() => {
    if (!weddingId) return;
    const interval = setInterval(() => {
      updateViewerCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [weddingId, updateViewerCount]);

  // FIX 2: Apply background to body element so it covers entire page/all sections
  // This should work for BOTH theme view and stream view
  useEffect(() => {
    if (!streamBackgroundUrl) return;
    
    // Apply background to body element for full-page coverage
    const originalBackground = document.body.style.background;
    const originalBackgroundImage = document.body.style.backgroundImage;
    const originalBackgroundSize = document.body.style.backgroundSize;
    const originalBackgroundPosition = document.body.style.backgroundPosition;
    const originalBackgroundAttachment = document.body.style.backgroundAttachment;
    const originalBackgroundRepeat = document.body.style.backgroundRepeat;
    const originalMinHeight = document.body.style.minHeight;
    
    // Apply background to body - works for ALL sections and pages
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.22)), url(${streamBackgroundUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.minHeight = '100vh';
    
    console.log('[FIX 2] Applied stream background to body element (covers all sections):', streamBackgroundUrl);
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.background = originalBackground;
      document.body.style.backgroundImage = originalBackgroundImage;
      document.body.style.backgroundSize = originalBackgroundSize;
      document.body.style.backgroundPosition = originalBackgroundPosition;
      document.body.style.backgroundAttachment = originalBackgroundAttachment;
      document.body.style.backgroundRepeat = originalBackgroundRepeat;
      document.body.style.minHeight = originalMinHeight;
      console.log('[FIX 2] Restored original body background');
    };
  }, [streamBackgroundUrl]); // FIX 2: Remove showTheme dependency - apply whenever URL exists

  useEffect(() => {
    if (!showTheme || !weddingId) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/weddings/${weddingId}`);
        if (response.data.theme_settings) {
          setWedding(prev => ({
            ...prev,
            theme_settings: response.data.theme_settings
          }));
        }
        // FIX 2: Enhanced background refresh - detect and apply changes immediately
        if (response.data.backgrounds) {
          const currentBgUrl = wedding?.backgrounds?.stream_page_background_url;
          const newBgUrl = response.data.backgrounds?.stream_page_background_url;
          
          if (currentBgUrl !== newBgUrl) {
            console.log('[FIX 2] Background changed detected during polling:', { 
              old: currentBgUrl, 
              new: newBgUrl 
            });
            setWedding(prev => ({
              ...prev,
              backgrounds: response.data.backgrounds
            }));
            
            // Show user feedback about background change
            console.log('[FIX 2] Stream background updated automatically');
          }
        }
      } catch (error) {
        console.error('Error refreshing theme settings:', error);
      }
    }, 10000); // Refresh every 10 seconds when theme is shown
    
    return () => clearInterval(interval);
  }, [showTheme, weddingId, wedding]);

  // Listen for background update events for immediate updates (no waiting for polling)
  useEffect(() => {
    const handleBackgroundUpdate = async (event) => {
      console.log('[BACKGROUND_UPDATE] Background update event received, reloading wedding data...', event.detail);
      
      // For background updates, do a hard reload to ensure changes are visible
      // This prevents caching issues and ensures the new background shows immediately
      if (event.detail?.updates) {
        console.log('[BACKGROUND_UPDATE] Reloading page to apply background changes');
        // Small delay to let the toast show
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('wedding-backgrounds-updated', handleBackgroundUpdate);
      
      return () => {
        window.removeEventListener('wedding-backgrounds-updated', handleBackgroundUpdate);
      };
    }
  }, [weddingId]);

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
  
  // CRITICAL FIX: Double-check theme_settings exists before showing layout
  if (showTheme && wedding && wedding.theme_settings && typeof wedding.theme_settings === 'object') {
    return (
      <LayoutRenderer 
        wedding={wedding}
        videoTemplate={videoTemplate}
        onEnter={handleEnterWedding}
      />
    );
  }

  // Main wedding stream view
  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-white to-purple-50"
      style={streamBackgroundStyle}
    >
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
                {wedding.status === 'live' && wedding.stream_call_id ? (
                  <div className="absolute inset-0">
                    <StreamVideoPlayer
                      playbackUrl={wedding.playback_url}
                      themeId={wedding.theme_settings?.theme_id}
                      streamBorderUrl={wedding.theme_settings?.theme_assets?.stream_border_url}
                    />
                  </div>
                ) : wedding.status === 'recorded' && wedding.recording_url ? (
                  <div className="absolute inset-0">
                    <StreamVideoPlayer
                      playbackUrl={wedding.recording_url}
                      themeId={wedding.theme_settings?.theme_id}
                      streamBorderUrl={wedding.theme_settings?.theme_assets?.stream_border_url}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold mb-2">
                        {wedding.status === 'scheduled' ? 'Stream Not Started Yet' : 'Stream Ended'}
                      </p>
                      {isMounted && (
                        <p className="text-sm opacity-75">
                          {wedding.status === 'scheduled' 
                            ? `Scheduled for ${format(new Date(wedding.scheduled_date), 'PPP p')}`
                            : 'This wedding stream has ended'}
                        </p>
                      )}
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
                  {isMounted && (
                    <>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5 text-rose-500" />
                        <span>{format(new Date(wedding.scheduled_date), 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-5 h-5 text-rose-500" />
                        <span>{format(new Date(wedding.scheduled_date), 'h:mm a')}</span>
                      </div>
                    </>
                  )}
                  {wedding.location && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-5 h-5 text-rose-500" />
                      <span>{wedding.location}</span>
                    </div>
                  )}
                  {wedding.status === 'live' && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Users className="w-5 h-5 text-rose-500" />
                      <span suppressHydrationWarning>{viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'} watching</span>
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

// Wrap the component with SocketProvider and ErrorBoundary for real-time features and error handling
export default function WeddingViewPage({ params, searchParams }) {
  return (
    <ErrorBoundary>
      <SocketProvider weddingId={params.id}>
        <WeddingViewPageContent params={params} searchParams={searchParams} />
      </SocketProvider>
    </ErrorBoundary>
  );
}
