'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image, Video, X, Play, Loader2, Download, Calendar, Youtube, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

export default function MediaGallery({ weddingId, isCreator = false }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'photo', 'video'

  useEffect(() => {
    if (weddingId) {
      loadMedia();
    }
  }, [weddingId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      console.log('[MEDIA_GALLERY] Loading media for wedding:', weddingId);
      const response = await api.get(`/api/media/gallery/${weddingId}?include_urls=true`);
      
      console.log('[MEDIA_GALLERY] API response:', response);
      console.log('[MEDIA_GALLERY] Media data:', response.data);
      
      // CRITICAL FIX: Validate response data
      if (!response.data) {
        console.error('[MEDIA_GALLERY] No media data received:', response);
        toast.error('No media data received');
        setMedia([]);
        return;
      }
      
      // Handle both array and object response formats
      const items = Array.isArray(response.data) ? response.data : (response.data.media || []);
      
      console.log('[MEDIA_GALLERY] Processed media items:', items);
      
      if (!Array.isArray(items)) {
        console.error('[MEDIA_GALLERY] Invalid media data format:', response.data);
        toast.error('Invalid media data format');
        setMedia([]);
        return;
      }
      
      // Filter out items with invalid/placeholder file_ids on the frontend as well
      const validItems = items.filter(item => {
        if (!item.file_url) return false;
        
        // Check for placeholder patterns like /file_61, /file_62
        const hasPlaceholder = item.file_url.includes('/file_') && /\/file_\d+/.test(item.file_url);
        if (hasPlaceholder) {
          console.warn('[MEDIA_GALLERY] Filtering out item with placeholder file_id:', item);
          return false;
        }
        
        return true;
      });
      
      if (validItems.length < items.length) {
        const filtered = items.length - validItems.length;
        console.log(`[MEDIA_GALLERY] Filtered out ${filtered} items with placeholder/invalid file references`);
        toast.info(`Note: ${filtered} placeholder image(s) were filtered out. Please upload actual photos.`, {
          duration: 5000
        });
      }
      
      // Log each media item's file URL for debugging
      validItems.forEach((item, index) => {
        console.log(`[MEDIA_GALLERY] Original media item ${index}:`, {
          id: item.id,
          original_file_url: item.file_url,
          media_type: item.media_type
        });
        
        // Handle file_url - preserve Telegram URLs, transform local URLs
        if (item.file_url) {
          // If it's already a full URL (including Telegram), keep it as is
          if (item.file_url.startsWith('http://') || item.file_url.startsWith('https://')) {
            console.log('[MEDIA_GALLERY] Keeping original URL (could be Telegram):', item.file_url);
            // Don't modify Telegram URLs or other external URLs
          } else {
            // Transform local relative URLs to absolute API URLs
            const apiBaseUrl = api.defaults.baseURL;  // Already set from config
            console.log('[MEDIA_GALLERY] API Base URL:', apiBaseUrl);
            // Ensure URL starts with /api/ if it doesn't already
            const normalizedUrl = item.file_url.startsWith('/api/') ? item.file_url : `/api${item.file_url}`;
            const finalUrl = `${apiBaseUrl}${normalizedUrl}`;
            console.log('[MEDIA_GALLERY] URL transformation:', {
              original: item.file_url,
              normalized: normalizedUrl,
              final: finalUrl
            });
            item.file_url = finalUrl;
          }
        }
        console.log(`[MEDIA_GALLERY] Processed media item ${index}:`, {
          id: item.id,
          final_file_url: item.file_url,
          media_type: item.media_type
        });
      });
      
      console.log(`[MEDIA_GALLERY] Setting ${validItems.length} valid media items`);
      setMedia(validItems);
    } catch (error) {
      console.error('[MEDIA_GALLERY] Error loading media:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load media gallery';
      toast.error(errorMessage);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      await api.delete(`/api/media/media/${mediaId}`);
      setMedia(media.filter(m => m.id !== mediaId));
      setSelectedMedia(null);
      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  };

  const filteredMedia = media.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'video') return item.media_type === 'video' || item.media_type === 'youtube_video';
    return item.media_type === filter;
  });

  const photoCount = media.filter(m => m.media_type === 'photo').length;
  const videoCount = media.filter(m => m.media_type === 'video' || m.media_type === 'youtube_video').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (media.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Media Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
              <Image className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No media yet</h3>
            <p className="text-gray-600">
              {isCreator ? 'Upload photos and videos to share memories of this special day' : 'Check back later for photos and videos from this wedding'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Media Gallery
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={filter === 'all' ? 'default' : 'outline'} 
                     className={`cursor-pointer ${filter === 'all' ? 'bg-rose-500' : ''}`}
                     onClick={() => setFilter('all')}>
                All ({media.length})
              </Badge>
              <Badge variant={filter === 'photo' ? 'default' : 'outline'}
                     className={`cursor-pointer ${filter === 'photo' ? 'bg-rose-500' : ''}`}
                     onClick={() => setFilter('photo')}>
                <Image className="w-3 h-3 mr-1" />
                Photos ({photoCount})
              </Badge>
              <Badge variant={filter === 'video' ? 'default' : 'outline'}
                     className={`cursor-pointer ${filter === 'video' ? 'bg-rose-500' : ''}`}
                     onClick={() => setFilter('video')}>
                <Video className="w-3 h-3 mr-1" />
                Videos ({videoCount})
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
                onClick={() => setSelectedMedia(item)}
              >
                {item.media_type === 'photo' ? (
                  <>
                    <img
                      src={item.file_url}
                      alt={item.caption || 'Wedding photo'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        console.error('[MEDIA_GALLERY] Image failed to load:', item.file_url, e);
                        // Check if this is a placeholder/invalid file reference
                        const isPlaceholder = item.file_url && item.file_url.includes('/file_') && /\/file_\d+/.test(item.file_url);
                        if (isPlaceholder) {
                          console.warn('[MEDIA_GALLERY] Detected placeholder image reference:', item.file_url);
                        }
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={(e) => {
                        console.log('[MEDIA_GALLERY] Image loaded successfully:', item.file_url);
                        e.target.nextSibling.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                      <div className="text-center p-4">
                        <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-semibold">Failed to load</p>
                        <p className="text-xs text-gray-400 mt-1">Photo unavailable</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Image className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                ) : item.media_type === 'youtube_video' ? (
                  <>
                    {/* YouTube Video Thumbnail */}
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title || 'YouTube Live Stream'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 opacity-20" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600/90 rounded-full p-4">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                    </div>
                    {/* YouTube Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-600 text-white">
                        <Youtube className="w-3 h-3 mr-1" />
                        YouTube
                      </Badge>
                    </div>
                    {/* View Count */}
                    {item.view_count > 0 && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-black/60 text-white">
                          <Eye className="w-3 h-3 mr-1" />
                          {item.view_count.toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-rose-500 opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 rounded-full p-4">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/60 text-white">
                        <Video className="w-3 h-3 mr-1" />
                        {item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : 'Video'}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Media Viewer Dialog */}
      <Dialog open={selectedMedia !== null} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedMedia && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center">
                    {selectedMedia.media_type === 'photo' ? (
                      <Image className="w-5 h-5 mr-2" />
                    ) : selectedMedia.media_type === 'youtube_video' ? (
                      <Youtube className="w-5 h-5 mr-2 text-red-600" />
                    ) : (
                      <Video className="w-5 h-5 mr-2" />
                    )}
                    {selectedMedia.title || selectedMedia.caption || 'Media'}
                  </DialogTitle>
                  {isCreator && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMedia(selectedMedia.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Media Display */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  {selectedMedia.media_type === 'photo' ? (
                    <>
                      <img
                        src={selectedMedia.file_url}
                        alt={selectedMedia.caption || 'Wedding photo'}
                        className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                        onError={(e) => {
                          console.error('Dialog image failed to load:', selectedMedia.file_url);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          console.log('Dialog image loaded successfully:', selectedMedia.file_url);
                          e.target.nextSibling.style.display = 'none';
                        }}
                      />
                      <div className="w-full h-[60vh] bg-gray-200 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-center">
                          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Image unavailable</p>
                          <p className="text-sm text-gray-400 mt-2">Unable to load image from server</p>
                        </div>
                      </div>
                    </>
                  ) : selectedMedia.media_type === 'youtube_video' ? (
                    <div className="w-full aspect-video">
                      <iframe
                        src={selectedMedia.youtube_url?.includes('youtube.com') || selectedMedia.youtube_url?.includes('youtu.be') 
                          ? selectedMedia.youtube_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                          : selectedMedia.youtube_url}
                        width="100%"
                        height="100%"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <video
                      src={selectedMedia.file_url}
                      controls
                      autoPlay
                      className="w-full h-auto max-h-[60vh] mx-auto"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                {/* Media Info */}
                <div className="space-y-2">
                  {selectedMedia.caption && (
                    <p className="text-sm text-gray-700">{selectedMedia.caption}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(selectedMedia.uploaded_at), 'PPp')}
                      </span>
                      {selectedMedia.media_type === 'video' && selectedMedia.duration && (
                        <span>Duration: {Math.floor(selectedMedia.duration / 60)}:{(selectedMedia.duration % 60).toString().padStart(2, '0')}</span>
                      )}
                      {selectedMedia.media_type === 'youtube_video' && selectedMedia.view_count && (
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedMedia.view_count.toLocaleString()} views
                        </span>
                      )}
                      {selectedMedia.width && selectedMedia.height && (
                        <span>{selectedMedia.width}x{selectedMedia.height}</span>
                      )}
                    </div>
                    {selectedMedia.media_type === 'youtube_video' ? (
                      <a
                        href={selectedMedia.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-red-600 hover:text-red-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Watch on YouTube
                      </a>
                    ) : (
                      <a
                        href={selectedMedia.file_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-rose-600 hover:text-rose-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
