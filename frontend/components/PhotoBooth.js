import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Download, Sparkles, RotateCcw } from 'lucide-react';
import axios from 'axios';
import CONFIG from '@/lib/config';

const API_URL = `${CONFIG.API.BASE_URL}/api`;

const FILTERS = [
  { name: 'None', value: 'none', class: '' },
  { name: 'Vintage', value: 'vintage', class: 'sepia-[0.5] contrast-[1.2]' },
  { name: 'Black & White', value: 'bw', class: 'grayscale' },
  { name: 'Warm', value: 'warm', class: 'hue-rotate-[-15deg] saturate-[1.3]' },
  { name: 'Cool', value: 'cool', class: 'hue-rotate-[15deg] brightness-[1.1]' },
  { name: 'Romantic', value: 'romantic', class: 'saturate-[1.5] brightness-[1.1] hue-rotate-[-10deg]' }
];

export function PhotoBooth({ weddingId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [stream, setStream] = useState(null);
  const [guestName, setGuestName] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchPhotos();
    const savedName = localStorage.getItem('guest_name');
    if (savedName) setGuestName(savedName);
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [weddingId, stream]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${API_URL}/features/photobooth/${weddingId}`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const photoData = canvas.toDataURL('image/jpeg', 0.8);

    setLoading(true);

    try {
      const name = guestName || 'Anonymous';
      if (!localStorage.getItem('guest_name') && guestName) {
        localStorage.setItem('guest_name', guestName);
      }

      const response = await axios.post(`${API_URL}/features/photobooth`, {
        wedding_id: weddingId,
        guest_name: name,
        photo_data: photoData,
        filter_used: selectedFilter
      });

      setPhotos([response.data, ...photos]);
      stopCamera();
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Failed to save photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = (photoUrl) => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `wedding-photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filterClass = FILTERS.find(f => f.value === selectedFilter)?.class || '';

  return (
    <div className="space-y-6">
      {/* Camera Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-bold text-gray-800">Virtual Photo Booth</h2>
          </div>
          {capturing && (
            <button
              onClick={stopCamera}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              Close Camera
            </button>
          )}
        </div>

        {!capturing ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">Take a photo to remember this special day!</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Open Camera
            </button>
          </div>
        ) : (
          <div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${filterClass}`}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Filter Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Choose Filter
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all ${
                      selectedFilter === filter.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-pink-300'
                    }`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Name */}
            {!guestName && (
              <input
                type="text"
                placeholder="Your name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            )}

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Saving...' : 'Capture Photo 📸'}
            </button>
          </div>
        )}
      </div>

      {/* Photos Gallery */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Photo Gallery</h3>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No photos yet. Be the first to take one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.photo_url}
                  alt={`Photo by ${photo.guest_name}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => downloadPhoto(photo.photo_url)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-all duration-200"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">{photo.guest_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
