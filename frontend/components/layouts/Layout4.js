'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Play, Heart, Star, Paperclip, Scissors, Sticker, RotateCcw, ArrowDownRight, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Layout 4: Modern Scrapbook (Redesigned Magazine Style)
 * 
 * Concept: "Handcrafted Collage"
 * A warm, personal layout that feels like a physical scrapbook.
 * Features:
 * - Taped photos
 * - Handwritten font headers
 * - Mixed media elements (stickers, paper textures)
 * - Overlapping layout
 */
export default function Layout4({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [isMounted, setIsMounted] = useState(false);

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
    font = 'Indie Flower', // Handwriting font preference
    primaryColor = '#44403c',
    secondaryColor = '#78716c',
    welcomeMessage = 'Our Scrapbook',
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

  // Rotation helpers for that messy scrapbook look
  const getRotation = (i) => (i % 2 === 0 ? 2 : -2);

  if (!isMounted) return null;

  return (
    <div 
      className="min-h-screen bg-[#fdf6e3] overflow-x-hidden selection:bg-yellow-200"
      style={{ 
        fontFamily: font, 
        color: primaryColor,
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")' 
      }}
    >
      {/* --- HERO: POLAROID STYLE --- */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 relative">
         {/* Tape Element */}
         <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 h-12 bg-yellow-200/80 rotate-1 transform skew-x-12 z-10" />
         
         <div className="bg-white p-6 pb-20 shadow-xl transform -rotate-1 max-w-2xl w-full border border-gray-200 relative">
             {/* Video Template or Couple Photo */}
             {hasTemplateVideo && templateVideoWeddingId ? (
               <div className="aspect-[4/5] bg-transparent overflow-hidden relative flex items-center justify-center">
                  <TemplateVideoPlayer 
                     weddingId={templateVideoWeddingId}
                     className="w-full h-full"
                  />
               </div>
             ) : couplePhoto?.url ? (
               <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                  <PhotoFrame 
                     src={couplePhoto.url} 
                     maskUrl={borders?.couple}
                     maskData={borderMasks?.couple}
                     aspectRatio="custom"
                     className="w-full h-full object-cover filter sepia-[0.2]"
                     style={{ height: '100%' }}
                  />
               </div>
             ) : (
               <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center">
                  <Heart className="w-20 h-20 text-gray-300" />
               </div>
             )}

             {/* Handwritten Caption (only if no video template) */}
             {!hasTemplateVideo && (
               <div className="absolute bottom-4 left-0 right-0 text-center">
                  <h1 className="text-5xl font-bold mb-1" style={{ fontFamily: 'Caveat, cursive' }}>
                     {bride_names} & {groom_names}
                  </h1>
                  {event_date && (() => {
                    try {
                      const parsedDate = parseISO(event_date);
                      if (!isValid(parsedDate)) return null;
                      return <p className="text-xl text-gray-500">{format(parsedDate, 'MMMM do, yyyy')}</p>;
                    } catch (e) {
                      console.error('Invalid date:', event_date, e);
                      return null;
                    }
                  })()}
               </div>
             )}

             {/* Sticker Decoration */}
             <div className="absolute -top-6 -right-6 text-red-400 transform rotate-12">
                <Heart className="w-16 h-16 fill-current" />
             </div>
         </div>

         {/* Scroll Hint */}
         <div className="absolute bottom-8 animate-bounce">
            <ArrowDownRight className="w-8 h-8 text-gray-400" />
         </div>
      </section>

      {/* --- STORY: NOTEBOOK STYLE --- */}
      {description && (
        <section className="py-20 px-4 max-w-4xl mx-auto">
           <div className="bg-white p-12 shadow-lg relative transform rotate-1 border border-gray-100"
                style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 2rem' }}>
              
              {/* Paperclip */}
              <div className="absolute -top-4 right-12 text-gray-400">
                 <Paperclip className="w-12 h-12" />
              </div>

              <h2 className="text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'Caveat, cursive' }}>{welcomeMessage}</h2>
              <div className="text-2xl leading-[2rem] font-handwriting text-gray-700">
                 {description}
              </div>
           </div>
        </section>
      )}

      {/* --- EVENT INFO: TICKET STUBS --- */}
      <section className="py-20 px-4">
         <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Date Ticket */}
            <div className="bg-[#ffedd5] p-8 border-2 border-dashed border-orange-300 relative transform -rotate-2">
               <div className="absolute -left-3 top-1/2 w-6 h-6 bg-[#fdf6e3] rounded-full" />
               <div className="absolute -right-3 top-1/2 w-6 h-6 bg-[#fdf6e3] rounded-full" />
               <h3 className="text-xl uppercase tracking-widest text-orange-800 mb-4 font-bold">Save the Date</h3>
               {event_date && (() => {
                 try {
                   const parsedDate = parseISO(event_date);
                   if (!isValid(parsedDate)) return <div className="text-center"><p className="text-6xl font-black text-orange-900">TBD</p></div>;
                   return (
                     <div className="text-center">
                        <p className="text-6xl font-black text-orange-900">{format(parsedDate, 'dd')}</p>
                        <p className="text-3xl text-orange-800">{format(parsedDate, 'MMMM')}</p>
                        <p className="text-xl mt-2 flex items-center justify-center gap-2"><Clock className="w-5 h-5" /> {event_time}</p>
                     </div>
                   );
                 } catch (e) {
                   console.error('Invalid date:', event_date, e);
                   return <div className="text-center"><p className="text-6xl font-black text-orange-900">TBD</p></div>;
                 }
               })()}
            </div>

            {/* Venue Ticket */}
            <div className="bg-[#e0f2fe] p-8 border-2 border-dashed border-blue-300 relative transform rotate-1">
               <div className="absolute -left-3 top-1/2 w-6 h-6 bg-[#fdf6e3] rounded-full" />
               <div className="absolute -right-3 top-1/2 w-6 h-6 bg-[#fdf6e3] rounded-full" />
               <h3 className="text-xl uppercase tracking-widest text-blue-800 mb-4 font-bold">Location</h3>
               <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <p className="text-3xl font-bold text-blue-900">{venue}</p>
                  <p className="mt-4 text-blue-700">Can't wait to see you there!</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- GALLERY: SCATTERED PHOTOS --- */}
      {preciousMoments?.length > 0 && (
         <section className="py-20 px-4 overflow-hidden">
            <h2 className="text-center text-4xl mb-16" style={{ fontFamily: 'Caveat, cursive' }}>Favorite Moments</h2>
            <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8">
               {preciousMoments.map((photo, i) => (
                  <motion.div 
                     key={i}
                     whileHover={{ scale: 1.1, rotate: 0, zIndex: 10 }}
                     className="bg-white p-3 shadow-md pb-12 relative w-64 transform transition-all duration-300"
                     style={{ rotate: `${getRotation(i)}deg` }}
                  >
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-pink-200/80" />
                     <div className="aspect-square bg-gray-100 overflow-hidden">
                        <PhotoFrame 
                           src={photo.url} 
                           maskUrl={borders?.preciousMoments}
                           className="w-full h-full object-cover"
                        />
                     </div>
                  </motion.div>
               ))}
            </div>
         </section>
      )}

      {preWeddingVideo && (
         <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto bg-black p-4 rounded-xl shadow-2xl transform rotate-1">
               <div className="bg-gray-800 p-1 mb-2 rounded flex justify-between px-4 text-white font-mono text-xs">
                  <span>REC ●</span>
                  <span>00:04:20</span>
                  <span>BAT [||||]</span>
               </div>
               <div className="aspect-video">
                  <iframe
                     src={preWeddingVideo}
                     className="w-full h-full rounded"
                     allowFullScreen
                  />
               </div>
            </div>
         </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="py-20 text-center relative">
         <div className="absolute top-0 left-0 w-full h-4 bg-[url('https://www.transparenttextures.com/patterns/zipper.png')] opacity-20" />
         
         {(playback_url || recording_url || onEnter) && (
            <div className="mb-12">
               <button 
                  onClick={onEnter}
                  className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-red-600 transition-colors transform hover:-rotate-1"
               >
                  <Play className="inline w-6 h-6 mr-2" /> Watch Live
               </button>
            </div>
         )}

         <p className="text-2xl" style={{ fontFamily: 'Caveat, cursive' }}>With Love,</p>
         <h2 className="text-4xl font-bold mt-2">{bride_names} & {groom_names}</h2>
         
         {studioDetails?.name && (
            <div className="mt-12 text-gray-500 text-sm">
               <p>Memories captured by {studioDetails.name}</p>
            </div>
         )}
      </footer>
    </div>
  );
}
