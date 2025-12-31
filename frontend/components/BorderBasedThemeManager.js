'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image as ImageIcon, Upload, X, Building2, Loader2, Eye, 
  FlipHorizontal, Check, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function BorderBasedThemeManager({ weddingId, wedding }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Section configuration state
  const [sectionConfig, setSectionConfig] = useState(null);
  
  // Available assets
  const [borders, setBorders] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [studios, setStudios] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // Cover section state
  const [coverMode, setCoverMode] = useState('single'); // 'single' or 'separate'
  const [selectedCoverBorder, setSelectedCoverBorder] = useState(null);
  const [couplePhoto, setCouplePhoto] = useState(null);
  const [bridePhoto, setBridePhoto] = useState(null);
  const [groomPhoto, setGroomPhoto] = useState(null);
  
  // Studio section state
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [selectedStudioBorder, setSelectedStudioBorder] = useState(null);
  const [studioPhoto, setStudioPhoto] = useState(null);
  
  // Background state
  const [selectedBackground, setSelectedBackground] = useState(null);

  useEffect(() => {
    if (weddingId) {
      loadAllData();
    }
  }, [weddingId]);

  const loadAllData = async () => {
    try {
      setLoadingAssets(true);
      await Promise.all([
        loadSectionConfig(),
        loadBorders(),
        loadBackgrounds(),
        loadStudios()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load theme data');
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadSectionConfig = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}/sections`);
      setSectionConfig(response.data);
      
      // Populate state from section config
      const section1 = response.data.section_1_cover || {};
      setCoverMode(section1.mode || 'single');
      setCouplePhoto(section1.couple_photo || null);
      setBridePhoto(section1.bride_photo || null);
      setGroomPhoto(section1.groom_photo || null);
      
      if (section1.selected_border_id) {
        // Border will be loaded when borders are fetched
        setSelectedCoverBorder({ id: section1.selected_border_id });
      }
      
      const section3 = response.data.section_3_studio || {};
      setStudioPhoto(section3.studio_photo || null);
      if (section3.studio_id) {
        setSelectedStudio({ id: section3.studio_id });
      }
      if (section3.studio_border_id) {
        setSelectedStudioBorder({ id: section3.studio_border_id });
      }
      
      if (response.data.background_image_id) {
        setSelectedBackground({ id: response.data.background_image_id });
      }
    } catch (error) {
      console.error('Error loading section config:', error);
    }
  };

  const loadBorders = async () => {
    try {
      const response = await api.get('/api/borders');
      setBorders(response.data);
      
      // Update selected border references with full data
      if (selectedCoverBorder?.id) {
        const border = response.data.find(b => b.id === selectedCoverBorder.id);
        if (border) setSelectedCoverBorder(border);
      }
      if (selectedStudioBorder?.id) {
        const border = response.data.find(b => b.id === selectedStudioBorder.id);
        if (border) setSelectedStudioBorder(border);
      }
    } catch (error) {
      console.error('Error loading borders:', error);
      toast.error('Failed to load borders');
    }
  };

  const loadBackgrounds = async () => {
    try {
      const response = await api.get('/api/theme-assets/backgrounds');
      setBackgrounds(response.data);
      
      if (selectedBackground?.id) {
        const bg = response.data.find(b => b.id === selectedBackground.id);
        if (bg) setSelectedBackground(bg);
      }
    } catch (error) {
      console.error('Error loading backgrounds:', error);
    }
  };

  const loadStudios = async () => {
    try {
      const response = await api.get('/api/studios');
      setStudios(response.data);
      
      if (selectedStudio?.id) {
        const studio = response.data.find(s => s.id === selectedStudio.id);
        if (studio) setSelectedStudio(studio);
      }
    } catch (error) {
      console.error('Error loading studios:', error);
    }
  };

  // Cover Section Handlers
  const handleCoverModeChange = async (mode) => {
    try {
      await api.put(`/api/weddings/${weddingId}/sections/cover`, { mode });
      setCoverMode(mode);
      toast.success(`Mode changed to ${mode}`);
      await loadSectionConfig();
    } catch (error) {
      console.error('Error updating mode:', error);
      toast.error('Failed to update mode');
    }
  };

  const handleSelectCoverBorder = async (border) => {
    try {
      setSelectedCoverBorder(border);
      
      // Update backend
      await api.put(`/api/weddings/${weddingId}/sections/cover`, {
        mode: coverMode,
        selected_border_id: border.id
      });
      
      toast.success('Border selected');
    } catch (error) {
      console.error('Error selecting border:', error);
      toast.error('Failed to select border');
    }
  };

  const handleUploadCoverPhoto = async (category, file) => {
    if (!selectedCoverBorder) {
      toast.error('Please select a border first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('border_id', selectedCoverBorder.id);

      const response = await api.post(
        `/api/weddings/${weddingId}/sections/cover/upload-photo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Update state
      if (category === 'couple') {
        setCouplePhoto(response.data);
      } else if (category === 'bride') {
        setBridePhoto(response.data);
      } else if (category === 'groom') {
        setGroomPhoto(response.data);
      }
      
      toast.success(`${category} photo uploaded successfully!`);
      await loadSectionConfig();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Studio Section Handlers
  const handleSelectStudio = async (studioId) => {
    const studio = studios.find(s => s.id === studioId);
    if (!studio) return;

    try {
      setSelectedStudio(studio);
      
      await api.put(`/api/weddings/${weddingId}/sections/studio`, {
        studio_id: studio.id,
        studio_border_id: selectedStudioBorder?.id || null
      });
      
      toast.success('Studio selected');
      await loadSectionConfig();
    } catch (error) {
      console.error('Error selecting studio:', error);
      toast.error('Failed to select studio');
    }
  };

  const handleSelectStudioBorder = async (border) => {
    try {
      setSelectedStudioBorder(border);
      
      await api.put(`/api/weddings/${weddingId}/sections/studio`, {
        studio_id: selectedStudio?.id || null,
        studio_border_id: border.id
      });
      
      toast.success('Studio border selected');
      await loadSectionConfig();
    } catch (error) {
      console.error('Error selecting studio border:', error);
      toast.error('Failed to select studio border');
    }
  };

  // Background Handler
  const handleSelectBackground = async (background) => {
    try {
      setSelectedBackground(background);
      
      // Update backend (you may need to add this endpoint)
      await api.put(`/api/weddings/${weddingId}/sections/background`, {
        background_image_id: background.id
      });
      
      toast.success('Background selected');
    } catch (error) {
      console.error('Error selecting background:', error);
      toast.error('Failed to select background');
    }
  };

  if (loadingAssets) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <span className="ml-3 text-gray-600">Loading theme assets...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Border-Based Theme System</CardTitle>
          <CardDescription>
            Customize your wedding page with dynamic borders and layouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cover" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cover">Cover / Couple</TabsTrigger>
              <TabsTrigger value="studio">Studio</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
            </TabsList>

            {/* Cover / Couple Tab */}
            <TabsContent value="cover" className="space-y-6">
              {/* Mode Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Display Mode</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={coverMode === 'single' ? 'default' : 'outline'}
                    onClick={() => handleCoverModeChange('single')}
                    className="h-auto py-4"
                  >
                    <div className="text-center">
                      <div className="font-semibold">Single Couple Photo</div>
                      <div className="text-xs mt-1 opacity-75">One photo with border</div>
                    </div>
                  </Button>
                  <Button
                    variant={coverMode === 'separate' ? 'default' : 'outline'}
                    onClick={() => handleCoverModeChange('separate')}
                    className="h-auto py-4"
                  >
                    <div className="text-center">
                      <div className="font-semibold flex items-center justify-center gap-2">
                        Bride & Groom Separate
                        <FlipHorizontal className="w-4 h-4" />
                      </div>
                      <div className="text-xs mt-1 opacity-75">Same border, mirrored for groom</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Border Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Select Border
                  {selectedCoverBorder && (
                    <Badge variant="outline" className="ml-2">
                      <Check className="w-3 h-3 mr-1" />
                      {selectedCoverBorder.name}
                    </Badge>
                  )}
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {borders.filter(b => 
                    coverMode === 'single' 
                      ? (b.category === 'couple' || b.category === 'general')
                      : (b.category === 'bride_groom' || b.category === 'general')
                  ).map((border) => (
                    <div
                      key={border.id}
                      onClick={() => handleSelectCoverBorder(border)}
                      className={`relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-lg ${
                        selectedCoverBorder?.id === border.id
                          ? 'border-rose-500 ring-2 ring-rose-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={border.cdn_url}
                        alt={border.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-sm font-medium truncate">{border.name}</p>
                        {border.supports_mirror && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <FlipHorizontal className="w-3 h-3 mr-1" />
                            Mirror Support
                          </Badge>
                        )}
                      </div>
                      {selectedCoverBorder?.id === border.id && (
                        <div className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {borders.filter(b => 
                    coverMode === 'single' 
                      ? (b.category === 'couple' || b.category === 'general')
                      : (b.category === 'bride_groom' || b.category === 'general')
                  ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No borders available for {coverMode === 'single' ? 'couple' : 'bride/groom'} mode.</p>
                    <p className="text-sm mt-1">Contact admin to upload borders.</p>
                  </div>
                )}
              </div>

              {/* Photo Upload Section */}
              {selectedCoverBorder && (
                <div className="space-y-4">
                  {coverMode === 'single' ? (
                    // Single Couple Photo
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Couple Photo</Label>
                      {couplePhoto ? (
                        <div className="relative inline-block">
                          <img
                            src={couplePhoto.cropped_url || couplePhoto.original_url}
                            alt="Couple"
                            className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => setCouplePhoto(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadCoverPhoto('couple', e.target.files[0])}
                            disabled={uploading}
                            className="hidden"
                            id="couple-upload"
                          />
                          <label htmlFor="couple-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">Click to upload couple photo</p>
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Separate Bride & Groom Photos
                    <div className="grid grid-cols-2 gap-6">
                      {/* Bride Photo */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Bride Photo</Label>
                        {bridePhoto ? (
                          <div className="relative">
                            <img
                              src={bridePhoto.cropped_url || bridePhoto.original_url}
                              alt="Bride"
                              className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => setBridePhoto(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Badge className="absolute bottom-2 left-2">Normal Border</Badge>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-64 flex flex-col items-center justify-center">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadCoverPhoto('bride', e.target.files[0])}
                              disabled={uploading}
                              className="hidden"
                              id="bride-upload"
                            />
                            <label htmlFor="bride-upload" className="cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-600">Upload bride photo</p>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Groom Photo */}
                      <div>
                        <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                          Groom Photo
                          <FlipHorizontal className="w-4 h-4 text-rose-500" />
                        </Label>
                        {groomPhoto ? (
                          <div className="relative">
                            <img
                              src={groomPhoto.cropped_url || groomPhoto.original_url}
                              alt="Groom"
                              className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => setGroomPhoto(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Badge className="absolute bottom-2 left-2 bg-rose-500">
                              <FlipHorizontal className="w-3 h-3 mr-1" />
                              Mirrored Border
                            </Badge>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-rose-300 rounded-lg p-8 text-center h-64 flex flex-col items-center justify-center bg-rose-50">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadCoverPhoto('groom', e.target.files[0])}
                              disabled={uploading}
                              className="hidden"
                              id="groom-upload"
                            />
                            <label htmlFor="groom-upload" className="cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-rose-400" />
                              <p className="text-sm text-rose-600">Upload groom photo</p>
                              <p className="text-xs text-rose-500 mt-1">Border will be mirrored</p>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Studio Tab */}
            <TabsContent value="studio" className="space-y-6">
              {/* Studio Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Studio</Label>
                <Select
                  value={selectedStudio?.id || ''}
                  onValueChange={handleSelectStudio}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a studio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {studios.map((studio) => (
                      <SelectItem key={studio.id} value={studio.id}>
                        <div className="flex items-center gap-2">
                          {studio.logo_url && (
                            <img
                              src={studio.logo_url}
                              alt={studio.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <span>{studio.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {studios.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No studios found. Create a studio in your profile first.
                  </p>
                )}
              </div>

              {/* Studio Border Selection */}
              {selectedStudio && (
                <>
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Select Studio Border
                      {selectedStudioBorder && (
                        <Badge variant="outline" className="ml-2">
                          <Check className="w-3 h-3 mr-1" />
                          {selectedStudioBorder.name}
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Using Bride/Groom borders for studio images
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {borders.filter(b => b.category === 'bride_groom' || b.category === 'general').map((border) => (
                        <div
                          key={border.id}
                          onClick={() => handleSelectStudioBorder(border)}
                          className={`relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-lg ${
                            selectedStudioBorder?.id === border.id
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={border.cdn_url}
                            alt={border.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-sm font-medium truncate">{border.name}</p>
                          </div>
                          {selectedStudioBorder?.id === border.id && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Studio Photo Preview */}
                  {selectedStudio.default_image_url && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Studio Photo Preview</Label>
                      <img
                        src={selectedStudio.default_image_url}
                        alt={selectedStudio.name}
                        className="w-full max-w-md h-64 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Background Tab */}
            <TabsContent value="background" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Select Background Image
                  {selectedBackground && (
                    <Badge variant="outline" className="ml-2">
                      <Check className="w-3 h-3 mr-1" />
                      {selectedBackground.name}
                    </Badge>
                  )}
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {backgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      onClick={() => handleSelectBackground(bg)}
                      className={`relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-lg ${
                        selectedBackground?.id === bg.id
                          ? 'border-green-500 ring-2 ring-green-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={bg.cdn_url}
                        alt={bg.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-sm font-medium truncate">{bg.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">{bg.category}</Badge>
                      </div>
                      {selectedBackground?.id === bg.id && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {backgrounds.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No background images available.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
