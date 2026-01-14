'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, MapPin, Clock, Play, ArrowDown, ArrowRight, Share2, Globe, Mail, Phone, Heart } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Layout 1: Modern Split Editorial (Redesigned & Fixed)
 * 
 * Concept: "The Dual Narrative"
 * - Fixed: Hydration errors by ensuring clean DOM structure (divs instead of ps for blocks)
 * - Fixed: Import references
 * - Fixed: React error #310 by moving useTransform outside JSX
 */
export default function Layout1({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  /// Pre-compute transform values to avoid hooks in JSX
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  
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
    font = 'Playfair Display',
    primaryColor = '#1e3a8a',
    secondaryColor = '#64748b',
    welcomeMessage = 'We Are Getting Married',
    description = '',
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
  const slideIn = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const fadeInUp = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8 } }
  };

  if (!isMounted) return null;

  return (
    <div 
      className="min-h-screen bg-white"
      style={{ fontFamily: font, color: primaryColor }}
    >
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* --- LEFT SIDE (STICKY HERO / SECTION 1) --- */}
        <div className="lg:w-1/2 h-[60vh] lg:h-screen lg:sticky lg:top-0 relative overflow-hidden bg-gray-100">
           {/* Video Template - Section 1 Fixed Template (Only if assigned) */}
           {hasTemplateVideo && templateVideoWeddingId ? (
             <div className="absolute inset-0 w-full h-full flex items-center justify-center">
               <TemplateVideoPlayer 
                 weddingId={templateVideoWeddingId}
                 className="w-full h-full"
               />
             </div>
           ) : couplePhoto?.url ? (
             <motion.div 
               className="w-full h-full"
               style={{ scale: imageScale }}
             >
               <PhotoFrame
                  src={couplePhoto.url}
                  alt="Couple"
                  maskUrl={borders?.couple}
                  maskData={borderMasks?.couple}
                  aspectRatio="custom"
                  className="w-full h-full object-cover"
                  style={{ height: '100%' }}
               />
               <div className="absolute inset-0 bg-black/20" />
             </motion.div>
           ) : (
             <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <Heart className="w-24 h-24 text-slate-300" />
             </div>
           )}

           {/* Floating Names on Image (only if no video template) */}
           {!hasTemplateVideo && (
             <div className="absolute bottom-12 left-8 md:left-12 text-white z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-lg uppercase tracking-[0.3em] mb-4 opacity-80">{welcomeMessage}</div>
                  <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                    {bride_names} <br/> 
                    <span className="text-3xl md:text-5xl font-light italic opacity-90">&</span> <br/>
                    {groom_names}
                  </h1>
                </motion.div>
             </div>
           )}
        </div>

        {/* --- RIGHT SIDE (SCROLLING CONTENT) --- */}
        <div className="lg:w-1/2 relative bg-white">
           
           {/* Date & Time Header */}
           <section className="min-h-[50vh] flex flex-col justify-center p-12 md:p-24 border-b border-gray-100">
              {event_date && (() => {
                try {
                  const parsedDate = parseISO(event_date);
                  if (!isValid(parsedDate)) return null;
                  return (
                    <motion.div 
                      initial="hidden" 
                      whileInView="visible" 
                      viewport={{ once: true }}
                      variants={fadeInUp}
                      className="space-y-6"
                    >
                       <div className="flex items-center gap-4">
                          <span className="h-px w-12 bg-gray-300" />
                          <span className="text-sm uppercase tracking-widest text-gray-500">The Date</span>
                       </div>
                       <h2 className="text-6xl md:text-8xl font-black text-gray-900 leading-none">
                         {format(parsedDate, 'dd')}
                         <span className="block text-4xl md:text-5xl font-light italic mt-2" style={{ color: primaryColor }}>
                            {format(parsedDate, 'MMMM')}
                         </span>
                       </h2>
                       <div className="text-xl text-gray-500 font-light flex items-center gap-3">
                          <Clock className="w-5 h-5" />
                          <span>{event_time} • {format(parsedDate, 'yyyy')}</span>
                       </div>
                    </motion.div>
                  );
                } catch (e) {
                  console.error('Invalid date:', event_date, e);
                  return null;
                }
              })()}
           </section>

           {/* Story / Description */}
           {description && (
             <section className="p-12 md:p-24 bg-gray-50">
               <motion.div
                 initial="hidden"
                 whileInView="visible"
                 variants={slideIn}
               >
                 <h3 className="text-3xl font-bold mb-8 relative inline-block">
                    Our Story
                    <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-current opacity-30" />
                 </h3>
                 <div className="text-lg leading-relaxed text-gray-600 font-serif">
                   {description}
                 </div>
               </motion.div>
             </section>
           )}

           {/* Venue & Location */}
           {venue && (
             <section className="p-12 md:p-24 border-b border-gray-100">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  variants={fadeInUp}
                  className="space-y-8"
                >
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8" style={{ color: primaryColor }} />
                   </div>
                   <h3 className="text-4xl font-bold">The Venue</h3>
                   <div className="text-2xl font-light text-gray-600">{venue}</div>
                   
                   <button className="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-60 transition-opacity">
                     View on Map
                   </button>
                </motion.div>
             </section>
           )}

           {/* Video / Live Stream */}
           {(preWeddingVideo || playback_url || recording_url || onEnter) && (
             <section className="bg-black text-white p-12 md:p-24">
                <div className="mb-12">
                   <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded">
                      {onEnter ? "Live Access" : "Featured Video"}
                   </span>
                   <h3 className="text-4xl md:text-5xl font-bold mt-6 mb-4">
                      {onEnter ? "Join The Celebration" : "Watch Our Film"}
                   </h3>
                </div>

                {/* Video Player Container */}
                <div className="aspect-video w-full bg-gray-900 rounded-lg overflow-hidden border border-white/10 shadow-2xl relative group">
                   {preWeddingVideo && !onEnter ? (
                      <iframe
                        src={preWeddingVideo}
                        className="w-full h-full"
                        allowFullScreen
                      />
                   ) : playback_url && !onEnter ? (
                      <video src={playback_url} controls className="w-full h-full" />
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                         {onEnter && (
                           <button 
                             onClick={onEnter}
                             className="w-20 h-20 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                           >
                              <Play className="w-8 h-8 text-black ml-1" />
                           </button>
                         )}
                      </div>
                   )}
                </div>
             </section>
           )}

           {/* Gallery Grid */}
           {preciousMoments?.length > 0 && (
             <section className="p-4 md:p-8 bg-white">
                <div className="grid grid-cols-2 gap-4">
                   {preciousMoments.slice(0, 4).map((photo, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`aspect-square overflow-hidden relative ${i % 3 === 0 ? 'col-span-2 aspect-[2/1]' : ''}`}
                      >
                         <PhotoFrame 
                           src={photo.url}
                           maskUrl={borders?.preciousMoments} // Apply border to gallery items
                           className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                           aspectRatio={i % 3 === 0 ? "2:1" : "1:1"}
                         />
                      </motion.div>
                   ))}
                </div>
             </section>
           )}

           {/* Footer / Studio */}
           <footer className="p-12 md:p-24 bg-gray-50 text-center">
              <h2 className="text-3xl font-serif italic mb-8">Thank You</h2>
              {studioDetails?.logo_url && (
                 <div className="opacity-50 grayscale hover:grayscale-0 transition-all">
                    <p className="text-[10px] uppercase tracking-widest mb-4">Memories By</p>
                    <img src={studioDetails.logo_url} className="h-12 mx-auto" alt="Studio" />
                 </div>
              )}
           </footer>

        </div>
      </div>
    </div>
  );
}
