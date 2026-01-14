'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Palette, Image as ImageIcon, Type, Upload, X, Building2, Loader2, Eye, Play, 
  Layout as LayoutIcon, CheckCircle2, Info, AlertCircle, Video 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import CONFIG, { getApiBaseUrl } from '../lib/config';
import SmartImage from './SmartImage';
import { useFont } from '@/contexts/FontContext';
import { useBorder } from '@/contexts/BorderContext';
import { getAllLayouts } from '@/components/layouts';
import { 
  getSupportedPhotoSlots,
  getSupportedBorderSlots,
  getLayoutMetadata,
  getPlaceholderMaxCount,
  isPlaceholderRequired,
  getLayoutCapabilities,
  validateRequiredPhotos
} from '@/lib/layoutSchemas';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/youtubeParser';

const FONT_OPTIONS = [
  { name: 'Inter', fontFamily: 'Inter, sans-serif', googleFont: 'Inter:wght@400;600;700' },
  { name: 'Great Vibes', fontFamily: "'Great Vibes', cursive", googleFont: 'Great+Vibes' },
  { name: 'Playfair Display', fontFamily: "'Playfair Display', serif", googleFont: 'Playfair+Display:wght@400;600;700' },
  { name: 'Cinzel', fontFamily: "'Cinzel', serif", googleFont: 'Cinzel:wght@400;600;700' },
  { name: 'Montserrat', fontFamily: "'Montserrat', sans-serif", googleFont: 'Montserrat:wght@400;600;700' },
  { name: 'Lato', fontFamily: "'Lato', sans-serif", googleFont: 'Lato:wght@400;700' },
  { name: 'Caveat', fontFamily: "'Caveat', cursive", googleFont: 'Caveat:wght@400;700' },
  { name: 'Bebas Neue', fontFamily: "'Bebas Neue', cursive", googleFont: 'Bebas+Neue' },
  { name: 'Rozha One', fontFamily: "'Rozha One', serif", googleFont: 'Rozha+One' },
  { name: 'Pinyon Script', fontFamily: "'Pinyon Script', cursive", googleFont: 'Pinyon+Script' }
];

export default function ThemeManager({ weddingId, wedding }) {
  const { updateFont } = useFont();
  const { updateBorder } = useBorder();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [layout, setLayout] = useState(null);

  const photoInputRefs = useRef({});
  
  // Layout-aware photo state (NEW - Task 2.2)
  const [layoutPhotos, setLayoutPhotos] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoConnectivityIssue, setPhotoConnectivityIssue] = useState(false);
  
  // Backgrounds state (NEW - Task 2.4)
  const [backgrounds, setBackgrounds] = useState({
    layout_page_background_id: null,
    stream_page_background_id: null
  });
  
  // Layout assets state
  const [availableBorders, setAvailableBorders] = useState([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // Studios state (Task 2.5)
  const [availableStudios, setAvailableStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(false);
  
  // Selected layout state
  const [selectedLayoutId, setSelectedLayoutId] = useState('layout_1');

  useEffect(() => {
    loadLayoutSettings();
    loadLayoutPhotos(); // NEW
    loadBackgrounds(); // NEW
    loadLayoutAssets();
    loadStudios();
    loadGoogleFonts();
  }, [weddingId]);

  const loadGoogleFonts = () => {
    const fontsToLoad = FONT_OPTIONS.map(f => f.googleFont).join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontsToLoad}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const loadLayoutSettings = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}/theme`);
      const layoutData = response.data;
      
      const layoutId = layoutData.layout_id || layoutData.theme_id || 'layout_1';
      setSelectedLayoutId(layoutId);
      
      setLayout({
        layout_id: layoutId,
        custom_font: layoutData.custom_font || 'Great Vibes',
        primary_color: layoutData.primary_color || '#f43f5e',
        secondary_color: layoutData.secondary_color || '#a855f7',
        pre_wedding_video: layoutData.pre_wedding_video || '',
        studio_details: layoutData.studio_details || {
          studio_id: '',
          logo_url: '',
          studio_image_url: '',
          default_image_url: '' // Task 2.5: Studio image
        },
        custom_messages: layoutData.custom_messages || {
          welcome_text: 'Welcome to our big day',
          description: ''
        },
        theme_assets: layoutData.theme_assets || {
          borders: {},
          background_image_id: null
        }
      });
    } catch (error) {
      console.error('Error loading layout:', error);
      toast.error('Failed to load layout settings');
      
      setLayout({
        layout_id: 'layout_1',
        custom_font: 'Great Vibes',
        primary_color: '#f43f5e',
        secondary_color: '#a855f7',
        pre_wedding_video: '',
        studio_details: { studio_id: '', logo_url: '', studio_image_url: '', default_image_url: '' },
        custom_messages: { welcome_text: 'Welcome to our big day', description: '' },
        theme_assets: { borders: {}, background_image_id: null }
      });
    }
  };

  // NEW - Function to detect and handle permanently broken photo references
  const detectBrokenPhotos = (photos) => {
    const brokenSlots = [];
    
    Object.keys(photos).forEach(slotName => {
      const slotPhotos = photos[slotName];
      if (Array.isArray(slotPhotos)) {
        // Check each photo in the array
        slotPhotos.forEach((photo, index) => {
          if (photo) {
            // Detect broken photos by multiple criteria
            const isRetryExceeded = photo.retryCount >= photo.maxRetries;
            const hasInvalidFileId = photo.file_id && (
              photo.file_id.startsWith('file_') && 
              ['8', '12', '13', '14', '52', '53', '54', '55', '56', '57'].includes(photo.file_id.replace('file_', '').replace('.jpg', ''))
            );
            const hasLoadingError = photo.retryCount > 0 && !photo.url;
            
            if (isRetryExceeded || hasInvalidFileId || hasLoadingError) {
              brokenSlots.push({ slotName, index, photo });
            }
          }
        });
      } else if (slotPhotos) {
        // Check single photo
        const isRetryExceeded = slotPhotos.retryCount >= slotPhotos.maxRetries;
        const hasInvalidFileId = slotPhotos.file_id && (
          slotPhotos.file_id.startsWith('file_') && 
          ['8', '12', '13', '14', '52', '53', '54', '55', '56', '57'].includes(slotPhotos.file_id.replace('file_', '').replace('.jpg', ''))
        );
        const hasLoadingError = slotPhotos.retryCount > 0 && !slotPhotos.url;
        
        if (isRetryExceeded || hasInvalidFileId || hasLoadingError) {
          brokenSlots.push({ slotName, index: 0, photo: slotPhotos });
        }
      }
    });
    
    return brokenSlots;
  };

  // NEW - Task 2.2: Load layout photos from new API
  // FIXED: Backend now returns proxy URLs, so we just need to add the base URL
  const loadLayoutPhotos = async () => {
    try {
      setLoadingPhotos(true);
      setPhotoConnectivityIssue(false); // Reset connectivity issue flag
      const response = await api.get(`/api/weddings/${weddingId}/layout-photos`);
      const photos = response.data.photos || {};
      const apiBaseUrl = getApiBaseUrl();
      
      console.log('[LOAD_LAYOUT_PHOTOS] Received photos from API:', Object.keys(photos));
      
      // Process photo URLs - backend now returns proxy URLs like /api/media/telegram-proxy/photos/{file_id}
      Object.keys(photos).forEach(slotName => {
        const slotPhotos = photos[slotName];
        if (Array.isArray(slotPhotos)) {
          // Handle multiple photos (like preciousMoments)
          slotPhotos.forEach((photo, index) => {
            if (photo && photo.url) {
              // Backend returns relative proxy URLs - prepend API base URL
              if (photo.url.startsWith('/api/')) {
                photo.url = `${apiBaseUrl}${photo.url}`;
                console.log(`[LOAD_LAYOUT_PHOTOS] ${slotName}[${index}]: Prepended base URL:`, photo.url);
              } else if (photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
                // Already an absolute URL (legacy data or external URL)
                console.log(`[LOAD_LAYOUT_PHOTOS] ${slotName}[${index}]: Keeping absolute URL:`, photo.url);
              }
              
              // Add retry mechanism flag
              photo.retryCount = 0;
              photo.maxRetries = CONFIG.IMAGE.MAX_RETRIES || 2;
            }
          });
        } else if (slotPhotos && slotPhotos.url) {
          // Handle single photo
          if (slotPhotos.url.startsWith('/api/')) {
            slotPhotos.url = `${apiBaseUrl}${slotPhotos.url}`;
            console.log(`[LOAD_LAYOUT_PHOTOS] ${slotName}: Prepended base URL:`, slotPhotos.url);
          } else if (slotPhotos.url.startsWith('http://') || slotPhotos.url.startsWith('https://')) {
            // Already an absolute URL (legacy data or external URL)
            console.log(`[LOAD_LAYOUT_PHOTOS] ${slotName}: Keeping absolute URL:`, slotPhotos.url);
          }
          
          // Add retry mechanism flag
          slotPhotos.retryCount = 0;
          slotPhotos.maxRetries = CONFIG.IMAGE.MAX_RETRIES || 2;
        }
      });
      
      setLayoutPhotos(photos);
      console.log('[LOAD_LAYOUT_PHOTOS] Photos loaded successfully');
    } catch (error) {
      console.error('[LOAD_LAYOUT_PHOTOS] Error loading layout photos:', error);
      setLayoutPhotos({});
      
      // Show connectivity issue if network error
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setPhotoConnectivityIssue(true);
      }
    } finally {
      setLoadingPhotos(false);
    }
  };

  // NEW - Task 2.4: Load backgrounds from new API
  const loadBackgrounds = async () => {
    try {
      console.log('[FIX 3] Loading backgrounds for wedding:', weddingId);
      
      const response = await api.get(`/api/weddings/${weddingId}/backgrounds`);
      
      console.log('[FIX 3] Backgrounds loaded from API:', response.data);
      
      setBackgrounds({
        layout_page_background_id: response.data.layout_page_background_id || null,
        stream_page_background_id: response.data.stream_page_background_id || null,
        layout_page_background_url: response.data.layout_page_background_url || null,
        stream_page_background_url: response.data.stream_page_background_url || null
      });
      
      console.log('[FIX 3] Backgrounds state updated:', {
        layout_id: response.data.layout_page_background_id,
        layout_url: response.data.layout_page_background_url,
        stream_id: response.data.stream_page_background_id,
        stream_url: response.data.stream_page_background_url
      });
      
    } catch (error) {
      console.error('[FIX 3] Error loading backgrounds:', error);
      setBackgrounds({
        layout_page_background_id: null,
        stream_page_background_id: null
      });
    }
  };

  const loadLayoutAssets = async () => {
    try {
      setLoadingAssets(true);
      // Use local API endpoints
      const [bordersRes, backgroundsRes] = await Promise.all([
        api.get('/api/borders'),
        api.get('/api/backgrounds')
      ]);
      
      setAvailableBorders(bordersRes.data || []);
      setAvailableBackgrounds(backgroundsRes.data || []);
      console.log('[THEME_MANAGER] Loaded borders:', bordersRes.data?.length || 0);
      console.log('[THEME_MANAGER] Loaded backgrounds:', backgroundsRes.data?.length || 0);
    } catch (error) {
      console.error('Error loading layout assets:', error);
      // Set empty arrays as fallback
      setAvailableBorders([]);
      setAvailableBackgrounds([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadStudios = async () => {
    try {
      setLoadingStudios(true);
      const response = await api.get('/api/profile/me');
      setAvailableStudios(response.data?.studios || []);
    } catch (error) {
      console.error('Error loading studios:', error);
      setAvailableStudios([]);
    } finally {
      setLoadingStudios(false);
    }
  };

  // Task 2.6: Enhanced layout change with confirmation
  const handleLayoutChange = async (newLayoutId) => {
    // Check if there are existing photos
    const hasExistingPhotos = Object.keys(layoutPhotos).length > 0;
    
    if (hasExistingPhotos) {
      const confirmed = window.confirm(
        'You have existing photos. Changing the layout may affect how they are displayed. Continue?'
      );
      if (!confirmed) return;
    }
    
    try {
      setLoading(true);
      setSelectedLayoutId(newLayoutId);
      
      const updates = {
        layout_id: newLayoutId
      };
      
      await api.put(`/api/weddings/${weddingId}/theme`, updates);
      toast.success('Layout changed successfully!');
      
      loadLayoutSettings();
      loadLayoutPhotos();
    } catch (error) {
      console.error('Error changing layout:', error);
      toast.error('Failed to change layout');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLayout = async (updates) => {
    try {
      setLoading(true);
      await api.put(`/api/weddings/${weddingId}/theme`, updates);
      toast.success('Settings updated!');
      loadLayoutSettings();
    } catch (error) {
      console.error('Error updating layout:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // NEW - Task 2.2: Upload photo to specific placeholder
  // IMPROVED: Phase 5 - Better error handling with retry
  const handlePhotoUpload = async (placeholder, file, retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    console.log('handlePhotoUpload called with:', { placeholder, fileName: file?.name, retryCount });
    
    try {
      setUploadingPhoto(true);
      
      // Validate file before upload
      if (!file) {
        console.error('No file selected');
        toast.error('No file selected');
        return;
      }
      
      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB`);
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      const formData = new FormData();
      formData.append('placeholder', placeholder);
      formData.append('file', file);
      
      // Show uploading toast
      const uploadToast = toast.loading(`Uploading photo to ${placeholder}...`);
      
      await api.post(`/api/weddings/${weddingId}/layout-photos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 // 5 minute timeout for large video uploads
      });
      
      toast.dismiss(uploadToast);
      toast.success(`Photo uploaded to ${placeholder}!`, {
        duration: 3000,
        icon: '✅'
      });
      loadLayoutPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      
      // Handle network errors with retry
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        if (retryCount < MAX_RETRIES) {
          toast.warning(`Upload timeout. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          setTimeout(() => handlePhotoUpload(placeholder, file, retryCount + 1), 2000);
          return;
        }
      }
      
      // Parse error message
      let errorMsg = 'Failed to upload photo';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object' && detail.error) {
          errorMsg = detail.error;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg, {
        duration: 5000,
        action: retryCount < MAX_RETRIES ? {
          label: 'Retry',
          onClick: () => handlePhotoUpload(placeholder, file, retryCount + 1)
        } : undefined
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // NEW - Task 2.2: Delete photo from placeholder
  // IMPROVED: Phase 5 - Confirmation dialog and better error handling
  const handlePhotoDelete = async (placeholder, photoId) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }
    
    try {
      const deleteToast = toast.loading('Deleting photo...');
      
      await api.delete(`/api/weddings/${weddingId}/layout-photos/${placeholder}/${photoId}`);
      
      toast.dismiss(deleteToast);
      toast.success('Photo deleted!', {
        duration: 2000,
        icon: '🗑️'
      });
      loadLayoutPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      
      let errorMsg = 'Failed to delete photo';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object' && detail.error) {
          errorMsg = detail.error;
        }
      }
      
      toast.error(errorMsg, {
        duration: 4000
      });
    }
  };

  // NEW - Task 2.4: Update backgrounds
  const handleUpdateBackgrounds = async (updates) => {
    try {
      setLoading(true);
      
      // Log the background update request
      console.log('[BACKGROUND_UPDATE] Updating backgrounds:', updates);
      
      await api.put(`/api/weddings/${weddingId}/backgrounds`, updates);
      
      console.log('[BACKGROUND_UPDATE] Background update API call successful');
      
      toast.success('Background updated! Refreshing...', {
        duration: 2000
      });
      
      // Wait for backend to process the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload backgrounds to get resolved CDN URLs
      await loadBackgrounds();
      
      console.log('[BACKGROUND_UPDATE] Backgrounds reloaded');
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wedding-backgrounds-updated', {
          detail: { 
            weddingId, 
            updates,
            timestamp: Date.now()
          }
        }));
      }
      
      // CRITICAL FIX: Force a hard reload of the wedding page to see changes immediately
      // This ensures the background actually shows up in the preview
      setTimeout(() => {
        console.log('[BACKGROUND_UPDATE] Forcing page reload to apply background changes');
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('[BACKGROUND_UPDATE] Error updating backgrounds:', error);
      toast.error(error.response?.data?.detail || 'Failed to update backgrounds');
    } finally {
      setLoading(false);
    }
  };

  // Safe layout accessor
  const safeLayout = layout || {
    layout_id: 'layout_1',
    custom_font: 'Great Vibes',
    primary_color: '#f43f5e',
    secondary_color: '#a855f7',
    pre_wedding_video: '',
    studio_details: { studio_id: '', logo_url: '', studio_image_url: '', default_image_url: '' },
    custom_messages: { welcome_text: 'Welcome to our big day', description: '' },
    theme_assets: { borders: {}, background_image_id: null }
  };

  // Get current layout info
  const currentLayoutMetadata = getLayoutMetadata(selectedLayoutId);
  const supportedPhotoSlots = getSupportedPhotoSlots(selectedLayoutId);
  const supportedBorderSlots = getSupportedBorderSlots(selectedLayoutId);
  const layoutCapabilities = getLayoutCapabilities(selectedLayoutId);

  if (!layout) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const layouts = getAllLayouts();

  return (
    <div className="space-y-6">
      {/* Task 2.6: Enhanced Layout Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutIcon className="w-5 h-5" />
            Wedding Layout
          </CardTitle>
          <CardDescription>
            Choose a layout structure for your wedding page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {layouts.map((layout) => {
              const isSelected = layout.layout_id === selectedLayoutId;
              const capabilities = getLayoutCapabilities(layout.layout_id);
              
              return (
                <button
                  key={layout.layout_id}
                  data-testid={`layout-card-${layout.layout_id}`}
                  onClick={() => handleLayoutChange(layout.layout_id)}
                  disabled={loading}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all group ${
                    isSelected 
                      ? 'border-rose-500 bg-rose-50' 
                      : 'border-gray-200 hover:border-rose-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Preview thumbnail */}
                  <div className="mb-3 aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded overflow-hidden">
                    {layout.thumbnail ? (
                      <img 
                        src={layout.thumbnail} 
                        alt={layout.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="font-semibold text-sm">{layout.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{layout.description}</div>
                  
                  {/* Task 2.6: Feature indicators */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {capabilities.supportsYouTube && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">
                        <Play className="w-2.5 h-2.5" />
                        YouTube
                      </span>
                    )}
                    {capabilities.supportsBorders && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full">
                        <Palette className="w-2.5 h-2.5" />
                        Borders
                      </span>
                    )}
                    {capabilities.photoPlaceholderCount && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full">
                        <ImageIcon className="w-2.5 h-2.5" />
                        {capabilities.photoPlaceholderCount} slots
                      </span>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Hover details */}
                  <div className="absolute inset-0 bg-black/90 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="text-white text-xs space-y-1">
                      <p className="font-semibold">{capabilities.layoutName}</p>
                      <p className="text-gray-300 text-[10px]">{capabilities.layoutDescription}</p>
                      <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                        {capabilities.hasBridePhoto && <p>✓ Bride photo</p>}
                        {capabilities.hasGroomPhoto && <p>✓ Groom photo</p>}
                        {capabilities.hasCouplePhoto && <p>✓ Couple photo</p>}
                        {capabilities.hasPreciousMoments && (
                          <p>✓ Gallery (max {capabilities.preciousMomentsMax})</p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Font & Colors Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typography & Colors
          </CardTitle>
          <CardDescription>
            Customize fonts and color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Font Family
            </Label>
            <Select
              value={safeLayout.custom_font}
              onValueChange={(value) => {
                handleUpdateLayout({ custom_font: value });
                updateFont(value);
              }}
            >
              <SelectTrigger className="w-full" data-testid="font-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(font => (
                  <SelectItem key={font.name} value={font.name}>
                    <span style={{ fontFamily: font.fontFamily }} className="text-lg">
                      {font.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="p-3 bg-gray-50 rounded-md border">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <p 
                className="text-3xl"
                style={{ fontFamily: FONT_OPTIONS.find(f => f.name === safeLayout.custom_font)?.fontFamily || 'Inter' }}
              >
                {wedding?.bride_name || 'Bride'} & {wedding?.groom_name || 'Groom'}
              </p>
            </div>
          </div>

          {/* Color Customization */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={safeLayout.primary_color}
                  onChange={(e) => handleUpdateLayout({ primary_color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                  disabled={loading}
                />
                <Input
                  value={safeLayout.primary_color}
                  onChange={(e) => handleUpdateLayout({ primary_color: e.target.value })}
                  className="flex-1"
                  placeholder="#f43f5e"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={safeLayout.secondary_color}
                  onChange={(e) => handleUpdateLayout({ secondary_color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                  disabled={loading}
                />
                <Input
                  value={safeLayout.secondary_color}
                  onChange={(e) => handleUpdateLayout({ secondary_color: e.target.value })}
                  className="flex-1"
                  placeholder="#a855f7"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content & Messages Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome Message & Description</CardTitle>
          <CardDescription>
            Customize the text content for your wedding page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <Input
              value={safeLayout.custom_messages?.welcome_text || ''}
              onChange={(e) => handleUpdateLayout({ 
                custom_messages: { 
                  ...safeLayout.custom_messages, 
                  welcome_text: e.target.value 
                } 
              })}
              placeholder="Welcome to our big day"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={safeLayout.custom_messages?.description || ''}
              onChange={(e) => handleUpdateLayout({ 
                custom_messages: { 
                  ...safeLayout.custom_messages, 
                  description: e.target.value 
                } 
              })}
              placeholder="Share your love story..."
              rows={4}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pre-Wedding Video Card */}
      {currentLayoutMetadata?.supports_youtube && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Pre-Wedding Video
            </CardTitle>
            <CardDescription>
              Add a YouTube video (supported by this layout)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={safeLayout.pre_wedding_video || ''}
                onChange={(e) => {
                  const url = e.target.value;
                  const embedUrl = isYouTubeUrl(url) ? getYouTubeEmbedUrl(url) : url;
                  handleUpdateLayout({ pre_wedding_video: embedUrl || url });
                }}
                placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Supports: youtube.com/watch?v=, youtu.be/, and embed URLs
              </p>
            </div>
            
            {safeLayout.pre_wedding_video && isYouTubeUrl(safeLayout.pre_wedding_video) && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(safeLayout.pre_wedding_video)}
                  title="Pre-wedding video preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task 2.2: NEW Placeholder-Based Photo Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Photos
          </CardTitle>
          <CardDescription>
            Upload photos based on your selected layout's placeholders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Layout Requirements Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Selected Layout:</span> {currentLayoutMetadata?.name}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {currentLayoutMetadata?.description}
            </p>
          </div>
          
          {loadingPhotos ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading photos...
            </div>
          ) : (
            <>
              {/* Broken Photos Detection and Cleanup */}
              {(() => {
                const brokenPhotos = detectBrokenPhotos(layoutPhotos);
                if (brokenPhotos.length > 0) {
                  return (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Broken Photo References Detected:</strong> {brokenPhotos.length} photo(s) reference files that no longer exist on Telegram.</p>
                          <div className="space-y-1">
                            {brokenPhotos.map(({ slotName, index, photo }) => (
                              <div key={`${slotName}-${index}`} className="text-xs flex items-center justify-between">
                                <span>{slotName} {index > 0 ? `(${index + 1})` : ''}</span>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Clear broken photo from ${slotName}${index > 0 ? ` (${index + 1})` : ''}?`)) {
                                      handlePhotoDelete(slotName, index);
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                >
                                  Clear
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`Clear all ${brokenPhotos.length} broken photo references?`)) {
                                brokenPhotos.forEach(({ slotName, index }) => {
                                  handlePhotoDelete(slotName, index);
                                });
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 mt-2"
                          >
                            Clear All Broken Photos
                          </button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}
              
              {/* Connectivity Issue Warning */}
              {photoConnectivityIssue && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Photo Loading Issue:</strong> Unable to load photos from server. This may be due to network connectivity or server issues. Photos will show as placeholders until the issue is resolved.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Dynamic Placeholder Upload Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(supportedPhotoSlots).map(([slotName, slotData]) => {
                  const existingPhoto = layoutPhotos[slotName];
                  const isArray = slotName === 'preciousMoments';
                  const currentCount = isArray ? (existingPhoto?.length || 0) : (existingPhoto ? 1 : 0);
                  const maxCount = slotData.max_count;
                  const canUploadMore = currentCount < maxCount;
                  
                  // Color coding by placeholder type
                  let colorClass = 'border-gray-300 bg-gray-50 text-gray-600';
                  if (slotName.includes('bride')) colorClass = 'border-pink-300 bg-pink-50 text-pink-600';
                  else if (slotName.includes('groom')) colorClass = 'border-blue-300 bg-blue-50 text-blue-600';
                  else if (slotName.includes('couple')) colorClass = 'border-purple-300 bg-purple-50 text-purple-600';
                  else if (slotName.includes('precious') || slotName.includes('Moments')) colorClass = 'border-green-300 bg-green-50 text-green-600';
                  else if (slotName.includes('studio')) colorClass = 'border-amber-300 bg-amber-50 text-amber-600';
                  
                  return (
                    <div key={slotName} className="space-y-2">
                      <label className={`aspect-square rounded-lg border-2 border-dashed ${colorClass} hover:border-rose-500 hover:bg-rose-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          data-testid={`upload-${slotName}`}
                          multiple={isArray}
                          ref={(el) => {
                            if (el) photoInputRefs.current[slotName] = el;
                          }}
                          disabled={uploadingPhoto}
                          onChange={(e) => {
                            const selectedFiles = Array.from(e.target.files || []);

                            if (!selectedFiles.length) {
                              e.target.value = '';
                              return;
                            }

                            if (isArray) {
                              if (currentCount >= maxCount) {
                                toast.error('Gallery is full. Delete a photo to add more.');
                                e.target.value = '';
                                return;
                              }

                              const available = maxCount - currentCount;
                              const filesToUpload = selectedFiles.slice(0, available);

                              if (selectedFiles.length > available) {
                                toast.warning(`Only ${available} photo(s) can be added. Extra files were ignored.`);
                              }

                              (async () => {
                                for (const file of filesToUpload) {
                                  console.log('File selected for upload:', file.name, 'to slot:', slotName);
                                  await handlePhotoUpload(slotName, file);
                                }
                              })();
                            } else {
                              const file = selectedFiles[0];
                              console.log('File selected for upload:', file.name, 'to slot:', slotName);
                              handlePhotoUpload(slotName, file);
                            }

                            e.target.value = '';
                          }}
                        />

                        {uploadingPhoto ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium text-center px-2">
                              {slotData.description.split(' ').slice(0, 2).join(' ')}
                            </span>
                            {slotData.required && (
                              <span className="text-[10px] text-red-500 font-semibold">Required</span>
                            )}
                            {!canUploadMore && (
                              <span className="text-[10px] text-gray-500">{isArray ? 'Full' : 'Replace'}</span>
                            )}
                            {isArray && (
                              <span className="text-[10px] mt-0.5">
                                {currentCount}/{maxCount}
                              </span>
                            )}
                          </>
                        )}
                      </label>

                      {existingPhoto && (
                        <div
                          className="grid grid-cols-2 gap-1 cursor-pointer"
                          onClick={() => {
                            if (uploadingPhoto) return;
                            const input = photoInputRefs.current[slotName];
                            if (input) input.click();
                          }}
                        >
                          {Array.isArray(existingPhoto) ? (
                            existingPhoto.map((photo, idx) => (
                              <div key={photo.photo_id || idx} className="relative group aspect-square" data-testid={`photo-${slotName}-${idx}`}>
                                <img
                                  src={photo.url || photo}
                                  alt={slotData.description}
                                  className="w-full h-full object-cover rounded border"
                                  onError={(e) => {
                                    console.error('Photo failed to load:', photo.url || photo, e);

                                    if (photo.fallbackUrl && photo.retryCount < photo.maxRetries) {
                                      console.log(`Retrying with fallback URL (attempt ${photo.retryCount + 1}/${photo.maxRetries}):`, photo.fallbackUrl);
                                      photo.retryCount++;
                                      e.target.src = photo.fallbackUrl;
                                      return;
                                    }

                                    if (!photoConnectivityIssue) {
                                      setPhotoConnectivityIssue(true);
                                      console.warn('Photo connectivity issue detected - showing user warning');
                                    }

                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                  onLoad={(e) => {
                                    console.log('Photo loaded successfully:', photo.url || photo);
                                    e.target.nextSibling.style.display = 'none';
                                  }}
                                />
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded border" style={{display: 'none'}}>
                                  <div className="text-center">
                                    <ImageIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">Failed to load</p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Use actual photo_id if available, otherwise use index
                                    const photoToDelete = photo.photo_id || `photo-${idx}`;
                                    console.log('Deleting photo:', { slotName, photoId: photoToDelete, photo });
                                    handlePhotoDelete(slotName, photoToDelete);
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`delete-${slotName}-${idx}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="relative group aspect-square" data-testid={`photo-${slotName}`}>
                              <img
                                src={existingPhoto.url || existingPhoto}
                                alt={slotData.description}
                                className="w-full h-full object-cover rounded border"
                                onError={(e) => {
                                  console.error('Photo failed to load:', existingPhoto.url || existingPhoto, e);

                                  if (existingPhoto.fallbackUrl && existingPhoto.retryCount < existingPhoto.maxRetries) {
                                    console.log(`Retrying with fallback URL (attempt ${existingPhoto.retryCount + 1}/${existingPhoto.maxRetries}):`, existingPhoto.fallbackUrl);
                                    existingPhoto.retryCount++;
                                    e.target.src = existingPhoto.fallbackUrl;
                                    return;
                                  }

                                  if (!photoConnectivityIssue) {
                                    setPhotoConnectivityIssue(true);
                                    console.warn('Photo connectivity issue detected - showing user warning');
                                  }

                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                                onLoad={(e) => {
                                  console.log('Photo loaded successfully:', existingPhoto.url || existingPhoto);
                                  e.target.nextSibling.style.display = 'none';
                                }}
                              />
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded border" style={{display: 'none'}}>
                                <div className="text-center">
                                  <ImageIcon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">Failed to load</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePhotoDelete(slotName, existingPhoto.photo_id || '0');
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`delete-${slotName}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Validation Info */}
              {(() => {
                const validation = validateRequiredPhotos(selectedLayoutId, layoutPhotos);
                if (!validation.isValid) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Missing required photos:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {validation.missingRequired.map(missing => (
                            <li key={missing.name}>{missing.description}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-800 font-medium">
                      All required photos uploaded!
                    </p>
                  </div>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Task 2.3: Layout-Aware Borders UI */}
      {Object.keys(supportedBorderSlots).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Photo Borders
            </CardTitle>
            <CardDescription>
              Customize borders for photos (based on layout support)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAssets ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading borders...
              </div>
            ) : availableBorders.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-sm text-amber-800">No borders available</p>
                <p className="text-xs text-amber-600 mt-1">Admin needs to upload borders first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(supportedBorderSlots).map(([borderSlotName, borderSlotData]) => {
                  // Determine border key in theme_assets
                  let borderKey = null;
                  if (borderSlotName === 'brideGroomBorder') borderKey = 'bride_groom_border_id';
                  else if (borderSlotName === 'coupleBorder') borderKey = 'couple_border_id';
                  else if (borderSlotName === 'preciousMomentsBorder') borderKey = 'precious_moments_border_id';
                  else if (borderSlotName === 'studioBorder') borderKey = 'studio_border_id';
                  
                  const currentBorderId = safeLayout.theme_assets?.borders?.[borderKey];
                  const selectedBorder = availableBorders.find(b => b.id === currentBorderId);
                  
                  return (
                    <div key={borderSlotName} className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                      <Label className="text-xs font-medium flex items-center justify-between">
                        <span>{borderSlotData.description}</span>
                        {borderSlotName === 'brideGroomBorder' && (
                          <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            Groom mirrored
                          </span>
                        )}
                      </Label>
                      <Select
                        value={currentBorderId || 'none'}
                        onValueChange={(value) => {
                          handleUpdateLayout({
                            theme_assets: {
                              ...safeLayout.theme_assets,
                              borders: {
                                ...safeLayout.theme_assets?.borders,
                                [borderKey]: value === 'none' ? null : value
                              }
                            }
                          });
                          updateBorder(borderKey, value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger className="text-xs bg-white" data-testid={`border-selector-${borderSlotName}`}>
                          <SelectValue placeholder="Select border" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {/* CRITICAL FIX: Filter borders based on layout support */}
                          {availableBorders
                            .filter(border => {
                              // For brideGroomBorder, show borders that can apply to individual photos
                              if (borderSlotName === 'brideGroomBorder') {
                                return true; // Most borders can work for individual photos
                              }
                              // For coupleBorder, show borders suitable for main couple photos
                              if (borderSlotName === 'coupleBorder') {
                                return border.tags?.includes('couple') || !border.tags?.includes('individual');
                              }
                              // For preciousMomentsBorder, show borders suitable for gallery
                              if (borderSlotName === 'preciousMomentsBorder') {
                                return border.tags?.includes('gallery') || !border.tags?.includes('individual');
                              }
                              // For studioBorder, show minimal borders suitable for logos
                              if (borderSlotName === 'studioBorder') {
                                return border.tags?.includes('minimal') || border.tags?.includes('studio');
                              }
                              return true;
                            })
                            .map(border => (
                            <SelectItem key={border.id} value={border.id}>
                              <div className="flex items-center gap-2">
                                {border.cdn_url && (
                                  <img 
                                    src={border.cdn_url} 
                                    alt={border.name}
                                    className="w-8 h-8 object-cover rounded border"
                                  />
                                )}
                                <span>{border.name}</span>
                                {border.tags && border.tags.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({border.tags.join(', ')})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedBorder?.cdn_url && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <img 
                            src={selectedBorder.cdn_url} 
                            alt="Preview"
                            className="w-full h-20 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task 5: Stream Border for Video Player */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Stream Border
          </CardTitle>
          <CardDescription>
            Add a decorative border around the video player during live stream
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAssets ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading borders...
            </div>
          ) : availableBorders.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-sm text-amber-800">No borders available</p>
              <p className="text-xs text-amber-600 mt-1">Admin needs to upload borders first</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Border for Video Player</Label>
              <Select
                value={safeLayout.theme_assets?.borders?.stream_border_id || 'none'}
                onValueChange={(value) => {
                  handleUpdateLayout({
                    theme_assets: {
                      ...safeLayout.theme_assets,
                      borders: {
                        ...safeLayout.theme_assets?.borders,
                        stream_border_id: value === 'none' ? null : value
                      }
                    }
                  });
                }}
              >
                <SelectTrigger className="text-xs bg-white" data-testid="border-selector-stream">
                  <SelectValue placeholder="Select border for stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableBorders.map(border => (
                    <SelectItem key={border.id} value={border.id}>
                      <div className="flex items-center gap-2">
                        {border.cdn_url && (
                          <img 
                            src={border.cdn_url} 
                            alt={border.name}
                            className="w-8 h-8 object-cover rounded border"
                          />
                        )}
                        <span>{border.name}</span>
                        {border.tags && border.tags.length > 0 && (
                          <span className="text-xs text-gray-500">
                            ({border.tags.join(', ')})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const streamBorderId = safeLayout.theme_assets?.borders?.stream_border_id;
                const selectedBorder = availableBorders.find(b => b.id === streamBorderId);
                return selectedBorder?.cdn_url ? (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <img 
                      src={selectedBorder.cdn_url} 
                      alt="Stream Border Preview"
                      className="w-full h-20 object-contain"
                    />
                  </div>
                ) : null;
              })()}
              <p className="text-xs text-gray-500 mt-2">
                This border will appear around the video player during live streaming
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task 2.4: Simplified Backgrounds UI - 2 Dropdowns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Background Images
          </CardTitle>
          <CardDescription>
            Set separate backgrounds for layout page and stream page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAssets ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading backgrounds...
            </div>
          ) : availableBackgrounds.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-sm text-amber-800">No backgrounds available</p>
              <p className="text-xs text-amber-600 mt-1">Admin needs to upload backgrounds first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Layout Page Background */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Layout Page Background</Label>
                <Select
                  value={backgrounds.layout_page_background_id || 'none'}
                  onValueChange={(value) => {
                    handleUpdateBackgrounds({
                      layout_page_background_id: value === 'none' ? null : value
                    });
                  }}
                >
                  <SelectTrigger className="bg-white" data-testid="layout-background-selector">
                    <SelectValue placeholder="Select background for layout page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableBackgrounds.map(bg => (
                      <SelectItem key={bg.id} value={bg.id}>
                        <div className="flex items-center gap-2">
                          {bg.cdn_url && (
                            <img 
                              src={bg.cdn_url} 
                              alt={bg.name}
                              className="w-12 h-8 object-cover rounded border"
                            />
                          )}
                          <span>{bg.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {backgrounds.layout_page_background_url && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <img 
                      src={backgrounds.layout_page_background_url} 
                      alt="Layout Background"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              
              {/* Stream Page Background */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Stream Page Background</Label>
                <Select
                  value={backgrounds.stream_page_background_id || 'none'}
                  onValueChange={(value) => {
                    handleUpdateBackgrounds({
                      stream_page_background_id: value === 'none' ? null : value
                    });
                  }}
                >
                  <SelectTrigger className="bg-white" data-testid="stream-background-selector">
                    <SelectValue placeholder="Select background for stream page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableBackgrounds.map(bg => (
                      <SelectItem key={bg.id} value={bg.id}>
                        <div className="flex items-center gap-2">
                          {bg.cdn_url && (
                            <img 
                              src={bg.cdn_url} 
                              alt={bg.name}
                              className="w-12 h-8 object-cover rounded border"
                            />
                          )}
                          <span>{bg.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {backgrounds.stream_page_background_url && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <img 
                      src={backgrounds.stream_page_background_url} 
                      alt="Stream Background"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task 2.5: Studio Details Card with Image Propagation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Studio Partner
          </CardTitle>
          <CardDescription>
            Select a studio from your profile (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStudios ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading studios...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Select
                  value={safeLayout.studio_details?.studio_id || 'none'}
                  onValueChange={async (value) => {
                    if (value === "none") {
                      handleUpdateLayout({
                        studio_details: {
                          studio_id: '',
                          name: '',
                          logo_url: '',
                          default_image_url: '', // Task 2.5: Clear studio image
                          website: '',
                          email: '',
                          phone: '',
                          address: '',
                          contact: '',
                          show_details: false
                        }
                      });
                    } else {
                      const selectedStudio = availableStudios.find(s => s.id === value);
                      if (selectedStudio) {
                        // Task 2.5: Propagate studio image
                        handleUpdateLayout({
                          studio_details: {
                            studio_id: selectedStudio.id,
                            name: selectedStudio.name || '',
                            logo_url: selectedStudio.logo_url || '',
                            default_image_url: selectedStudio.default_image_url || '', // Studio image
                            website: selectedStudio.website || '',
                            email: selectedStudio.email || '',
                            phone: selectedStudio.phone || '',
                            address: selectedStudio.address || '',
                            contact: selectedStudio.contact || '',
                            show_details: true
                          }
                        });
                        
                        // Show success message
                        if (selectedStudio.default_image_url) {
                          toast.success('Studio selected with image!');
                        }
                      }
                    }
                  }}
                  disabled={loading || availableStudios.length === 0}
                >
                  <SelectTrigger className="bg-white" data-testid="studio-selector">
                    <SelectValue placeholder={availableStudios.length === 0 ? "No studios available - Create one in Profile" : "Select a studio"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableStudios.map(studio => (
                      <SelectItem key={studio.id} value={studio.id}>
                        <div className="flex items-center gap-2">
                          {studio.default_image_url && (
                            <img 
                              src={studio.default_image_url} 
                              alt={studio.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <span>{studio.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableStudios.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Go to Profile → Studios to create a studio first
                  </p>
                )}
              </div>
              
              {/* Studio Preview with Image */}
              {safeLayout.studio_details?.studio_id && safeLayout.studio_details?.studio_id !== '' && (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
                    
                    {/* Studio Image (Task 2.5) */}
                    {safeLayout.studio_details?.default_image_url ? (
                      <div className="mb-3">
                        <img
                          src={safeLayout.studio_details.default_image_url}
                          alt="Studio"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="h-32 mx-auto flex flex-col items-center justify-center bg-gray-100 rounded mb-3">
                        <Building2 className="w-8 h-8 text-gray-400" />
                        <span className="text-gray-400 text-xs text-center mt-1">
                          No studio image
                        </span>
                      </div>
                    )}
                    
                    {/* Logo */}
                    {safeLayout.studio_details?.logo_url && (
                      <div className="mb-3">
                        <img
                          src={safeLayout.studio_details.logo_url}
                          alt={safeLayout.studio_details.name || 'Studio logo'}
                          className="h-16 mx-auto object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Studio Details */}
                    {safeLayout.studio_details?.show_details && (
                      <div className="text-center text-sm space-y-1">
                        {safeLayout.studio_details?.name && (
                          <p className="font-semibold text-gray-900">{safeLayout.studio_details.name}</p>
                        )}
                        {safeLayout.studio_details?.email && (
                          <p className="text-gray-600">{safeLayout.studio_details.email}</p>
                        )}
                        {safeLayout.studio_details?.phone && (
                          <p className="text-gray-600">{safeLayout.studio_details.phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Show Details Toggle */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-purple-900">Show Studio Details</Label>
                      <p className="text-xs text-purple-600 mt-1">
                        Display contact info along with logo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateLayout({
                        studio_details: {
                          ...safeLayout.studio_details,
                          show_details: !safeLayout.studio_details?.show_details
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        safeLayout.studio_details?.show_details ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                      disabled={loading}
                      data-testid="studio-details-toggle"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          safeLayout.studio_details?.show_details ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
