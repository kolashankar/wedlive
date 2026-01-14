'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Image as ImageIcon, Type, Upload, X, Building2, Loader2, Eye, Play, Layout as LayoutIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import MediaSelector from '@/components/MediaSelector';
import { useFont } from '@/contexts/FontContext';
import { useBorder } from '@/contexts/BorderContext';
import { getAllLayouts, getLayoutSchema } from '@/components/layouts';
import { 
  layoutSupportsSlot, 
  getSupportedPhotoSlots, 
  getPhotoSlotMaxCount,
  getRandomLayoutAssets,
  getLayoutInfo 
} from '@/lib/layoutHelpers';
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

export default function LayoutManager({ weddingId, wedding }) {
  const { updateFont } = useFont();
  const { updateBorder, updateAllBorders } = useBorder();
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Layout assets state
  const [availableBorders, setAvailableBorders] = useState([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // Studios state
  const [availableStudios, setAvailableStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(false);
  
  // Selected layout state
  const [selectedLayoutId, setSelectedLayoutId] = useState('layout_1');
  const [randomAssetsApplied, setRandomAssetsApplied] = useState(false);

  useEffect(() => {
    loadLayoutSettings();
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
      
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid layout settings response:', response.data);
        toast.error('Invalid layout settings received');
        return;
      }
      
      const layoutData = response.data;
      
      // Check if layout_id exists, otherwise default to layout_1
      const layoutId = layoutData.layout_id || layoutData.theme_id || 'layout_1';
      setSelectedLayoutId(layoutId);
      
      // Check if we've already customized (assets exist)
      const hasCustomAssets = layoutData.theme_assets && (
        layoutData.theme_assets.borders || 
        layoutData.theme_assets.background_image_id ||
        layoutData.custom_font !== 'Great Vibes'
      );
      setRandomAssetsApplied(hasCustomAssets);
      
      // Set default layout structure
      setLayout({
        layout_id: layoutId,
        custom_font: layoutData.custom_font || 'Great Vibes',
        primary_color: layoutData.primary_color || '#f43f5e',
        secondary_color: layoutData.secondary_color || '#a855f7',
        pre_wedding_video: layoutData.pre_wedding_video || '',
        cover_photos: Array.isArray(layoutData.cover_photos) ? layoutData.cover_photos : [],
        studio_details: layoutData.studio_details || {
          studio_id: '',
          logo_url: '',
          studio_image_url: '', // PROMPT 6: Add studio image URL field
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
      
      // Set default layout
      setLayout({
        layout_id: 'layout_1',
        custom_font: 'Great Vibes',
        primary_color: '#f43f5e',
        secondary_color: '#a855f7',
        pre_wedding_video: '',
        cover_photos: [],
        studio_details: { studio_id: '', logo_url: '', studio_image_url: '' },
        custom_messages: { welcome_text: 'Welcome to our big day', description: '' },
        theme_assets: { borders: {}, background_image_id: null }
      });
    }
  };

  const loadLayoutAssets = async () => {
    try {
      setLoadingAssets(true);
      console.log('DEBUG: Loading layout assets...');
      const [bordersRes, backgroundsRes] = await Promise.all([
        api.get('/api/theme-assets/borders'),
        api.get('/api/theme-assets/backgrounds')
      ]);
      
      console.log('DEBUG: Borders response:', bordersRes.data);
      console.log('DEBUG: Backgrounds response:', backgroundsRes.data);
      
      setAvailableBorders(bordersRes.data || []);
      setAvailableBackgrounds(backgroundsRes.data || []);
      
      console.log('DEBUG: Available borders set:', bordersRes.data?.length || 0);
      console.log('DEBUG: Available backgrounds set:', backgroundsRes.data?.length || 0);
    } catch (error) {
      console.error('Error loading layout assets:', error);
      console.error('DEBUG: Error details:', error.response?.data || error.message);
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

  const handleLayoutChange = async (newLayoutId) => {
    try {
      setLoading(true);
      setSelectedLayoutId(newLayoutId);
      
      // ALWAYS apply random assets immediately on layout change
      const randomAssets = getRandomLayoutAssets(
        newLayoutId, 
        weddingId, 
        availableBorders, 
        availableBackgrounds
      );
      
      const updates = {
        layout_id: newLayoutId,
        custom_font: randomAssets.font,
        theme_assets: {
          borders: {
            couple_border_id: randomAssets.border?.id || null,
            bride_groom_border_id: randomAssets.border?.id || null,
            precious_moments_border_id: randomAssets.border?.id || null
          },
          background_image_id: randomAssets.background?.id || null
        }
      };
      
      await api.put(`/api/weddings/${weddingId}/theme`, updates);
      setRandomAssetsApplied(true);
      updateFont(randomAssets.font);
      toast.success('Layout changed with random styling applied!');
      
      loadLayoutSettings();
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
      
      // Mark that user has customized (no more random)
      if (updates.custom_font || updates.theme_assets) {
        setRandomAssetsApplied(true);
      }
      
      loadLayoutSettings();
    } catch (error) {
      console.error('Error updating layout:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = async (selectedMedia) => {
    if (!selectedCategory) return;
    
    // PROMPT 7: Enforce max 5 precious moments
    if (selectedCategory === 'moment') {
      const currentMoments = layout?.cover_photos?.filter(p => p.category === 'moment') || [];
      const totalMoments = currentMoments.length + selectedMedia.length;
      
      if (totalMoments > 5) {
        toast.error('Maximum 5 precious moments allowed. Please remove existing moments first.');
        return;
      }
    }
    
    // PROMPT 5: Auto-assign category to media in backend
    try {
      // Update each media item's category in the backend
      const updatePromises = selectedMedia.map(media => {
        if (media.id) {
          const formData = new FormData();
          formData.append('category', selectedCategory);
          return api.put(`/api/media/${media.id}/category`, formData).catch(err => {
            console.warn(`Failed to update category for media ${media.id}:`, err);
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      toast.success(`Category "${selectedCategory}" assigned to ${selectedMedia.length} photo(s)`);
    } catch (error) {
      console.error('Error updating media categories:', error);
      toast.warning('Photos added to layout, but category assignment partially failed');
    }
    
    const newPhotos = selectedMedia.map(media => ({
      id: media.id,
      url: media.cdn_url || media.file_url || media.url,
      category: selectedCategory,
      type: media.file_type?.includes('video') ? 'video' : 'photo'
    }));
    
    const currentPhotos = layout?.cover_photos || [];
    const filteredPhotos = currentPhotos.filter(p => p.category !== selectedCategory);
    
    handleUpdateLayout({
      cover_photos: [...filteredPhotos, ...newPhotos]
    });
    
    setShowMediaSelector(false);
    setSelectedCategory(null);
  };

  const removeCategorizedPhoto = (photoToRemove, category) => {
    const currentPhotos = layout?.cover_photos || [];
    const updatedPhotos = currentPhotos.filter(photo => 
      !(photo.category === category && (photo.url === photoToRemove.url || photo === photoToRemove))
    );
    
    handleUpdateLayout({ cover_photos: updatedPhotos });
  };

  // Safe layout accessor
  const safeLayout = layout || {
    layout_id: 'layout_1',
    custom_font: 'Great Vibes',
    primary_color: '#f43f5e',
    secondary_color: '#a855f7',
    pre_wedding_video: '',
    cover_photos: [],
    studio_details: { studio_id: '', logo_url: '' },
    custom_messages: { welcome_text: 'Welcome to our big day', description: '' },
    theme_assets: { borders: {}, background_image_id: null }
  };

  // Get current layout schema
  const currentLayoutSchema = getLayoutSchema(selectedLayoutId);
  const supportedPhotoSlots = getSupportedPhotoSlots(selectedLayoutId);

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
      {/* Layout Selection Card */}
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
              const layoutInfo = getLayoutInfo(layout.layout_id);
              
              return (
                <button
                  key={layout.layout_id}
                  onClick={() => handleLayoutChange(layout.layout_id)}
                  disabled={loading}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all ${
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
                  <div className="text-xs text-gray-500 mt-1">{layout.description}</div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  )}
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
              <SelectTrigger className="w-full">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Pre-Wedding Video
          </CardTitle>
          <CardDescription>
            Add a YouTube video (any format supported)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input
              value={safeLayout.pre_wedding_video || ''}
              onChange={(e) => {
                const url = e.target.value;
                // Convert to embed URL if it's a valid YouTube URL
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

      {/* Photo Selection Card - Schema Driven */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Photos
          </CardTitle>
          <CardDescription>
            Upload photos based on your selected layout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Layout Requirements Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Selected Layout:</span> {currentLayoutSchema?.name}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {currentLayoutSchema?.description}
            </p>
          </div>
          
          {/* Dynamic Photo Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Bride Photo - Only if supported */}
            {supportedPhotoSlots.bridePhoto && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('bride');
                  setShowMediaSelector(true);
                }}
                className="aspect-square border-2 border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors bg-pink-50"
              >
                <ImageIcon className="w-6 h-6 text-pink-400 mb-1" />
                <span className="text-xs text-pink-600 font-medium">Bride Photo</span>
                {supportedPhotoSlots.bridePhoto.required && (
                  <span className="text-[10px] text-pink-500">Required</span>
                )}
              </button>
            )}
            
            {/* Groom Photo - Only if supported */}
            {supportedPhotoSlots.groomPhoto && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('groom');
                  setShowMediaSelector(true);
                }}
                className="aspect-square border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-blue-50"
              >
                <ImageIcon className="w-6 h-6 text-blue-400 mb-1" />
                <span className="text-xs text-blue-600 font-medium">Groom Photo</span>
                {supportedPhotoSlots.groomPhoto.required && (
                  <span className="text-[10px] text-blue-500">Required</span>
                )}
              </button>
            )}
            
            {/* Couple Photo - Only if supported */}
            {supportedPhotoSlots.couplePhoto && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('couple');
                  setShowMediaSelector(true);
                }}
                className="aspect-square border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors bg-purple-50"
              >
                <ImageIcon className="w-6 h-6 text-purple-400 mb-1" />
                <span className="text-xs text-purple-600 font-medium">Couple Photo</span>
                {supportedPhotoSlots.couplePhoto.required && (
                  <span className="text-[10px] text-purple-500">Required</span>
                )}
              </button>
            )}
            
            {/* Precious Moments - Only if supported */}
            {supportedPhotoSlots.preciousMoments && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('moment');
                  setShowMediaSelector(true);
                }}
                className="aspect-square border-2 border-dashed border-green-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors bg-green-50"
              >
                <ImageIcon className="w-6 h-6 text-green-400 mb-1" />
                <span className="text-xs text-green-600 font-medium text-center px-1">Gallery</span>
                <span className="text-[10px] text-green-500 mt-0.5">
                  (Up to {getPhotoSlotMaxCount(selectedLayoutId, 'preciousMoments')})
                </span>
              </button>
            )}
          </div>
          
          {/* Display Selected Photos by Category */}
          {safeLayout.cover_photos?.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              {/* Bride Photos */}
              {safeLayout.cover_photos.filter(p => p.category === 'bride').length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-pink-600 mb-2">Bride Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {safeLayout.cover_photos.filter(p => p.category === 'bride').map((photo, idx) => (
                      <div key={`bride-${idx}`} className="relative group aspect-square">
                        <img
                          src={photo.url || photo}
                          alt="Bride"
                          className="w-full h-full object-cover rounded-lg border border-pink-200"
                        />
                        <button
                          onClick={() => removeCategorizedPhoto(photo, 'bride')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Groom Photos */}
              {safeLayout.cover_photos.filter(p => p.category === 'groom').length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-blue-600 mb-2">Groom Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {safeLayout.cover_photos.filter(p => p.category === 'groom').map((photo, idx) => (
                      <div key={`groom-${idx}`} className="relative group aspect-square">
                        <img
                          src={photo.url || photo}
                          alt="Groom"
                          className="w-full h-full object-cover rounded-lg border border-blue-200"
                        />
                        <button
                          onClick={() => removeCategorizedPhoto(photo, 'groom')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Couple Photos */}
              {safeLayout.cover_photos.filter(p => p.category === 'couple').length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-purple-600 mb-2">Couple Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {safeLayout.cover_photos.filter(p => p.category === 'couple').map((photo, idx) => (
                      <div key={`couple-${idx}`} className="relative group aspect-square">
                        <img
                          src={photo.url || photo}
                          alt="Couple"
                          className="w-full h-full object-cover rounded-lg border border-purple-200"
                        />
                        <button
                          onClick={() => removeCategorizedPhoto(photo, 'couple')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Gallery/Precious Moments */}
              {safeLayout.cover_photos.filter(p => p.category === 'moment').length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-green-600 mb-2">Gallery Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {safeLayout.cover_photos.filter(p => p.category === 'moment').map((photo, idx) => (
                      <div key={`moment-${idx}`} className="relative group aspect-square">
                        {photo.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={photo.url || photo}
                              className="w-full h-full object-cover rounded-lg border border-green-200"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                              <Play className="w-6 h-6 text-white" fill="white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={photo.url || photo}
                            alt="Gallery"
                            className="w-full h-full object-cover rounded-lg border border-green-200"
                          />
                        )}
                        <button
                          onClick={() => removeCategorizedPhoto(photo, 'moment')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Borders & Backgrounds Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Borders & Backgrounds
          </CardTitle>
          <CardDescription>
            Customize photo borders and background images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAssets ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading assets...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo Borders */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Photo Borders</Label>
                {availableBorders.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-sm text-amber-800">No borders available</p>
                    <p className="text-xs text-amber-600 mt-1">Admin needs to upload borders first</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Couple Border */}
                    <div className="space-y-2 p-3 bg-purple-50 rounded-lg border">
                      <Label className="text-xs font-medium text-purple-700">Couple Border</Label>
                      <Select
                        value={safeLayout.theme_assets?.borders?.couple_border_id || 'none'}
                        onValueChange={(value) => {
                          handleUpdateLayout({
                            theme_assets: {
                              ...safeLayout.theme_assets,
                              borders: {
                                ...safeLayout.theme_assets?.borders,
                                couple_border_id: value === 'none' ? null : value
                              }
                            }
                          });
                          updateBorder('couple_border_id', value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger className="text-xs bg-white">
                          <SelectValue placeholder="Select border" />
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
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {safeLayout.theme_assets?.borders?.couple_border_id && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          {(() => {
                            const selectedBorder = availableBorders.find(b => b.id === safeLayout.theme_assets.borders.couple_border_id);
                            return selectedBorder?.cdn_url ? (
                              <img 
                                src={selectedBorder.cdn_url} 
                                alt="Preview"
                                className="w-full h-20 object-contain"
                              />
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* Bride/Groom Border */}
                    <div className="space-y-2 p-3 bg-pink-50 rounded-lg border">
                      <Label className="text-xs font-medium text-pink-700">Bride/Groom Border</Label>
                      <Select
                        value={safeLayout.theme_assets?.borders?.bride_groom_border_id || 'none'}
                        onValueChange={(value) => {
                          handleUpdateLayout({
                            theme_assets: {
                              ...safeLayout.theme_assets,
                              borders: {
                                ...safeLayout.theme_assets?.borders,
                                bride_groom_border_id: value === 'none' ? null : value
                              }
                            }
                          });
                          updateBorder('bride_groom_border_id', value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger className="text-xs bg-white">
                          <SelectValue placeholder="Select border" />
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
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {safeLayout.theme_assets?.borders?.bride_groom_border_id && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          {(() => {
                            const selectedBorder = availableBorders.find(b => b.id === safeLayout.theme_assets.borders.bride_groom_border_id);
                            return selectedBorder?.cdn_url ? (
                              <img 
                                src={selectedBorder.cdn_url} 
                                alt="Preview"
                                className="w-full h-20 object-contain"
                              />
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* Gallery Border */}
                    <div className="space-y-2 p-3 bg-green-50 rounded-lg border">
                      <Label className="text-xs font-medium text-green-700">Gallery Border</Label>
                      <Select
                        value={safeLayout.theme_assets?.borders?.precious_moments_border_id || 'none'}
                        onValueChange={(value) => {
                          handleUpdateLayout({
                            theme_assets: {
                              ...safeLayout.theme_assets,
                              borders: {
                                ...safeLayout.theme_assets?.borders,
                                precious_moments_border_id: value === 'none' ? null : value
                              }
                            }
                          });
                          updateBorder('precious_moments_border_id', value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger className="text-xs bg-white">
                          <SelectValue placeholder="Select border" />
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
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {safeLayout.theme_assets?.borders?.precious_moments_border_id && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          {(() => {
                            const selectedBorder = availableBorders.find(b => b.id === safeLayout.theme_assets.borders.precious_moments_border_id);
                            return selectedBorder?.cdn_url ? (
                              <img 
                                src={selectedBorder.cdn_url} 
                                alt="Preview"
                                className="w-full h-20 object-contain"
                              />
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Background Image */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hero Background</Label>
                {availableBackgrounds.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-sm text-amber-800">No backgrounds available</p>
                    <p className="text-xs text-amber-600 mt-1">Admin needs to upload backgrounds first</p>
                  </div>
                ) : (
                  <>
                    <Select
                      value={safeLayout.theme_assets?.background_image_id || 'none'}
                      onValueChange={(value) => {
                        handleUpdateLayout({
                          theme_assets: {
                            ...safeLayout.theme_assets,
                            background_image_id: value === 'none' ? null : value
                          }
                        });
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select background" />
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
                    {safeLayout.theme_assets?.background_image_id && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                        {(() => {
                          const selectedBg = availableBackgrounds.find(bg => bg.id === safeLayout.theme_assets.background_image_id);
                          return selectedBg?.cdn_url ? (
                            <img 
                              src={selectedBg.cdn_url} 
                              alt="Background Preview"
                              className="w-full h-32 object-cover rounded"
                            />
                          ) : null;
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Studio Details Card - With Dropdown and Toggle */}
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
                      // Clear studio details
                      handleUpdateLayout({
                        studio_details: {
                          studio_id: '',
                          name: '',
                          logo_url: '',
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
                        console.log('Selected studio:', selectedStudio);
                        // PROMPT 6: Include default_image_url for studio image display
                        handleUpdateLayout({
                          studio_details: {
                            studio_id: selectedStudio.id,
                            name: selectedStudio.name || '',
                            logo_url: selectedStudio.logo_url || '',
                            studio_image_url: selectedStudio.default_image_url || '', // Add studio image
                            website: selectedStudio.website || '',
                            email: selectedStudio.email || '',
                            phone: selectedStudio.phone || '',
                            address: selectedStudio.address || '',
                            contact: selectedStudio.contact || '',
                            show_details: true // Auto-show details when studio is selected
                          }
                        });
                      }
                    }
                  }}
                  disabled={loading || availableStudios.length === 0}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={availableStudios.length === 0 ? "No studios available - Create one in Profile" : "Select a studio"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableStudios.map(studio => (
                      <SelectItem key={studio.id} value={studio.id}>
                        {studio.name}
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
              
              {/* Show Details Toggle */}
              {safeLayout.studio_details?.studio_id && safeLayout.studio_details?.studio_id !== '' && (
                <div className="space-y-3">
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
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          safeLayout.studio_details?.show_details ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Studio Preview */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
                    {(() => {
                      const logoUrl = safeLayout.studio_details?.logo_url;
                      const isInvalidUrl = logoUrl && (logoUrl.includes('google.com/url') || logoUrl.includes('iso.500px.com'));
                      
                      if (!logoUrl || isInvalidUrl) {
                        return (
                          <div className="h-20 mx-auto flex flex-col items-center justify-center bg-gray-100 rounded mb-3">
                            <Building2 className="w-8 h-8 text-gray-400" />
                            <span className="text-gray-400 text-xs text-center mt-1">
                              {isInvalidUrl ? 'Invalid logo URL detected' : 'No logo uploaded'}
                            </span>
                            {isInvalidUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 text-xs"
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    // Clear the invalid logo URL
                                    handleUpdateLayout({
                                      studio_details: {
                                        ...safeLayout.studio_details,
                                        logo_url: ''
                                      }
                                    });
                                    toast.success('Invalid logo URL cleared. Please re-upload your studio logo in Profile.');
                                    // Reload studios to get updated data
                                    loadStudios();
                                  } catch (error) {
                                    toast.error('Failed to clear invalid logo URL');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                disabled={loading}
                              >
                                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                Clear Invalid URL
                              </Button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="mb-3">
                          <img
                            src={logoUrl}
                            alt={safeLayout.studio_details.name || 'Studio logo'}
                            className="h-20 mx-auto object-contain"
                            onError={(e) => {
                              console.error('Studio logo load error:', e);
                              console.error('Failed logo URL:', logoUrl);
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              if (parent && !parent.querySelector('.error-message')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-center text-red-500 text-xs error-message mt-2';
                                errorDiv.innerHTML = `
                                  Logo failed to load<br>
                                  <small class="text-gray-500">Re-upload logo in Profile</small>
                                `;
                                parent.appendChild(errorDiv);
                              }
                            }}
                            onLoad={() => {
                              console.log('Studio logo loaded successfully:', logoUrl);
                            }}
                          />
                        </div>
                      );
                    })()}
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
                        {safeLayout.studio_details?.address && (
                          <p className="text-gray-600">{safeLayout.studio_details.address}</p>
                        )}
                      </div>
                    )}
                    {!safeLayout.studio_details?.show_details && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Only logo will be shown
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          isOpen={showMediaSelector}
          weddingId={weddingId}
          onSelect={handleMediaSelect}
          onClose={() => {
            setShowMediaSelector(false);
            setSelectedCategory(null);
          }}
          multiSelect={selectedCategory === 'moment'}
          maxSelection={selectedCategory === 'moment' ? getPhotoSlotMaxCount(selectedLayoutId, 'preciousMoments') : 1}
          category={selectedCategory} // PROMPT 7: Pass category for validation
          currentCategoryCount={layout?.cover_photos?.filter(p => p.category === selectedCategory).length || 0} // PROMPT 7: Pass current count
        />
      )}
    </div>
  );
}
