'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, MapPin, Clock, Play, Heart, ChevronRight, Music, Film, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Layout 3: The Love Story Journey (Redesigned & Fixed)
 * 
 * Concept: "Interactive Timeline Journey"
 * - Fixed: Hydration errors
 * - Fixed: Reference errors
 */
export default function Layout3({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Transform scroll to horizontal movement for desktop section
  const xMove = useTransform(scrollYProgress, [0.2, 0.8], ["0%", "-100%"]);

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
    font = 'Lato',
    primaryColor = '#be185d',
    secondaryColor = '#fbcfe8',
    welcomeMessage = 'Our Journey',
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
      className="bg-white min-h-screen overflow-x-hidden"
      style={{ fontFamily: font, color: '#333' }}
    >
       {/* --- MOBILE VIEW (Vertical Timeline) --- */}
       <div className="lg:hidden">
          {/* Mobile Hero - Section 1 */}
          <div className="min-h-screen relative flex items-center justify-center p-8 bg-pink-50 text-center">
             {hasTemplateVideo && templateVideoWeddingId ? (
               <div className="w-full max-w-2xl mx-auto relative z-10">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-white/50 backdrop-blur-xl p-2">
                     <TemplateVideoPlayer 
                       weddingId={templateVideoWeddingId}
                       className="w-full h-full"
                     />
                  </div>
               </div>
             ) : (
               <div className="space-y-6 relative z-10">
                  <div className="w-20 h-1 bg-pink-400 mx-auto" />
                  <h1 className="text-4xl font-bold text-pink-900">{bride_names} <br/>&<br/> {groom_names}</h1>
                  <div className="text-pink-700 uppercase tracking-widest text-sm">{welcomeMessage}</div>
                  {couplePhoto?.url && (
                     <div className="mt-8 rounded-full w-64 h-64 mx-auto overflow-hidden border-4 border-white shadow-xl">
                        <PhotoFrame 
                          src={couplePhoto.url} 
                          aspectRatio="1:1" 
                          maskUrl={borders?.couple}
                          className="w-full h-full object-cover" 
                        />
                     </div>
                  )}
               </div>
             )}
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 rounded-bl-full opacity-50" />
          </div>

          {/* Vertical Timeline */}
          <div className="px-6 py-20 relative">
             <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-pink-200" />
             
             {/* Story Node */}
             {description && (
               <div className="mb-16 relative pl-12">
                  <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-pink-500 border-4 border-white shadow flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-pink-900 mb-2">Our Story</h3>
                  <div className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-pink-100">
                    {description}
                  </div>
               </div>
             )}

             {/* Moments Nodes */}
             {preciousMoments?.map((photo, i) => (
                <div key={i} className="mb-16 relative pl-12">
                   <div className="absolute left-3 top-8 w-2 h-2 rounded-full bg-pink-300" />
                   <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                      <img src={photo.url} className="w-full h-auto" />
                   </div>
                </div>
             ))}

             {/* Event Node */}
             <div className="mb-16 relative pl-12">
                <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-pink-900 border-4 border-white shadow flex items-center justify-center">
                   <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="bg-pink-900 text-white p-6 rounded-2xl shadow-xl">
                   {event_date && (() => {
                     try {
                       const parsedDate = parseISO(event_date);
                       if (!isValid(parsedDate)) return <h3 className="text-2xl font-bold mb-1">Date TBD</h3>;
                       return (
                         <>
                           <h3 className="text-2xl font-bold mb-1">{format(parsedDate, 'MMMM dd')}</h3>
                           <div className="opacity-80 mb-4">{format(parsedDate, 'yyyy')} • {event_time}</div>
                         </>
                       );
                     } catch (e) {
                       console.error('Invalid date:', event_date, e);
                       return <h3 className="text-2xl font-bold mb-1">Date TBD</h3>;
                     }
                   })()}
                   {venue && (
                     <div className="flex items-center gap-2 text-sm border-t border-white/20 pt-4">
                        <MapPin className="w-4 h-4" /> {venue}
                     </div>
                   )}
                </div>
             </div>

             {/* Live/Video Node */}
             {(playback_url || recording_url || onEnter) && (
                <div className="relative pl-12">
                   <div className="absolute left-0 top-2 w-8 h-8 rounded-full bg-black border-4 border-white shadow flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                   </div>
                   <button 
                     onClick={onEnter}
                     className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                   >
                     {onEnter ? "Join Live Stream" : "Watch Video"}
                   </button>
                </div>
             )}
          </div>
       </div>


       {/* --- DESKTOP VIEW (Horizontal Scroll) --- */}
       <div className="hidden lg:block h-[500vh] relative" ref={containerRef}>
          <div className="sticky top-0 h-screen overflow-hidden bg-gray-50 flex items-center">
             
             {/* Progress Bar Line */}
             <motion.div 
               className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10" 
             >
                <motion.div 
                   className="h-full bg-pink-500 origin-left"
                   style={{ scaleX: scrollYProgress }} 
                />
             </motion.div>

             {/* Horizontal Moving Container */}
             <motion.div 
               style={{ x: xMove }}
               className="flex items-center gap-[40vw] px-[10vw]"
             >
                {/* 1. HERO CARD */}
                <div className="w-[80vw] shrink-0 grid grid-cols-2 gap-12 items-center">
                   <div className="relative">
                      {couplePhoto ? (
                         <div className="relative z-10">
                            <div className="absolute -inset-4 bg-pink-200 rounded-full blur-xl opacity-50" />
                            <PhotoFrame 
                               src={couplePhoto.url} 
                               maskUrl={borders?.couple}
                               aspectRatio="4:5"
                               className="w-full h-[70vh] object-cover shadow-2xl rounded-3xl"
                            />
                         </div>
                      ) : <div className="h-[60vh] bg-gray-200 rounded-3xl" />}
                   </div>
                   <div className="space-y-8">
                      <div className="text-pink-600 font-bold tracking-[0.4em] uppercase">The Wedding Of</div>
                      <h1 className="text-9xl font-black text-slate-900 leading-[0.8]">
                         {bride_names.split(' ')[0]} <br/> 
                         <span className="text-pink-500">&</span> <br/>
                         {groom_names.split(' ')[0]}
                      </h1>
                      <div className="flex items-center gap-4 text-gray-500">
                         <div className="w-12 h-px bg-gray-400" />
                         <div>Scroll to Explore</div>
                         <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            <ArrowRight className="w-4 h-4" />
                         </motion.div>
                      </div>
                   </div>
                </div>

                {/* 2. STORY CARD */}
                {description && (
                   <div className="w-[40vw] shrink-0 bg-white p-12 rounded-3xl shadow-2xl border-t-8 border-pink-500 relative">
                      <div className="absolute -top-6 left-12 bg-pink-500 text-white p-4 rounded-full">
                         <Heart className="w-6 h-6" />
                      </div>
                      <h3 className="text-3xl font-bold mb-6 mt-4">How We Met</h3>
                      <div className="text-xl leading-relaxed text-gray-600">
                         {description}
                      </div>
                   </div>
                )}

                {/* 3. MOMENTS (Stacked horizontally) */}
                {preciousMoments?.map((photo, i) => (
                   <div key={i} className={`w-[25vw] shrink-0 ${i % 2 === 0 ? '-mt-24' : 'mt-24'}`}>
                      <div className="bg-white p-4 rounded-xl shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                         <PhotoFrame 
                            src={photo.url} 
                            maskUrl={borders?.preciousMoments}
                            className="w-full aspect-[3/4] object-cover rounded-lg"
                         />
                         <div className="text-center mt-4 font-handwriting text-gray-400">Moment {i+1}</div>
                      </div>
                   </div>
                ))}

                {/* 5. EVENT DETAILS CARD */}
                <div className="w-[50vw] shrink-0 flex items-center gap-12">
                   <div className="w-full bg-slate-900 text-white p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500 rounded-full blur-[100px] opacity-20" />
                      
                      <div className="relative z-10 grid grid-cols-2 gap-12">
                         <div>
                            <div className="text-pink-400 uppercase tracking-widest text-sm mb-2">Save The Date</div>
                            {event_date && (() => {
                               try {
                                 const parsedDate = parseISO(event_date);
                                 if (!isValid(parsedDate)) return <h2 className="text-7xl font-bold mb-4">TBD</h2>;
                                 return <h2 className="text-7xl font-bold mb-4">{format(parsedDate, 'dd.MM')}</h2>;
                               } catch (e) {
                                 console.error('Invalid date:', event_date, e);
                                 return <h2 className="text-7xl font-bold mb-4">TBD</h2>;
                               }
                            })()}
                            <div className="flex items-center gap-2 text-gray-400">
                               <Clock className="w-4 h-4" /> {event_time}
                            </div>
                         </div>
                         <div className="border-l border-white/10 pl-12">
                            <div className="text-pink-400 uppercase tracking-widest text-sm mb-2">Location</div>
                            <h3 className="text-3xl font-bold mb-4 leading-tight">{venue}</h3>
                            <button className="flex items-center gap-2 text-sm border-b border-white/30 pb-1 hover:text-pink-400 transition-colors">
                               <MapPin className="w-4 h-4" /> Get Directions
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 6. MEDIA & END */}
                <div className="w-[60vw] shrink-0 flex items-center justify-center">
                   {(playback_url || recording_url || onEnter) ? (
                      <div className="text-center">
                         <div className="inline-block p-1 rounded-full border-2 border-dashed border-pink-300 mb-8 relative">
                            <div className="w-32 h-32 rounded-full bg-pink-500 flex items-center justify-center animate-pulse">
                               <Play className="w-12 h-12 text-white fill-current ml-1" />
                            </div>
                         </div>
                         <h2 className="text-5xl font-bold mb-8">Ready to Celebrate?</h2>
                         <button 
                           onClick={onEnter}
                           className="bg-black text-white px-12 py-6 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl"
                         >
                            ENTER LIVE EVENT
                         </button>
                      </div>
                   ) : (
                      <div className="text-center">
                         <h2 className="text-6xl font-black text-gray-200 uppercase">See You<br/>There</h2>
                      </div>
                   )}
                </div>

             </motion.div>
          </div>
       </div>
    </div>
  );
}
