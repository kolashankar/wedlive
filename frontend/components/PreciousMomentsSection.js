'use client';
import { useState, useEffect } from 'react';
import BorderedPhotoGallery from './BorderedPhotoGallery';
import ExactFitPhotoFrame from './ExactFitPhotoFrame';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

/**
 * PreciousMomentsSection - Dynamic precious moments with photo borders
 * 
 * Features:
 * - Fetches selected precious moment style
 * - Renders photos with assigned borders
 * - Multiple layout types (grid, collage, carousel)
 * - Responsive and animated
 */

export default function PreciousMomentsSection({
  weddingId,
  themeAssets, // From wedding.theme_settings.theme_assets
  primaryColor = '#f43f5e',
  secondaryColor = '#a855f7',
  className = ''
}) {
  const [styleData, setStyleData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreciousMoments();
  }, [weddingId, themeAssets]);

  const loadPreciousMoments = async () => {
    try {
      // Get style details if style is selected
      if (themeAssets?.precious_moment_style_id) {
        const styleResponse = await fetch(
          `/api/theme-assets/precious-styles/${themeAssets.precious_moment_style_id}`
        );
        if (styleResponse.ok) {
          const style = await styleResponse.json();
          setStyleData(style);
        }
      }

      // Get precious moment photos
      if (themeAssets?.precious_moment_photos?.length > 0) {
        // Map photos with their borders
        const photosWithBorders = themeAssets.precious_moment_photos.map((photo, index) => {
          // Determine which border to use (cycle through couple/groom/bride)
          let borderUrl = themeAssets.borders?.couple_border_url;
          if (index % 3 === 1) borderUrl = themeAssets.borders?.groom_border_url;
          if (index % 3 === 2) borderUrl = themeAssets.borders?.bride_border_url;

          return {
            photo_url: photo.url,
            border_url: borderUrl,
            aspect_ratio: photo.aspect_ratio || '1:1',
            caption: photo.caption || ''
          };
        });
        setPhotos(photosWithBorders);
      }
    } catch (error) {
      console.error('Error loading precious moments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-rose-500" />
      </div>
    );
  }

  if (photos.length === 0) {
    return null; // Don't show section if no photos
  }

  const layoutType = styleData?.layout_type || 'grid';

  return (
    <section className={`precious-moments-section py-16 ${className}`}>
      {/* Section Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart 
            className="w-8 h-8" 
            style={{ color: primaryColor }}
            fill={primaryColor}
          />
          <h2 
            className="text-4xl md:text-5xl font-bold"
            style={{ color: primaryColor }}
          >
            Our Precious Moments
          </h2>
          <Sparkles 
            className="w-8 h-8" 
            style={{ color: secondaryColor }}
            fill={secondaryColor}
          />
        </div>
        {styleData?.description && (
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            {styleData.description}
          </p>
        )}
      </motion.div>

      {/* Photo Gallery with Borders */}
      <div className="container mx-auto px-4">
        {layoutType === 'carousel' ? (
          <BorderedPhotoGallery
            photos={photos}
            layout="carousel"
            borderFeather={3}
            className="max-w-4xl mx-auto"
          />
        ) : layoutType === 'collage' ? (
          // Custom collage layout
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                className={`relative ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                } ${
                  index === photos.length - 1 && photos.length % 2 === 0
                    ? 'col-span-2'
                    : ''
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={index === 0 ? 'aspect-square' : 'aspect-square'}>
                  <ExactFitPhotoFrame
                    photoUrl={photo.photo_url}
                    borderUrl={photo.border_url}
                    aspectRatio={photo.aspect_ratio}
                    feather={3}
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Default grid layout
          <BorderedPhotoGallery
            photos={photos}
            layout="grid"
            columns={3}
            gap={6}
            borderFeather={3}
          />
        )}
      </div>

      {/* Decorative elements */}
      <div className="mt-12 text-center">
        <motion.div
          className="inline-block"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <Heart 
            className="w-12 h-12 mx-auto" 
            style={{ color: primaryColor }}
            fill={primaryColor}
          />
        </motion.div>
      </div>
    </section>
  );
}
