'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Image as ImageIcon, Layout, Layers, Trash2, Eye, 
  Plus, X, Check, AlertCircle, Loader2, ArrowLeft, PenTool
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import TemplateEditor from '@/components/TemplateEditor';
import BorderEditor from '@/components/BorderEditor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ThemeAssetsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borders'); // borders, styles, backgrounds, templates
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Template editor state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [templates, setTemplates] = useState([]);
  
  // Border editor state
  const [showBorderEditor, setShowBorderEditor] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); // 'border', 'style', 'background'
  const [editorImage, setEditorImage] = useState(null);
  const [editorFile, setEditorFile] = useState(null);

  // Data states
  const [borders, setBorders] = useState([]);
  const [styles, setStyles] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  
  // Form states for different asset types
  const [borderNames, setBorderNames] = useState('');
  const [borderTags, setBorderTags] = useState('');
  
  const [styleName, setStyleName] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [styleLayoutType, setStyleLayoutType] = useState('grid');
  const [stylePhotoCount, setStylePhotoCount] = useState(6);
  const [styleFrameShapes, setStyleFrameShapes] = useState('');
  const [styleTags, setStyleTags] = useState('');
  const [stylePreviewImage, setStylePreviewImage] = useState(null);
  
  const [bgNames, setBgNames] = useState('');
  const [bgCategory, setBgCategory] = useState('general');
  const [bgTags, setBgTags] = useState('');

  useEffect(() => {
    checkAdminAccess();
    loadAllAssets();
  }, []);

  const checkAdminAccess = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => router.push('/admin'), 2000);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchBorders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/theme-assets/borders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBorders(response.data);
    } catch (error) {
      console.error('Error fetching borders:', error);
      setError('Failed to load borders');
    }
  };

  const fetchStyles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/theme-assets/precious-styles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStyles(response.data);
    } catch (error) {
      console.error('Error fetching styles:', error);
      setError('Failed to load styles');
    }
  };

  const fetchBackgrounds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/theme-assets/backgrounds`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBackgrounds(response.data);
    } catch (error) {
      console.error('Error fetching backgrounds:', error);
      setError('Failed to load backgrounds');
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates');
    }
  };

  const loadAllAssets = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchBorders(),
        fetchStyles(),
        fetchBackgrounds(),
        fetchTemplates()
      ]);
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to load theme assets');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setTemplateFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateUpload = async (shapes) => {
    if (!templateFile) {
      setError('Please select a template image first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', templateFile);
      formData.append('name', `Template ${Date.now()}`);
      formData.append('description', 'Freehand template with custom shapes');
      formData.append('category', 'custom');
      formData.append('shapes_json', JSON.stringify(shapes));
      formData.append('tags', 'freehand,custom,template');

      const response = await axios.post(`${API_URL}/api/admin/templates/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Template uploaded successfully!');
      setTemplates(prev => [...prev, response.data]);
      setShowTemplateEditor(false);
      setTemplateFile(null);
      setTemplatePreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('template-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Error uploading template:', err);
      setError(err.response?.data?.detail || 'Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleBorderEdit = (file, assetType) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditorImage(e.target.result);
      setEditorFile(file);
      setEditingAsset(assetType);
      setShowBorderEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBorderSave = async (borderData) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('files', editorFile);
      formData.append('names', `${editingAsset} with custom border`);
      formData.append('tags', `custom-border,${editingAsset}`);
      formData.append('border_data', JSON.stringify(borderData));
      
      let endpoint;
      if (editingAsset === 'border') {
        endpoint = `${API_URL}/api/admin/theme-assets/borders/upload`;
      } else if (editingAsset === 'style') {
        endpoint = `${API_URL}/api/admin/theme-assets/precious-styles/upload`;
      } else if (editingAsset === 'background') {
        endpoint = `${API_URL}/api/admin/theme-assets/backgrounds/upload`;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.post(endpoint, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess(`${editingAsset} with custom border uploaded successfully!`);
      
      // Update the respective list
      if (editingAsset === 'border') {
        setBorders(prev => [...prev, ...response.data]);
      } else if (editingAsset === 'style') {
        setStyles(prev => [...prev, ...response.data]);
      } else if (editingAsset === 'background') {
        setBackgrounds(prev => [...prev, ...response.data]);
      }
      
      setShowBorderEditor(false);
      setEditorImage(null);
      setEditorFile(null);
      setEditingAsset(null);
      
    } catch (err) {
      console.error('Error uploading custom border:', err);
      setError(err.response?.data?.detail || 'Failed to upload custom border');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e, assetType) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (10MB max)
    const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(`Some files exceed 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate file type
    const invalidTypes = files.filter(f => !f.type.startsWith('image/'));
    if (invalidTypes.length > 0) {
      setError('Only image files are allowed');
      return;
    }

    // If single file, open border editor
    if (files.length === 1) {
      handleBorderEdit(files[0], assetType);
    } else {
      // For multiple files, use regular upload
      setSelectedFiles(files);
      
      // Generate previews
      const previews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ file, url: e.target.result });
          reader.readAsDataURL(file);
        });
      });

      Promise.all(previews).then(setUploadPreview);
    }
  };

  const uploadBorders = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    if (borderNames) formData.append('names', borderNames);
    if (borderTags) formData.append('tags', borderTags);

    try {
      setUploading(true);
      setError(null);
      
      const response = await axios.post(
        `${API_URL}/api/admin/theme-assets/borders/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(`Successfully uploaded ${response.data.length} border(s)`);
      setBorders([...response.data, ...borders]);
      
      // Reset form
      setSelectedFiles([]);
      setUploadPreview([]);
      setBorderNames('');
      setBorderTags('');
      document.getElementById('border-file-input').value = '';
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Border upload failed:', error);
      setError(error.response?.data?.detail || 'Failed to upload borders');
    } finally {
      setUploading(false);
    }
  };

  const uploadStyle = async () => {
    if (!styleName) {
      setError('Style name is required');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('name', styleName);
    formData.append('description', styleDescription);
    formData.append('layout_type', styleLayoutType);
    formData.append('photo_count', stylePhotoCount);
    formData.append('frame_shapes', styleFrameShapes);
    formData.append('tags', styleTags);
    
    if (stylePreviewImage) {
      formData.append('preview_image', stylePreviewImage);
    }

    try {
      setUploading(true);
      setError(null);
      
      const response = await axios.post(
        `${API_URL}/api/admin/theme-assets/precious-styles/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Successfully created precious moment style');
      setStyles([response.data, ...styles]);
      
      // Reset form
      setStyleName('');
      setStyleDescription('');
      setStyleLayoutType('grid');
      setStylePhotoCount(6);
      setStyleFrameShapes('');
      setStyleTags('');
      setStylePreviewImage(null);
      document.getElementById('style-preview-input').value = '';
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Style upload failed:', error);
      setError(error.response?.data?.detail || 'Failed to create style');
    } finally {
      setUploading(false);
    }
  };

  const uploadBackgrounds = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    if (bgNames) formData.append('names', bgNames);
    formData.append('category', bgCategory);
    if (bgTags) formData.append('tags', bgTags);

    try {
      setUploading(true);
      setError(null);
      
      const response = await axios.post(
        `${API_URL}/api/admin/theme-assets/backgrounds/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess(`Successfully uploaded ${response.data.length} background(s)`);
      setBackgrounds([...response.data, ...backgrounds]);
      
      // Reset form
      setSelectedFiles([]);
      setUploadPreview([]);
      setBgNames('');
      setBgCategory('general');
      setBgTags('');
      document.getElementById('bg-file-input').value = '';
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Background upload failed:', error);
      setError(error.response?.data?.detail || 'Failed to upload backgrounds');
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (type, id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    const token = localStorage.getItem('token');
    const endpoints = {
      borders: `/api/admin/theme-assets/borders/${id}`,
      styles: `/api/admin/theme-assets/precious-styles/${id}`,
      backgrounds: `/api/admin/theme-assets/backgrounds/${id}`
    };

    try {
      await axios.delete(`${API_URL}${endpoints[type]}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update state
      if (type === 'borders') {
        setBorders(borders.filter(b => b.id !== id));
      } else if (type === 'styles') {
        setStyles(styles.filter(s => s.id !== id));
      } else if (type === 'backgrounds') {
        setBackgrounds(backgrounds.filter(b => b.id !== id));
      }

      setSuccess('Asset deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete asset');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading theme assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Theme Assets Management</h1>
            <p className="text-gray-600 mt-2">Upload and manage dynamic borders, styles, and backgrounds</p>
          </div>
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

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={activeTab === 'borders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('borders')}
            className="flex items-center"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Photo Borders ({borders.length})
          </Button>
          <Button
            variant={activeTab === 'styles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('styles')}
            className="flex items-center"
          >
            <Layout className="w-4 h-4 mr-2" />
            Precious Moment Styles ({styles.length})
          </Button>
          <Button
            variant={activeTab === 'backgrounds' ? 'default' : 'outline'}
            onClick={() => setActiveTab('backgrounds')}
            className="flex items-center"
          >
            <Layers className="w-4 h-4 mr-2" />
            Backgrounds ({backgrounds.length})
          </Button>
          <Button
            variant={activeTab === 'templates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('templates')}
            className="flex items-center"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Templates ({templates.length})
          </Button>
        </div>

        {/* Photo Borders Tab */}
        {activeTab === 'borders' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-rose-500" />
                Upload Photo Borders
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Images (Max 10MB each)
                  </label>
                  <input
                    id="border-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'border')}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-rose-50 file:text-rose-700
                      hover:file:bg-rose-100"
                  />
                </div>

                {uploadPreview.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {uploadPreview.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview.url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <p className="text-xs text-gray-600 mt-1 truncate">{preview.file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Names (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={borderNames}
                    onChange={(e) => setBorderNames(e.target.value)}
                    placeholder="Floral Border, Royal Frame, Modern Edge"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={borderTags}
                    onChange={(e) => setBorderTags(e.target.value)}
                    placeholder="floral, elegant, traditional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <Button
                  onClick={uploadBorders}
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Borders
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Borders List */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Uploaded Borders</h2>
              <div className="grid grid-cols-4 gap-4">
                {borders.map((border) => (
                  <div key={border.id} className="relative group">
                    <img
                      src={border.cdn_url}
                      alt={border.name}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAsset('borders', border.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{border.name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{border.orientation}</span>
                        <span>{border.aspect_ratio}</span>
                      </div>
                      {border.tags && border.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {border.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {borders.length === 0 && (
                <p className="text-center text-gray-500 py-8">No borders uploaded yet</p>
              )}
            </Card>
          </div>
        )}

        {/* Precious Moment Styles Tab */}
        {activeTab === 'styles' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-rose-500" />
                Create Precious Moment Style
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style Name *
                  </label>
                  <input
                    type="text"
                    value={styleName}
                    onChange={(e) => setStyleName(e.target.value)}
                    placeholder="Romantic Grid Layout"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={styleDescription}
                    onChange={(e) => setStyleDescription(e.target.value)}
                    placeholder="Describe this layout style..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Layout Type
                    </label>
                    <select
                      value={styleLayoutType}
                      onChange={(e) => setStyleLayoutType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="grid">Grid</option>
                      <option value="collage">Collage</option>
                      <option value="carousel">Carousel</option>
                      <option value="animated-frames">Animated Frames</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Photos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={stylePhotoCount}
                      onChange={(e) => setStylePhotoCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frame Shapes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={styleFrameShapes}
                    onChange={(e) => setStyleFrameShapes(e.target.value)}
                    placeholder="rectangle, circle, heart"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={styleTags}
                    onChange={(e) => setStyleTags(e.target.value)}
                    placeholder="romantic, modern, elegant"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style Image (Auto-detect borders)
                  </label>
                  <input
                    id="style-preview-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleBorderEdit(e.target.files[0], 'style');
                      }
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-50 file:text-purple-700
                      hover:file:bg-purple-100"
                  />
                </div>

                <Button
                  onClick={uploadStyle}
                  disabled={uploading || !styleName}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Style
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Styles List */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Created Styles</h2>
              <div className="space-y-4">
                {styles.map((style) => (
                  <div key={style.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{style.name}</h3>
                        {style.description && (
                          <p className="text-gray-600 text-sm mt-1">{style.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Layout className="w-4 h-4 mr-1" />
                            {style.layout_type}
                          </span>
                          <span className="flex items-center">
                            <ImageIcon className="w-4 h-4 mr-1" />
                            {style.photo_count} photos
                          </span>
                        </div>
                        {style.tags && style.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {style.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {style.cdn_url && (
                        <img
                          src={style.cdn_url}
                          alt={style.name}
                          className="w-32 h-32 object-cover rounded-lg ml-4"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAsset('styles', style.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {styles.length === 0 && (
                <p className="text-center text-gray-500 py-8">No styles created yet</p>
              )}
            </Card>
          </div>
        )}

        {/* Backgrounds Tab */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-rose-500" />
                Upload Background Images
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Images (Max 10MB each)
                  </label>
                  <input
                    id="bg-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'background')}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>

                {uploadPreview.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {uploadPreview.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview.url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <p className="text-xs text-gray-600 mt-1 truncate">{preview.file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Names (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={bgNames}
                    onChange={(e) => setBgNames(e.target.value)}
                    placeholder="Sunset Background, Floral Pattern, Golden Gradient"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={bgCategory}
                    onChange={(e) => setBgCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="general">General</option>
                    <option value="hero">Hero Section</option>
                    <option value="full-page">Full Page</option>
                    <option value="pattern">Pattern</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={bgTags}
                    onChange={(e) => setBgTags(e.target.value)}
                    placeholder="sunset, elegant, modern"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <Button
                  onClick={uploadBackgrounds}
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Backgrounds
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Backgrounds List */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Uploaded Backgrounds</h2>
              <div className="grid grid-cols-3 gap-4">
                {backgrounds.map((bg) => (
                  <div key={bg.id} className="relative group">
                    <img
                      src={bg.cdn_url}
                      alt={bg.name}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAsset('backgrounds', bg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{bg.name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">{bg.category}</Badge>
                        <span>{bg.width}x{bg.height}</span>
                      </div>
                      {bg.tags && bg.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {bg.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {backgrounds.length === 0 && (
                <p className="text-center text-gray-500 py-8">No backgrounds uploaded yet</p>
              )}
            </Card>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <PenTool className="w-5 h-5 mr-2 text-rose-500" />
                Create Freehand Template
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Template Image (Max 10MB)
                  </label>
                  <input
                    id="template-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleTemplateFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>
                
                {templatePreview && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Template Preview</h3>
                    <img 
                      src={templatePreview} 
                      alt="Template preview" 
                      className="max-w-full h-48 object-contain border rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowTemplateEditor(true)}
                    disabled={!templateFile}
                    className="flex items-center"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Open Template Editor
                  </Button>
                  
                  {templateFile && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTemplateFile(null);
                        setTemplatePreview(null);
                        document.getElementById('template-upload').value = '';
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Template Editor Modal */}
            {showTemplateEditor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Template Editor</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateEditor(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <TemplateEditor
                    templateUrl={templatePreview}
                    onTemplateSave={handleTemplateUpload}
                    onShapeAdd={(shape) => console.log('Shape added:', shape)}
                    className="m-4"
                  />
                </div>
              </div>
            )}
            
            {/* Existing Templates */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Existing Templates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={template.template_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{template.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        <span className="text-xs text-gray-500">{template.shapes?.length || 0} shapes</span>
                      </div>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {templates.length === 0 && (
                <p className="text-center text-gray-500 py-8">No templates created yet</p>
              )}
            </Card>
          </div>
        )}
        
        {/* Border Editor Modal */}
        {showBorderEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
              <BorderEditor
                imageUrl={editorImage}
                onBorderSave={handleBorderSave}
                onClose={() => {
                  setShowBorderEditor(false);
                  setEditorImage(null);
                  setEditorFile(null);
                  setEditingAsset(null);
                }}
                assetType={editingAsset}
                className="m-4"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
