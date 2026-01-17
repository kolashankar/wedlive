'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, 
  Play, 
  Image as ImageIcon, 
  Camera, 
  Download, 
  Share2, 
  Users, 
  Calendar,
  MapPin,
  Heart,
  Loader2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import StreamVideoPlayer from '@/components/StreamVideoPlayer';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import CommentsSection from '@/components/CommentsSection';
import QualityControl from '@/components/QualityControl';
import SlideshowPlayer from '@/components/SlideshowPlayer';

import LayoutRenderer from './layouts/LayoutRenderer';
function ViewerContent({ weddingId }) {
  const router = useRouter();
  const { viewerCount } = useSocket();
  
  const [weddingData, setWeddingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const loadWeddingData = useCallback(async () => {
    try {
      const response = await api.get(`/api/viewer/wedding/${weddingId}/all`);
      console.log('API Response:', response.data);
      console.log('Video Template Data:', response.data.video_template);
      setWeddingData(response.data);
      
      // Fetch albums
      try {
        const albumRes = await api.get(`/api/albums/${weddingId}`);
        setAlbums(albumRes.data);
      } catch (err) {
        console.error("Failed to load albums", err);
      }

      // Auto-select appropriate tab
      if (response.data.live_stream.is_live) {
        setActiveTab('live');
      } else if (response.data.recording.available) {
        setActiveTab('recording');
      } else if (response.data.media.total_count > 0) {
        setActiveTab('media');
      }
    } catch (error) {
      console.error('Error loading wedding:', error);
      toast.error('Failed to load wedding data');
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) {
      loadWeddingData();
    }
  }, [weddingId, loadWeddingData]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: weddingData?.wedding.title,
        text: `Watch ${weddingData?.wedding.bride_name} & ${weddingData?.wedding.groom_name}'s wedding!`,
        url: url
      }).catch(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!weddingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Wedding not found</p>
          <Link href="/join">
            <Button>Enter Wedding Code</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { wedding, live_stream, media, recording, branding, access_restricted } = weddingData;
  const primaryColor = branding?.primary_color || '#FF6B6B';

  if (access_restricted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold">Content Locked</h2>
            <p className="text-gray-600">
              {weddingData.restriction_message}
            </p>
            <div className="pt-4">
              <Link href="/join">
                <Button variant="outline">Try Another Wedding</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const playAlbum = async (albumId) => {
      try {
          const res = await api.get(`/api/albums/detail/${albumId}`);
          setSelectedAlbum(res.data);
      } catch (e) {
          toast.error("Could not load album");
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Slideshow Player Overlay */}
      {selectedAlbum && (
        <SlideshowPlayer 
            album={selectedAlbum} 
            onClose={() => setSelectedAlbum(null)} 
        />
      )}

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/join">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="h-8" />
              ) : (
                <div className="flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                  {!branding?.hide_wedlive_branding && (
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      WedLive
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <LayoutRenderer 
        wedding={wedding} 
        themeSettings={weddingData.theme_settings} 
        media={media}
        videoTemplate={weddingData.video_template}
        layoutPhotos={weddingData.layout_photos || {}}
      />

      {/* Wedding Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">


          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
              <TabsTrigger value="live" disabled={!live_stream.is_live}>
                <Video className="w-4 h-4 mr-2" />
                Live
              </TabsTrigger>
              <TabsTrigger value="albums" disabled={albums.length === 0}>
                <Play className="w-4 h-4 mr-2" />
                Albums ({albums.length})
              </TabsTrigger>
              <TabsTrigger value="media" disabled={media.total_count === 0}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Media ({media.total_count})
              </TabsTrigger>
              <TabsTrigger value="recording" disabled={!recording.available}>
                <Download className="w-4 h-4 mr-2" />
                Recording
              </TabsTrigger>
            </TabsList>

            {/* Albums Tab */}
            <TabsContent value="albums">
                {albums.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map((album) => (
                            <Card key={album.id} className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer" onClick={() => playAlbum(album.id)}>
                                <div className="aspect-video bg-gray-100 relative">
                                    {album.cover_photo_url ? (
                                        <img src={album.cover_photo_url} alt={album.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/50 group-hover:scale-110 transition-transform">
                                            <Play className="w-8 h-8 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                        <h3 className="font-bold text-lg">{album.title}</h3>
                                        <p className="text-sm opacity-80">{album.slides?.length || 0} photos</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                     <Card>
                        <CardContent className="py-12 text-center">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No albums created yet</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>

            {/* Live Stream Tab */}
            <TabsContent value="live">
              {live_stream.is_live && live_stream.stream_call_id ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Player */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="p-0">
                        <div className="aspect-video bg-black relative">
                          <StreamVideoPlayer
                            playbackUrl={live_stream.playback_url}
                            autoPlay={true}
                            controls={true}
                            muted={false}
                          />
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Users className="w-5 h-5 text-gray-600" />
                              <span className="text-gray-600">{viewerCount || live_stream.viewers_count} watching</span>
                            </div>
                            {live_stream.has_multi_camera && (
                              <div className="flex items-center space-x-2">
                                <Camera className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-600 font-medium">Multi-Camera</span>
                              </div>
                            )}
                          </div>
                          <Badge className="bg-red-500 text-white animate-pulse">
                            LIVE
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Comments Section - Replaces Live Chat */}
                  <div className="lg:col-span-1">
                    <CommentsSection weddingId={weddingId} />
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Live stream is not currently active</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Media Gallery Tab */}
            <TabsContent value="media">
              {media.recent_items.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.recent_items.map((item) => (
                    <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                      <div className="aspect-square relative">
                        <img
                          src={item.thumbnail_url || item.url}
                          alt={item.caption || 'Media'}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No media uploaded yet</p>
                  </CardContent>
                </Card>
              )}
              {media.total_count > 12 && (
                <div className="text-center mt-6">
                  <Button variant="outline">Load More Media</Button>
                </div>
              )}
            </TabsContent>

            {/* Recording Tab */}
            <TabsContent value="recording">
              {recording.available && recording.url ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-black">
                      <video
                        src={recording.url}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                    <div className="p-4">
                      <Button className="w-full" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Recording
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Recording not available yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Main export with Socket.IO Provider
export default function UnifiedViewerPage({ params }) {
  const weddingId = params.id;
  
  return (
    <SocketProvider weddingId={weddingId}>
      <ViewerContent weddingId={weddingId} />
    </SocketProvider>
  );
}
