'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Heart, 
  User, 
  Users,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * CategoryPhotoUpload Component
 * Handles photo uploads by category (bride, groom, couple, precious_moments)
 * Shows category-specific limits and validations
 */
export default function CategoryPhotoUpload({ weddingId, themeConfig, onPhotosUpdate }) {
  const [categories, setCategories] = useState({
    bride: [],
    groom: [],
    couple: [],
    precious_moments: []
  });
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('bride');
  const [loading, setLoading] = useState(true);

  // Get limits from theme config
  const getCategoryLimit = (category) => {
    if (category === 'precious_moments' && themeConfig?.precious_moments_config) {
      return themeConfig.precious_moments_config.max_photos || 8;
    }
    return 1; // Single photo for bride, groom, couple
  };

  const getMinPhotos = (category) => {
    if (category === 'precious_moments' && themeConfig?.precious_moments_config) {
      return themeConfig.precious_moments_config.min_photos || 0;
    }
    return 0;
  };

  const isCategoryRequired = (category) => {
    if (!themeConfig?.required_sections) return false;
    return themeConfig.required_sections[category] || false;
  };

  useEffect(() => {
    loadExistingPhotos();
  }, [weddingId]);

  const loadExistingPhotos = async () => {
    try {
      setLoading(true);
      // Load wedding data to get existing photos
      const response = await api.get(`/api/weddings/${weddingId}`);
      const wedding = response.data;
      
      // Parse existing photos by category from theme_settings
      if (wedding.theme_settings?.category_photos) {
        setCategories(wedding.theme_settings.category_photos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e, category) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const currentCount = categories[category].length;
    const limit = getCategoryLimit(category);
    const availableSlots = limit - currentCount;

    if (files.length > availableSlots) {
      toast.error(`You can only upload ${availableSlots} more photo(s) for ${category}`);
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        // Upload to backend
        const formData = new FormData();
        formData.append('file', file);
        formData.append('wedding_id', weddingId);
        formData.append('category', category);

        const response = await api.post('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        uploadedUrls.push(response.data.url);
      }

      // Update categories
      const newCategories = {
        ...categories,
        [category]: [...categories[category], ...uploadedUrls]
      };
      setCategories(newCategories);

      // Save to wedding
      await api.put(`/api/weddings/${weddingId}/theme-assets`, {
        category_photos: newCategories
      });

      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully`);
      
      if (onPhotosUpdate) {
        onPhotosUpdate(newCategories);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (category, index) => {
    try {
      const newPhotos = [...categories[category]];
      newPhotos.splice(index, 1);
      
      const newCategories = {
        ...categories,
        [category]: newPhotos
      };
      setCategories(newCategories);

      // Save to wedding
      await api.put(`/api/weddings/${weddingId}/theme-assets`, {
        category_photos: newCategories
      });

      toast.success('Photo removed');
      
      if (onPhotosUpdate) {
        onPhotosUpdate(newCategories);
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bride': return <User className="w-4 h-4" />;
      case 'groom': return <User className="w-4 h-4" />;
      case 'couple': return <Users className="w-4 h-4" />;
      case 'precious_moments': return <Heart className="w-4 h-4" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderCategoryCard = (category) => {
    const currentCount = categories[category].length;
    const limit = getCategoryLimit(category);
    const minPhotos = getMinPhotos(category);
    const required = isCategoryRequired(category);
    const isFull = currentCount >= limit;
    const meetsMinimum = currentCount >= minPhotos;

    return (
      <Card key={category}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
              {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </div>
            <Badge variant={meetsMinimum ? "default" : "secondary"}>
              {currentCount} / {limit}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            {minPhotos > 0 && `Minimum ${minPhotos} photo(s) required. `}
            {category === 'precious_moments' ? 
              `Upload ${minPhotos}-${limit} special moments` :
              'Upload 1 photo'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories[category].map((url, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                <img 
                  src={url} 
                  alt={`${category} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(category, index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {!isFull && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-rose-500 hover:bg-rose-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <input
                  type="file"
                  accept="image/*"
                  multiple={category === 'precious_moments'}
                  onChange={(e) => handleFileSelect(e, category)}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-rose-500" />
                    <span className="text-xs text-muted-foreground group-hover:text-rose-500">Upload</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Status Alert */}
          {!meetsMinimum && required && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This theme requires at least {minPhotos} photo(s) in this category
              </AlertDescription>
            </Alert>
          )}

          {meetsMinimum && required && (
            <Alert className="border-green-500 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-600">
                Category requirement met
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Wedding Photos</h3>
        <p className="text-sm text-muted-foreground">
          Upload photos for each category based on your selected theme requirements.
        </p>
      </div>

      {/* Tabs for Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="bride" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            Bride
          </TabsTrigger>
          <TabsTrigger value="groom" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            Groom
          </TabsTrigger>
          <TabsTrigger value="couple" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Couple
          </TabsTrigger>
          <TabsTrigger value="precious_moments" className="text-xs">
            <Heart className="w-3 h-3 mr-1" />
            Moments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bride" className="mt-4">
          {renderCategoryCard('bride')}
        </TabsContent>

        <TabsContent value="groom" className="mt-4">
          {renderCategoryCard('groom')}
        </TabsContent>

        <TabsContent value="couple" className="mt-4">
          {renderCategoryCard('couple')}
        </TabsContent>

        <TabsContent value="precious_moments" className="mt-4">
          {renderCategoryCard('precious_moments')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
