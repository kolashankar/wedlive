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
  Sparkles
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
  
  const isPremium = user?.subscription_plan === 'monthly' || user?.subscription_plan === 'yearly';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && weddingId) {
      loadWedding();
    }
  }, [user, authLoading, weddingId]);

  const loadWedding = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/weddings/${weddingId}`);
      const weddingData = response.data;
      
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
      setStreamActive(weddingData.status === 'live');
      setViewerCount(weddingData.viewers_count || 0);
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
                <TabsTrigger value="theme">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Theme
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
                {/* RTMP Credentials */}
                <Card>
                  <CardHeader>
                    <CardTitle>Main Camera - RTMP Credentials</CardTitle>
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

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
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

              {/* Settings Tab */}
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

                {/* Theme Settings */}
                <ThemeManager weddingId={weddingId} />

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
