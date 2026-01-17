'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Calendar, MapPin, Clock, Play, Sparkles, Mail, Phone, Globe, ChevronDown, Share2, Music } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import PhotoFrame from '@/components/PhotoFrame';
import BorderedPhotoGallery from '@/components/BorderedPhotoGallery';
import TemplateVideoPlayer from '@/components/TemplateVideoPlayer';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isValid } from 'date-fns';

/**
 * Layout 2: Ethereal Center Focus (Redesigned)
 * 
 * A world-class, immersive layout focusing on the couple's unity.
 * Features:
 * - Parallax Hero Section
 * - Glassmorphism UI elements
 * - Smooth entrance animations
 * - Elegant typography hierarchy
 * - Interactive countdown
 */
export default function Layout2({ 
  weddingData = {}, 
  layoutConfig = {},
  onEnter 
}) {
  const [countdown, setCountdown] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Extract data
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

  // Extract config
  const {
    font = 'Cormorant Garamond',
    primaryColor = '#3b82f6',
    secondaryColor = '#8b5cf6',
    welcomeMessage = 'Together Forever',
    description = '',
    couplePhoto = null,
    preciousMoments = [],
    studioDetails = {},
    heroBackground = null,
    liveBackground = null,
    preWeddingVideo = null,
    borders = {},
    borderMasks = {},
    templateVideoWeddingId = null,
    hasTemplateVideo = false,
  } = layoutConfig;

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!event_date) return;
    const updateCountdown = () => {
      try {
        const eventDateTime = parseISO(event_date);
        if (!isValid(eventDateTime)) {
          console.error('Invalid event date:', event_date);
          return;
        }
        const now = new Date();
        const diff = eventDateTime - now;
        
        if (diff > 0) {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          });
        } else {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } catch (error) {
        console.error(error);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event_date]);

  // Dynamic Styles
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Hex to RGBA helper
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const primaryLight = hexToRgba(primaryColor, 0.1);
  const secondaryLight = hexToRgba(secondaryColor, 0.1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  if (!isMounted) return null;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full overflow-x-hidden selection:bg-black/10"
      style={{ 
        fontFamily: font,
        color: '#1a1a1a',
        backgroundColor: '#fafafa'
      }}
    >
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          {heroBackground ? (
            <>
              <motion.div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroBackground})` }}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
              />
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/40 to-[#fafafa]" />
            </>
          ) : (
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${primaryLight} 0%, transparent 70%), radial-gradient(circle at 80% 20%, ${secondaryLight} 0%, transparent 50%)`
              }}
            />
          )}
        </div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Top Decoration */}
          <motion.div variants={itemVariants} className="mb-8">
            <Sparkles className="w-8 h-8 opacity-60" style={{ color: secondaryColor }} />
          </motion.div>

          {/* Couple Names */}
          <motion.h1 
            variants={itemVariants}
            className="text-center text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] mb-8 sm:mb-12 relative"
            style={{ color: primaryColor }}
          >
            <span className="block">{bride_names}</span>
            <span 
              className="block text-3xl sm:text-5xl md:text-6xl font-light italic my-2 sm:my-4"
              style={{ color: secondaryColor, fontFamily: font }}
            >
              &
            </span>
            <span className="block">{groom_names}</span>
          </motion.h1>

          {/* Welcome Message */}
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-2xl tracking-wide uppercase font-light text-center mb-12 max-w-md mx-auto"
            style={{ color: '#4a4a4a' }}
          >
            {welcomeMessage}
          </motion.p>

          {/* Main Photo - The "Center Focus" OR Video Template */}
          <motion.div 
            variants={itemVariants}
            className="relative w-full max-w-sm sm:max-w-md md:max-w-xl aspect-[4/5] mx-auto z-20"
            whileHover={{ scale: 1.02, rotate: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            {hasTemplateVideo && templateVideoWeddingId ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <TemplateVideoPlayer 
                  weddingId={templateVideoWeddingId}
                  className="w-full h-full"
                />
              </div>
            ) : couplePhoto?.url ? (
              <div className="relative w-full h-full drop-shadow-2xl">
                <PhotoFrame
                  src={couplePhoto.url}
                  alt={`${bride_names} & ${groom_names}`}
                  maskUrl={borders?.couple}
                  maskData={borderMasks?.couple}
                  aspectRatio="4:5"
                  className="w-full h-full object-cover rounded-sm"
                />
              </div>
            ) : (
              <div 
                className="w-full h-full bg-white flex items-center justify-center rounded-t-full border border-gray-100 shadow-xl"
                style={{ background: `linear-gradient(135deg, ${primaryLight}, ${secondaryLight})` }}
              >
                <Heart className="w-32 h-32 opacity-20" style={{ color: primaryColor }} />
              </div>
            )}
            
            {/* Floating Badges */}
            <motion.div 
              className="absolute -right-4 top-10 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/50 hidden sm:block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-sm font-semibold tracking-wider" style={{ color: primaryColor }}>
                SAVE THE DATE
              </span>
            </motion.div>
          </motion.div>

          {/* Info Card Strip */}
          <motion.div 
            variants={itemVariants}
            className="mt-12 w-full max-w-3xl mx-auto"
          >
             <div 
               className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl sm:rounded-full p-6 shadow-xl flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-4"
             >
                {event_date && (() => {
                  try {
                    const parsedDate = parseISO(event_date);
                    if (!isValid(parsedDate)) return null;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-white shadow-sm">
                          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <span className="text-lg font-medium">
                          {format(parsedDate, 'MMMM do, yyyy')}
                        </span>
                      </div>
                    );
                  } catch (e) {
                    console.error('Invalid date:', event_date, e);
                    return null;
                  }
                })()}
                
                <div className="hidden sm:block w-px h-10 bg-gray-300" />
                
                {event_time && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white shadow-sm">
                      <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-lg font-medium">{event_time}</span>
                  </div>
                )}
                
                <div className="hidden sm:block w-px h-10 bg-gray-300" />
                
                {venue && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white shadow-sm">
                      <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <span className="text-lg font-medium truncate max-w-[200px]">{venue}</span>
                  </div>
                )}
             </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 opacity-40" />
        </motion.div>
      </section>

      {/* --- COUNTDOWN SECTION --- */}
      {countdown && (
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                Counting Down
              </h2>
              <div className="h-1 w-24 mx-auto rounded-full" style={{ background: primaryColor }} />
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  <div 
                    className="aspect-square rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:-translate-y-2"
                    style={{ 
                      background: 'white',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                       style={{ background: `linear-gradient(135deg, ${primaryLight}, transparent)` }} 
                    />
                    
                    {/* Ring Decoration */}
                    <svg className="absolute inset-0 w-full h-full p-2 rotate-[-90deg]">
                      <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#f3f4f6" strokeWidth="2" />
                      <circle 
                        cx="50%" cy="50%" r="45%" 
                        fill="none" 
                        stroke={primaryColor} 
                        strokeWidth="2" 
                        strokeDasharray="100 200"
                        className="opacity-30"
                      />
                    </svg>

                    <span 
                      className="text-5xl sm:text-6xl md:text-7xl font-bold tabular-nums relative z-10"
                      style={{ color: primaryColor }}
                    >
                      {item.value}
                    </span>
                    <span 
                      className="text-sm sm:text-base uppercase tracking-widest font-medium mt-2 text-gray-400"
                    >
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- LOVE STORY VIDEO --- */}
      {preWeddingVideo && (
        <section className="py-24 px-4 bg-[#111] text-white relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <span className="text-sm uppercase tracking-[0.3em] opacity-60">The Motion Picture</span>
              <h2 className="text-4xl sm:text-6xl font-serif mt-4">Our Love Story</h2>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-video w-full rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <iframe
                src={preWeddingVideo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* --- GALLERY SECTION --- */}
      {preciousMoments?.length > 0 && (
        <section 
          className="py-32 px-4 overflow-hidden"
          style={{ 
            background: `linear-gradient(to bottom, #fafafa, ${secondaryLight} 50%, #fafafa)` 
          }}
        >
          <div className="max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row items-end justify-between mb-16 px-4">
                <div className="max-w-xl">
                  <h2 className="text-5xl sm:text-7xl font-bold leading-tight" style={{ color: primaryColor }}>
                    Captured<br/>Moments
                  </h2>
                  <div className="h-1 w-32 mt-6 rounded-full" style={{ background: secondaryColor }} />
                </div>
                <p className="mt-8 md:mt-0 max-w-sm text-gray-500 text-lg">
                  A collection of our favorite memories leading up to this special day.
                </p>
             </div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              {/* Using the BorderedPhotoGallery but in a cleaner container */}
              <div className="p-4 bg-white/50 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60">
                <BorderedPhotoGallery
                  photos={preciousMoments.map(photo => ({
                    ...photo,
                    border_url: borders?.preciousMoments || null
                  }))}
                  layout="masonry"
                  primaryColor={primaryColor}
                />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* --- DESCRIPTION --- */}
      {description && (
        <section className="py-24 px-6 flex items-center justify-center">
          <div className="max-w-3xl text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-8 opacity-50" style={{ color: secondaryColor }} />
            <p className="text-xl sm:text-3xl leading-relaxed font-light text-gray-700">
              "{description}"
            </p>
            <div className="mt-8 w-16 h-px bg-gray-300 mx-auto" />
          </div>
        </section>
      )}

      {/* --- LIVE STREAM SECTION --- */}
      {(playback_url || recording_url) && (
        <section className="relative py-32 px-4 text-white">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
            style={liveBackground ? {
              backgroundImage: `url(${liveBackground})`,
            } : {
              background: '#000',
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-8">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium tracking-wide">VIRTUAL ATTENDANCE</span>
                </div>
                
                <h2 className="text-4xl sm:text-6xl font-bold mb-6">
                  Join Us <br/>
                  <span style={{ color: primaryColor }}>Live</span>
                </h2>
                <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                  Distance implies so little when someone means so much. 
                  Be part of our celebration from wherever you are.
                </p>

                {onEnter && (
                  <button
                    onClick={onEnter}
                    className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-full overflow-hidden transition-transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative flex items-center gap-3">
                      Enter Live Event <Play className="w-5 h-5 fill-current" />
                    </span>
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-2">
                   {!onEnter && playback_url && (
                      <video
                        src={playback_url}
                        controls
                        className="w-full h-full rounded-xl bg-black"
                      />
                   )}
                   {onEnter && (
                     <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl">
                       <Play className="w-20 h-20 opacity-50" />
                     </div>
                   )}
                </div>
                {/* Decorative glow */}
                <div 
                  className="absolute -inset-10 -z-10 opacity-30 blur-3xl rounded-full"
                  style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- STUDIO PARTNER --- */}
      {studioDetails?.default_image_url && (
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-10">Memories Captured By</h3>
            
            <div className="flex flex-col items-center gap-8">
              <img
                src={studioDetails.default_image_url}
                alt={studioDetails.name || "Studio partner"}
                className="w-full max-w-sm rounded-lg object-cover grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100"
              />

              {studioDetails.show_details && (
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                  {studioDetails.website && (
                    <a 
                      href={studioDetails.website}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-black transition-colors flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" /> Website
                    </a>
                  )}
                  {studioDetails.email && (
                    <a href={`mailto:${studioDetails.email}`} className="hover:text-black transition-colors flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                  {studioDetails.phone && (
                    <a href={`tel:${studioDetails.phone}`} className="hover:text-black transition-colors flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Footer Decoration */}
      <footer className="py-8 text-center">
        <Heart className="w-4 h-4 mx-auto text-gray-300" />
      </footer>
    </div>
  );
}
