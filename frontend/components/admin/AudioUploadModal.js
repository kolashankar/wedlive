'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AudioUploadModal({ open, onClose, category, folders, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    file: null,
    title: '',
    artist: '',
    folder_id: '',
    tags: '',
    is_public: true
  });

  if (!open) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|aac|ogg|m4a)$/i)) {
        toast.error('Invalid file type. Please upload MP3, WAV, AAC, OGG, or M4A files.');
        return;
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }

      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleUpload = async () => {
    if (!formData.file) {
      toast.error('Please select an audio file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const data = new FormData();
    data.append('file', formData.file);
    data.append('title', formData.title);
    data.append('category', category);
    if (formData.artist) data.append('artist', formData.artist);
    if (formData.folder_id) data.append('folder_id', formData.folder_id);
    if (formData.tags) data.append('tags', formData.tags);
    data.append('is_public', formData.is_public);

    try {
      await api.post('/api/admin/music/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      toast.success('Audio file uploaded successfully!');
      setFormData({
        file: null,
        title: '',
        artist: '',
        folder_id: '',
        tags: '',
        is_public: true
      });
      onUploadSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload audio file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      background_music: 'Background Music',
      sound_effect: 'Sound Effect',
      transition: 'Transition Sound',
      emotion: 'Emotion Sound'
    };
    return labels[cat] || cat;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upload Audio File</CardTitle>
              <CardDescription>
                Upload {getCategoryLabel(category)} to the music library
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div>
            <Label>Audio File *</Label>
            <div className="mt-2">
              <input
                type="file"
                accept=".mp3,.wav,.aac,.ogg,.m4a,audio/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-rose-50 file:text-rose-700
                  hover:file:bg-rose-100
                  disabled:opacity-50"
              />
              {formData.file && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{formData.file.name}</span>
                  <span className="text-xs text-green-600 ml-auto">
                    {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: MP3, WAV, AAC, OGG, M4A (Max 50MB)
            </p>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Wedding March"
              disabled={uploading}
              className="mt-2"
            />
          </div>

          {/* Artist */}
          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={formData.artist}
              onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              placeholder="e.g., Classical Orchestra"
              disabled={uploading}
              className="mt-2"
            />
          </div>

          {/* Folder Selection */}
          <div>
            <Label htmlFor="folder">Folder (Optional)</Label>
            <Select
              value={formData.folder_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, folder_id: value }))}
              disabled={uploading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No folder (root)</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.icon} {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., romantic, classical, ceremony (comma-separated)"
              disabled={uploading}
              className="mt-2"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !formData.file || !formData.title}
              className="bg-gradient-to-r from-rose-500 to-purple-500"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
