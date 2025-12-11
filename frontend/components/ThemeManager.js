'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Image as ImageIcon, Type, Upload, X, Building2, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import ThemePreviewModal from '@/components/ThemePreviewModal';
import MediaSelector from '@/components/MediaSelector';

const THEME_OPTIONS = [
  { id: 'floral_garden', name: 'Floral Garden', description: 'Soft & Romantic', colors: ['#fce7f3', '#fbcfe8'] },
  { id: 'royal_palace', name: 'Royal Palace', description: 'Traditional Luxury', colors: ['#fde68a', '#dc2626'] },
  { id: 'modern_minimalist', name: 'Modern Minimalist', description: 'Clean & Simple', colors: ['#ffffff', '#000000'] },
  { id: 'cinema_scope', name: 'Cinema Scope', description: 'Video First', colors: ['#1f2937', '#ef4444'] },
];

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

  useEffect(() => {
    loadThemeSettings();
    loadUserStudios();
    
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
      toast.error('Failed to add selected photos');
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

        {/* Cover Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Cover Photos
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowMediaSelector(true)}
              className="text-rose-600 border-rose-300 hover:bg-rose-50"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Select from Gallery
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {safeTheme.cover_photos?.map((photoUrl, idx) => (
              <div key={idx} className="relative group aspect-square">
                <img
                  src={photoUrl}
                  alt={`Cover ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  onClick={() => removePhoto(photoUrl)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 transition-colors">
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload New</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          
          <p className="text-xs text-gray-500">
            You can upload new photos or select from your wedding media gallery
          </p>
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
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelection}
        weddingId={weddingId}
        maxSelection={10}
        allowedTypes={['photo']}
        selectedMedia={[]}
      />
    </Card>
  );
}
