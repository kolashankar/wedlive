'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, Play, Minus, Mail, Phone, Globe, ArrowRight, X } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Layout 5: Minimalist Card (Redesigned)
 * 
 * Concept: "Modern Art Gallery Ticket"
 * A sophisticated, structured design resembling high-end invitation stationery.
 * Features:
 * - Asymmetrical grid layout
 * - "Ticket" stub aesthetics with barcode details
 * - Smooth inertia-based scroll animations
 * - Precision typography
 */
export default function Layout5({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    bride_name = '',
    groom_name = '',
    event_date = '',
    event_time = '',
    venue = '',
    playback_url = '',
    recording_url = '',
  } = weddingData;
  
  const bride_names = bride_name;
  const groom_names = groom_name;

  const {
    font = 'Montserrat',
    primaryColor = '#1a1a1a',
    secondaryColor = '#666666',
    welcomeMessage = 'Together',
    description = '',
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    preWeddingVideo = null,
    heroBackground = null,
    borders = {},
    borderMasks = {},
    templateVideoWeddingId = null,
    hasTemplateVideo = false,
  } = layoutConfig;

  // Animation Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  if (!isMounted) return null;

  return (
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 md:px-12 selection:bg-gray-200"
      style={{ 
        backgroundColor: '#f4f4f5',
        fontFamily: font,
        color: primaryColor,
        backgroundImage: 'radial-gradient(#e4e4e7 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - MAIN "TICKET" */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Invitation Card */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white p-8 sm:p-12 shadow-2xl relative overflow-hidden group"
            style={{ borderRadius: '2px' }}
          >
            {/* Decorative "Ticket" notches */}
            <div className="absolute -left-3 top-1/2 w-6 h-12 bg-[#f4f4f5] rounded-r-full" />
            <div className="absolute -right-3 top-1/2 w-6 h-12 bg-[#f4f4f5] rounded-l-full" />
            
            <div className="flex flex-col h-full justify-between min-h-[500px]">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
                 <div className="space-y-1">
                   <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Invitation</p>
                   <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">No. 001</p>
                 </div>
                 {event_date && (() => {
                   try {
                     const parsedDate = parseISO(event_date);
                     if (!isValid(parsedDate)) return (
                       <div className="text-right">
                         <p className="text-4xl font-light tabular-nums tracking-tighter" style={{ color: primaryColor }}>TBD</p>
                       </div>
                     );
                     return (
                       <div className="text-right">
                         <p className="text-4xl font-light tabular-nums tracking-tighter" style={{ color: primaryColor }}>
                           {format(parsedDate, 'dd.MM')}
                         </p>
                         <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
                            {format(parsedDate, 'yyyy')}
                         </p>
                       </div>
                     );
                   } catch (e) {
                     console.error('Invalid date:', event_date, e);
                     return null;
                   }
                 })()}
              </div>

              {/* Names */}
              <div className="py-12 text-center lg:text-left relative">
                 <motion.h1 
                    className="text-6xl sm:text-7xl md:text-8xl font-medium leading-none tracking-tight mix-blend-exclusion"
                    style={{ color: primaryColor }}
                    whileHover={{ scale: 1.02, x: 20 }}
                    transition={{ type: "spring", stiffness: 300 }}
                 >
                   {bride_names}
                 </motion.h1>
                 <span className="text-4xl font-light italic text-gray-300 block my-4 ml-12">&</span>
                 <motion.h1 
                    className="text-6xl sm:text-7xl md:text-8xl font-medium leading-none tracking-tight pl-8 sm:pl-20"
                    style={{ color: primaryColor }}
                    whileHover={{ scale: 1.02, x: 20 }}
                    transition={{ type: "spring", stiffness: 300 }}
                 >
                   {groom_names}
                 </motion.h1>
              </div>

              {/* Footer Info */}
              <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-end gap-6">
                <div>
                   <p className="text-lg font-medium mb-2">{welcomeMessage}</p>
                   {venue && (
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                       <MapPin className="w-4 h-4" />
                       <span className="uppercase tracking-wide">{venue}</span>
                     </div>
                   )}
                </div>
                {event_time && (
                  <div className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold tracking-widest">
                    {event_time}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Couple Photo or Video Template Card - Section 1 */}
          {hasTemplateVideo && templateVideoWeddingId ? (
            <motion.div
               variants={cardVariants}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               className="bg-white p-4 shadow-xl"
            >
               <div className="aspect-[16/10] overflow-hidden bg-transparent relative flex items-center justify-center">
                  <TemplateVideoPlayer
                    weddingId={templateVideoWeddingId}
                    className="w-full h-full"
                  />
               </div>
            </motion.div>
          ) : couplePhoto?.url ? (
            <motion.div
               variants={cardVariants}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               className="bg-white p-4 shadow-xl"
            >
               <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
                  <PhotoFrame
                    src={couplePhoto.url}
                    alt={`${bride_names} & ${groom_names}`}
                    maskUrl={borders?.couple}
                    maskData={borderMasks?.couple}
                    aspectRatio="16:10"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                  {/* Overlay text */}
                  <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2">
                    <p className="text-xs font-bold tracking-widest uppercase">The Couple</p>
                  </div>
               </div>
            </motion.div>
          ) : null}

          {/* Video Section */}
          {preWeddingVideo && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-black text-white p-8 sm:p-12 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-light uppercase tracking-widest">Our Story</h3>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="aspect-video w-full border border-white/20">
                <iframe
                  src={preWeddingVideo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN - INFO STACK */}
        <div className="lg:col-span-5 space-y-8 lg:mt-24">
          
          {/* Description Card */}
          {description && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="bg-white p-8 shadow-lg border-l-4"
              style={{ borderColor: primaryColor }}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">A Note</h3>
              <p className="text-lg leading-relaxed font-light text-gray-800">
                {description}
              </p>
            </motion.div>
          )}

          {/* Live Stream Ticket */}
          {(playback_url || recording_url || onEnter) && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-[#1a1a1a] text-white p-8 relative overflow-hidden group cursor-pointer"
              onClick={onEnter}
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Globe className="w-32 h-32 rotate-12" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-xs font-bold uppercase tracking-widest">Digital Access</p>
                </div>
                
                <h2 className="text-3xl font-bold mb-2">Live Stream</h2>
                <p className="text-gray-400 mb-8 text-sm">Join the celebration from anywhere.</p>
                
                {onEnter ? (
                   <button className="flex items-center gap-4 text-white hover:gap-6 transition-all">
                     <span className="uppercase tracking-widest text-sm border-b border-white pb-1">Enter Event</span>
                     <ArrowRight className="w-4 h-4" />
                   </button>
                ) : (
                  <div className="bg-white/10 p-2 rounded">
                    <p className="text-xs text-center">Video Player Loaded</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Gallery Grid - Compact */}
          {preciousMoments?.length > 0 && (
             <motion.div
               variants={staggerContainer}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               className="grid grid-cols-2 gap-4"
             >
               {preciousMoments.slice(0, 4).map((photo, idx) => (
                 <motion.div 
                    key={idx} 
                    variants={cardVariants}
                    className="aspect-square bg-white p-2 shadow-md hover:shadow-xl transition-shadow duration-300"
                 >
                    <div className="w-full h-full bg-gray-100 overflow-hidden relative">
                      <img 
                        src={photo.url} 
                        alt="Moment" 
                        className="w-full h-full object-cover filter sepia-[0.2] hover:sepia-0 transition-all" 
                      />
                    </div>
                 </motion.div>
               ))}
               {preciousMoments.length > 4 && (
                 <motion.div variants={cardVariants} className="col-span-2 text-center py-4">
                   <p className="text-xs uppercase tracking-widest text-gray-500">
                     + {preciousMoments.length - 4} More Moments
                   </p>
                 </motion.div>
               )}
             </motion.div>
          )}

          {/* Barcode Footer */}
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            className="text-center py-12 opacity-40"
          >
            <div className="h-12 w-3/4 mx-auto bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/UPC-A-036000291452.svg/2560px-UPC-A-036000291452.svg.png')] bg-contain bg-no-repeat bg-center grayscale" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em]">Admit One • {event_date || '2025'}</p>
          </motion.div>
          
          {/* Studio Info (Minimal) */}
          {studioDetails?.default_image_url && (
             <div className="border-t border-gray-200 pt-8 text-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                <img src={studioDetails.default_image_url} className="w-32 h-32 mx-auto mb-2 rounded object-cover" alt="Studio" />
                <p className="text-[10px] uppercase">{studioDetails.name}</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
