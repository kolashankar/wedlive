'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Heart, Play, Phone, Mail, MapPinned, Sparkles, Music, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';

export default function ModernMinimalist({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  const themeAssets = theme.theme_assets || {};
  
  // Get dynamic theme assets - these should be populated with actual URLs from the selected assets
  const brideBorderUrl = themeAssets.bride_border_url || '';
  const groomBorderUrl = themeAssets.groom_border_url || '';
  const coupleStyleUrl = themeAssets.couple_style_url || '';
  const backgroundUrl = themeAssets.background_url || '';
  
  // Debug: Log the theme assets structure
  console.log('ModernMinimalist - wedding:', wedding);
  console.log('ModernMinimalist - theme:', theme);
  console.log('ModernMinimalist - themeAssets:', themeAssets);
  
  const FONT_FAMILY_MAP = {
    'Inter': 'Inter, sans-serif',
    'Great Vibes': "'Great Vibes', cursive",
    'Playfair Display': "'Playfair Display', serif",
    'Cinzel': "'Cinzel', serif",
    'Montserrat': "'Montserrat', sans-serif",
    'Lato': "'Lato', sans-serif",
    'Caveat': "'Caveat', cursive",
    'Bebas Neue': "'Bebas Neue', cursive",
    'Rozha One': "'Rozha One', serif",
    'Pinyon Script': "'Pinyon Script', cursive"
  };
  
  const customFontName = theme.custom_font || 'Inter';
  const customFont = FONT_FAMILY_MAP[customFontName] || 'Inter, sans-serif';
  const primaryColor = theme.primary_color || '#000000';
  const secondaryColor = theme.secondary_color || '#e5e5e5';
  const welcomeText = theme.custom_messages?.welcome_text || 'Welcome';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Enhanced floating petals for elegant minimalist feel
  const petals = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
    size: 3 + Math.random() * 5
  }));

  // Floral SVG corner decoration component
  const FloralCorner = ({ className, rotation }) => (
    <svg
      className={`absolute ${className} pointer-events-none`}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      style={{ transform: `rotate(${rotation}deg)`, opacity: 0.6 }}
    >
      <g fill={primaryColor} opacity="0.2">
        {/* Elegant leaf pattern */}
        <ellipse cx="30" cy="30" rx="25" ry="15" transform="rotate(-45 30 30)" />
        <ellipse cx="50" cy="20" rx="20" ry="12" transform="rotate(-30 50 20)" />
        <ellipse cx="20" cy="50" rx="20" ry="12" transform="rotate(-60 20 50)" />
        <ellipse cx="40" cy="40" rx="18" ry="10" transform="rotate(-50 40 40)" />
        {/* Small accent flowers */}
        <circle cx="25" cy="25" r="3" opacity="0.8" />
        <circle cx="35" cy="30" r="2.5" opacity="0.6" />
        <circle cx="30" cy="35" r="2" opacity="0.7" />
      </g>
      {/* Delicate stems */}
      <path
        d="M 10,10 Q 25,20 40,40"
        stroke={primaryColor}
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Enhanced modern gradient background with subtle texture */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-50/30 via-transparent to-purple-50/30" />
        {/* Subtle noise texture for depth */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
      </div>
      
      {/* Refined floating petals animation - more subtle */}
      {petals.slice(0, 25).map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: `${petal.x}%`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            background: petal.id % 3 === 0 ? 'linear-gradient(135deg, #fce7f3, #e9d5ff)' : petal.id % 3 === 1 ? 'linear-gradient(135deg, #f3e8ff, #fce7f3)' : 'linear-gradient(135deg, #fae8ff, #fbcfe8)',
            opacity: 0.3,
          }}
          initial={{ y: -20, rotate: 0 }}
          animate={{
            y: '110vh',
            rotate: 360,
            x: [0, 20, -20, 0],
          }}
          transition={{
            duration: petal.duration + 5,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Modern thin accent line - top */}
      <div className="absolute top-0 left-0 right-0 h-[2px]">
        <div className="h-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60" />
      </div>

      {/* Enhanced Sticky Watch Live Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="sticky top-6 right-0 z-50 flex justify-end px-6 md:px-12 py-4"
      >
        <motion.button
          onClick={onEnter}
          className="group relative px-6 py-2.5 md:px-8 md:py-3 text-xs md:text-sm font-semibold tracking-wider rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 uppercase overflow-hidden"
          style={{
            backgroundColor: `${primaryColor}`,
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          />
          <span className="relative flex items-center gap-2">
            <Play className="w-3.5 h-3.5 md:w-4 md:h-4" fill="white" />
            <span className="hidden sm:inline">Watch Live</span>
            <span className="sm:hidden">Live</span>
          </span>
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        {/* Welcome with refined entry animation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20 sm:mb-28"
        >
          <motion.div
            className="inline-block mb-6 sm:mb-8"
            animate={{ 
              scale: [1, 1.08, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 opacity-40" style={{ color: primaryColor }} />
          </motion.div>
          <motion.p 
            className="text-xs sm:text-sm uppercase tracking-[0.35em] sm:tracking-[0.45em] font-medium"
            style={{ color: primaryColor, opacity: 0.5 }}
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            animate={{ opacity: 0.5, letterSpacing: '0.45em' }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            {welcomeText}
          </motion.p>
        </motion.div>

        {/* Couple Names - Modern Refined Typography */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24 sm:mb-32 relative"
        >
          {/* Decorative element behind names */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full opacity-5" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
          </div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-extralight tracking-tighter mb-8 sm:mb-10"
            style={{
              fontFamily: `${customFont}, sans-serif`,
              color: primaryColor,
              lineHeight: '1.1',
            }}
          >
            {wedding.bride_name}
          </motion.h1>
          
          {/* Refined separator with elegant heart */}
          <motion.div 
            className="flex items-center justify-center gap-5 sm:gap-8 my-10 sm:my-14"
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              className="h-[1px] w-20 sm:w-28"
              style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)`, opacity: 0.3 }}
              animate={{ scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="relative"
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: primaryColor }} fill={primaryColor} />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 blur-md opacity-30" style={{ backgroundColor: primaryColor }} />
            </motion.div>
            <motion.div 
              className="h-[1px] w-20 sm:w-28"
              style={{ background: `linear-gradient(to left, transparent, ${primaryColor}, transparent)`, opacity: 0.3 }}
              animate={{ scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-extralight tracking-tighter"
            style={{
              fontFamily: `${customFont}, sans-serif`,
              color: primaryColor,
              lineHeight: '1.1',
            }}
          >
            {wedding.groom_name}
          </motion.h1>
        </motion.div>

        {/* Featured Photo - Modern Full Width Hero */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-24 sm:mb-32"
          >
            <div className="relative max-w-6xl mx-auto group">
              {/* Refined shadow effect */}
              <motion.div 
                className="absolute -inset-8 rounded-3xl opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-40"
                style={{ background: `radial-gradient(circle, ${primaryColor}15, transparent 70%)` }}
              />
              
              <div className="relative h-[55vh] sm:h-[65vh] lg:h-[80vh] overflow-hidden rounded-xl sm:rounded-2xl">
                <motion.img
                  src={coverPhotos[0]?.url || coverPhotos[0]}
                  alt="Couple"
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.95) contrast(1.02)' }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                
                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-transparent" />
                
                {/* Modern corner frame elements */}
                <FloralCorner className="top-3 left-3 sm:top-6 sm:left-6" rotation={0} />
                <FloralCorner className="top-3 right-3 sm:top-6 sm:right-6" rotation={90} />
                <FloralCorner className="bottom-3 left-3 sm:bottom-6 sm:left-6" rotation={270} />
                <FloralCorner className="bottom-3 right-3 sm:bottom-6 sm:right-6" rotation={180} />
                
                {/* Refined minimalist corner brackets */}
                <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-l border-t opacity-20" style={{ borderColor: primaryColor }} />
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 border-r border-t opacity-20" style={{ borderColor: primaryColor }} />
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-l border-b opacity-20" style={{ borderColor: primaryColor }} />
                <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-20 sm:h-20 border-r border-b opacity-20" style={{ borderColor: primaryColor }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Wedding Details - Clean Grid Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 mb-20 sm:mb-28 max-w-5xl mx-auto"
        >
          <motion.div 
            className="text-center space-y-3"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Calendar className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-4 opacity-70" style={{ color: primaryColor }} />
            </motion.div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light">Date</p>
            <p className="text-base sm:text-lg font-light" style={{ color: primaryColor }}>
              {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMMM d, yyyy') : 'TBD'}
            </p>
          </motion.div>
          
          <motion.div 
            className="text-center space-y-3"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Calendar className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-4 opacity-70" style={{ color: primaryColor }} />
            </motion.div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light">Time</p>
            <p className="text-base sm:text-lg font-light" style={{ color: primaryColor }}>
              {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'TBD'}
            </p>
          </motion.div>
          
          {wedding.location && (
            <motion.div 
              className="text-center space-y-3 sm:col-span-2 md:col-span-1"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <MapPin className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-4 opacity-70" style={{ color: primaryColor }} />
              </motion.div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light">Venue</p>
              <p className="text-base sm:text-lg font-light" style={{ color: primaryColor }}>{wedding.location}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Description - Clean Typography */}
        {description && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.9 }}
            className="max-w-3xl mx-auto mb-20 sm:mb-28 text-center px-4"
          >
            <p className="text-gray-600 text-base sm:text-lg font-light leading-relaxed">
              {description}
            </p>
          </motion.div>
        )}

        {/* Pre-Wedding Video - Minimalist Player */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.2 }}
            className="mb-20 sm:mb-28"
          >
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <ReactPlayer
                  url={preWeddingVideo}
                  width="100%"
                  height="600px"
                  controls
                  light
                  playIcon={
                    <motion.button 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-2xl"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" style={{ color: primaryColor }} fill={primaryColor} />
                    </motion.button>
                  }
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Photo Gallery - Clean Masonry Grid with Floral Frames */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.5 }}
            className="mb-20 sm:mb-28"
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-light text-center mb-12 sm:mb-16 tracking-tight"
              style={{ fontFamily: `${customFont}, sans-serif`, color: primaryColor }}
            >
              Our Moments
            </motion.h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 2.7 + idx * 0.1 }}
                  whileHover={{ scale: 0.98, y: -5 }}
                  className="aspect-square overflow-hidden bg-gray-50 rounded-lg relative group"
                >
                  <img
                    src={photo?.url || photo}
                    alt={`Photo ${idx + 2}`}
                    className="w-full h-full object-cover"
                    style={{ filter: 'saturate(0.9)' }}
                  />
                  {/* Floral overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FloralCorner className="top-1 left-1" rotation={0} />
                    <FloralCorner className="top-1 right-1" rotation={90} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Studio Section - Minimalist Presentation */}
        {studioDetails && (studioDetails.name || studioDetails.logo_url) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3 }}
            className="mb-20 sm:mb-28"
          >
            <div className="max-w-4xl mx-auto text-center p-12 sm:p-16 rounded-3xl" style={{ background: 'linear-gradient(135deg, #fafafa, #f5f5f5)' }}>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-light mb-6 sm:mb-8">Presented by</p>
              
              {studioDetails.logo_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 3.3 }}
                  className="mb-6 sm:mb-8"
                >
                  <img 
                    src={studioDetails.logo_url} 
                    alt="Studio Logo" 
                    className="h-12 sm:h-16 mx-auto object-contain opacity-80 grayscale hover:grayscale-0 transition-all duration-500" 
                  />
                </motion.div>
              )}
              
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 3.5 }}
                className="text-2xl sm:text-3xl font-light tracking-wide mb-4 sm:mb-6"
                style={{ fontFamily: `${customFont}, sans-serif`, color: primaryColor }}
              >
                {studioDetails.name || 'Studio'}
              </motion.h3>
              
              {(studioDetails.contact || studioDetails.email || studioDetails.phone || studioDetails.website) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 3.7 }}
                  className="space-y-2 text-gray-500 text-sm"
                >
                  {studioDetails.contact && <p>{studioDetails.contact}</p>}
                  {studioDetails.email && <p>{studioDetails.email}</p>}
                  {studioDetails.phone && <p>{studioDetails.phone}</p>}
                  {studioDetails.website && <p>{studioDetails.website}</p>}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Watch Live CTA - Elegant Button (Natural scroll position) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex justify-center mb-20 sm:mb-28"
        >
          <motion.button
            onClick={onEnter}
            className="group px-12 sm:px-16 py-5 sm:py-6 text-sm sm:text-base uppercase tracking-[0.2em] sm:tracking-[0.3em] rounded-full border-2 transition-all duration-500"
            style={{
              backgroundColor: primaryColor,
              color: 'white',
              borderColor: primaryColor,
              fontFamily: `${customFont}, sans-serif`,
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline">Watch Live Wedding</span>
              <span className="sm:hidden">Watch Live</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.span>
            </span>
          </motion.button>
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 4 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" style={{ color: primaryColor }} />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom elegant line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}