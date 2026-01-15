'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';

/**
 * Layout 1: Vertical Wedding Invitation Layout
 * 
 * Concept: "Single Column Narrative"
 * - Template video with dynamic aspect ratio (9:16 or 16:9)
 * - Couple photo with border
 * - YouTube video embed
 * - Studio branding
 * - Precious moments gallery
 * - Fully mobile responsive
 */
export default function Layout1({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9'); // default
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    bride_name = '',
    groom_name = '',
    event_date = '',
    event_time = '',
    venue = '',
  } = weddingData;

  const {
    font = 'Playfair Display',
    primaryColor = '#1e3a8a',
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    preWeddingVideo = null,
    borders = {},
    borderMasks = {},
    templateVideoWeddingId = null,
    hasTemplateVideo = false,
  } = layoutConfig;

  // Animation variants
  const fadeInUp = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8 } }
  };

  // Detect video aspect ratio dynamically
  useEffect(() => {
    if (hasTemplateVideo) {
      const checkVideo = () => {
        const video = document.querySelector('video');
        if (video) {
          const handleMetadata = () => {
            const aspectRatio = video.videoWidth / video.videoHeight;
            console.log('[Layout1] Video dimensions:', video.videoWidth, 'x', video.videoHeight, 'Aspect:', aspectRatio);
            if (aspectRatio < 1) {
              setVideoAspectRatio('9:16'); // Portrait
            } else {
              setVideoAspectRatio('16:9'); // Landscape
            }
          };
          
          if (video.readyState >= 1) {
            handleMetadata();
          } else {
            video.addEventListener('loadedmetadata', handleMetadata);
          }
        }
      };
      
      // Check immediately and with a delay to catch late-loading videos
      checkVideo();
      const timer = setTimeout(checkVideo, 500);
      
      return () => clearTimeout(timer);
    }
  }, [hasTemplateVideo, templateVideoWeddingId]);

  if (!isMounted) return null;

  return (
    <div 
      className="min-h-screen bg-white"
      style={{ fontFamily: font, color: primaryColor }}
    >
      {/* Section 1: Template Video with Invitation Card Style */}
      {hasTemplateVideo && templateVideoWeddingId && (
        <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-pink-100 to-purple-100 p-4 md:p-8">
          <div 
            className={`w-full mx-auto transition-all duration-300 ${
              videoAspectRatio === '9:16' 
                ? 'max-w-md aspect-[9/16]' 
                : 'max-w-6xl aspect-[16/9]'
            }`}
          >
            <TemplateVideoPlayer 
              weddingId={templateVideoWeddingId}
              className="w-full h-full"
            />
          </div>
        </section>
      )}

      {/* Section 2: Couple Photo with Border */}
      {couplePhoto?.url && (
        <section className="w-full min-h-[50vh] md:min-h-[60vh] bg-black py-8 md:py-16 flex items-center justify-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-6xl mx-auto px-4 md:px-8"
          >
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
              <PhotoFrame
                src={couplePhoto.url}
                alt="Couple"
                maskUrl={borders?.couple}
                maskData={borderMasks?.couple}
                aspectRatio="custom"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </section>
      )}

      {/* Section 3: YouTube Video Embed */}
      {preWeddingVideo && (
        <section className="w-full min-h-[50vh] md:min-h-[60vh] bg-gradient-to-br from-gray-900 to-black py-8 md:py-16 flex items-center justify-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-6xl mx-auto px-4 md:px-8"
          >
            <div className="aspect-video w-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={preWeddingVideo}
                className="w-full h-full"
                allowFullScreen
                title="Wedding Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </motion.div>
        </section>
      )}

      {/* Section 4: Studio Image/Branding */}
      {studioDetails?.logo_url && (
        <section className="w-full bg-gradient-to-br from-blue-900 to-purple-900 py-12 md:py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-4xl mx-auto px-4 md:px-8 text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 md:p-12">
              <img 
                src={studioDetails.logo_url} 
                className="h-16 md:h-24 mx-auto mb-6" 
                alt="Studio" 
              />
              <p className="text-white text-sm md:text-base uppercase tracking-widest">
                Stand Out With World-Class Video Production
              </p>
              <p className="text-white/80 text-xs md:text-sm mt-2">
                Your Story Deserves To Be Heard
              </p>
            </div>
          </motion.div>
        </section>
      )}

      {/* Section 5: Precious Moments Gallery */}
      {preciousMoments?.length > 0 && (
        <section className="w-full bg-gradient-to-br from-pink-50 to-white py-8 md:py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-6xl mx-auto px-4 md:px-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12" style={{ color: primaryColor }}>
              Precious Moments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {preciousMoments.map((photo, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-square overflow-hidden rounded-lg shadow-lg"
                >
                  <PhotoFrame 
                    src={photo.url}
                    maskUrl={borders?.preciousMoments}
                    maskData={borderMasks?.preciousMoments}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    aspectRatio="1:1"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-white py-8 text-center">
        <p className="text-sm md:text-base">© 2025 - Crafted with ❤️</p>
      </footer>
    </div>
  );
}
