'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, Play, ArrowDownRight, MoveRight, X } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO } from 'date-fns';

/**
 * Layout 7: Editorial Grid (Redesigned & Fixed)
 * 
 * Concept: "Museum Exhibition"
 * - Fixed: Hydration errors (nesting)
 * - Fixed: Potential missing imports
 */
export default function Layout7({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

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
    font = 'Space Grotesk',
    primaryColor = '#000000',
    secondaryColor = '#4b5563',
    welcomeMessage = 'The Wedding',
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

  if (!isMounted) return null;

  return (
    <div 
      className="min-h-screen bg-stone-50 overflow-x-hidden"
      style={{ fontFamily: font, color: primaryColor }}
    >
       {/* --- HEADER --- */}
       <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-start mix-blend-difference text-white pointer-events-none">
          <div className="text-xs font-bold uppercase tracking-widest">
             {welcomeMessage}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-right">
             {event_date ? format(parseISO(event_date), 'dd.MM.yy') : '2025'}
          </div>
       </header>

       {/* --- HERO SECTION (Sticky Scroll) - Section 1 --- */}
       <section className="relative min-h-[120vh]">
          <div className="sticky top-0 h-screen flex flex-col justify-center items-center overflow-hidden">
             
             {/* Video Template or Traditional Hero */}
             {hasTemplateVideo && templateVideoWeddingId ? (
               <div className="relative z-30 w-[80vw] h-[70vh] md:w-[60vw] md:h-[80vh] flex items-center justify-center">
                 <TemplateVideoPlayer 
                   weddingId={templateVideoWeddingId}
                   className="w-full h-full"
                 />
               </div>
             ) : (
               <>
                 {/* Huge Typography Layer */}
                 <div className="absolute inset-0 flex flex-col justify-between p-12 z-0 opacity-10">
                    <h1 className="text-[15vw] leading-none font-bold text-transparent stroke-black border-text" style={{ WebkitTextStroke: `2px ${primaryColor}` }}>
                       {bride_names.split(' ')[0]}
                    </h1>
                    <h1 className="text-[15vw] leading-none font-bold text-right text-transparent stroke-black border-text" style={{ WebkitTextStroke: `2px ${primaryColor}` }}>
                       {groom_names.split(' ')[0]}
                    </h1>
                 </div>

                 {/* Main Image Layer */}
                 {couplePhoto?.url && (
                    <motion.div 
                      className="relative z-10 w-[80vw] h-[70vh] md:w-[40vw] md:h-[80vh] bg-gray-200 shadow-2xl"
                      style={{ y: yParallax }}
                    >
                       <PhotoFrame 
                         src={couplePhoto.url} 
                         maskUrl={borders?.couple}
                         maskData={borderMasks?.couple}
                         className="w-full h-full object-cover grayscale contrast-125"
                         aspectRatio="custom"
                         style={{ height: '100%' }}
                       />
                    </motion.div>
                 )}

                 {/* Foreground Text Layer */}
                 <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mix-blend-difference text-white">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">
                      {bride_names} <span className="text-2xl font-light italic">&</span> {groom_names}
                    </h2>
                 </div>
               </>
             )}
          </div>
       </section>

       {/* --- BROKEN GRID CONTENT --- */}
       <section className="max-w-7xl mx-auto px-6 py-24">
          
          {/* 1. Introduction Block */}
          <div className="grid md:grid-cols-12 gap-12 items-start mb-32">
             <div className="md:col-span-4 sticky top-24">
                <div className="w-12 h-1 bg-black mb-8" />
                <p className="text-sm uppercase tracking-widest font-bold mb-2">Exhibition Note</p>
                <p className="text-gray-500 text-sm">Curated by Fate</p>
             </div>
             <div className="md:col-span-8">
                {description && (
                   <div className="text-3xl md:text-5xl font-light leading-tight indent-24">
                      {description}
                   </div>
                )}
             </div>
          </div>

          {/* 2. Gallery (Asymmetrical) */}
          {preciousMoments?.length > 0 && (
             <div className="space-y-32 mb-32">
                {preciousMoments.map((photo, i) => (
                   <div 
                     key={i} 
                     className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                   >
                      <div className={`relative w-full md:w-2/3 ${i % 2 === 0 ? 'md:pr-24' : 'md:pl-24'}`}>
                         {/* Caption Number */}
                         <div className="absolute -top-12 text-6xl font-bold opacity-10 font-serif">
                            0{i + 1}
                         </div>
                         
                         <div className="aspect-[4/3] bg-gray-200 relative group overflow-hidden">
                            <PhotoFrame 
                               src={photo.url} 
                               maskUrl={borders?.preciousMoments}
                               className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 grayscale"
                            />
                            {/* Overlay Info on Hover */}
                            <div className="absolute bottom-0 left-0 w-full bg-black text-white p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                               <p className="text-xs uppercase tracking-widest">Figure {i + 1}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* 3. Event Details (Brutalist List) */}
          <div className="border-t-2 border-black pt-12 mb-32">
             <div className="grid md:grid-cols-2 gap-12">
                <div>
                   <h3 className="text-6xl font-bold mb-8">Details</h3>
                   <ArrowDownRight className="w-12 h-12" />
                </div>
                <div className="space-y-8">
                   <div className="group border-b border-gray-300 pb-8 hover:border-black transition-colors cursor-default">
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 group-hover:text-black">When</p>
                      <p className="text-3xl md:text-4xl">
                         {event_date ? format(parseISO(event_date), 'MMMM do, yyyy') : 'Date TBD'}
                      </p>
                      <p className="text-xl text-gray-600">{event_time}</p>
                   </div>
                   
                   <div className="group border-b border-gray-300 pb-8 hover:border-black transition-colors cursor-default">
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 group-hover:text-black">Where</p>
                      <p className="text-3xl md:text-4xl">{venue || 'Location TBD'}</p>
                   </div>

                   {(playback_url || recording_url || onEnter) && (
                      <div className="group pt-8 cursor-pointer" onClick={onEnter}>
                         <div className="flex justify-between items-center mb-4">
                            <p className="text-xs uppercase tracking-widest text-gray-500 group-hover:text-black">Digital Access</p>
                            <div className="bg-black text-white px-3 py-1 text-xs uppercase font-bold animate-pulse">Live</div>
                         </div>
                         <div className="flex items-center gap-4">
                            <p className="text-3xl md:text-4xl underline decoration-2 underline-offset-4 group-hover:text-blue-600 transition-colors">
                               Enter Viewing Room
                            </p>
                            <MoveRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {preWeddingVideo && (
             <div className="mb-32">
                <div className="w-full aspect-video bg-black p-4 md:p-8">
                   <iframe
                     src={preWeddingVideo}
                     className="w-full h-full opacity-80 hover:opacity-100 transition-opacity"
                     allowFullScreen
                   />
                </div>
                <div className="flex justify-between mt-4 font-mono text-xs uppercase">
                   <span>Motion Picture</span>
                   <span>Duration: Variable</span>
                </div>
             </div>
          )}

       </section>

       {/* --- FOOTER --- */}
       <footer className="bg-black text-white py-24 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
             <div>
                <h2 className="text-8xl font-bold leading-none mb-4">{bride_names.charAt(0)}&{groom_names.charAt(0)}</h2>
                <p className="text-sm text-gray-500 max-w-xs">
                   A union celebrating art, love, and the future.
                </p>
             </div>
             
             <div className="text-right">
                {studioDetails?.name && (
                   <div className="mb-8">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Captured By</p>
                      <p className="text-xl font-bold">{studioDetails.name}</p>
                   </div>
                )}
             </div>
          </div>
       </footer>

    </div>
  );
}
