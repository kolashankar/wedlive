'use client';
import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Phase 6 Task 6.1: Drag & Drop Photo Upload Component
 * Provides a Canva-like drag and drop experience for photo uploads
 */
export default function DragDropPhotoUpload({ 
  placeholder, 
  slotData, 
  existingPhoto, 
  onUpload, 
  onDelete, 
  uploading = false,
  className = ''
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload
      onUpload(placeholder, file);
    }
  }, [placeholder, onUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload
      onUpload(placeholder, file);
    }
  }, [placeholder, onUpload]);

  const handleDelete = useCallback(() => {
    setPreview(null);
    if (existingPhoto) {
      const photoId = Array.isArray(existingPhoto) 
        ? existingPhoto[0]?.photo_id 
        : existingPhoto.photo_id;
      onDelete(placeholder, photoId);
    }
  }, [placeholder, existingPhoto, onDelete]);

  // Determine color class based on placeholder type
  let colorClass = 'border-gray-300 bg-gray-50 hover:bg-gray-100';
  if (placeholder.includes('bride')) colorClass = 'border-pink-300 bg-pink-50 hover:bg-pink-100';
  else if (placeholder.includes('groom')) colorClass = 'border-blue-300 bg-blue-50 hover:bg-blue-100';
  else if (placeholder.includes('couple')) colorClass = 'border-purple-300 bg-purple-50 hover:bg-purple-100';
  else if (placeholder.includes('precious') || placeholder.includes('Moments')) colorClass = 'border-green-300 bg-green-50 hover:bg-green-100';
  else if (placeholder.includes('studio')) colorClass = 'border-amber-300 bg-amber-50 hover:bg-amber-100';

  // If dragging, add visual feedback
  if (isDragging) {
    colorClass = colorClass.replace('border-', 'border-4 border-dashed bg-gradient-to-br from-');
  }

  const displayPhoto = preview || (Array.isArray(existingPhoto) ? existingPhoto[0]?.url : existingPhoto?.url);

  return (
    <div 
      className={`relative group ${className}`}
      data-testid={`drag-drop-${placeholder}`}
    >
      {displayPhoto ? (
        // Photo Preview with Delete Button
        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
          <img
            src={displayPhoto}
            alt={slotData.description}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transform hover:scale-110"
              data-testid={`delete-${placeholder}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Required badge */}
          {slotData.required && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              Required
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        // Upload Area with Drag & Drop
        <label
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            block aspect-square border-2 border-dashed rounded-lg 
            flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200
            ${colorClass}
            ${isDragging ? 'scale-105 shadow-lg' : ''}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            data-testid={`upload-${placeholder}`}
            disabled={uploading}
            onChange={handleFileSelect}
          />
          
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-xs font-medium">Uploading...</span>
            </>
          ) : isDragging ? (
            <>
              <Upload className="w-8 h-8 mb-2 animate-bounce" />
              <span className="text-xs font-medium">Drop photo here</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
              <span className="text-xs font-medium text-center px-2">
                {slotData.description.split(' ').slice(0, 3).join(' ')}
              </span>
              <span className="text-[10px] text-gray-500 mt-1">
                Drag & drop or click
              </span>
              {slotData.required && (
                <span className="text-[10px] text-red-500 font-semibold mt-1">Required</span>
              )}
            </>
          )}
        </label>
      )}
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {slotData.description}
        </div>
      </div>
    </div>
  );
}
