'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Trash2, Eye, Plus, X, Check, AlertCircle, Loader2, 
  ArrowLeft, Edit3, Image as ImageIcon, Save, Scissors
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import BorderEditor from '@/components/BorderEditor';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

export default function BorderManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Borders data
  const [borders, setBorders] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all'); // Category filter
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [borderName, setBorderName] = useState('');
  const [borderTags, setBorderTags] = useState('');
  const [supportsMirror, setSupportsMirror] = useState(true);
  const [borderCategory, setBorderCategory] = useState('border');
  
  // Background removal state
  const [removeBackground, setRemoveBackground] = useState(false);
  const [processingBackground, setProcessingBackground] = useState(false);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [backgroundRemovalProgress, setBackgroundRemovalProgress] = useState(0);
  
  // Transparency verification state
  const [transparencyCheck, setTransparencyCheck] = useState(null);
  const [isVerifyingTransparency, setIsVerifyingTransparency] = useState(false);
  
  // Border editor state
  const [showBorderEditor, setShowBorderEditor] = useState(false);
  const [editorImage, setEditorImage] = useState(null);
  const [maskData, setMaskData] = useState(null);
  
  // Editing existing border
  const [editingBorder, setEditingBorder] = useState(null);

  useEffect(() => {
    checkAdminAccess();
    loadBorders();
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

  const loadBorders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/borders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // FIX 1: Enhanced logging for debugging
      console.log('[ADMIN_BORDERS] API Response:', {
        totalBorders: response.data.length,
        borders: response.data.map(b => ({ name: b.name, category: b.category }))
      });
      
      // Count by category
      const categoryCounts = {
        all: response.data.length,
        border: response.data.filter(b => (b.category || 'border') === 'border').length,
        background: response.data.filter(b => (b.category || 'border') === 'background').length
      };
      
      console.log('[ADMIN_BORDERS] Category counts:', categoryCounts);
      
      setBorders(response.data);
    } catch (err) {
      console.error('Error loading borders:', err);
      setError('Failed to load borders');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset states
    setProcessedPreview(null);
    setBackgroundRemovalProgress(0);
    setTransparencyCheck(null);
    setError(null);
    setSuccess(null);

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    setSelectedFile(file);
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target.result;
      setUploadPreview(imageUrl);
      setEditorImage(imageUrl);
      
      // Verify transparency automatically
      setIsVerifyingTransparency(true);
      try {
        const transparencyResult = await verifyTransparency(imageUrl);
        setTransparencyCheck(transparencyResult);
        
        // Auto-suggest background removal if needed
        if (transparencyResult.recommendation === 'needs_removal') {
          setRemoveBackground(true);
          setSuccess('Black background detected! Background removal has been enabled automatically.');
          // CRITICAL FIX: Process immediately when background removal is needed
          // Don't wait for state update - process right away
          setTimeout(() => {
            processBackgroundRemoval();
          }, 100); // Small delay to ensure state updates
        } else if (transparencyResult.recommendation === 'excellent') {
          setSuccess('Perfect! This image already has good transparency.');
        }
      } catch (error) {
        console.error('Transparency check failed:', error);
      } finally {
        setIsVerifyingTransparency(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenBorderEditor = () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }
    setShowBorderEditor(true);
  };

  const handleBorderSave = async (borderData) => {
    console.log('Border data received from editor:', borderData);
    setMaskData(borderData.maskData);
    setShowBorderEditor(false);
    setSuccess('Mask defined! Now click "Upload Border" to save.');
  };

  // Ultra-fast background removal function - completes in seconds
  const removeBlackBackground = async (imageFile) => {
    return new Promise((resolve, reject) => {
      console.log('[Background Removal] Starting ultra-fast processing');
      const startTime = performance.now();
      
      const img = new Image();
      img.onload = () => {
        // Create canvas with reasonable size limits
        const maxSize = 1000; // Limit size for faster processing
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width *= scale;
          height *= scale;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        
        // Draw scaled image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        let pixelsRemoved = 0;
        
        // Ultra-fast black removal - simplest possible logic
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Remove pure black and very dark pixels only
          if (r < 20 && g < 20 && b < 20) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
            pixelsRemoved++;
          }
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        const processingTime = performance.now() - startTime;
        console.log(`[Background Removal] Ultra-fast processing completed in ${processingTime.toFixed(2)}ms - ${pixelsRemoved} pixels removed`);
        
        // Convert to blob immediately with explicit PNG format
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png', 1.0); // Quality 1.0 for maximum PNG quality with full alpha channel
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  };

  // Helper function to check if pixel is near a border edge
  const checkIfNearBorderEdge = (data, x, y, width, height) => {
    const pixelIndex = (y * width + x) * 4;
    const r = data[pixelIndex];
    const g = data[pixelIndex + 1];
    const b = data[pixelIndex + 2];
    const brightness = (r + g + b) / 3;
    
    // Check surrounding pixels for significant brightness differences
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = (ny * width + nx) * 4;
          const nr = data[nIndex];
          const ng = data[nIndex + 1];
          const nb = data[nIndex + 2];
          const nbrightness = (nr + ng + nb) / 3;
          
          // If there's a significant brightness difference, we might be near an edge
          if (Math.abs(brightness - nbrightness) > 60) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // Transparency verification function
  const verifyTransparency = async (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let transparentPixels = 0;
        let blackPixels = 0;
        let totalPixels = 0;
        let edgePixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          totalPixels++;
          
          // Check for transparency
          if (a < 255) {
            transparentPixels++;
          }
          
          // Check for black pixels (potential background)
          if (r <= 30 && g <= 30 && b <= 30) {
            blackPixels++;
            
            // Check if black pixel is near an edge (part of border design)
            const pixelIndex = i / 4;
            const x = pixelIndex % canvas.width;
            const y = Math.floor(pixelIndex / canvas.width);
            
            if (checkIfNearBorderEdge(data, x, y, canvas.width, canvas.height)) {
              edgePixels++;
            }
          }
        }
        
        const transparencyPercentage = (transparentPixels / totalPixels) * 100;
        const blackPercentage = (blackPixels / totalPixels) * 100;
        const problematicBlackPercentage = ((blackPixels - edgePixels) / totalPixels) * 100;
        
        const result = {
          hasTransparency: transparencyPercentage > 1,
          transparencyPercentage: transparencyPercentage.toFixed(2),
          blackBackgroundPercentage: problematicBlackPercentage.toFixed(2),
          totalPixels,
          transparentPixels,
          blackPixels,
          edgePixels,
          recommendation: getTransparencyRecommendation(transparencyPercentage, problematicBlackPercentage)
        };
        
        console.log('[Transparency Check] Result:', result);
        resolve(result);
      };
      
      img.onerror = () => {
        resolve({
          hasTransparency: false,
          error: 'Failed to load image for transparency check',
          recommendation: 'error'
        });
      };
      
      img.src = imageUrl;
    });
  };
  
  const getTransparencyRecommendation = (transparency, blackBg) => {
    if (transparency > 5) {
      return 'excellent';
    } else if (transparency > 1) {
      return 'good';
    } else if (blackBg > 10) {
      return 'needs_removal';
    } else if (blackBg > 1) {
      return 'check_manually';
    } else {
      return 'unknown';
    }
  };

  // Process background removal with enhanced Canvas API implementation
  const processBackgroundRemoval = async () => {
    // CRITICAL FIX: Don't check removeBackground state - process if called
    if (!selectedFile) {
      console.warn('[Background Removal] No file selected');
      return;
    }
    
    setProcessingBackground(true);
    setBackgroundRemovalProgress(50);
    
    try {
      console.log('[Background Removal] Starting instant processing for:', selectedFile.name);
      
      const processedBlob = await removeBlackBackground(selectedFile);
      
      setBackgroundRemovalProgress(90);
      
      // Create preview with metadata
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target.result);
        setBackgroundRemovalProgress(100);
        setProcessingBackground(false);
        
        // Log processing results
        const fileSize = (processedBlob.size / 1024 / 1024).toFixed(2);
        console.log(`[Background Removal] Completed instantly. File size: ${fileSize}MB`);
        
        setSuccess(`Background removed instantly! Processed file size: ${fileSize}MB`);
      };
      reader.readAsDataURL(processedBlob);
      
    } catch (error) {
      console.error('Background removal failed:', error);
      setError('Failed to remove background. Please try again.');
      setProcessingBackground(false);
      setBackgroundRemovalProgress(0);
    }
  };

  // Auto-create default rectangular mask when background removal is done without BorderEditor
  const createDefaultMask = () => {
    console.log('[TRANSPARENT BORDER FIX] Auto-creating default rectangular mask for background-removed border');
    
    // Create a default rectangular mask that covers most of the image
    // This allows uploading transparent borders without opening BorderEditor
    return {
      svg_path: '',
      polygon_points: [],
      feather_radius: 8,
      inner_usable_area: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      processedImage: null // Will be set from processedPreview
    };
  };

  const handleUploadBorder = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    if (!borderName.trim()) {
      setError('Please enter a border name');
      return;
    }

    // FIX 1: Enhanced category logging to debug upload issues
    console.log('[BORDER_UPLOAD] Category selected:', borderCategory);
    console.log('[BORDER_UPLOAD] Border name:', borderName);
    console.log('[BORDER_UPLOAD] Full upload details:', {
      name: borderName,
      category: borderCategory,
      tags: borderTags,
      supportsMirror,
      hasTransparency: removeBackground || processedPreview !== null
    });

    // CRITICAL FIX: Allow upload without BorderEditor if background was removed
    // Auto-create a default mask for transparent borders
    let effectiveMaskData = maskData;
    
    if (!maskData && (removeBackground || processedPreview)) {
      console.log('[TRANSPARENT BORDER FIX] No mask defined, but background removal was done');
      console.log('[TRANSPARENT BORDER FIX] Creating default mask to allow transparent border upload');
      effectiveMaskData = createDefaultMask();
      setMaskData(effectiveMaskData);
    }
    
    if (!effectiveMaskData) {
      setError('Please define mask using Border Editor or enable background removal');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    // Use processed image from BorderEditor if available, otherwise use original
    let fileToUpload = selectedFile;
    let fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    let originalFormat = fileExtension;
    
    // Check if we have processed image from BorderEditor (new system)
    if (effectiveMaskData && effectiveMaskData.processedImage && effectiveMaskData.processedImage.blob) {
      try {
        console.log('[Upload] Using processed transparent image from BorderEditor');
        
        // Use the processed image blob from BorderEditor
        const processedBlob = maskData.processedImage.blob;
        
        // ENFORCE PNG-32 format for transparency preservation
        fileExtension = 'png'; // Always use PNG for transparency support
        fileToUpload = new File([processedBlob], selectedFile.name.replace(/\.[^/.]+$/, '.png'), {
          type: 'image/png' // Explicitly set to PNG for 32-bit transparency
        });
        
        console.log(`[Upload] PNG-32 format enforced with BorderEditor processed image:`, {
          originalFormat,
          newFormat: 'png',
          fileSize: (fileToUpload.size / 1024 / 1024).toFixed(2) + 'MB',
          hasTransparency: true,
          source: 'BorderEditor processed image'
        });
        
      } catch (error) {
        console.error('[Upload] Failed to use BorderEditor processed image:', error);
        setError('Failed to use processed transparent image. Please try again.');
        return;
      }
    } else if (processedPreview) {
      // Fallback to old system if available
      try {
        console.log('[Upload] Using processed image from old system - enforcing PNG-32 format');
        
        // Convert processed preview back to blob with proper PNG-32 format
        const response = await fetch(processedPreview);
        const blob = await response.blob();
        
        // ENFORCE PNG-32 format for transparency preservation
        fileExtension = 'png'; // Always use PNG for transparency support
        fileToUpload = new File([blob], selectedFile.name.replace(/\.[^/.]+$/, '.png'), {
          type: 'image/png' // Explicitly set to PNG for 32-bit transparency
        });
        
        console.log(`[Upload] PNG-32 format enforced (old system):`, {
          originalFormat,
          newFormat: 'png',
          fileSize: (fileToUpload.size / 1024 / 1024).toFixed(2) + 'MB',
          hasTransparency: true
        });
        
      } catch (error) {
        console.error('[Upload] Failed to process image for PNG-32 conversion:', error);
        setError('Failed to convert image to PNG-32 format. Please try again.');
        return;
      }
    } else {
      // Even without processing, ensure PNG format if transparency is needed
      if (removeBackground) {
        console.log('[Upload] Background removal requested but no processed image - converting to PNG-32');
        // Convert original to PNG-32 for consistency
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
              fileToUpload = new File([blob], selectedFile.name.replace(/\.[^/.]+$/, '.png'), {
                type: 'image/png'
              });
              fileExtension = 'png';
              console.log('[Upload] PNG-32 conversion complete with full alpha channel');
              resolve();
            }, 'image/png', 1.0); // Quality 1.0 for maximum PNG quality with full alpha channel
          };
          img.src = URL.createObjectURL(selectedFile);
        });
      }
    }
    
    // Add file to form data
    formData.append('file', fileToUpload);
    formData.append('name', borderName);
    formData.append('tags', borderTags);
    formData.append('supports_mirror', supportsMirror);
    formData.append('category', borderCategory);
    
    // FIX 1: Enhanced logging for category to ensure it's correctly sent
    console.log('[UPLOAD] FormData category being sent:', borderCategory);
    console.log('[UPLOAD] FormData entries:', {
      name: borderName,
      category: borderCategory,
      tags: borderTags,
      supports_mirror: supportsMirror
    });
    
    // CRITICAL: Add transparency metadata
    const hasTransparency = removeBackground || processedPreview !== null || (effectiveMaskData && effectiveMaskData.processedImage);
    formData.append('has_transparency', hasTransparency.toString());
    formData.append('remove_background', removeBackground.toString());
    
    console.log(`[Upload] Transparency metadata:`, {
      hasTransparency,
      removeBackground,
      processedPreview: !!processedPreview,
      maskDataProcessed: !!(effectiveMaskData && effectiveMaskData.processedImage)
    });
    
    // Add mask data
    if (effectiveMaskData.svg_path) {
      formData.append('mask_svg_path', effectiveMaskData.svg_path);
    }
    
    if (effectiveMaskData.polygon_points && effectiveMaskData.polygon_points.length > 0) {
      formData.append('mask_polygon_points', JSON.stringify(effectiveMaskData.polygon_points));
    }
    
    formData.append('feather_radius', effectiveMaskData.feather_radius || 8);
    formData.append('mask_x', effectiveMaskData.inner_usable_area?.x || 0);
    formData.append('mask_y', effectiveMaskData.inner_usable_area?.y || 0);
    formData.append('mask_width', effectiveMaskData.inner_usable_area?.width || 0);
    formData.append('mask_height', effectiveMaskData.inner_usable_area?.height || 0);

    try {
      setUploading(true);
      setError(null);
      
      const response = await axios.post(
        `${API_URL}/api/admin/borders/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Border uploaded successfully!');
      
      // FIX 1: Log the uploaded border details to verify category
      console.log('[UPLOAD_SUCCESS] Border uploaded with details:', {
        id: response.data.id,
        name: response.data.name,
        category: response.data.category,
        expected_category: borderCategory
      });
      
      // Verify category matches what was selected
      if (response.data.category !== borderCategory) {
        console.error('[UPLOAD_WARNING] Category mismatch!', {
          selected: borderCategory,
          saved: response.data.category
        });
      }
      
      setBorders([response.data, ...borders]);
      
      // Reset form
      setSelectedFile(null);
      setUploadPreview(null);
      setBorderName('');
      setBorderTags('');
      setSupportsMirror(true);
      setBorderCategory('border');
      setMaskData(null);
      setEditorImage(null);
      document.getElementById('border-file-input').value = '';
      
      // FIX 1: Reload borders to ensure fresh data from server
      loadBorders();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Border upload failed:', error);
      setError(error.response?.data?.detail || 'Failed to upload border');
    } finally {
      setUploading(false);
    }
  };

  const handleEditBorderMask = async (border) => {
    setEditingBorder(border);
    setEditorImage(border.cdn_url);
    setShowBorderEditor(true);
  };

  const handleUpdateMask = async (borderData) => {
    if (!editingBorder) return;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    const maskData = borderData.maskData;
    
    if (maskData.svg_path) {
      formData.append('mask_svg_path', maskData.svg_path);
    }
    
    if (maskData.polygon_points && maskData.polygon_points.length > 0) {
      formData.append('mask_polygon_points', JSON.stringify(maskData.polygon_points));
    }
    
    formData.append('feather_radius', maskData.feather_radius || 8);
    formData.append('mask_x', maskData.inner_usable_area?.x || 0);
    formData.append('mask_y', maskData.inner_usable_area?.y || 0);
    formData.append('mask_width', maskData.inner_usable_area?.width || 0);
    formData.append('mask_height', maskData.inner_usable_area?.height || 0);

    try {
      setUploading(true);
      
      const response = await axios.put(
        `${API_URL}/api/admin/borders/${editingBorder.id}/mask`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Border mask updated successfully!');
      
      // Update borders list
      setBorders(borders.map(b => b.id === editingBorder.id ? response.data : b));
      
      setShowBorderEditor(false);
      setEditingBorder(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Mask update failed:', error);
      setError(error.response?.data?.detail || 'Failed to update mask');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBorder = async (borderId) => {
    if (!confirm('Are you sure you want to delete this border?')) return;

    const token = localStorage.getItem('token');

    try {
      await axios.delete(`${API_URL}/api/admin/borders/${borderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBorders(borders.filter(b => b.id !== borderId));
      setSuccess('Border deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete border');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading borders...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Border Management</h1>
            <p className="text-gray-600 mt-2">Upload and manage photo borders with custom masks</p>
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

        {/* Upload Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-rose-500" />
            Upload New Border with Mask
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Border Image (Max 10MB)
              </label>
              <input
                id="border-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-rose-50 file:text-rose-700
                  hover:file:bg-rose-100"
              />
            </div>

            {/* Background Removal Option */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={removeBackground}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setRemoveBackground(isChecked);
                    // CRITICAL FIX: Trigger background removal immediately when checked
                    if (isChecked && selectedFile) {
                      setTimeout(() => {
                        processBackgroundRemoval();
                      }, 100);
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Remove Background</span>
              </label>
              
              {selectedFile && !removeBackground && (
                <button
                  onClick={() => {
                    setRemoveBackground(true);
                    // Trigger background removal immediately
                    setTimeout(() => {
                      handleFileSelect({ target: { files: [selectedFile] } });
                    }, 100);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Remove Background Now
                </button>
              )}
            </div>

            {/* Processing State */}
            {processingBackground && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Processing background removal...</span>
                  <span className="text-sm text-blue-700">{backgroundRemovalProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${backgroundRemovalProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Dual Preview - Original vs Processed */}
            {uploadPreview && (
              <div className="space-y-4">
                {processedPreview ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
                      <div className="relative">
                        <img
                          src={uploadPreview}
                          alt="Original"
                          className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 bg-white"
                        />
                      </div>
                    </div>
                    
                    {/* Processed Preview with Checkerboard */}
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Processed (Transparent)</h4>
                      <div className="relative">
                        <div 
                          className="w-full h-48 rounded-lg border-2 border-green-200 overflow-hidden"
                          style={{
                            backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 10px 10px'
                          }}
                        >
                          <img
                            src={processedPreview}
                            alt="Processed"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Background Removed
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Side-by-side preview when background removal is enabled */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">Original</h4>
                      <div className="relative">
                        <img
                          src={uploadPreview}
                          alt="Original"
                          className="w-full h-48 object-contain rounded-lg border-2 border-red-200 bg-white"
                        />
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          Original Image
                        </div>
                      </div>
                    </div>
                    
                    {/* Processed Preview with Checkerboard */}
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Processed (Transparent)</h4>
                      <div className="relative">
                        <div 
                          className="w-full h-48 rounded-lg border-2 border-green-200 overflow-hidden"
                          style={{
                            backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 10px 10px'
                          }}
                        >
                          {maskData && maskData.processedImage && maskData.processedImage.url ? (
                            <img
                              src={maskData.processedImage.url}
                              alt="Processed Transparent"
                              className="w-full h-full object-contain"
                            />
                          ) : processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Processed"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              {processingBackground ? (
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                                  <p className="text-xs">Processing...</p>
                                </div>
                              ) : (
                                <p className="text-xs">Click "Remove Background" to process</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          {processedPreview ? 'Background Removed' : 'Waiting'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Name *
                </label>
                <input
                  type="text"
                  value={borderName}
                  onChange={(e) => setBorderName(e.target.value)}
                  placeholder="Floral Wedding Border"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Category *
                </label>
                <select
                  value={borderCategory}
                  onChange={(e) => setBorderCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="border">Border</option>
                  <option value="background">Background</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {borderCategory === 'border' 
                    ? '✓ For: Bride/Groom photos (mirror effect), Couple, Studio, Precious Moments, Live stream background'
                    : '✓ For: Theme background, Live streaming page background'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={borderTags}
                  onChange={(e) => setBorderTags(e.target.value)}
                  placeholder="floral, elegant, traditional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="supports-mirror"
                  checked={supportsMirror}
                  onChange={(e) => setSupportsMirror(e.target.checked)}
                  className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="supports-mirror" className="ml-2 text-sm font-medium text-gray-700">
                  Supports Mirror (for Bride/Groom separate mode)
                </label>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleOpenBorderEditor}
                disabled={!selectedFile}
                variant="outline"
                className="flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {maskData ? 'Edit Mask' : 'Define Mask'}
              </Button>

              {selectedFile && (
                <Button
                  onClick={() => {
                    if (!removeBackground) {
                      // Enable background removal and process immediately
                      setRemoveBackground(true);
                      setTimeout(() => {
                        processBackgroundRemoval();
                      }, 100);
                    } else {
                      // Disable background removal
                      setRemoveBackground(false);
                      setProcessedPreview(null);
                    }
                  }}
                  variant={removeBackground ? "default" : "outline"}
                  className={`flex items-center ${removeBackground ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {removeBackground ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Background Removed
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Remove Background
                    </>
                  )}
                </Button>
              )}

              {maskData && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Mask Defined
                </Badge>
              )}
            </div>

            <Button
              onClick={handleUploadBorder}
              disabled={uploading || !selectedFile || !borderName}
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
                  Upload Border
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Borders List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            <span>Uploaded Borders ({borders.length})</span>
          </h2>
          
          {/* FIX 1: Category Filter Tabs with debugging */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Borders' },
                { key: 'border', label: 'Border' },
                { key: 'background', label: 'Background' }
              ].map((cat) => {
                // FIX 1: Debug categorization
                const count = cat.key === 'all' 
                  ? borders.length 
                  : borders.filter(b => {
                      // Ensure we're comparing the right field
                      const borderCategory = b.category || 'border'; // Default to 'border' if not set
                      const matches = borderCategory === cat.key;
                      
                      // Log for debugging (only in development)
                      if (process.env.NODE_ENV === 'development' && borders.length > 0) {
                        console.log(`[BORDER_FILTER] Border "${b.name}" - category: "${borderCategory}", comparing with: "${cat.key}", matches: ${matches}`);
                      }
                      
                      return matches;
                    }).length;
                
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                      activeCategory === cat.key
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid={`filter-${cat.key}`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {borders.filter(border => {
              // FIX 1: Consistent filtering with default fallback
              const borderCategory = border.category || 'border'; // Default to 'border' if not set
              return activeCategory === 'all' || borderCategory === activeCategory;
            }).map((border) => (
              <div key={border.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={border.processed_image_url || border.cdn_url}
                    alt={border.name}
                    className="w-full h-48 object-cover"
                    style={{ 
                      // Show transparency checkerboard for processed images
                      backgroundImage: border.processed_image_url ? 
                        'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px' : 
                        'none'
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditBorderMask(border)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteBorder(border.id)}
                      className="bg-red-500/90 hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{border.name}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>{border.orientation}</span>
                    <span>{border.width}x{border.height}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs">
                      {border.mask?.suggested_aspect_ratio || '1:1'}
                    </Badge>
                    {border.supports_mirror && (
                      <Badge variant="secondary" className="text-xs">
                        Mirror Support
                      </Badge>
                    )}
                  </div>
                  {border.category && (
                    <div className="mt-2">
                      <Badge variant="default" className={`text-xs ${border.category === 'border' ? 'bg-purple-500' : 'bg-green-500'}`}>
                        {border.category === 'border' ? 'Border' : 'Background'}
                      </Badge>
                    </div>
                  )}
                  {border.tags && border.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {border.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    <div>Feather: {border.mask?.feather_radius || 8}px</div>
                    {border.mask?.svg_path && (
                      <div className="text-green-600">✓ SVG Mask</div>
                    )}
                    {border.mask?.polygon_points?.length > 0 && (
                      <div className="text-blue-600">✓ Polygon Mask ({border.mask.polygon_points.length} points)</div>
                    )}
                    {border.mask_slots && border.mask_slots.length > 0 && (
                      <div className="text-purple-600 font-semibold">✓ {border.mask_slots.length} Photo Slots</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {borders.filter(border => {
            const borderCategory = border.category || 'border';
            return activeCategory === 'all' || borderCategory === activeCategory;
          }).length === 0 && (
            <p className="text-center text-gray-500 py-8 col-span-3">
              {activeCategory === 'all' ? 'No borders uploaded yet' : `No borders in "${activeCategory}" category`}
            </p>
          )}
        </Card>

        {/* Border Editor Modal */}
        {showBorderEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
              <BorderEditor
                imageUrl={editorImage}
                onBorderSave={editingBorder ? handleUpdateMask : handleBorderSave}
                onClose={() => {
                  setShowBorderEditor(false);
                  if (!editingBorder) {
                    setEditorImage(null);
                  }
                  setEditingBorder(null);
                }}
                assetType="border"
                className="m-4"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
