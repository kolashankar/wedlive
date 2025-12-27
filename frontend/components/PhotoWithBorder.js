'use client';
import { useState, useEffect } from 'react';
import { useBorder } from '@/contexts/BorderContext';
import TelegramImageLoader from './TelegramImageLoader';

export default function PhotoWithBorder({ 
  photo, 
  borderType, 
  className = '', 
  alt = 'Photo',
  children 
}) {
  const { currentBorders } = useBorder();
  const [borderUrl, setBorderUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get photo URL from different possible field names
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    
    return photo.cdn_url || photo.file_url || photo.url || photo.src || (typeof photo === 'string' ? photo : null);
  };

  const photoUrl = getPhotoUrl(photo);
  const isTelegramImage = photoUrl && photoUrl.includes('api.telegram.org/file/');

  useEffect(() => {
    const loadBorder = async () => {
      const borderId = currentBorders[borderType];
      console.log('PhotoWithBorder Debug:', {
        borderType,
        borderId,
        currentBorders,
        availableBorders: Object.keys(currentBorders)
      });
      
      if (borderId && borderId !== 'none' && borderId !== null) {
        try {
          // Fetch border details from API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/theme-assets/borders/${borderId}`);
          console.log('Border API Response:', response.status);
          
          if (response.ok) {
            const borderData = await response.json();
            console.log('Border Data:', borderData);
            setBorderUrl(borderData.cdn_url);
          } else {
            console.error('Border API Error:', response.status, response.statusText);
            setBorderUrl(null);
          }
        } catch (error) {
          console.error('Error loading border:', error);
          setBorderUrl(null);
        }
      } else {
        console.log('No border selected or set to none');
        setBorderUrl(null);
      }
      setLoading(false);
    };

    loadBorder();
  }, [borderType, currentBorders?.[borderType]]); // Only trigger when specific border ID changes

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          Loading border...
        </div>
      </div>
    );
  }

  // If no border, just show the photo
  if (!borderUrl) {
    return (
      <div className={`relative ${className}`}>
        {children || (
          isTelegramImage ? (
            <TelegramImageLoader
              telegramUrl={photoUrl}
              alt={alt}
              className="w-full h-full object-cover rounded-lg"
              fallbackComponent={
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Image unavailable</span>
                </div>
              }
            />
          ) : (
            <img
              src={photoUrl}
              alt={alt}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )
        )}
        {/* Fallback for regular images */}
        {!isTelegramImage && (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
            <span className="text-gray-500 text-sm">Image unavailable</span>
          </div>
        )}
        {/* Debug indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-75">
            No border
          </div>
        )}
      </div>
    );
  }

  // With border - create layered effect with IMG tag for transparency
  return (
    <div className={`relative ${className}`} style={{ backgroundColor: 'transparent' }}>
      {/* Photo layer */}
      <div className="relative w-full h-full">
        {children || (
          isTelegramImage ? (
            <TelegramImageLoader
              telegramUrl={photoUrl}
              alt={alt}
              className="w-full h-full object-cover rounded-lg"
              fallbackComponent={
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Image unavailable</span>
                </div>
              }
            />
          ) : (
            <img
              src={photoUrl}
              alt={alt}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )
        )}
        {/* Fallback for regular images */}
        {!isTelegramImage && (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
            <span className="text-gray-500 text-sm">Image unavailable</span>
          </div>
        )}
      </div>
      
      {/* Border overlay as IMG tag (CRITICAL for transparency) */}
      <img 
        src={borderUrl}
        alt="Border overlay"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          backgroundColor: 'transparent',
          objectFit: 'cover',
          zIndex: 10
        }}
        onError={(e) => {
          console.error('Border image failed to load:', borderUrl);
          e.target.style.display = 'none';
        }}
      />
      
      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-20">
          Border applied (transparent)
        </div>
      )}
    </div>
  );
}
