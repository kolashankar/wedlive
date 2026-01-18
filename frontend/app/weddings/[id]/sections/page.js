'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Image as ImageIcon, Video, Building2, Heart, 
  Plus, X, Check, AlertCircle, Loader2, ArrowLeft, Trash2,
  RefreshCw, Eye, Edit3
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

export default function WeddingSectionBuilder() {
  const router = useRouter();
  const params = useParams();
  const wedding_id = params.id;
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Wedding & Section Data
  const [wedding, setWedding] = useState(null);
  const [sectionConfig, setSectionConfig] = useState(null);
  
  // Borders & Studios
  const [borders, setBorders] = useState([]);
  const [studios, setStudios] = useState([]);
  
  // Active Tab
  const [activeSection, setActiveSection] = useState('cover'); // cover, live, studio, precious
  
  // Section 1: Cover/Couple State
  const [coverMode, setCoverMode] = useState('single'); // single, separate
  const [selectedCoverBorder, setSelectedCoverBorder] = useState(null);
  const [couplePhoto, setCouplePhoto] = useState(null);
  const [bridePhoto, setBridePhoto] = useState(null);
  const [groomPhoto, setGroomPhoto] = useState(null);
  
  // Section 3: Studio State
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [selectedStudioBorder, setSelectedStudioBorder] = useState(null);
  
  // Section 4: Precious Moments State
  const [selectedPreciousBorder, setSelectedPreciousBorder] = useState(null);
  const [preciousPhotos, setPreciousPhotos] = useState([]);
  const [maxPreciousPhotos, setMaxPreciousPhotos] = useState(5);

  useEffect(() => {
    if (wedding_id) {
      loadData();
    }
  }, [wedding_id]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Load wedding, borders, studios, and section config
      const [weddingRes, bordersRes, studiosRes, sectionRes] = await Promise.all([
        axios.get(`${API_URL}/api/weddings/${wedding_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/borders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/studios`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/weddings/${wedding_id}/sections`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setWedding(weddingRes.data);
      setBorders(bordersRes.data);
      setStudios(studiosRes.data);
      setSectionConfig(sectionRes.data);
      
      // Populate state from section config
      const section1 = sectionRes.data.section_1_cover || {};
      setCoverMode(section1.mode || 'single');
      if (section1.couple_photo) setCouplePhoto(section1.couple_photo);
      if (section1.bride_photo) setBridePhoto(section1.bride_photo);
      if (section1.groom_photo) setGroomPhoto(section1.groom_photo);
      if (section1.couple_border_id) {
        const border = bordersRes.data.find(b => b.id === section1.couple_border_id);
        if (border) setSelectedCoverBorder(border);
      }
      
      const section3 = sectionRes.data.section_3_studio || {};
      if (section3.studio_id) {
        const studio = studiosRes.data.find(s => s.id === section3.studio_id);
        if (studio) setSelectedStudio(studio);
      }
      if (section3.studio_border_id) {
        const border = bordersRes.data.find(b => b.id === section3.studio_border_id);
        if (border) setSelectedStudioBorder(border);
      }
      
      const section4 = sectionRes.data.section_4_precious || {};
      if (section4.border_id) {
        const border = bordersRes.data.find(b => b.id === section4.border_id);
        if (border) setSelectedPreciousBorder(border);
      }
      setPreciousPhotos(section4.photos || []);
      setMaxPreciousPhotos(section4.max_photos || 5);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load wedding data');
    } finally {
      setLoading(false);
    }
  };

  // Section 1: Cover/Couple Handlers
  const handleCoverModeChange = async (mode) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_URL}/api/weddings/${wedding_id}/sections/cover`,
        { mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoverMode(mode);
      setSuccess(`Mode changed to ${mode}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to update mode');
    }
  };

  const handleUploadCoverPhoto = async (category, file) => {
    if (!selectedCoverBorder) {
      setError('Please select a border first');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('border_id', selectedCoverBorder.id);

    try {
      setUploading(true);
      const response = await axios.post(
        `${API_URL}/api/weddings/${wedding_id}/sections/cover/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(`${category} photo uploaded successfully!`);
      
      // Update state
      if (category === 'couple') {
        setCouplePhoto(response.data);
      } else if (category === 'bride') {
        setBridePhoto(response.data);
      } else if (category === 'groom') {
        setGroomPhoto(response.data);
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Section 3: Studio Handlers
  const handleSelectStudio = async (studio) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_URL}/api/weddings/${wedding_id}/sections/studio`,
        { studio_id: studio.id, studio_border_id: selectedStudioBorder?.id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedStudio(studio);
      setSuccess('Studio selected');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to select studio');
    }
  };

  const handleSelectStudioBorder = async (border) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_URL}/api/weddings/${wedding_id}/sections/studio`,
        { studio_id: selectedStudio?.id || null, studio_border_id: border.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedStudioBorder(border);
      setSuccess('Studio border selected');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to select studio border');
    }
  };

  // Section 4: Precious Moments Handlers
  const handleSelectPreciousBorder = async (border) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `${API_URL}/api/weddings/${wedding_id}/sections/precious-moments`,
        { border_id: border.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPreciousBorder(border);
      setMaxPreciousPhotos(response.data.max_photos);
      setSuccess('Border selected');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to select precious moments border');
    }
  };

  const handleUploadPreciousPhoto = async (slotIndex, file) => {
    if (!selectedPreciousBorder) {
      setError('Please select a border first');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slot_index', slotIndex);
    formData.append('border_id', selectedPreciousBorder.id);

    try {
      setUploading(true);
      const response = await axios.post(
        `${API_URL}/api/weddings/${wedding_id}/sections/precious-moments/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(`Photo uploaded to slot ${slotIndex + 1}!`);
      
      // Update photos array
      const updatedPhotos = [...preciousPhotos];
      const existingIndex = updatedPhotos.findIndex(p => p.slot_index === slotIndex);
      if (existingIndex >= 0) {
        updatedPhotos[existingIndex] = response.data;
      } else {
        updatedPhotos.push(response.data);
      }
      setPreciousPhotos(updatedPhotos);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePreciousPhoto = async (photoId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(
        `${API_URL}/api/weddings/${wedding_id}/sections/precious-moments/photos/${photoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPreciousPhotos(preciousPhotos.filter(p => p.photo_id !== photoId));
      setSuccess('Photo deleted');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to delete photo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading wedding builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/weddings/${wedding_id}`)}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wedding
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Wedding Section Builder</h1>
          <p className="text-gray-600 mt-2">{wedding?.title}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Check className="w-5 h-5 mr-2" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeSection === 'cover' ? 'default' : 'outline'}
            onClick={() => setActiveSection('cover')}
            className="flex items-center whitespace-nowrap"
          >
            <Heart className="w-4 h-4 mr-2" />
            Section 1: Cover/Couple
          </Button>
          <Button
            variant={activeSection === 'live' ? 'default' : 'outline'}
            onClick={() => setActiveSection('live')}
            className="flex items-center whitespace-nowrap"
          >
            <Video className="w-4 h-4 mr-2" />
            Section 2: Live Stream
          </Button>
          <Button
            variant={activeSection === 'studio' ? 'default' : 'outline'}
            onClick={() => setActiveSection('studio')}
            className="flex items-center whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Section 3: Studio
          </Button>
          <Button
            variant={activeSection === 'precious' ? 'default' : 'outline'}
            onClick={() => setActiveSection('precious')}
            className="flex items-center whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Section 4: Precious Moments
          </Button>
        </div>

        {/* Section 1: Cover/Couple */}
        {activeSection === 'cover' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Cover / Couple Photo</h2>
              
              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Mode</label>
                <div className="flex gap-4">
                  <Button
                    variant={coverMode === 'single' ? 'default' : 'outline'}
                    onClick={() => handleCoverModeChange('single')}
                  >
                    Single Couple Photo
                  </Button>
                  <Button
                    variant={coverMode === 'separate' ? 'default' : 'outline'}
                    onClick={() => handleCoverModeChange('separate')}
                  >
                    Separate Bride & Groom
                  </Button>
                </div>
              </div>

              {/* Border Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Border</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {borders.filter(b => {
                    // Filter for cover section: show couple or bride_groom category borders
                    const validCategories = coverMode === 'single' ? ['couple', 'general'] : ['bride_groom', 'general'];
                    return validCategories.includes(b.category) && (!b.mask_slots || b.mask_slots.length === 0);
                  }).map((border) => (
                    <div
                      key={border.id}
                      onClick={() => setSelectedCoverBorder(border)}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedCoverBorder?.id === border.id
                          ? 'border-rose-500 ring-2 ring-rose-500'
                          : 'border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <img
                        src={border.cdn_url}
                        alt={border.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium truncate">{border.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">{border.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {borders.filter(b => {
                  const validCategories = coverMode === 'single' ? ['couple', 'general'] : ['bride_groom', 'general'];
                  return validCategories.includes(b.category) && (!b.mask_slots || b.mask_slots.length === 0);
                }).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No borders available for {coverMode} mode. Admin needs to upload {coverMode === 'single' ? 'couple' : 'bride_groom'} category borders.
                  </p>
                )}
              </div>

              {/* Photo Upload - Single Mode */}
              {coverMode === 'single' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Couple Photo</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files[0] && handleUploadCoverPhoto('couple', e.target.files[0])}
                      disabled={!selectedCoverBorder || uploading}
                      className="flex-1"
                    />
                    {couplePhoto && (
                      <img src={couplePhoto.cropped_url || couplePhoto.original_url} alt="Couple" className="w-20 h-20 object-cover rounded" />
                    )}
                  </div>
                </div>
              )}

              {/* Photo Upload - Separate Mode */}
              {coverMode === 'separate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bride Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files[0] && handleUploadCoverPhoto('bride', e.target.files[0])}
                      disabled={!selectedCoverBorder || uploading}
                      className="w-full"
                    />
                    {bridePhoto && (
                      <img src={bridePhoto.cropped_url || bridePhoto.original_url} alt="Bride" className="mt-2 w-full h-32 object-cover rounded" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Groom Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files[0] && handleUploadCoverPhoto('groom', e.target.files[0])}
                      disabled={!selectedCoverBorder || uploading}
                      className="w-full"
                    />
                    {groomPhoto && (
                      <img src={groomPhoto.cropped_url || groomPhoto.original_url} alt="Groom" className="mt-2 w-full h-32 object-cover rounded" />
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Section 2: Live Stream */}
        {activeSection === 'live' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Live Stream</h2>
            <p className="text-gray-600">
              Live streaming is already configured. You can manage your stream settings in the main wedding page.
            </p>
          </Card>
        )}

        {/* Section 3: Studio */}
        {activeSection === 'studio' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Studio Section</h2>
              
              {/* Studio Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Studio</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studios.map((studio) => (
                    <div
                      key={studio.id}
                      onClick={() => handleSelectStudio(studio)}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        selectedStudio?.id === studio.id
                          ? 'border-rose-500 ring-2 ring-rose-500'
                          : 'border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <h3 className="font-semibold">{studio.name}</h3>
                      <p className="text-sm text-gray-600">{studio.email}</p>
                      <p className="text-sm text-gray-600">{studio.phone}</p>
                    </div>
                  ))}
                </div>
                {studios.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No studios created yet. <Button variant="link" onClick={() => router.push('/profile')}>Create one in your profile</Button>
                  </p>
                )}
              </div>

              {/* Border Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Studio Border</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {borders.filter(b => {
                    // Filter for studio section: show studio or general category borders
                    return (['studio', 'general'].includes(b.category)) && (!b.mask_slots || b.mask_slots.length === 0);
                  }).map((border) => (
                    <div
                      key={border.id}
                      onClick={() => handleSelectStudioBorder(border)}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedStudioBorder?.id === border.id
                          ? 'border-rose-500 ring-2 ring-rose-500'
                          : 'border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <img
                        src={border.cdn_url}
                        alt={border.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium truncate">{border.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">{border.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {borders.filter(b => (['studio', 'general'].includes(b.category)) && (!b.mask_slots || b.mask_slots.length === 0)).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No studio borders available. Admin needs to upload studio category borders.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Section 4: Precious Moments */}
        {activeSection === 'precious' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Our Precious Moments</h2>
              
              {/* Border Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Border (Determines Photo Count)</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {borders.filter(b => {
                    // Filter for precious moments: show precious_moments category borders with mask_slots
                    return b.category === 'precious_moments' && b.mask_slots && b.mask_slots.length > 0;
                  }).map((border) => (
                    <div
                      key={border.id}
                      onClick={() => handleSelectPreciousBorder(border)}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedPreciousBorder?.id === border.id
                          ? 'border-rose-500 ring-2 ring-rose-500'
                          : 'border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <img
                        src={border.cdn_url}
                        alt={border.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium truncate">{border.name}</p>
                        {border.mask_slots && border.mask_slots.length > 0 && (
                          <Badge className="text-xs mt-1">{border.mask_slots.length} slots</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {borders.filter(b => b.category === 'precious_moments' && b.mask_slots && b.mask_slots.length > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No precious moments borders available. Admin needs to upload precious_moments category borders with multiple mask slots.
                  </p>
                )}
              </div>

              {/* Photo Slots */}
              {selectedPreciousBorder && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Photos ({preciousPhotos.length}/{maxPreciousPhotos} slots filled)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: maxPreciousPhotos }).map((_, index) => {
                      const existingPhoto = preciousPhotos.find(p => p.slot_index === index);
                      
                      return (
                        <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Slot {index + 1}</p>
                          {existingPhoto ? (
                            <div className="relative">
                              <img
                                src={existingPhoto.cropped_url || existingPhoto.original_url}
                                alt={`Slot ${index + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePreciousPhoto(existingPhoto.photo_id)}
                                className="absolute top-1 right-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files[0] && handleUploadPreciousPhoto(index, e.target.files[0])}
                                disabled={uploading}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
