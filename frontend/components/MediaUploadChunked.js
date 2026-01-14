'use client';
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image as ImageIcon, Video, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const CHUNK_SIZE_THRESHOLD = 200 * 1024 * 1024; // 200MB
const MIN_CHUNKS = 8;
const MAX_CHUNKS = 15;
const MAX_PARALLEL_UPLOADS = 5;

export default function MediaUploadChunked({ weddingId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploadStats, setUploadStats] = useState({ uploaded: 0, total: 0, failed: [] });
  const [selectedCategory, setSelectedCategory] = useState('general');
  const fileInputRef = useRef(null);

  const calculateChunks = (fileSize) => {
    if (fileSize <= CHUNK_SIZE_THRESHOLD) {
      return { chunkSize: fileSize, totalChunks: 1 };
    }

    // Calculate optimal chunk count between 8-15
    let chunkCount = Math.ceil(fileSize / CHUNK_SIZE_THRESHOLD);
    chunkCount = Math.max(MIN_CHUNKS, Math.min(MAX_CHUNKS, chunkCount));
    
    const chunkSize = Math.ceil(fileSize / chunkCount);
    return { chunkSize, totalChunks: chunkCount };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    // Updated max size to 10GB
    const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10GB');
      return;
    }

    setSelectedFile(file);
    setMediaType(file.type.startsWith('image/') ? 'photo' : 'video');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Show chunk info
    const { chunkSize, totalChunks } = calculateChunks(file.size);
    if (totalChunks > 1) {
      toast.info(`Large file detected! Will upload in ${totalChunks} chunks (${(chunkSize / 1024 / 1024).toFixed(0)}MB each)`);
    }
  };

  const uploadChunk = async (uploadId, chunkIndex, chunkBlob, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      const formData = new FormData();
      formData.append('upload_id', uploadId);
      formData.append('chunk_index', chunkIndex);
      formData.append('chunk', chunkBlob, `chunk_${chunkIndex}`);

      await api.post('/api/media/upload/chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return { success: true, chunkIndex };
    } catch (error) {
      console.error(`Chunk ${chunkIndex} upload failed:`, error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying chunk ${chunkIndex} (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return uploadChunk(uploadId, chunkIndex, chunkBlob, retryCount + 1);
      }
      
      return { success: false, chunkIndex, error };
    }
  };

  const uploadInParallel = async (uploadId, chunks) => {
    const results = [];
    const failed = [];
    
    for (let i = 0; i < chunks.length; i += MAX_PARALLEL_UPLOADS) {
      const batch = chunks.slice(i, i + MAX_PARALLEL_UPLOADS);
      const batchPromises = batch.map(({ index, blob }) => 
        uploadChunk(uploadId, index, blob)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result.chunkIndex);
          setUploadStats(prev => ({
            ...prev,
            uploaded: prev.uploaded + 1
          }));
          setProgress(Math.round((results.length / chunks.length) * 95));
        } else {
          failed.push(result.chunkIndex);
          setUploadStats(prev => ({
            ...prev,
            failed: [...prev.failed, result.chunkIndex]
          }));
        }
      });
    }
    
    return { results, failed };
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadStats({ uploaded: 0, total: 0, failed: [] });

    try {
      const { chunkSize, totalChunks } = calculateChunks(selectedFile.size);
      
      // For small files, use direct upload
      if (totalChunks === 1) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('wedding_id', weddingId);
        formData.append('caption', caption);
        formData.append('category', selectedCategory);

        const endpoint = mediaType === 'photo' 
          ? '/api/media/upload/photo' 
          : '/api/media/upload/video';

        const response = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000, // 5 minute timeout for large video uploads
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        });

        toast.success(`${mediaType === 'photo' ? 'Photo' : 'Video'} uploaded successfully!`);
        resetForm();
        if (onUploadComplete) onUploadComplete(response.data);
        return;
      }

      // Initialize chunked upload
      setUploadStats({ uploaded: 0, total: totalChunks, failed: [] });
      
      const initResponse = await api.post('/api/media/upload/init', {
        wedding_id: weddingId,
        filename: selectedFile.name,
        total_size: selectedFile.size,
        total_chunks: totalChunks,
        media_type: mediaType,
        caption: caption,
        category: selectedCategory
      });

      const uploadId = initResponse.data.upload_id;
      toast.info(`Starting chunked upload: ${totalChunks} chunks`);

      // Split file into chunks
      const chunks = [];
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, selectedFile.size);
        const blob = selectedFile.slice(start, end);
        chunks.push({ index: i, blob });
      }

      // Upload chunks in parallel
      setProgress(5);
      const { results, failed } = await uploadInParallel(uploadId, chunks);

      if (failed.length > 0) {
        throw new Error(`Failed to upload ${failed.length} chunks: ${failed.join(', ')}`);
      }

      // Complete upload
      setProgress(95);
      const completeFormData = new FormData();
      completeFormData.append('upload_id', uploadId);
      
      const completeResponse = await api.post('/api/media/upload/complete', completeFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProgress(100);
      toast.success(`${mediaType === 'photo' ? 'Photo' : 'Video'} uploaded successfully! (${totalChunks} chunks)`);
      
      resetForm();
      if (onUploadComplete) onUploadComplete(completeResponse.data);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload media';
      toast.error(errorMsg);
      
      if (error.response?.status === 403) {
        toast.error('Storage limit reached. Please upgrade your plan.', { duration: 5000 });
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setCaption('');
    setPreview(null);
    setMediaType(null);
    setSelectedCategory('general');
    setProgress(0);
    setUploadStats({ uploaded: 0, total: 0, failed: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          Upload Media
        </CardTitle>
        <CardDescription>
          Add photos and videos to your wedding gallery (up to 10GB per file)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedFile ? (
          <>
            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              {mediaType === 'photo' ? (
                <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
              ) : (
                <div className="relative w-full h-64">
                  <video src={preview} className="w-full h-full object-cover" controls />
                </div>
              )}
              {!uploading && (
                <button
                  onClick={resetForm}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* File Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center">
                {mediaType === 'photo' ? (
                  <ImageIcon className="w-4 h-4 mr-2" />
                ) : (
                  <Video className="w-4 h-4 mr-2" />
                )}
                {selectedFile.name}
              </span>
              <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your media..."
                disabled={uploading}
                rows={3}
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Photo Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="general">General Gallery</option>
                <option value="couple">Couple Photo</option>
                <option value="bride">Bride Photo</option>
                <option value="groom">Groom Photo</option>
                <option value="moment">Precious Moment</option>
                <option value="cover">Cover Photo</option>
              </select>
              <p className="text-xs text-gray-500">
                Select a category to automatically use this photo in your wedding theme
              </p>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {uploadStats.total > 1 
                      ? `Uploading chunks... ${uploadStats.uploaded}/${uploadStats.total}` 
                      : 'Uploading...'}
                  </span>
                  <span className="font-semibold text-rose-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {uploadStats.failed.length > 0 && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Retrying failed chunks: {uploadStats.failed.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:from-rose-600 hover:to-purple-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Upload {mediaType === 'photo' ? 'Photo' : 'Video'}
                  </>
                )}
              </Button>
              {!uploading && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Drop Zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-rose-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files && files[0]) {
                  handleFileSelect({ target: { files: [files[0]] } });
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-rose-500" />
                  </div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-sm text-gray-600">
                    Supports images and videos up to 10GB
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Large files (over 200MB) will be uploaded in chunks for reliability
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  Select Files
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Tip:</strong> Upload high-quality photos and videos to preserve precious
                memories. Supported formats: JPG, PNG, MP4, MOV
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
