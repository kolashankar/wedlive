'use client';
import { useState, useEffect } from 'react';
import PhotoFrame from './PhotoFrame';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

/**
 * BorderedPhotoGallery - Photo gallery with dynamic borders
 * 
 * Features:
 * - Integrates ExactFitPhotoFrame for perfect photo fitting
 * - Grid/carousel layouts
 * - Lightbox view
 * - Responsive design
 * - Different borders per photo
 */

export default function BorderedPhotoGallery({
  photos = [], // Array of { photo_url, border_url, aspect_ratio, caption }
  layout = 'grid', // grid, carousel, masonry
  columns = 3, // For grid layout
  gap = 4,
  borderFeather = 2,
  enableLightbox = true,
  className = ''
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIndex !== null) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setLightboxIndex(null);
        } else if (e.key === 'ArrowLeft') {
          navigateLightbox('prev');
        } else if (e.key === 'ArrowRight') {
          navigateLightbox('next');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [lightboxIndex]);

  const navigateLightbox = (direction) => {
    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    } else {
      setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }
  };

  // Grid layout
  const renderGridLayout = () => (
    <div 
      className={`grid gap-${gap}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {photos.map((photo, index) => (
        <motion.div
          key={index}
          // CRITICAL FIX: Removed overflow-hidden to allow borders to extend 5% beyond photo
          className="relative group cursor-pointer rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => enableLightbox && setLightboxIndex(index)}
        >
          {/* Photo with border */}
          <div className="aspect-square">
            <PhotoFrame
              photoUrl={photo.photo_url || photo.url} // FIXED: Support both url field names
              borderUrl={photo.border_url}
              maskData={photo.mask_data}
              aspectRatio="1:1"
              feather={borderFeather}
              className="w-full h-full"
            />
          </div>

          {/* Hover overlay - Constrained to container, might not cover extended border */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded-lg">
            {enableLightbox && (
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          {/* Caption */}
          {photo.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
              <p className="text-white text-sm text-center">{photo.caption}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  // Carousel layout
  const renderCarouselLayout = () => (
    <div className="relative">
      <div className="overflow-visible rounded-xl">
        <motion.div
          className="flex"
          animate={{ x: `-${currentSlide * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {photos.map((photo, index) => (
            <div key={index} className="min-w-full px-4">
              <PhotoFrame
                photoUrl={photo.photo_url}
                borderUrl={photo.border_url}
                maskData={photo.mask_data}
                aspectRatio="1:1"
                feather={borderFeather}
                className="w-full h-full"
              />
              {photo.caption && (
                <p className="text-center mt-4 text-gray-700">{photo.caption}</p>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-all shadow-lg z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-all shadow-lg z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-gray-800 w-8' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );

  // Lightbox modal
  const renderLightbox = () => (
    <AnimatePresence>
      {lightboxIndex !== null && (
        <motion.div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('prev');
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-50"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('next');
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-50"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </>
          )}

          {/* Main image */}
          <motion.div
            key={lightboxIndex}
            className="max-w-6xl max-h-[90vh] w-full p-8 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full relative" style={{ overflow: 'visible' }}>
                <PhotoFrame
                photoUrl={photos[lightboxIndex].photo_url}
                borderUrl={photos[lightboxIndex].border_url}
                maskData={photos[lightboxIndex].mask_data}
                aspectRatio="4:3"
                feather={borderFeather}
                className="w-full h-full"
                />
            </div>
            {photos[lightboxIndex].caption && (
              <p className="text-white text-center mt-4 text-lg">
                {photos[lightboxIndex].caption}
              </p>
            )}
          </motion.div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`bordered-photo-gallery ${className}`}>
      {layout === 'carousel' ? renderCarouselLayout() : renderGridLayout()}
      {enableLightbox && renderLightbox()}
    </div>
  );
}
