'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function VideoTemplateUploader({ onSuccess }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    aspect_ratio: '16:9',
    tags: ''
  });

  const onDrop = useCallback((acceptedFiles) => {
    const videoFile = acceptedFiles[0];
    if (!videoFile) return;

    // Check file size
    if (videoFile.size > MAX_SIZE) {
      toast({
        title: 'Error',
        description: 'File size exceeds 50MB limit',
        variant: 'destructive'
      });
      return;
    }

    // Check file type
    if (!videoFile.type.startsWith('video/')) {
      toast({
        title: 'Error',
        description: 'Please upload a video file',
        variant: 'destructive'
      });
      return;
    }

    setFile(videoFile);
    
    // Create preview
    const url = URL.createObjectURL(videoFile);
    setPreview(url);

    // Auto-fill name if empty
    if (!formData.name) {
      setFormData(prev => ({
        ...prev,
        name: videoFile.name.replace(/\.[^/.]+$/, '')
      }));
    }
  }, [formData.name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleRemoveFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a video file',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a template name',
        variant: 'destructive'
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Error',
        description: 'Please login first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('aspect_ratio', formData.aspect_ratio);
      uploadFormData.append('tags', formData.tags);

      const response = await axios.post(
        `${API_URL}/api/admin/video-templates/upload`,
        uploadFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      toast({
        title: 'Success',
        description: 'Video template uploaded successfully'
      });

      // Call success callback with template ID
      if (onSuccess && response.data.id) {
        onSuccess(response.data.id);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to upload video template',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Video</h3>
        
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            data-testid="video-dropzone"
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? 'Drop video here' : 'Drag & drop video file here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <p className="text-xs text-gray-400">Supported formats: MP4, WebM, MOV (Max 50MB)</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={preview}
                controls
                className="w-full h-full"
                data-testid="video-preview"
              />
              <button
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                data-testid="remove-video-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* File Info */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Video className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-sm text-green-900">{file.name}</p>
                <p className="text-xs text-green-700">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
        )}
      </Card>

      {/* Template Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Template Details</h3>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Elegant Wedding Invitation"
              className="mt-1"
              data-testid="template-name-input"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template..."
              rows={3}
              className="mt-1"
              data-testid="template-description-input"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1" data-testid="template-category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="invitation">Invitation</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="save-the-date">Save the Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aspect Ratio */}
          <div>
            <Label htmlFor="aspect_ratio">Video Aspect Ratio *</Label>
            <Select
              value={formData.aspect_ratio}
              onValueChange={(value) => setFormData(prev => ({ ...prev, aspect_ratio: value }))}
            >
              <SelectTrigger className="mt-1" data-testid="aspect-ratio-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape - Widescreen)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait - Mobile/Story)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Select the aspect ratio of your video. Only videos matching this ratio should be uploaded.
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., elegant, floral, romantic"
              className="mt-1"
              data-testid="template-tags-input"
            />
          </div>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Uploading template...</span>
              <span className="font-medium text-blue-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || !formData.name.trim()}
          data-testid="upload-template-btn"
        >
          {uploading ? 'Uploading...' : 'Upload Template'}
        </Button>
      </div>
    </div>
  );
}
