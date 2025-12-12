'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Heart, Sparkles, Mail, Phone, MapPinned, Flower2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';

export default function PremiumWeddingCard({ wedding, onEnter }) {
  const [cardOpened, setCardOpened] = useState(false);
  const theme = wedding.theme_settings || {};
  const themeAssets = theme.theme_assets || {};
  
  // Get dynamic theme assets
  const brideBorderUrl = themeAssets.bride_border_url || '';
  const groomBorderUrl = themeAssets.groom_border_url || '';
  const coupleStyleUrl = themeAssets.couple_style_url || '';
  const backgroundUrl = themeAssets.background_url || '';
  
  // Debug: Log the theme assets structure
  console.log('PremiumWeddingCard - themeAssets:', themeAssets);
  
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
  
  const customFontName = theme.custom_font || 'Playfair Display';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Playfair Display', serif";
  const primaryColor = theme.primary_color || '#d4af37';
  const secondaryColor = theme.secondary_color || '#ffffff';
  const welcomeText = theme.custom_messages?.welcome_text || 'You are cordially invited';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Auto-open card after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCardOpened(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced animated glitter/sparkles
  const glitters = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
  }));

  // Floral SVG decoration component
  const FloralDecoration = ({ className, size = 80 }) => (
    <svg 
      className={`absolute ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id="goldGradient">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      {/* Central flower */}
      <circle cx="50" cy="50" r="12" fill="url(#goldGradient)" />
      {/* Petals */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 50 50)`}>
          <ellipse 
            cx="50" 
            cy="30" 
            rx="8" 
            ry="18" 
            fill="url(#goldGradient)"
          />
        </g>
      ))}
      {/* Inner petals */}
      {[30, 90, 150, 210, 270, 330].map((angle, i) => (
        <g key={`inner-${i}`} transform={`rotate(${angle} 50 50)`}>
          <ellipse 
            cx="50" 
            cy="35" 
            rx="6" 
            ry="14" 
            fill={primaryColor}
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fff 50%, #fffbf0 100%)' }}>
      {/* Animated Wedding Card Opening */}
      <AnimatePresence>
        {!cardOpened && (
          <>
            {/* Left Card Door */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: -165 }}
              exit={{ rotateY: -165 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 origin-right"
              style={{
                background: 'url("https://images.unsplash.com/photo-1676910490328-2a4d7e5e747c?w=800&h=1200&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                boxShadow: '0 50px 100px rgba(0,0,0,0.5)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-amber-50/90 flex items-center justify-center">
                <div className="text-center p-8 sm:p-12">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Heart className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto mb-6 sm:mb-8" style={{ color: primaryColor }} fill={primaryColor} />
                    <h2 className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
                      You're Invited
                    </h2>
                    <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-700">to our wedding celebration</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Right Card Door */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 165 }}
              exit={{ rotateY: 165 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 origin-left"
              style={{
                background: 'url("https://images.unsplash.com/photo-1676910490328-2a4d7e5e747c?w=800&h=1200&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                boxShadow: '0 50px 100px rgba(0,0,0,0.5)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-white/90 to-amber-50/90" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Glitter & Sparkle Effects */}
      {glitters.map((glitter) => (
        <motion.div
          key={glitter.id}
          className="absolute pointer-events-none"
          style={{ left: `${glitter.x}%`, top: `${glitter.y}%` }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: glitter.duration,
            delay: glitter.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: primaryColor }} />
        </motion.div>
      ))}

      {/* Scrollable Watch Live Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: cardOpened ? 1 : 0 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="sticky top-6 sm:top-8 right-0 z-50 flex justify-end px-4 sm:px-6 md:px-8 py-2 sm:py-4"
      >
        <motion.button
          onClick={onEnter}
          className="px-5 py-2.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-full shadow-xl border-2 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, #f4e4c1)`,
            color: '#4a3f2f',
            borderColor: primaryColor
          }}
          whileHover={{ scale: 1.1, boxShadow: `0 15px 40px ${primaryColor}60` }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="#4a3f2f" />
          <span className="hidden sm:inline">Watch Wedding</span>
          <span className="sm:hidden">Watch</span>
        </motion.button>
      </motion.div>

      {/* Main Content - Card Interior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: cardOpened ? 1 : 0 }}
        transition={{ duration: 1, delay: 2 }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20"
      >
        {/* Wedding Invitation Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-4 sm:mb-6" style={{ color: primaryColor }} fill={primaryColor} />
          </motion.div>
          <p className="text-base sm:text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6" style={{ color: primaryColor }}>
            {welcomeText}
          </p>
        </motion.div>

        {/* Couple Names - Elegant Card Style with Enhanced Floral Borders */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 2.8 }}
          className="mb-16 sm:mb-20"
        >
          <div className="relative p-10 sm:p-12 md:p-16 rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #ffffff, #fef3c7)' }}>
            {/* Enhanced Ornamental corners with floral SVG */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20 border-l-4 border-t-4 rounded-tl-3xl" style={{ borderColor: primaryColor }} />
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 border-r-4 border-t-4 rounded-tr-3xl" style={{ borderColor: primaryColor }} />
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20 border-l-4 border-b-4 rounded-bl-3xl" style={{ borderColor: primaryColor }} />
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 border-r-4 border-b-4 rounded-br-3xl" style={{ borderColor: primaryColor }} />
            
            {/* Floral decorations in corners */}
            <FloralDecoration className="top-0 left-0" size={60} />
            <FloralDecoration className="top-0 right-0 transform scale-x-[-1]" size={60} />
            <FloralDecoration className="bottom-0 left-0 transform scale-y-[-1]" size={60} />
            <FloralDecoration className="bottom-0 right-0 transform scale-[-1]" size={60} />
            
            <div className="text-center space-y-6 sm:space-y-8">
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light"
                style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}
              >
                {wedding.bride_name}
              </motion.h1>
              
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="flex justify-center"
              >
                <Heart className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: primaryColor }} fill={primaryColor} />
              </motion.div>
              
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light"
                style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}
              >
                {wedding.groom_name}
              </motion.h1>
            </div>
          </div>
        </motion.div>

        {/* Wedding Details in Card Format */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.1 }}
          className="mb-16 sm:mb-20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 sm:p-8 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #ffffff, #fef3c7)' }}>
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest mb-2 text-gray-600">Date</p>
              <p className="text-base sm:text-lg font-medium" style={{ color: primaryColor }}>
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #ffffff, #fef3c7)' }}>
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest mb-2 text-gray-600">Time</p>
              <p className="text-base sm:text-lg font-medium" style={{ color: primaryColor }}>
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'TBD'}
              </p>
            </div>
            
            {wedding.location && (
              <div className="text-center p-6 sm:p-8 rounded-2xl shadow-lg sm:col-span-2 md:col-span-1" style={{ background: 'linear-gradient(135deg, #ffffff, #fef3c7)' }}>
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
                <p className="text-xs uppercase tracking-widest mb-2 text-gray-600">Venue</p>
                <p className="text-base sm:text-lg font-medium" style={{ color: primaryColor }}>{wedding.location}</p>
              </div>
            )}
          </div>
          
          {description && (
            <div className="max-w-3xl mx-auto text-center mt-8 sm:mt-12">
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">{description}</p>
            </div>
          )}
        </motion.div>

        {/* Couple Photo with Enhanced Floral Frame */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.4 }}
            className="mb-16 sm:mb-20 flex justify-center"
          >
            <div className="relative max-w-3xl w-full">
              <div className="absolute -inset-6 opacity-40 blur-2xl" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
              <div className="relative rounded-3xl overflow-hidden border-4 sm:border-6 md:border-8 shadow-2xl" style={{ borderColor: primaryColor }}>
                <img
                  src={coverPhotos[0]?.url || coverPhotos[0]}
                  alt="Couple"
                  className="w-full aspect-[16/10] object-cover"
                />
                
                {/* Enhanced Floral SVG corners on photo */}
                <div className="absolute inset-0 pointer-events-none">
                  <FloralDecoration className="top-2 left-2 sm:top-4 sm:left-4" size={80} />
                  <FloralDecoration className="top-2 right-2 sm:top-4 sm:right-4 transform scale-x-[-1]" size={80} />
                  <FloralDecoration className="bottom-2 left-2 sm:bottom-4 sm:left-4 transform scale-y-[-1]" size={80} />
                  <FloralDecoration className="bottom-2 right-2 sm:bottom-4 sm:right-4 transform scale-[-1]" size={80} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pre-Wedding Video */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.7 }}
            className="mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl text-center mb-8 sm:mb-12" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
              Our Love Story
            </h2>
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 sm:border-6 md:border-8 shadow-2xl" style={{ borderColor: primaryColor }}>
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="600px"
                controls
                light
                playIcon={
                  <button className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl" style={{ background: primaryColor }}>
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-2" fill="white" />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* Photo Gallery with Floral Frames */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 4 }}
            className="mb-16 sm:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl text-center mb-8 sm:mb-12" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
              Precious Moments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 3 : -3 }}
                  className="relative aspect-square rounded-2xl overflow-hidden border-2 sm:border-4 shadow-lg group"
                  style={{ borderColor: primaryColor }}
                >
                  <img src={photo?.url || photo} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
                  {/* Floral overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <FloralDecoration className="top-1 left-1" size={50} />
                    <FloralDecoration className="top-1 right-1 transform scale-x-[-1]" size={50} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Studio Section */}
        {studioDetails && (studioDetails.name || studioDetails.logo_url) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 4.3 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center p-8 sm:p-10 md:p-12 rounded-3xl shadow-xl" style={{ background: 'linear-gradient(135deg, #ffffff, #fef3c7)' }}>
              <p className="text-xs uppercase tracking-widest mb-4 sm:mb-6 text-gray-600">Presented By</p>
              
              {studioDetails.logo_url && (
                <img src={studioDetails.logo_url} alt="Studio Logo" className="h-12 sm:h-14 md:h-16 mx-auto mb-4 sm:mb-6 object-contain" />
              )}
              
              <h3 className="text-2xl sm:text-3xl font-medium mb-4 sm:mb-6" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
                {studioDetails.name || 'Studio'}
              </h3>
              
              {(studioDetails.contact || studioDetails.email || studioDetails.phone || studioDetails.website) && (
                <div className="space-y-2 text-gray-600 text-sm sm:text-base">
                  {studioDetails.contact && <p>{studioDetails.contact}</p>}
                  {studioDetails.email && <p><Mail className="w-4 h-4 inline mr-2" />{studioDetails.email}</p>}
                  {studioDetails.phone && <p><Phone className="w-4 h-4 inline mr-2" />{studioDetails.phone}</p>}
                  {studioDetails.website && <p>{studioDetails.website}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Large CTA Button (Natural scroll position) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <motion.button
            onClick={onEnter}
            className="px-12 py-5 sm:px-16 sm:py-6 md:px-20 md:py-8 text-xl sm:text-2xl md:text-3xl font-bold rounded-full shadow-2xl border-2 sm:border-4"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, #f4e4c1)`,
              color: '#4a3f2f',
              borderColor: primaryColor,
              fontFamily: `${customFont}, serif`
            }}
            whileHover={{ scale: 1.1, boxShadow: `0 25px 60px ${primaryColor}80` }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 sm:mr-3 inline" fill="#4a3f2f" />
            <span className="hidden sm:inline">Watch Live Wedding</span>
            <span className="sm:hidden">Watch Live</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}