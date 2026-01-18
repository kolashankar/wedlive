'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function CreatorMusicUpload({ open, onClose, onSuccess, storageInfo }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/x-m4a'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|aac|ogg|m4a)$/i)) {
      toast.error('Invalid file type. Please upload MP3, WAV, AAC, OGG, or M4A files.');
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error('File too large. Maximum size is 50MB.');
      return;
    }

    // Check storage quota
    if (storageInfo && (storageInfo.storage_used + selectedFile.size) > storageInfo.storage_limit) {
      toast.error('Not enough storage space. Please delete some files or upgrade your plan.');
      return;
    }

    setFile(selectedFile);
    // Auto-fill title from filename
    if (!title) {
      const filename = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(filename);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (artist) formData.append('artist', artist);
      formData.append('is_private', 'true');

      await api.post('/api/music/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      toast.success('Music uploaded successfully!');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload music');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setTitle('');
      setArtist('');
      setUploadProgress(0);
      onClose();
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Music</DialogTitle>
          <DialogDescription>
            Upload your personal music files. Supported formats: MP3, WAV, AAC, OGG, M4A (Max 50MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Storage Warning */}
          {storageInfo && storageInfo.percentage > 80 && (
            <div className="flex items-start space-x-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Storage is {storageInfo.percentage}% full. You have {storageInfo.storage_limit_formatted} total.</span>
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-rose-500 bg-rose-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div className="flex items-center justify-center space-x-2">
                  <File className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-900">{file.name}</span>
                </div>
                <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-rose-600 hover:text-rose-500 font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".mp3,.wav,.aac,.ogg,.m4a,audio/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelection(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">MP3, WAV, AAC, OGG, M4A (max 50MB)</p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Artist Input */}
          <div className="space-y-2">
            <Label htmlFor="artist">Artist (Optional)</Label>
            <Input
              id="artist"
              placeholder="Enter artist name"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !title.trim() || uploading}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
