'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Video,
  Users,
  Calendar,
  MapPin,
  Heart,
  Eye,
  Loader2,
  Settings,
  Image as ImageIcon,
  Crown,
  ExternalLink,
  Copy,
  Lock,
  MessageSquare,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import MediaUploadChunked from '@/components/MediaUploadChunked';
import MediaGallery from '@/components/MediaGallery';
import StorageWidget from '@/components/StorageWidget';
import QualityControl from '@/components/QualityControl';
import MultiCameraManager from '@/components/MultiCameraManager';
import FolderManagerNested from '@/components/FolderManagerNested';
import ThemeManager from '@/components/ThemeManager';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import CommentsSection from '@/components/CommentsSection';
import ThemeSelector from '@/components/ThemeSelector';
import CategoryPhotoUpload from '@/components/CategoryPhotoUpload';
import BorderStyleCustomizer from '@/components/BorderStyleCustomizer';
import YouTubeBroadcastControls from '@/components/YouTubeBroadcastControls';
import YouTubeBroadcastsList from '@/components/YouTubeBroadcastsList';
import TemplateSelector from '@/components/TemplateSelector';
import StreamViewMusicPlayer from '@/components/StreamViewMusicPlayer';

import AlbumManager from '@/components/AlbumManager';
function ManagePageContent({ params }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const weddingId = params.id;

  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamActive, setStreamActive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [refreshGallery, setRefreshGallery] = useState(0);
  const [weddingSettings, setWeddingSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [localStreamingType, setLocalStreamingType] = useState('weblive');
  const [skipStreamingTypeUpdate, setSkipStreamingTypeUpdate] = useState(false);
  
  const isPremium = user?.subscription_plan === 'monthly' || user?.subscription_plan === 'yearly';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && weddingId) {
      loadWedding();
    }
    
    // FIX 4: Listen for background update events from ThemeManager
    // Optimized to only update backgrounds without full page reload
    const handleBackgroundUpdate = (event) => {
      console.log('[FIX 4] Background update event received in manage page:', event.detail);
      // Update only the backgrounds in state without full reload
      if (event.detail?.updates) {
        setWedding(prev => ({
          ...prev,
          backgrounds: {
            ...prev.backgrounds,
            ...event.detail.updates
          }
        }));
        console.log('[FIX 4] Wedding backgrounds updated in state (no page refresh)');
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('wedding-backgrounds-updated', handleBackgroundUpdate);
      
      return () => {
        window.removeEventListener('wedding-backgrounds-updated', handleBackgroundUpdate);
      };
    }
  }, [user, authLoading, weddingId]);

  const loadWedding = async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Loading wedding with ID:', weddingId);
      const response = await api.get(`/api/weddings/${weddingId}`);
      const weddingData = response.data;
      
      console.log('DEBUG: Wedding data received:', weddingData);
      
      // CRITICAL FIX: Validate wedding data before setting state
      if (!weddingData || typeof weddingData !== 'object') {
        console.error('Invalid wedding data received:', weddingData);
        toast.error('Invalid wedding data received');
        router.push('/dashboard');
        return;
      }
      
      // Check if user is the creator - with proper null safety
      if (user && user.id && weddingData.creator_id !== user.id) {
        toast.error('You do not have permission to manage this wedding');
        router.push('/dashboard');
        return;
      }

      console.log('DEBUG: Theme settings before processing:', weddingData.theme_settings);

      // Ensure theme_settings exists with ALL nested objects properly initialized
      if (!weddingData.theme_settings || typeof weddingData.theme_settings !== 'object') {
        console.log('DEBUG: Creating default theme_settings');
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

      console.log('DEBUG: Final theme_settings:', weddingData.theme_settings);
      console.log('DEBUG: Cover photos count:', weddingData.theme_settings.cover_photos.length);
      console.log('DEBUG: Theme assets:', weddingData.theme_settings.theme_assets);

      setWedding(weddingData);
      setStreamActive(weddingData.status === 'live');
      setViewerCount(weddingData.viewers_count || 0);
      const newStreamingType = weddingData.streaming_type || 'weblive';
      console.log('DEBUG: Wedding streaming_type:', weddingData.streaming_type);
      console.log('DEBUG: Setting localStreamingType to:', newStreamingType);
      console.log('DEBUG: skipStreamingTypeUpdate:', skipStreamingTypeUpdate);
      
      // Only update local streaming type if we haven't just changed it manually
      if (!skipStreamingTypeUpdate) {
        setLocalStreamingType(newStreamingType);
      } else {
        // Reset the flag after checking
        setSkipStreamingTypeUpdate(false);
      }
    } catch (error) {
      console.error('Error loading wedding:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load wedding details';
      toast.error(errorMessage);
      
      // Don't redirect on network errors, only on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };


  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleMediaUploadComplete = () => {
    // Trigger gallery refresh
    setRefreshGallery(prev => prev + 1);
    toast.success('Media uploaded successfully!');
  };

  const loadWeddingSettings = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}/settings`);
      setWeddingSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleUpdateSettings = async (field, value) => {
    try {
      setSavingSettings(true);
      await api.put(`/api/weddings/${weddingId}/settings`, {
        [field]: value
      });
      toast.success('Settings updated');
      loadWeddingSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (weddingId && user) {
      loadWeddingSettings();
    }
  }, [weddingId, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!wedding) {
    return null;
  }

  const publicUrl = `${window.location.origin}/weddings/${weddingId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-lg">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Manage Wedding</h1>
                  <p className="text-xs text-gray-600">{wedding.title}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {wedding.is_locked && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </Badge>
              )}
              <Badge
                variant={streamActive ? 'default' : 'secondary'}
                className={streamActive ? 'bg-red-500 animate-pulse' : ''}
              >
                {streamActive ? 'LIVE' : wedding.status}
              </Badge>
              <Link href={`/weddings/${weddingId}`} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wedding Locked Alert */}
            {wedding.is_locked && (
              <Alert variant="destructive">
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  This wedding is locked because your premium subscription has expired. 
                  <Link href="/pricing" className="font-semibold underline ml-1">
                    Upgrade to Premium
                  </Link> to unlock and start streaming.
                </AlertDescription>
              </Alert>
            )}

            {/* Tabs for different sections */}
            <Tabs defaultValue="stream" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="stream">
                  <Video className="w-4 h-4 mr-2" />
                  Stream
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="media">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Stream Tab */}
              <TabsContent value="stream" className="space-y-6">
                {/* Streaming Mode Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Streaming Type</CardTitle>
                    <CardDescription>
                      Choose between WebLive custom RTMP or YouTube Live Streaming
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="streamingType"
                            value="weblive"
                            checked={localStreamingType === 'weblive'}
                            onChange={async (e) => {
                              if (wedding.status === 'live' || wedding.status === 'paused') {
                                toast.error('Cannot change streaming type during an active stream');
                                return;
                              }
                              const previousType = localStreamingType;
                              setLocalStreamingType('weblive'); // Update UI immediately
                              try {
                                const response = await api.put(`/api/weddings/${weddingId}/streaming-type?streaming_type=weblive`);
                                console.log('DEBUG: Streaming type update response:', response.data);
                                toast.success('Switched to WebLive Streaming');
                                // Set flag to prevent loadWedding from overwriting our change
                                setSkipStreamingTypeUpdate(true);
                                console.log('DEBUG: API call successful, keeping local state');
                              } catch (error) {
                                console.error('DEBUG: Failed to update streaming type:', error);
                                toast.error(error.response?.data?.detail || 'Failed to update streaming type');
                                setLocalStreamingType(previousType); // Revert state on error
                              }
                            }}
                            disabled={wedding.status === 'live' || wedding.status === 'paused'}
                            className="w-4 h-4 text-rose-500"
                          />
                          <span className="text-sm font-medium">WebLive Streaming (Default)</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="streamingType"
                            value="youtube"
                            checked={localStreamingType === 'youtube'}
                            onChange={async (e) => {
                              if (wedding.status === 'live' || wedding.status === 'paused') {
                                toast.error('Cannot change streaming type during an active stream');
                                return;
                              }
                              const previousType = localStreamingType;
                              console.log('DEBUG: Changing streaming type from', previousType, 'to youtube');
                              setLocalStreamingType('youtube'); // Update UI immediately
                              try {
                                const response = await api.put(`/api/weddings/${weddingId}/streaming-type?streaming_type=youtube`);
                                console.log('DEBUG: Streaming type update response:', response.data);
                                toast.success('Switched to YouTube Live Streaming');
                                // Set flag to prevent loadWedding from overwriting our change
                                setSkipStreamingTypeUpdate(true);
                                console.log('DEBUG: API call successful, keeping local state');
                              } catch (error) {
                                console.error('DEBUG: Failed to update streaming type:', error);
                                toast.error(error.response?.data?.detail || 'Failed to update streaming type');
                                setLocalStreamingType(previousType); // Revert state on error
                              }
                            }}
                            disabled={wedding.status === 'live' || wedding.status === 'paused'}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-sm font-medium">YouTube Live Streaming</span>
                        </label>
                      </div>
                      
                      {(wedding.status === 'live' || wedding.status === 'paused') && (
                        <Alert>
                          <Lock className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Streaming type is locked during an active stream. End the stream to switch modes.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Live Stream Status & Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Live Stream Status
                    </CardTitle>
                    <CardDescription>
                      Manage your wedding stream lifecycle - OBS controls stream presence, you control when it ends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Stream Status Display */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          wedding.status === 'live' ? 'bg-red-500 animate-pulse' : 
                          wedding.status === 'paused' ? 'bg-yellow-500' : 
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-semibold">
                            {wedding.status === 'live' ? 'LIVE' : 
                             wedding.status === 'paused' ? 'PAUSED' : 
                             'ENDED'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {wedding.status === 'live' ? 'Streaming in progress' : 
                             wedding.status === 'paused' ? 'Stream paused - waiting for OBS reconnect' : 
                             'Stream has ended'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Viewers</p>
                        <p className="text-2xl font-bold">{viewerCount}</p>
                      </div>
                    </div>

                    {/* Stream Control Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* OBS Status Indicator */}
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            streamActive ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium">OBS Status</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {streamActive ? 'OBS is connected and streaming' : 'OBS is disconnected'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          OBS start/stop controls stream presence only
                        </p>
                      </div>

                      {/* Current State Description */}
                      <div className="p-4 border rounded-lg bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Viewer Experience</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {wedding.status === 'live' ? 'Viewers see live stream' : 
                           wedding.status === 'paused' ? 'Viewers see "Be Right Back" screen' : 
                           'Viewers see replay and highlights'}
                        </p>
                      </div>

                      {/* Host Control */}
                      <div className="p-4 border rounded-lg bg-rose-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="w-4 h-4 text-rose-600" />
                          <span className="text-sm font-medium">Host Control</span>
                        </div>
                        <p className="text-xs text-gray-600">Only you can end the live stream</p>
                      </div>
                    </div>

                    {/* End Live Stream Button */}
                    {(wedding.status === 'live' || wedding.status === 'paused') && (
                      <div className="pt-4 border-t">
                        <Button
                          variant="destructive"
                          size="lg"
                          className="w-full"
                          onClick={async () => {
                            if (confirm('Are you sure you want to end the live stream? This will finalize the recording and show replay to viewers. This action cannot be undone.')) {
                              try {
                                setLoading(true);
                                // Refresh wedding data first to ensure current state
                                await loadWedding();
                                await api.post(`/api/weddings/${weddingId}/live/end`);
                                toast.success('Live stream ended successfully! Recording is being processed.');
                                loadWedding(); // Reload to get updated status
                              } catch (error) {
                                console.error('Error ending live stream:', error);
                                if (error.response?.data?.detail?.includes('Cannot end from')) {
                                  toast.error('Cannot end live stream: Stream is not currently active');
                                } else {
                                  toast.error('Failed to end live stream');
                                }
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          disabled={loading}
                        >
                          <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          End Live Stream
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          This will merge recordings, upload to CDN, and show replay to viewers
                        </p>
                      </div>
                    )}

                    {/* Stream Ended Info */}
                    {wedding.status === 'ended' && (
                      <div className="pt-4 border-t">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="font-semibold text-green-800">Stream Successfully Ended</p>
                          <p className="text-sm text-green-600 mt-1">
                            Recording has been processed and is available for replay
                          </p>
                          {wedding.recording_url && (
                            <Button
                              variant="outline"
                              className="mt-3"
                              asChild
                            >
                              <a href={wedding.recording_url} target="_blank">
                                <Play className="w-4 h-4 mr-2" />
                                View Recording
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* WebLive RTMP Credentials */}
                {localStreamingType === 'weblive' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>WebLive - RTMP Credentials</CardTitle>
                      <CardDescription>
                        Use these credentials in OBS Studio or your streaming software
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {wedding.stream_credentials ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Server URL</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={wedding.stream_credentials.rtmp_url}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(wedding.stream_credentials.rtmp_url, 'Server URL')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Stream Key</label>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                value={wedding.stream_credentials.stream_key}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(wedding.stream_credentials.stream_key, 'Stream Key')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <Alert>
                            <Video className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Keep your stream key private! Anyone with this key can stream to your wedding.
                            </AlertDescription>
                          </Alert>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">Loading credentials...</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* YouTube Streaming */}
                {localStreamingType === 'youtube' && (
                  <>
                    {/* YouTube Connection Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle>YouTube Account</CardTitle>
                        <CardDescription>
                          Connect your YouTube account to stream live
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {wedding.youtube_settings?.auth_connected ? (
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-semibold text-green-800">YouTube Connected</p>
                                <p className="text-sm text-green-600">Ready to stream</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm('Are you sure you want to disconnect YouTube?')) {
                                  try {
                                    await api.get(`/api/youtube/disconnect/${weddingId}`);
                                    toast.success('YouTube disconnected');
                                    loadWedding();
                                  } catch (error) {
                                    toast.error('Failed to disconnect YouTube');
                                  }
                                }
                              }}
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Alert>
                              <AlertDescription>
                                Connect your YouTube account to enable live streaming to your YouTube channel
                              </AlertDescription>
                            </Alert>
                            <Button
                              onClick={async () => {
                                try {
                                  setLoading(true);
                                  const response = await api.post('/api/youtube/connect', {
                                    wedding_id: weddingId
                                  });
                                  // Store state and wedding_id in sessionStorage for callback
                                  sessionStorage.setItem('youtube_state', response.data.state);
                                  sessionStorage.setItem('youtube_wedding_id', weddingId);
                                  // Redirect to YouTube OAuth
                                  window.location.href = response.data.oauth_url;
                                } catch (error) {
                                  toast.error('Failed to initiate YouTube connection');
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                              className="w-full bg-red-600 hover:bg-red-700"
                            >
                              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Connect YouTube Account
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* YouTube RTMP Credentials */}
                    {wedding.youtube_settings?.auth_connected && wedding.youtube_settings?.broadcast_id && (
                      <Card>
                        <CardHeader>
                          <CardTitle>YouTube - RTMP Credentials</CardTitle>
                          <CardDescription>
                            Use these credentials in OBS Studio to stream to YouTube
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {wedding.stream_credentials && wedding.youtube_settings?.stream_id ? (
                            <>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Stream Server URL</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={wedding.stream_credentials.rtmp_url || 'rtmp://a.rtmp.youtube.com/live2'}
                                    readOnly
                                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(wedding.stream_credentials.rtmp_url || 'rtmp://a.rtmp.youtube.com/live2', 'Server URL')}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Stream Key</label>
                                <div className="flex gap-2">
                                  <input
                                    type="password"
                                    value={wedding.stream_credentials.stream_key || '••••••••••••••••'}
                                    readOnly
                                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (wedding.stream_credentials?.stream_key) {
                                        copyToClipboard(wedding.stream_credentials.stream_key, 'Stream Key');
                                      } else {
                                        toast.error('Stream key not available');
                                      }
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {wedding.youtube_settings?.youtube_video_url && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">YouTube Video URL</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={wedding.youtube_settings.youtube_video_url}
                                      readOnly
                                      className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(wedding.youtube_settings.youtube_video_url, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <Alert>
                                <Video className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  Stream to YouTube using these credentials. Your stream will be visible on your YouTube channel.
                                </AlertDescription>
                              </Alert>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-600 mb-3">No broadcast created yet</p>
                              <Button
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    await api.post(`/api/youtube/create-broadcast/${weddingId}`);
                                    toast.success('YouTube broadcast created successfully');
                                    loadWedding();
                                  } catch (error) {
                                    toast.error(error.response?.data?.detail || 'Failed to create broadcast');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Create YouTube Broadcast
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* YouTube Broadcast Controls */}
                    {wedding.youtube_settings?.auth_connected && wedding.youtube_settings?.broadcast_id && (
                      <YouTubeBroadcastControls
                        weddingId={weddingId}
                        wedding={wedding}
                        onStatusChange={loadWedding}
                      />
                    )}

                    {/* Previous YouTube Broadcasts List */}
                    {wedding.youtube_settings?.auth_connected && (
                      <YouTubeBroadcastsList
                        weddingId={weddingId}
                        wedding={wedding}
                      />
                    )}
                  </>
                )}

                {/* Quality Control with Recording */}
                <QualityControl weddingId={weddingId} isPremium={isPremium} isLive={streamActive} />

                {/* Multi-Camera Manager */}
                <MultiCameraManager 
                  weddingId={weddingId} 
                  isPremium={isPremium}
                  rtmpUrl={wedding?.stream_credentials?.rtmp_url}
                />

                {/* Comments Section - Visible when stream is active */}
                {streamActive && (
                  <CommentsSection weddingId={weddingId} />
                )}
              </TabsContent>

              {/* Layout Tab - Enhanced with Wedding Layout Settings */}
              <TabsContent value="layout" className="space-y-6">
                {/* Video Template Selector */}
                <TemplateSelector 
                  weddingId={weddingId} 
                  currentTemplateId={wedding?.template_assignment?.template_id}
                  onTemplateAssigned={() => {
                    toast.success('Template assigned! Your wedding data will be automatically populated.');
                    loadWedding();
                  }}
                />

                {/* Layout Customization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Wedding Layout Customization
                    </CardTitle>
                    <CardDescription>
                      Select a layout structure, upload photos by category, and customize borders & styles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Layout settings managed by LayoutManager below */}
                    <p className="text-sm text-gray-600">
                      Choose your layout structure and customize photos, colors, fonts, and borders below.
                    </p>
                  </CardContent>
                </Card>

                {/* Wedding Layout Settings - Core Component */}
                <ThemeManager weddingId={weddingId} wedding={wedding} />

              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
                <Tabs defaultValue="albums" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent gap-6">
                        <TabsTrigger value="albums" className="rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 data-[state=active]:bg-transparent px-0 py-2">Albums & Slideshows</TabsTrigger>
                        <TabsTrigger value="gallery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 data-[state=active]:bg-transparent px-0 py-2">All Media Gallery</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="albums" className="mt-6">
                        <AlbumManager weddingId={weddingId} />
                    </TabsContent>
                    
                    <TabsContent value="gallery" className="mt-6 space-y-6">
                        {/* Folder Manager */}
                        <FolderManagerNested 
                          weddingId={weddingId}
                          onFolderSelect={(folderId) => {
                            console.log('Selected folder:', folderId);
                            // You can filter media gallery by folder here
                          }}
                        />
                        
                        {/* Media Upload */}
                        <MediaUploadChunked 
                          weddingId={weddingId} 
                          onUploadComplete={handleMediaUploadComplete}
                        />
                        
                        {/* Media Gallery */}
                        <MediaGallery 
                          key={refreshGallery} 
                          weddingId={weddingId} 
                          isCreator={true} 
                        />
                    </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Settings Tab - Cleaned up without Theme Settings */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Wedding Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Couple</label>
                        <p className="text-lg font-semibold flex items-center gap-2">
                          <Heart className="w-5 h-5 text-rose-500" />
                          {wedding.bride_name} & {wedding.groom_name}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <label className="text-sm font-medium text-gray-500">Date & Time</label>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(wedding.scheduled_date), 'PPP')}
                        </p>
                        <p className="text-sm text-gray-600 ml-6">
                          {format(new Date(wedding.scheduled_date), 'p')}
                        </p>
                      </div>

                      {wedding.location && (
                        <>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Location</label>
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {wedding.location}
                            </p>
                          </div>
                        </>
                      )}

                      {wedding.description && (
                        <>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-500">Description</label>
                            <p className="text-gray-700 mt-1">{wedding.description}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Media Management Settings */}
                {weddingSettings && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Media & Access Settings</CardTitle>
                      <CardDescription>
                        Control how guests interact with your wedding content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Auto Delete Media */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Auto Delete Media</label>
                          <p className="text-xs text-gray-500">
                            Automatically delete media after a specified period
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpdateSettings('auto_delete_media', !weddingSettings.auto_delete_media)}
                          disabled={savingSettings}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            weddingSettings.auto_delete_media ? 'bg-rose-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              weddingSettings.auto_delete_media ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {weddingSettings.auto_delete_media && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Delete after (days)</label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={weddingSettings.auto_delete_days}
                            onChange={(e) => handleUpdateSettings('auto_delete_days', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                      )}

                      <Separator />

                      {/* Enable Download */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Enable Download</label>
                          <p className="text-xs text-gray-500">
                            Allow guests to download photos and videos
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpdateSettings('enable_download', !weddingSettings.enable_download)}
                          disabled={savingSettings}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            weddingSettings.enable_download ? 'bg-rose-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              weddingSettings.enable_download ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <Separator />

                      {/* Enable Sharing */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Enable Sharing/Embed</label>
                          <p className="text-xs text-gray-500">
                            Allow guests to share wedding page and embed media
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpdateSettings('enable_sharing', !weddingSettings.enable_sharing)}
                          disabled={savingSettings}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            weddingSettings.enable_sharing ? 'bg-rose-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              weddingSettings.enable_sharing ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <Separator />

                      {/* Viewer Limit */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Viewer Limit</label>
                            <p className="text-xs text-gray-500">
                              Maximum number of concurrent viewers (leave empty for unlimited)
                            </p>
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="Unlimited"
                          value={weddingSettings.viewer_limit || ''}
                          onChange={(e) => handleUpdateSettings('viewer_limit', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <Separator />

                      {/* Playback Quality */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Playback Quality Options</label>
                        <p className="text-xs text-gray-500 mb-2">
                          Quality options available to viewers
                        </p>
                        <select
                          value={weddingSettings.playback_quality}
                          onChange={(e) => handleUpdateSettings('playback_quality', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="auto">Auto (Adaptive)</option>
                          <option value="720p">720p Maximum</option>
                          <option value="1080p">1080p Maximum</option>
                          <option value="4K">4K Maximum</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Public URL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Your Wedding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-xs text-gray-500 mb-1">Public URL</p>
                  <p className="text-sm font-mono break-all">{publicUrl}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyToClipboard(publicUrl, 'Wedding URL')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </CardContent>
            </Card>

            {/* Storage Widget */}
            <StorageWidget token={user?.access_token || localStorage.getItem('token')} />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={streamActive ? 'default' : 'secondary'}>
                    {wedding.status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Viewers</span>
                  <span className="font-semibold">{viewerCount}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Views</span>
                  <span className="font-semibold">{wedding.viewers_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with SocketProvider for real-time features
export default function ManagePage({ params }) {
  return (
    <SocketProvider>
      <ManagePageContent params={params} />
    </SocketProvider>
  );
}
