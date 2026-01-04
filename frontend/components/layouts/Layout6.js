'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, MapPin, Clock, Play, Heart, Sparkles, Mail, Phone, Globe, ChevronDown, Music } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import BorderedPhotoGallery from '@/components/BorderedPhotoGallery';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Layout 6: Romantic Overlay (Redesigned & Fixed)
 * 
 * Concept: "Dreamy Cinematic Blur"
 * - Fixed: Hydration nesting errors
 * - Fixed: Import references
 * - Fixed: React error #310 by moving useTransform outside JSX
 */
export default function Layout6({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const yRange = useTransform(scrollYProgress, [0, 1], [0, 200]);
  
  // Pre-compute transform for background scale - MUST be called before any early returns
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.3]);
  
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
    font = 'Pinyon Script',
    primaryColor = '#fbbf24',
    secondaryColor = '#f59e0b',
    welcomeMessage = 'Forever Starts Today',
    description = '',
    couplePhoto = null,
    bridePhoto = null,
    groomPhoto = null,
    preciousMoments = [],
    studioDetails = {},
    heroBackground = null,
    preWeddingVideo = null,
    borders = {},
    borderMasks = {},
    templateVideoWeddingId = null,
    hasTemplateVideo = false,
  } = layoutConfig;

  // Floating animation for elements
  const floatVariant = {
    animate: {
      y: [0, -20, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      
      {/* --- BACKGROUND LAYER (Fixed) --- */}
      <div className="fixed inset-0 z-0">
        {couplePhoto?.url ? (
          <motion.div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${couplePhoto.url})`,
              scale: backgroundScale
            }}
          />
        ) : (
           <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        {/* Cinematic Gradient Overlay - Darker at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/90" />
        
        {/* Frosted Glass Overlay just to soften details */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 w-full">
        
        {/* HERO SECTION - Section 1 */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative">
            
            {/* Video Template in Hero Section */}
            {hasTemplateVideo && templateVideoWeddingId ? (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <div className="w-full max-w-4xl mx-auto aspect-video">
                  <TemplateVideoPlayer 
                    weddingId={templateVideoWeddingId}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Decorative Floating Orbs */}
                <motion.div 
                  className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-30"
                  style={{ background: primaryColor }}
                  animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                  transition={{ duration: 10, repeat: Infinity }}
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1 }}
                  className="relative z-20"
                >
                  <h2 
                    className="text-xl sm:text-2xl md:text-3xl tracking-[0.3em] uppercase text-white/80 mb-6 font-light"
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                  >
                    {welcomeMessage}
                  </h2>

                  <div className="flex flex-col items-center justify-center">
                    <motion.h1 
                      className="text-6xl sm:text-7xl md:text-9xl text-white drop-shadow-2xl"
                      style={{ fontFamily: font, color: primaryColor }}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                    >
                      {bride_names}
                    </motion.h1>
                    
                    <motion.span 
                      className="text-4xl text-white/90 my-2"
                      style={{ fontFamily: font }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      &
                    </motion.span>

                    <motion.h1 
                      className="text-6xl sm:text-7xl md:text-9xl text-white drop-shadow-2xl"
                      style={{ fontFamily: font, color: primaryColor }}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    >
                      {groom_names}
                    </motion.h1>
                  </div>

                  {/* Date Badge */}
                  {isMounted && event_date && (() => {
                    try {
                      const parsedDate = parseISO(event_date);
                      if (!isValid(parsedDate)) return null;
                      return (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="mt-12 inline-block"
                        >
                          <div 
                            className="px-8 py-3 rounded-full border border-white/30 bg-white/10 backdrop-blur-md shadow-lg"
                          >
                            <span className="text-xl sm:text-2xl text-white font-light tracking-wide">
                              {format(parsedDate, 'MMMM do, yyyy')}
                            </span>
                          </div>
                        </motion.div>
                      );
                    } catch (e) {
                      console.error('Invalid date:', event_date, e);
                      return null;
                    }
                  })()}
                </motion.div>
              </>
            )}

            {/* Scroll Indicator */}
            <motion.div 
              className="absolute bottom-10"
              animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-8 h-8 text-white/50" />
            </motion.div>
        </section>

        {/* BRIDE & GROOM SECTION (Floating Cards) */}
        {(bridePhoto || groomPhoto) && (
          <section className="py-20 px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 sm:gap-24">
               {bridePhoto?.url && (
                 <motion.div 
                   variants={floatVariant}
                   animate="animate"
                   className="relative"
                 >
                   <div className="aspect-[4/5] rounded-t-[10rem] rounded-b-[2rem] overflow-hidden border border-white/20 shadow-2xl relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <img src={bridePhoto.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <h3 className="absolute bottom-8 left-0 right-0 text-center text-4xl text-white z-20" style={{ fontFamily: font }}>{bride_names}</h3>
                   </div>
                 </motion.div>
               )}
               
               {groomPhoto?.url && (
                 <motion.div 
                   variants={floatVariant}
                   animate="animate"
                   className="relative md:mt-24" // Stagger layout
                 >
                   <div className="aspect-[4/5] rounded-t-[10rem] rounded-b-[2rem] overflow-hidden border border-white/20 shadow-2xl relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <img src={groomPhoto.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <h3 className="absolute bottom-8 left-0 right-0 text-center text-4xl text-white z-20" style={{ fontFamily: font }}>{groom_names}</h3>
                   </div>
                 </motion.div>
               )}
            </div>
          </section>
        )}

        {/* DESCRIPTION & DETAILS (Glassmorphism) */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
             <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 sm:p-16 rounded-3xl shadow-2xl text-center relative overflow-hidden">
                {/* Shine effect */}
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none" />
                
                <Sparkles className="w-10 h-10 mx-auto mb-8 text-white/60" />
                
                {description && (
                  <div className="text-xl sm:text-3xl text-white leading-relaxed mb-12 font-light">
                    "{description}"
                  </div>
                )}
                
                <div className="grid sm:grid-cols-3 gap-8 border-t border-white/10 pt-12">
                   {event_time && (
                     <div className="text-white">
                       <Clock className="w-6 h-6 mx-auto mb-2 text-white/70" />
                       <p className="uppercase tracking-widest text-xs opacity-60 mb-1">Time</p>
                       <p className="text-lg">{event_time}</p>
                     </div>
                   )}
                   {venue && (
                     <div className="text-white sm:col-span-2">
                       <MapPin className="w-6 h-6 mx-auto mb-2 text-white/70" />
                       <p className="uppercase tracking-widest text-xs opacity-60 mb-1">Venue</p>
                       <p className="text-lg">{venue}</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </section>

        {/* GALLERY (Horizontal Scroll) */}
        {preciousMoments?.length > 0 && (
          <section className="py-20 overflow-hidden">
             <motion.h2 
               initial={{ x: -100, opacity: 0 }}
               whileInView={{ x: 0, opacity: 1 }}
               className="text-center text-5xl sm:text-6xl text-white mb-16" 
               style={{ fontFamily: font, color: primaryColor }}
             >
               Memories
             </motion.h2>
             
             {/* Using the new PhotoFrame capability inside BorderedPhotoGallery structure */}
             <div className="px-4">
               <BorderedPhotoGallery 
                  photos={preciousMoments.map(p => ({
                    ...p,
                    border_url: borders?.preciousMoments || null // Pass the border URL
                  }))}
                  layout="carousel"
                  className="max-w-7xl mx-auto"
               />
             </div>
          </section>
        )}

        {/* LIVE STREAM CALL TO ACTION */}
        {(playback_url || recording_url || onEnter) && (
          <section className="py-32 px-4 text-center">
             <motion.div 
               whileHover={{ scale: 1.05 }}
               className="inline-block relative group"
             >
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ background: primaryColor }}
                />
                <button
                  onClick={onEnter}
                  className="relative px-12 py-6 rounded-full bg-white text-black text-xl font-bold tracking-wide shadow-2xl flex items-center gap-4"
                >
                  <Play className="w-6 h-6 fill-black" />
                  {onEnter ? 'ENTER LIVE EVENT' : 'WATCH VIDEO'}
                </button>
             </motion.div>
             
             {playback_url && !onEnter && (
               <div className="mt-12 max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                  <video src={playback_url} controls className="w-full h-full" />
               </div>
             )}
          </section>
        )}

        {/* FOOTER */}
        <footer className="py-12 border-t border-white/10 text-center text-white/40">
           <p className="text-sm uppercase tracking-widest">With Love</p>
           {studioDetails?.name && (
             <p className="mt-4 text-xs">Photography by {studioDetails.name}</p>
           )}
        </footer>

      </div>
    </div>
  );
}
