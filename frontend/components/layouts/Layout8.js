'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Play, Minus, Mail, Phone, Globe, MoveRight, ArrowDown, Clock } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO } from 'date-fns';

/**
 * Layout 8: Zen Minimalist (Redesigned & Fixed)
 * 
 * Concept: "Japanese Wabi-Sabi"
 * - Fixed: Missing Clock import
 * - Fixed: Hydration nesting errors
 */
export default function Layout8({ 
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
    font = 'CINZEL',
    primaryColor = '#27272a',
    secondaryColor = '#71717a',
    welcomeMessage = 'We\'re Getting Married',
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

  // Variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } }
  };

  const lineDraw = {
    hidden: { height: 0 },
    visible: { height: '100px', transition: { duration: 1.5, ease: "easeInOut" } }
  };

  if (!isMounted) return null;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full overflow-x-hidden selection:bg-stone-200"
      style={{ 
        backgroundColor: '#f5f5f4', // Stone-100
        fontFamily: font,
        color: primaryColor,
      }}
    >
       {/* Texture Overlay */}
       <div className="fixed inset-0 pointer-events-none opacity-40 z-0" 
         style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/rice-paper-2.png")` }} 
       />

       {/* --- HERO SECTION --- */}
       <section className="relative min-h-screen flex flex-col md:flex-row z-10">
          
          {/* Left Column - Names (Vertical on desktop) */}
          <div className="w-full md:w-1/3 min-h-[50vh] md:h-screen flex flex-col items-center justify-center p-8 border-r border-stone-300 bg-[#f5f5f4]">
             <motion.div 
               initial="hidden"
               animate="visible"
               variants={fadeUp}
               className="flex flex-col items-center gap-12"
             >
                <div className="md:writing-vertical-rl text-center md:text-left space-y-4 md:space-y-0 md:space-x-8">
                   <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-widest font-light" style={{ color: primaryColor }}>
                     {bride_names}
                   </h1>
                   <div className="w-12 h-px md:w-px md:h-12 bg-stone-400 mx-auto" />
                   <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-widest font-light" style={{ color: primaryColor }}>
                     {groom_names}
                   </h1>
                </div>
                
                {event_date && (
                  <div className="text-sm tracking-[0.4em] uppercase text-stone-500 mt-8">
                     {format(parseISO(event_date), 'MMMM dd, yyyy')}
                  </div>
                )}
             </motion.div>
          </div>

          {/* Right Column - Photo or Video Template */}
          <div className="w-full md:w-2/3 h-[50vh] md:h-screen relative overflow-hidden">
             {hasTemplateVideo && templateVideoWeddingId ? (
               <motion.div 
                 initial={{ scale: 1.1, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 2 }}
                 className="w-full h-full flex items-center justify-center"
               >
                 <TemplateVideoPlayer
                    weddingId={templateVideoWeddingId}
                    className="w-full h-full"
                 />
               </motion.div>
             ) : couplePhoto?.url ? (
               <motion.div 
                 initial={{ scale: 1.1, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 2 }}
                 className="w-full h-full"
               >
                 <PhotoFrame
                    src={couplePhoto.url}
                    alt="Couple"
                    maskUrl={borders?.couple}
                    maskData={borderMasks?.couple}
                    aspectRatio="custom" // Allow fill
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
                    style={{ height: '100%' }}
                 />
                 {/* Zen Circle Overlay */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square border border-white/20 rounded-full opacity-50" />
               </motion.div>
             ) : (
                <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                   <div className="w-32 h-32 border border-stone-400 rounded-full" />
                </div>
             )}
             
             {/* Scroll Hint */}
             <div className="absolute bottom-8 right-8 animate-bounce">
                <ArrowDown className="w-6 h-6 text-white mix-blend-difference" />
             </div>
          </div>
       </section>

       {/* --- INTRODUCTION --- */}
       <section className="py-32 px-4 md:px-20 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
             <motion.div 
               initial={{ height: 0 }}
               whileInView={{ height: 80 }}
               className="w-px bg-stone-800 mx-auto mb-12"
             />
             
             <motion.h2 
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                className="text-2xl md:text-3xl font-light leading-relaxed"
             >
               "{description || welcomeMessage}"
             </motion.h2>
             
             <div className="mt-16 flex justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-800" />
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                <span className="w-2 h-2 rounded-full bg-stone-200" />
             </div>
          </div>
       </section>

       {/* --- DETAILS (Asymmetrical) --- */}
       <section className="py-20 px-4 md:px-12 z-10 relative bg-stone-100">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
             
             <div className="space-y-12 flex flex-col justify-center">
                <motion.div 
                   initial={{ x: -50, opacity: 0 }}
                   whileInView={{ x: 0, opacity: 1 }}
                   transition={{ duration: 0.8 }}
                >
                   <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">The Ceremony</p>
                   <h3 className="text-4xl font-serif mb-4">{venue}</h3>
                   <div className="flex items-center gap-4 text-stone-600">
                      <Clock className="w-4 h-4" />
                      <span>{event_time}</span>
                   </div>
                   <div className="w-20 h-px bg-stone-800 mt-8" />
                </motion.div>

                {(playback_url || recording_url || onEnter) && (
                   <motion.div
                     initial={{ x: -50, opacity: 0 }}
                     whileInView={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.2, duration: 0.8 }}
                   >
                      <button 
                        onClick={onEnter}
                        className="group flex items-center gap-4 text-xl tracking-widest uppercase hover:text-stone-500 transition-colors"
                      >
                         Join Live <MoveRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </button>
                   </motion.div>
                )}
             </div>

             <div className="relative h-[400px] md:h-[600px] bg-stone-200">
                {preWeddingVideo ? (
                   <iframe
                     src={preWeddingVideo}
                     className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                     allowFullScreen
                   />
                ) : (
                   // Decorative abstract visual if no video
                   <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      <div className="w-[150%] h-[150%] bg-[url('https://www.transparenttextures.com/patterns/shattered-island.png')] opacity-20 rotate-12" />
                   </div>
                )}
             </div>
          </div>
       </section>

       {/* --- MOMENTS (Horizontal Gallery) --- */}
       {preciousMoments?.length > 0 && (
          <section className="py-32 px-4 z-10 relative">
             <div className="max-w-7xl mx-auto">
                <p className="text-center text-xs uppercase tracking-widest mb-16">Captured Moments</p>
                <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                   {preciousMoments.slice(0, 3).map((photo, i) => (
                      <motion.div 
                         key={i}
                         initial={{ y: 50, opacity: 0 }}
                         whileInView={{ y: 0, opacity: 1 }}
                         transition={{ delay: i * 0.2 }}
                         className={`relative w-full md:w-1/3 aspect-[3/4] ${i === 1 ? 'md:-mt-12' : ''}`}
                      >
                         <PhotoFrame
                            src={photo.url}
                            alt="Moment"
                            className="w-full h-full object-cover shadow-xl"
                            style={{ filter: 'brightness(0.9) contrast(1.1)' }}
                         />
                         <div className="mt-4 text-center">
                            <span className="text-xs font-serif italic text-stone-500">0{i + 1}</span>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </section>
       )}

       {/* --- FOOTER --- */}
       <footer className="py-20 text-center z-10 relative border-t border-stone-200">
          <div className="w-px h-16 bg-stone-300 mx-auto mb-8" />
          <p className="text-3xl font-light" style={{ fontFamily: font }}>{bride_names.charAt(0)} & {groom_names.charAt(0)}</p>
          {studioDetails?.name && (
             <p className="mt-8 text-[10px] uppercase tracking-widest text-stone-400">
               Photography by {studioDetails.name}
             </p>
          )}
       </footer>
    </div>
  );
}
