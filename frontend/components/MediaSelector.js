'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Check, Image as ImageIcon, Video as VideoIcon, X, Upload } from 'lucide-react';
import MediaUploadChunked from './MediaUploadChunked';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function MediaSelector({
  isOpen,
  onClose,
  onSelect,
  weddingId,
  maxSelection = 1,
  allowedTypes = ['photo', 'video'], // ['photo', 'video']
  selectedMedia = [],
  category = null, // PROMPT 7: Add category prop for validation
  currentCategoryCount = 0 // PROMPT 7: Current count of photos in this category
}) {
  const [loading, setLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState(selectedMedia);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen && weddingId) {
      loadMedia();
    }
  }, [isOpen, weddingId]);

  useEffect(() => {
    filterMedia();
  }, [mediaItems, searchQuery, activeTab]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/media/gallery/${weddingId}`);
      
      // CRITICAL FIX: Validate response data
      if (!response.data) {
        console.error('No media data received:', response);
        toast.error('No media data received');
        setMediaItems([]);
        return;
      }
      
      // Handle both array and object response formats
      const items = Array.isArray(response.data) ? response.data : (response.data.media || []);
      
      if (!Array.isArray(items)) {
        console.error('Invalid media data format:', response.data);
        toast.error('Invalid media data format');
        setMediaItems([]);
        return;
      }
      
      // Filter by allowed types
      const filteredItems = items.filter(item => 
        allowedTypes.includes(item.media_type)
      );
      
      setMediaItems(filteredItems);
    } catch (error) {
      console.error('Error loading media:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load media gallery';
      toast.error(errorMessage);
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = [...mediaItems];

    // Filter by type (tab)
    if (activeTab === 'photos') {
      filtered = filtered.filter(item => item.media_type === 'photo');
    } else if (activeTab === 'videos') {
      filtered = filtered.filter(item => item.media_type === 'video');
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMedia(filtered);
  };

  const toggleSelection = (item) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      // PROMPT 7: Enforce max 5 precious moments limit
      if (category === 'moment') {
        const totalAfterSelection = currentCategoryCount + selectedItems.length + 1;
        if (totalAfterSelection > 5) {
          toast.error('Maximum 5 precious moments allowed across all layouts');
          return;
        }
      }
      
      if (maxSelection === 1) {
        setSelectedItems([item]);
      } else if (selectedItems.length < maxSelection) {
        setSelectedItems([...selectedItems, item]);
      } else {
        toast.warning(`You can select up to ${maxSelection} items`);
      }
    }
  };

  const handleConfirm = () => {
    onSelect(selectedItems);
    onClose();
  };
  const handleUploadComplete = (newMedia) => {
    loadMedia();
    setActiveTab('all'); // Switch to gallery view to show new media
    // Optionally auto-select the new media?
    // User wants "choose and upload multiple".
    // If they upload one, we switch to gallery.
    // They can then select it.
    // If they want to upload another, they go back to Upload tab.
    toast.success('Media uploaded! Select it from the gallery.');
  };


  const photosCount = mediaItems.filter(item => item.media_type === 'photo').length;
  const videosCount = mediaItems.filter(item => item.media_type === 'video').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Media from Gallery</DialogTitle>
          <DialogDescription>
            Choose {maxSelection === 1 ? 'a photo' : `up to ${maxSelection} photos`} from your uploaded media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({mediaItems.length})
              </TabsTrigger>
              <TabsTrigger value="photos" disabled={!allowedTypes.includes('photo')}>
                <ImageIcon className="w-4 h-4 mr-1" />
                Photos ({photosCount})
              </TabsTrigger>
              <TabsTrigger value="videos" disabled={!allowedTypes.includes('video')}>
                <VideoIcon className="w-4 h-4 mr-1" />
                Videos ({videosCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No media found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload some photos or videos first
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedItems.some(selected => selected.id === item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelection(item)}
                        className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-rose-500 ring-2 ring-rose-200'
                            : 'border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        {item.media_type === 'photo' ? (
                          <img
                            src={item.cdn_url || item.file_url || item.url}
                            alt={item.caption || 'Media'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image load error:', e);
                              console.error('Failed image URL:', item.cdn_url || item.file_url || item.url);
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><span class="text-gray-400 text-xs">Image Error</span></div>';
                            }}
                          />
                        ) : (
                          <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                            <VideoIcon className="w-8 h-8 text-gray-400" />
                            {item.thumbnail_url && (
                              <img
                                src={item.thumbnail_url}
                                alt={item.caption || 'Video'}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-rose-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-rose-500 text-white rounded-full p-2">
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                        
                        {/* Caption overlay */}
                        {item.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs truncate">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Selected count */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-rose-500">
                  {selectedItems.length} selected
                </Badge>
                <span className="text-sm text-gray-600">
                  {maxSelection > 1 && `(Maximum: ${maxSelection})`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems([])}
                className="text-rose-600 hover:text-rose-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
            className="bg-rose-500 hover:bg-rose-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Select {selectedItems.length > 0 && `(${selectedItems.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
