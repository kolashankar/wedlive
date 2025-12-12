'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Image as ImageIcon, Type, Upload, X, Building2, Loader2, Eye, Play } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import ThemePreviewModal from '@/components/ThemePreviewModal';
import MediaSelector from '@/components/MediaSelector';

const THEME_OPTIONS = [
  { id: 'floral_garden', name: 'Floral Garden', description: 'Soft & Romantic', colors: ['#fce7f3', '#fbcfe8'] },
  { id: 'royal_palace', name: 'Royal Palace', description: 'Traditional Luxury', colors: ['#fde68a', '#dc2626'] },
  { id: 'modern_minimalist', name: 'Modern Minimalist', description: 'Clean & Simple', colors: ['#ffffff', '#000000'] },
  { id: 'cinema_scope', name: 'Cinema Scope', description: 'Video First', colors: ['#1f2937', '#ef4444'] },
  { id: 'premium_wedding_card', name: 'Premium Wedding Card', description: 'Elegant Invitation', colors: ['#d4af37', '#ffffff'] },
  { id: 'romantic_pastel', name: 'Romantic Pastel', description: 'Sweet & Lovely', colors: ['#fda4af', '#e9d5ff'] },
  { id: 'traditional_south_indian', name: 'Traditional South Indian', description: 'Cultural Heritage', colors: ['#f59e0b', '#dc2626'] },
];

// Theme-specific photo requirements configuration
const THEME_PHOTO_REQUIREMENTS = {
  cinema_scope: {
    requiresGroom: true,
    requiresBride: true,
    requiresCouple: true,
    preciousMomentsCount: 5,
    description: 'Cinematic themes showcase all subjects individually and together'
  },
  modern_minimalist: {
    requiresGroom: false,
    requiresBride: false,
    requiresCouple: true,
    preciousMomentsCount: 2,
    description: 'Minimalist design focuses on the couple with select moments'
  },
  royal_palace: {
    requiresGroom: true,
    requiresBride: true,
    requiresCouple: true,
    preciousMomentsCount: 5,
    description: 'Traditional themes celebrate both individuals and the union'
  },
  floral_garden: {
    requiresGroom: false,
    requiresBride: false,
    requiresCouple: true,
    preciousMomentsCount: 4,
    description: 'Romantic garden theme highlights the couple with beautiful moments'
  },
  premium_wedding_card: {
    requiresGroom: false,
    requiresBride: false,
    requiresCouple: true,
    preciousMomentsCount: 3,
    description: 'Elegant invitation style features the couple with curated moments'
  },
  romantic_pastel: {
    requiresGroom: true,
    requiresBride: true,
    requiresCouple: true,
    preciousMomentsCount: 4,
    description: 'Sweet design showcases both partners and their love story'
  },
  traditional_south_indian: {
    requiresGroom: true,
    requiresBride: true,
    requiresCouple: true,
    preciousMomentsCount: 5,
    description: 'Cultural heritage theme honors both families and the couple'
  }
};

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
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [studios, setStudios] = useState([]);
  const [loadingStudios, setLoadingStudios] = useState(true);
  const [previewThemeId, setPreviewThemeId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Theme assets state
  const [availableBorders, setAvailableBorders] = useState([]);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  useEffect(() => {
    loadThemeSettings();
    loadUserStudios();
    loadThemeAssets();
    
    // Load Google Fonts dynamically
    loadGoogleFonts();
  }, [weddingId]);

  const loadGoogleFonts = () => {
    const fontsToLoad = FONT_OPTIONS.map(f => f.googleFont).join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontsToLoad}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const loadThemeSettings = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}/theme`);
      
      // CRITICAL FIX: Validate response data
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid theme settings response:', response.data);
        toast.error('Invalid theme settings received');
        return;
      }
      
      setTheme(response.data);
    } catch (error) {
      console.error('Error loading theme:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load theme settings';
      toast.error(errorMessage);
      
      // Set default theme to prevent crashes
      setTheme({
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
          website: '',
          email: '',
          phone: '',
          address: '',
          contact: ''
        },
        custom_messages: {
          welcome_text: 'Welcome to our big day',
          description: ''
        }
      });
    }
  };

  const loadUserStudios = async () => {
    try {
      const response = await api.get('/api/profile/studios');
      setStudios(response.data);
    } catch (error) {
      console.error('Error loading studios:', error);
    } finally {
      setLoadingStudios(false);
    }
  };

  const loadThemeAssets = async () => {
    try {
      setLoadingAssets(true);
      const [bordersRes, stylesRes, backgroundsRes] = await Promise.all([
        api.get('/api/theme-assets/borders'),
        api.get('/api/theme-assets/precious-styles'),
        api.get('/api/theme-assets/backgrounds')
      ]);
      
      setAvailableBorders(bordersRes.data);
      setAvailableStyles(stylesRes.data);
      setAvailableBackgrounds(backgroundsRes.data);
    } catch (error) {
      console.error('Error loading theme assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleUpdateTheme = async (updates) => {
    try {
      setLoading(true);
      
      // CRITICAL FIX: Ensure proper data structure for API
      const cleanUpdates = { ...updates };
      
      // Handle nested objects properly - ensure they're objects, not strings
      if (cleanUpdates.studio_details && typeof cleanUpdates.studio_details === 'object') {
        // Convert to plain object for API
        cleanUpdates.studio_details = { ...cleanUpdates.studio_details };
      }
      
      if (cleanUpdates.custom_messages && typeof cleanUpdates.custom_messages === 'object') {
        // Convert to plain object for API
        cleanUpdates.custom_messages = { ...cleanUpdates.custom_messages };
      }
      
      // CRITICAL FIX: Handle cover_photos data structure - backend expects List[str]
      if (cleanUpdates.cover_photos) {
        // Convert objects back to strings for API compatibility
        cleanUpdates.cover_photos = cleanUpdates.cover_photos.map(photo => {
          if (typeof photo === 'string') {
            return photo;
          } else if (photo && typeof photo === 'object') {
            return photo.url || photo;
          }
          return photo;
        }).filter(Boolean); // Remove any null/undefined items
      }
      
      console.log('Sending theme update:', cleanUpdates);
      
      await api.put(`/api/weddings/${weddingId}/theme`, cleanUpdates);
      toast.success('Theme settings updated!');
      loadThemeSettings();
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error(error.response?.data?.detail || 'Failed to update theme settings');
    } finally {
      setLoading(false);
    }
  };

  const handleStudioSelect = async (studioId) => {
    if (studioId === 'none') {
      await handleUpdateTheme({
        studio_details: {
          studio_id: '',
          name: '',
          logo_url: '',
          website: '',
          email: '',
          phone: '',
          address: '',
          contact: ''
        }
      });
      return;
    }

    const selectedStudio = studios.find(s => s.id === studioId);
    if (selectedStudio) {
      await handleUpdateTheme({
        studio_details: {
          studio_id: selectedStudio.id,
          name: selectedStudio.name,
          logo_url: selectedStudio.logo_url || '',
          website: selectedStudio.website || '',
          email: selectedStudio.email || '',
          phone: selectedStudio.phone || '',
          address: selectedStudio.address || '',
          contact: selectedStudio.contact || ''
        }
      });
      
      // CRITICAL FIX: Reload studios to get updated data
      await loadUserStudios();
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wedding_id', weddingId);

      const response = await api.post('/api/media/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const photoUrl = response.data.cdn_url;
      const updatedPhotos = [...(theme?.cover_photos || []), photoUrl];
      
      await handleUpdateTheme({ cover_photos: updatedPhotos });
      toast.success('Cover photo added!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async (photoUrl) => {
    const updatedPhotos = (theme?.cover_photos || []).filter(url => url !== photoUrl);
    await handleUpdateTheme({ cover_photos: updatedPhotos });
  };

  const handleCategorizedPhotoUpload = async (e, category) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setUploadingPhoto(true);
      
      // Process each file
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('wedding_id', weddingId);

        const response = await api.post('/api/media/upload/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return {
          url: response.data.cdn_url || response.data.url,
          category: category,
          type: file.type.startsWith('video/') ? 'video' : 'photo'
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Get existing photos
      const existingPhotos = theme?.cover_photos || [];
      
      // Get theme-specific precious moments limit
      const preciousMomentsLimit = THEME_PHOTO_REQUIREMENTS[theme?.theme_id]?.preciousMomentsCount || 5;
      
      // Filter out existing photos of the same category (for single photo categories)
      let updatedPhotos;
      if (category === 'moment') {
        // For precious moments, allow multiple based on theme requirements
        const existingMoments = existingPhotos.filter(photo => photo.category !== 'moment');
        const allMoments = [...existingPhotos.filter(photo => photo.category === 'moment'), ...uploadedFiles];
        updatedPhotos = [...existingMoments, ...allMoments.slice(-preciousMomentsLimit)]; // Keep only allowed moments per theme
      } else {
        // For groom, bride, couple - replace existing photo of same category
        updatedPhotos = [
          ...existingPhotos.filter(photo => photo.category !== category),
          ...uploadedFiles
        ];
      }
      
      await handleUpdateTheme({ cover_photos: updatedPhotos });
      
      // Clear the input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading categorized photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeCategorizedPhoto = async (photoToRemove, category) => {
    const updatedPhotos = (theme?.cover_photos || []).filter(photo => 
      !(photo.url === photoToRemove.url || photo === photoToRemove)
    );
    await handleUpdateTheme({ cover_photos: updatedPhotos });
  };

  const handleMediaSelection = async (selectedMedia) => {
    try {
      // Extract the correct URL field from selected media items
      const selectedUrls = selectedMedia.map(item => item.cdn_url || item.file_url || item.url);
      
      // Add to existing cover photos (don't replace)
      const currentPhotos = theme?.cover_photos || [];
      const updatedPhotos = [...currentPhotos, ...selectedUrls];
      
      await handleUpdateTheme({ cover_photos: updatedPhotos });
      toast.success(`${selectedMedia.length} photo(s) added to cover photos!`);
    } catch (error) {
      console.error('Error adding selected photos:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. Please try again with smaller files or check your connection.');
      } else {
        toast.error('Failed to add selected photos');
      }
    }
  };

  const handleCategorizedMediaSelection = async (selectedMedia, category) => {
    try {
      // Process selected media items with category assignment
      const processedMedia = selectedMedia.map(item => ({
        url: item.cdn_url || item.file_url || item.url,
        category: category,
        type: item.type || (item.file_type?.includes('video') ? 'video' : 'photo')
      }));
      
      // Get existing photos
      const existingPhotos = theme?.cover_photos || [];
      
      // Get theme-specific precious moments limit
      const preciousMomentsLimit = THEME_PHOTO_REQUIREMENTS[theme?.theme_id]?.preciousMomentsCount || 5;
      
      // Filter out existing photos of the same category (for single photo categories)
      let updatedPhotos;
      if (category === 'moment') {
        // For precious moments, allow multiple based on theme requirements
        const existingMoments = existingPhotos.filter(photo => photo.category !== 'moment');
        const allMoments = [...existingPhotos.filter(photo => photo.category === 'moment'), ...processedMedia];
        updatedPhotos = [...existingMoments, ...allMoments.slice(-preciousMomentsLimit)]; // Keep only allowed moments per theme
      } else {
        // For groom, bride, couple - replace existing photo of same category
        updatedPhotos = [
          ...existingPhotos.filter(photo => photo.category !== category),
          ...processedMedia
        ];
      }
      
      await handleUpdateTheme({ cover_photos: updatedPhotos });
      toast.success(`${selectedMedia.length} media item(s) assigned to ${category}!`);
    } catch (error) {
      console.error('Error assigning media to category:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Assignment timeout. Please try again.');
      } else {
        toast.error(`Failed to assign media to ${category}`);
      }
    }
  };

  if (!theme || typeof theme !== 'object') {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            <span className="ml-2 text-gray-500">Loading theme settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure theme has all required properties with defaults
  const safeTheme = {
    theme_id: theme.theme_id || 'floral_garden',
    custom_font: theme.custom_font || 'Great Vibes',
    primary_color: theme.primary_color || '#f43f5e',
    secondary_color: theme.secondary_color || '#a855f7',
    pre_wedding_video: theme.pre_wedding_video || '',
    cover_photos: Array.isArray(theme.cover_photos) ? theme.cover_photos : [],
    studio_details: theme.studio_details || {
      studio_id: '',
      name: '',
      logo_url: '',
      website: '',
      email: '',
      phone: '',
      address: '',
      contact: ''
    },
    custom_messages: theme.custom_messages || {
      welcome_text: 'Welcome to our big day',
      description: ''
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Wedding Theme
        </CardTitle>
        <CardDescription>
          Customize the appearance of your wedding landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection with Preview */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Theme Style</label>
          <div className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map((themeOption) => (
              <div key={themeOption.id} className="relative">
                <button
                  onClick={() => handleUpdateTheme({ theme_id: themeOption.id })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    safeTheme.theme_id === themeOption.id
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {themeOption.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="font-semibold text-sm">{themeOption.name}</div>
                  <div className="text-xs text-gray-500">{themeOption.description}</div>
                </button>
                
                {/* Preview Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewThemeId(themeOption.id);
                    setShowPreview(true);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Font Selection with Live Preview in Dropdown */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Couple Names Font
          </Label>
          <Select
            value={safeTheme.custom_font}
            onValueChange={(value) => handleUpdateTheme({ custom_font: value })}
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
              style={{ fontFamily: FONT_OPTIONS.find(f => f.name === safeTheme.custom_font)?.fontFamily || 'Inter' }}
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
                value={safeTheme.primary_color}
                onChange={(e) => handleUpdateTheme({ primary_color: e.target.value })}
                className="w-12 h-10 rounded border cursor-pointer"
                disabled={loading}
              />
              <Input
                value={safeTheme.primary_color}
                onChange={(e) => handleUpdateTheme({ primary_color: e.target.value })}
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
                value={safeTheme.secondary_color}
                onChange={(e) => handleUpdateTheme({ secondary_color: e.target.value })}
                className="w-12 h-10 rounded border cursor-pointer"
                disabled={loading}
              />
              <Input
                value={safeTheme.secondary_color}
                onChange={(e) => handleUpdateTheme({ secondary_color: e.target.value })}
                className="flex-1"
                placeholder="#a855f7"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Pre-Wedding Video */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pre-Wedding Video URL</label>
          <Input
            value={safeTheme.pre_wedding_video}
            onChange={(e) => handleUpdateTheme({ pre_wedding_video: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            disabled={loading}
          />
          <p className="text-xs text-gray-500">YouTube or direct video URL</p>
        </div>

        {/* Cover Photos - Dynamic based on Theme */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Cover Photos
            </label>
          </div>
          
          {/* Theme Requirements Info */}
          {THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id] && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Theme Requirements:</span>{' '}
                {THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id].description}
              </p>
            </div>
          )}
          
          {/* Categorized Selection from Gallery - Dynamic based on theme */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Groom Photo Selection - Conditional */}
            {THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id]?.requiresGroom && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('groom');
                    setShowMediaSelector(true);
                  }}
                  className="aspect-square border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-blue-50 w-full"
                >
                  <ImageIcon className="w-6 h-6 text-blue-400 mb-1" />
                  <span className="text-xs text-blue-600 font-medium">Groom Photo</span>
                </button>
              </div>
            )}
            
            {/* Bride Photo Selection - Conditional */}
            {THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id]?.requiresBride && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('bride');
                    setShowMediaSelector(true);
                  }}
                  className="aspect-square border-2 border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors bg-pink-50 w-full"
                >
                  <ImageIcon className="w-6 h-6 text-pink-400 mb-1" />
                  <span className="text-xs text-pink-600 font-medium">Bride Photo</span>
                </button>
              </div>
            )}
            
            {/* Couple Photo Selection - Conditional */}
            {THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id]?.requiresCouple && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('couple');
                    setShowMediaSelector(true);
                  }}
                  className="aspect-square border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors bg-purple-50 w-full"
                >
                  <ImageIcon className="w-6 h-6 text-purple-400 mb-1" />
                  <span className="text-xs text-purple-600 font-medium">Couple Photo</span>
                </button>
              </div>
            )}
            
            {/* Precious Moments Selection - Always shown with dynamic limit */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('moment');
                  setShowMediaSelector(true);
                }}
                className="aspect-square border-2 border-dashed border-green-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors bg-green-50 w-full"
              >
                <ImageIcon className="w-6 h-6 text-green-400 mb-1" />
                <span className="text-xs text-green-600 font-medium text-center px-1">Precious Moments</span>
                <span className="text-[10px] text-green-500 mt-0.5">
                  (Up to {THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id]?.preciousMomentsCount || 5})
                </span>
              </button>
            </div>
          </div>
          
          {/* Display Selected Photos by Category */}
          <div className="space-y-4">
            {/* Groom Photos */}
            {safeTheme.cover_photos?.filter(photo => photo.category === 'groom').length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-blue-600 mb-2">Groom Photos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {safeTheme.cover_photos.filter(photo => photo.category === 'groom').map((photo, idx) => (
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
            
            {/* Bride Photos */}
            {safeTheme.cover_photos?.filter(photo => photo.category === 'bride').length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-pink-600 mb-2">Bride Photos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {safeTheme.cover_photos.filter(photo => photo.category === 'bride').map((photo, idx) => (
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
            
            {/* Couple Photos */}
            {safeTheme.cover_photos?.filter(photo => photo.category === 'couple').length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-purple-600 mb-2">Couple Photos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {safeTheme.cover_photos.filter(photo => photo.category === 'couple').map((photo, idx) => (
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
            
            {/* Precious Moments */}
            {safeTheme.cover_photos?.filter(photo => photo.category === 'moment').length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-green-600 mb-2">Precious Moments</h4>
                <div className="grid grid-cols-3 gap-2">
                  {safeTheme.cover_photos.filter(photo => photo.category === 'moment').map((photo, idx) => (
                    <div key={`moment-${idx}`} className="relative group aspect-square">
                      {photo.type === 'video' || photo.url?.includes('.mp4') || photo.url?.includes('.mov') ? (
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
                          alt="Precious Moment"
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
          
          <p className="text-xs text-gray-500">
            Select photos from your uploaded media gallery for each category
          </p>
        </div>

        {/* Dynamic Theme Assets Section */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Dynamic Theme Assets
          </h3>
          
          {loadingAssets ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading theme assets...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo Borders Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Photo Borders</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Groom Border */}
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600">Groom Border</Label>
                    <Select
                      value={theme?.theme_assets?.borders?.groom_border_id || ''}
                      onValueChange={(value) => handleUpdateTheme({
                        theme_assets: {
                          ...theme?.theme_assets,
                          borders: {
                            ...theme?.theme_assets?.borders,
                            groom_border_id: value || null
                          }
                        }
                      })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select border" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableBorders.map(border => (
                          <SelectItem key={border.id} value={border.id}>
                            <div className="flex items-center gap-2">
                              <img src={border.cdn_url} alt={border.name} className="w-4 h-4 rounded object-cover" />
                              <span className="text-xs">{border.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Bride Border */}
                  <div className="space-y-1">
                    <Label className="text-xs text-pink-600">Bride Border</Label>
                    <Select
                      value={theme?.theme_assets?.borders?.bride_border_id || ''}
                      onValueChange={(value) => handleUpdateTheme({
                        theme_assets: {
                          ...theme?.theme_assets,
                          borders: {
                            ...theme?.theme_assets?.borders,
                            bride_border_id: value || null
                          }
                        }
                      })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select border" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableBorders.map(border => (
                          <SelectItem key={border.id} value={border.id}>
                            <div className="flex items-center gap-2">
                              <img src={border.cdn_url} alt={border.name} className="w-4 h-4 rounded object-cover" />
                              <span className="text-xs">{border.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Couple Border */}
                  <div className="space-y-1">
                    <Label className="text-xs text-purple-600">Couple Border</Label>
                    <Select
                      value={theme?.theme_assets?.borders?.couple_border_id || ''}
                      onValueChange={(value) => handleUpdateTheme({
                        theme_assets: {
                          ...theme?.theme_assets,
                          borders: {
                            ...theme?.theme_assets?.borders,
                            couple_border_id: value || null
                          }
                        }
                      })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select border" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableBorders.map(border => (
                          <SelectItem key={border.id} value={border.id}>
                            <div className="flex items-center gap-2">
                              <img src={border.cdn_url} alt={border.name} className="w-4 h-4 rounded object-cover" />
                              <span className="text-xs">{border.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Cover Border */}
                  <div className="space-y-1">
                    <Label className="text-xs text-green-600">Cover Border</Label>
                    <Select
                      value={theme?.theme_assets?.borders?.cover_border_id || ''}
                      onValueChange={(value) => handleUpdateTheme({
                        theme_assets: {
                          ...theme?.theme_assets,
                          borders: {
                            ...theme?.theme_assets?.borders,
                            cover_border_id: value || null
                          }
                        }
                      })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select border" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableBorders.map(border => (
                          <SelectItem key={border.id} value={border.id}>
                            <div className="flex items-center gap-2">
                              <img src={border.cdn_url} alt={border.name} className="w-4 h-4 rounded object-cover" />
                              <span className="text-xs">{border.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Precious Moment Style Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Precious Moments Style</Label>
                <Select
                  value={theme?.theme_assets?.precious_moment_style_id || ''}
                  onValueChange={(value) => handleUpdateTheme({
                    theme_assets: {
                      ...theme?.theme_assets,
                      precious_moment_style_id: value || null
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style for precious moments layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default Layout</SelectItem>
                    {availableStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex items-center gap-2">
                          {style.cdn_url && (
                            <img src={style.cdn_url} alt={style.name} className="w-4 h-4 rounded object-cover" />
                          )}
                          <div>
                            <div className="text-xs font-medium">{style.name}</div>
                            <div className="text-xs text-gray-500">{style.layout_type} • {style.photo_count} photos</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Background Image Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Background Image</Label>
                <Select
                  value={theme?.theme_assets?.background_image_id || ''}
                  onValueChange={(value) => handleUpdateTheme({
                    theme_assets: {
                      ...theme?.theme_assets,
                      background_image_id: value || null
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select background image (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Background</SelectItem>
                    {availableBackgrounds.map(bg => (
                      <SelectItem key={bg.id} value={bg.id}>
                        <div className="flex items-center gap-2">
                          <img src={bg.cdn_url} alt={bg.name} className="w-6 h-4 rounded object-cover" />
                          <div>
                            <div className="text-xs font-medium">{bg.name}</div>
                            <div className="text-xs text-gray-500">{bg.category} • {bg.width}x{bg.height}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Random Assignment Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await api.get('/api/theme-assets/random-defaults');
                      const defaults = response.data;
                      
                      await handleUpdateTheme({
                        theme_assets: {
                          borders: {
                            groom_border_id: defaults.border?.id || null,
                            bride_border_id: defaults.border?.id || null,
                            couple_border_id: defaults.border?.id || null,
                            cover_border_id: defaults.border?.id || null
                          },
                          precious_moment_style_id: defaults.precious_moment_style?.id || null,
                          background_image_id: defaults.background?.id || null
                        }
                      });
                      
                      toast.success('Random theme assets assigned!');
                    } catch (error) {
                      console.error('Error assigning random assets:', error);
                      toast.error('Failed to assign random assets');
                    }
                  }}
                  className="text-xs"
                >
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Assign Random Assets
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/admin/theme-assets', '_blank')}
                  className="text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Manage Assets
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Messages */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Welcome Message</label>
          <Input
            value={safeTheme.custom_messages?.welcome_text || ''}
            onChange={(e) => handleUpdateTheme({
              custom_messages: {
                ...safeTheme.custom_messages,
                welcome_text: e.target.value
              }
            })}
            placeholder="Welcome to our big day"
            disabled={loading}
          />
          
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={safeTheme.custom_messages?.description || ''}
            onChange={(e) => handleUpdateTheme({
              custom_messages: {
                ...safeTheme.custom_messages,
                description: e.target.value
              }
            })}
            placeholder="Tell your love story..."
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
          />
        </div>

        {/* Studio Partner Selection */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-rose-50 to-purple-50 rounded-lg border border-rose-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Studio Partner (Optional)
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/profile', '_blank')}
            >
              Manage Studios
            </Button>
          </div>
          
          {loadingStudios ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading studios...
            </div>
          ) : studios.length > 0 ? (
            <div className="space-y-2">
              <Label>Select Studio</Label>
              <Select
                value={safeTheme.studio_details?.studio_id || 'none'}
                onValueChange={handleStudioSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {studios.map(studio => (
                    <SelectItem key={studio.id} value={studio.id}>
                      <div className="flex items-center gap-2">
                        {studio.logo_url && (
                          <img src={studio.logo_url} alt={studio.name} className="w-4 h-4 rounded" />
                        )}
                        {studio.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {safeTheme.studio_details?.studio_id && (
                <div className="p-3 bg-white rounded-md border">
                  <div className="flex items-start gap-3">
                    {safeTheme.studio_details.logo_url && (
                      <img
                        src={safeTheme.studio_details.logo_url}
                        alt={safeTheme.studio_details.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{safeTheme.studio_details.name}</p>
                      {safeTheme.studio_details.contact && (
                        <p className="text-xs text-gray-500">{safeTheme.studio_details.contact}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600 bg-white p-3 rounded-md">
              <p className="mb-2">No studios found. Create a studio in your profile to display branding on your wedding theme.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/profile', '_blank')}
              >
                Go to Profile
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Theme Preview Modal */}
      {showPreview && previewThemeId && (
        <ThemePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          wedding={wedding}
          themeId={previewThemeId}
          onApply={async (themeId) => {
            await handleUpdateTheme({ theme_id: themeId });
          }}
        />
      )}

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => {
          setShowMediaSelector(false);
          setSelectedCategory(null);
        }}
        onSelect={(selectedMedia) => {
          if (selectedCategory) {
            handleCategorizedMediaSelection(selectedMedia, selectedCategory);
          } else {
            handleMediaSelection(selectedMedia);
          }
          setShowMediaSelector(false);
          setSelectedCategory(null);
        }}
        weddingId={weddingId}
        maxSelection={selectedCategory === 'moment' ? (THEME_PHOTO_REQUIREMENTS[safeTheme.theme_id]?.preciousMomentsCount || 5) : 1}
        allowedTypes={selectedCategory === 'moment' ? ['photo', 'video'] : ['photo']}
        selectedMedia={[]}
        title={selectedCategory ? `Select ${selectedCategory === 'groom' ? 'Groom' : selectedCategory === 'bride' ? 'Bride' : selectedCategory === 'couple' ? 'Couple' : 'Precious Moments'} Media` : 'Select Media'}
      />
    </Card>
  );
}
