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
      className="min-h-screen"
      style={{ fontFamily: font, color: primaryColor }}
    >
      {/* Section 1: Template Video with Invitation Card Style */}
      {hasTemplateVideo && templateVideoWeddingId && (
        <section className="w-full min-h-screen flex items-center justify-center backdrop-blur-sm p-4 md:p-8">
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
        <section className="w-full min-h-[50vh] md:min-h-[60vh] py-8 md:py-16 flex items-center justify-center">
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
        <section className="w-full min-h-[50vh] md:min-h-[60vh] backdrop-blur-sm py-8 md:py-16 flex items-center justify-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-6xl mx-auto px-4 md:px-8"
          >
            <div className="aspect-video w-full bg-black/30 rounded-lg overflow-hidden shadow-2xl">
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
        <section className="w-full min-h-[40vh] md:min-h-[50vh] backdrop-blur-sm py-12 md:py-20 flex items-center justify-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-5xl mx-auto px-4 md:px-8 text-center"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-16 shadow-2xl border border-white/20">
              <img 
                src={studioDetails.logo_url} 
                className="h-20 md:h-32 mx-auto mb-6 filter drop-shadow-lg" 
                alt="Studio" 
              />
              <h3 className="text-white text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-widest mb-4">
                Stand Out With World-Class Video Production
              </h3>
              <p className="text-white/90 text-sm md:text-base lg:text-lg font-light">
                Your Story Deserves To Be Heard
              </p>
            </div>
          </motion.div>
        </section>
      )}

      {/* Section 5: Precious Moments Gallery */}
      {preciousMoments?.length > 0 && (
        <section className="w-full min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 md:py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full max-w-7xl mx-auto px-4 md:px-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 md:mb-16" style={{ color: primaryColor }}>
              Precious Moments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
              {preciousMoments.map((photo, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative group"
                >
                  {/* Polaroid-style frame */}
                  <div className="bg-white p-3 md:p-4 shadow-xl rounded-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <PhotoFrame 
                        src={photo.url}
                        maskUrl={borders?.preciousMoments}
                        maskData={borderMasks?.preciousMoments}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        aspectRatio="1:1"
                      />
                    </div>
                    {/* Bottom caption area (polaroid style) */}
                    <div className="h-8 md:h-10 bg-white"></div>
                  </div>
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
