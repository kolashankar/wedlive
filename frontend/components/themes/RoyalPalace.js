'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Phone, Mail, MapPinned, Sparkles, Crown, Star } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';

export default function RoyalPalace({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  const themeAssets = theme.theme_assets || {};
  
  // Get dynamic theme assets
  const brideBorderUrl = themeAssets.bride_border_url || '';
  const groomBorderUrl = themeAssets.groom_border_url || '';
  const coupleStyleUrl = themeAssets.couple_style_url || '';
  const backgroundUrl = themeAssets.background_url || '';
  
  // Debug: Log the theme assets structure
  console.log('RoyalPalace - themeAssets:', themeAssets);
  
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
  
  const customFontName = theme.custom_font || 'Cinzel';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Cinzel', serif";
  const primaryColor = theme.primary_color || '#dc2626';
  const secondaryColor = theme.secondary_color || '#fde68a';
  const welcomeText = theme.custom_messages?.welcome_text || 'Welcome to our Royal Wedding';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  
  // Enhanced Cover Photos with Categories
  const groomPhoto = coverPhotos.find(photo => photo.category === 'groom') || (coverPhotos[1]?.url ? coverPhotos[1] : null);
  const bridePhoto = coverPhotos.find(photo => photo.category === 'bride') || (coverPhotos[0]?.url ? coverPhotos[0] : null);
  const couplePhoto = coverPhotos.find(photo => photo.category === 'couple') || (coverPhotos[2]?.url ? coverPhotos[2] : null);
  const preciousMoments = coverPhotos.filter(photo => photo.category === 'moment') || coverPhotos.slice(3, 8).filter(photo => photo?.url);
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Enhanced floating sparkles
  const sparkles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
  }));

  // Royal Ornamental Border SVG Component
  const RoyalBorder = ({ className = "", style = {} }) => (
    <svg className={`absolute ${className}`} style={style} viewBox="0 0 200 200" preserveAspectRatio="none">
      {/* Palace architectural curves */}
      <path
        d="M10,10 L50,10 L50,50 Q50,70 70,70 L130,70 Q150,70 150,50 L150,10 L190,10"
        stroke={secondaryColor}
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />
      {/* Crown ornaments */}
      <g transform="translate(30, 20)">
        <path d="M0,0 L5,15 L10,5 L15,15 L20,0" fill={secondaryColor} opacity="0.9" />
        <circle cx="10" cy="0" r="3" fill={secondaryColor} />
      </g>
      <g transform="translate(150, 20)">
        <path d="M0,0 L5,15 L10,5 L15,15 L20,0" fill={secondaryColor} opacity="0.9" />
        <circle cx="10" cy="0" r="3" fill={secondaryColor} />
      </g>
      {/* Jewels/diamonds */}
      <polygon points="100,40 105,50 100,60 95,50" fill="#ef4444" opacity="0.8" />
      <circle cx="60" cy="45" r="4" fill={secondaryColor} opacity="0.9" />
      <circle cx="140" cy="45" r="4" fill={secondaryColor} opacity="0.9" />
    </svg>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)' }}>
      {/* Enhanced Royal Background with Velvet Texture */}
      <div className="fixed inset-0 opacity-20" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23fbbf24" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '60px 60px'
      }} />
      
      {/* Palace ornamental patterns overlay */}
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, ${secondaryColor} 1px, transparent 1px), radial-gradient(circle at 80% 50%, ${secondaryColor} 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Royal gold ornamental borders */}
      <div className="fixed top-0 left-0 w-full h-32 opacity-60 pointer-events-none z-40">
        <svg viewBox="0 0 1920 128" className="w-full h-full" preserveAspectRatio="none">
          <rect x="0" y="0" width="1920" height="6" fill={secondaryColor} />
          <rect x="0" y="12" width="1920" height="3" fill={secondaryColor} opacity="0.6" />
          <rect x="0" y="20" width="1920" height="2" fill={secondaryColor} opacity="0.4" />
          {/* Ornamental pattern */}
          {Array.from({ length: 20 }, (_, i) => (
            <g key={i} transform={`translate(${i * 96}, 0)`}>
              <circle cx="48" cy="40" r="4" fill={secondaryColor} />
              <circle cx="36" cy="50" r="3" fill={secondaryColor} opacity="0.7" />
              <circle cx="60" cy="50" r="3" fill={secondaryColor} opacity="0.7" />
            </g>
          ))}
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-32 opacity-60 pointer-events-none z-40 transform rotate-180">
        <svg viewBox="0 0 1920 128" className="w-full h-full" preserveAspectRatio="none">
          <rect x="0" y="0" width="1920" height="6" fill={secondaryColor} />
          <rect x="0" y="12" width="1920" height="3" fill={secondaryColor} opacity="0.6" />
          <rect x="0" y="20" width="1920" height="2" fill={secondaryColor} opacity="0.4" />
          {Array.from({ length: 20 }, (_, i) => (
            <g key={i} transform={`translate(${i * 96}, 0)`}>
              <circle cx="48" cy="40" r="4" fill={secondaryColor} />
              <circle cx="36" cy="50" r="3" fill={secondaryColor} opacity="0.7" />
              <circle cx="60" cy="50" r="3" fill={secondaryColor} opacity="0.7" />
            </g>
          ))}
        </svg>
      </div>

      {/* Enhanced sparkle animations */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-5 h-5" style={{ color: secondaryColor }} />
        </motion.div>
      ))}

      {/* Main Content - Scrollable */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-40 pb-20">
        
        {/* Watch Live Button - SCROLLS WITH CONTENT (Not Fixed) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute top-8 right-8 z-30"
        >
          <motion.button
            onClick={onEnter}
            className="px-10 py-4 text-base font-bold rounded-full shadow-2xl border-3 transition-all duration-300"
            style={{
              backgroundColor: secondaryColor,
              color: primaryColor,
              borderColor: secondaryColor,
              boxShadow: `0 10px 40px ${secondaryColor}60`
            }}
            whileHover={{ scale: 1.1, boxShadow: `0 15px 50px ${secondaryColor}` }}
            whileTap={{ scale: 0.95 }}
            data-testid="watch-wedding-button"
          >
            <Crown className="w-5 h-5 mr-2 inline" />
            Watch Live
          </motion.button>
        </motion.div>

        {/* Crown & Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ 
              rotate: [0, -8, 8, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-block mb-6 relative"
          >
            <div className="absolute inset-0 blur-2xl opacity-60" style={{ background: secondaryColor }} />
            <Crown className="relative w-20 h-20 mx-auto" style={{ color: secondaryColor }} fill={secondaryColor} />
          </motion.div>
          <p className="text-yellow-100 text-2xl font-light tracking-widest uppercase">
            {welcomeText}
          </p>
        </motion.div>

        {/* Couple Names with Royal Typography */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="text-center mb-20"
        >
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-7xl md:text-9xl mb-8 tracking-wide"
            style={{
              fontFamily: `${customFont}, serif`,
              color: secondaryColor,
              textShadow: `4px 4px 8px rgba(0,0,0,0.6), 0 0 30px ${secondaryColor}40`,
            }}
          >
            {wedding.bride_name}
          </motion.h1>
          
          {/* Enhanced Royal Separator */}
          <motion.div 
            className="flex items-center justify-center gap-6 my-10"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <motion.div 
              className="h-1 w-28 rounded-full"
              style={{ background: `linear-gradient(to right, transparent, ${secondaryColor})` }}
              animate={{ scaleX: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.3, 1] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <Crown className="w-8 h-8" style={{ color: secondaryColor }} fill={secondaryColor} />
            </motion.div>
            <motion.div 
              className="h-1 w-28 rounded-full"
              style={{ background: `linear-gradient(to left, transparent, ${secondaryColor})` }}
              animate={{ scaleX: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-7xl md:text-9xl tracking-wide"
            style={{
              fontFamily: `${customFont}, serif`,
              color: secondaryColor,
              textShadow: `4px 4px 8px rgba(0,0,0,0.6), 0 0 30px ${secondaryColor}40`,
            }}
          >
            {wedding.groom_name}
          </motion.h1>
        </motion.div>

        {/* Bride & Groom Photos with ORNAMENTAL BORDERS */}
        {(bridePhoto || groomPhoto) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mb-20 flex justify-center gap-12"
          >
            {/* Bride Photo */}
            {bridePhoto && (
              <div className="relative" data-testid="bride-photo">
                <div className="absolute -inset-4 opacity-50 blur-2xl" style={{ background: `radial-gradient(circle, ${secondaryColor}, transparent)` }} />
                
                {/* Ornamental frame with multiple borders */}
                <div className="relative">
                  {/* Royal Border Overlay */}
                  <RoyalBorder className="top-0 left-0 w-40 h-40" style={{ opacity: 0.9 }} />
                  <RoyalBorder className="bottom-0 right-0 w-40 h-40 transform scale-[-1]" style={{ opacity: 0.9 }} />
                  
                  <div
                    className="relative overflow-hidden"
                    style={{ 
                      border: `6px solid ${secondaryColor}`,
                      boxShadow: `0 20px 60px ${secondaryColor}40, inset 0 0 40px rgba(0,0,0,0.3)`,
                    }}
                  >
                    <img
                      src={bridePhoto.url || bridePhoto}
                      alt="Royal Bride"
                      className="w-64 h-80 object-cover"
                      style={{ filter: 'contrast(1.1) saturate(1.1)' }}
                    />
                    
                    {/* Royal overlay with ornamental corners */}
                    <div className="absolute top-0 left-0 w-20 h-20">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="absolute top-0 right-0 w-20 h-20 transform scale-x-[-1]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 transform scale-y-[-1]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 transform scale-[-1]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="text-center mt-4 text-yellow-100 text-lg tracking-wide" style={{ fontFamily: customFont }}>
                    Bride
                  </p>
                </div>
              </div>
            )}

            {/* Groom Photo */}
            {groomPhoto && (
              <div className="relative" data-testid="groom-photo">
                <div className="absolute -inset-4 opacity-50 blur-2xl" style={{ background: `radial-gradient(circle, ${secondaryColor}, transparent)` }} />
                
                {/* Ornamental frame with multiple borders */}
                <div className="relative">
                  {/* Royal Border Overlay */}
                  <RoyalBorder className="top-0 left-0 w-40 h-40" style={{ opacity: 0.9 }} />
                  <RoyalBorder className="bottom-0 right-0 w-40 h-40 transform scale-[-1]" style={{ opacity: 0.9 }} />
                  
                  <div
                    className="relative overflow-hidden"
                    style={{ 
                      border: `6px solid ${secondaryColor}`,
                      boxShadow: `0 20px 60px ${secondaryColor}40, inset 0 0 40px rgba(0,0,0,0.3)`,
                    }}
                  >
                    <img
                      src={groomPhoto.url || groomPhoto}
                      alt="Royal Groom"
                      className="w-64 h-80 object-cover"
                      style={{ filter: 'contrast(1.1) saturate(1.1)' }}
                    />
                    
                    {/* Royal overlay with ornamental corners */}
                    <div className="absolute top-0 left-0 w-20 h-20">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="absolute top-0 right-0 w-20 h-20 transform scale-x-[-1]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 transform scale-y-[-1]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 transform scale-[-1]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                        <circle cx="15" cy="15" r="5" fill="#ef4444" opacity="0.8" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="text-center mt-4 text-yellow-100 text-lg tracking-wide" style={{ fontFamily: customFont }}>
                    Groom
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Couple Photo with ROYAL PALACE FRAME */}
        {couplePhoto && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.7 }}
            className="mb-20 flex justify-center"
            data-testid="couple-photo"
          >
            <div className="relative max-w-4xl">
              {/* Royal glow backdrop */}
              <div className="absolute -inset-12 opacity-50 blur-3xl" style={{ background: `radial-gradient(circle, ${secondaryColor}, transparent)` }} />
              
              {/* Palace-style layered frame */}
              <div className="relative">
                {/* Royal Border Overlays - All Corners */}
                <RoyalBorder className="top-0 left-0 w-48 h-48" style={{ opacity: 0.95 }} />
                <RoyalBorder className="top-0 right-0 w-48 h-48 transform scale-x-[-1]" style={{ opacity: 0.95 }} />
                <RoyalBorder className="bottom-0 left-0 w-48 h-48 transform scale-y-[-1]" style={{ opacity: 0.95 }} />
                <RoyalBorder className="bottom-0 right-0 w-48 h-48 transform scale-[-1]" style={{ opacity: 0.95 }} />
                
                <div
                  className="absolute inset-0 border-6 transform translate-x-6 translate-y-6"
                  style={{ borderColor: secondaryColor, opacity: 0.3 }}
                />
                <div
                  className="absolute inset-0 border-6 transform translate-x-3 translate-y-3"
                  style={{ borderColor: secondaryColor, opacity: 0.5 }}
                />
                <div className="relative overflow-hidden border-6" style={{ 
                  borderColor: secondaryColor, 
                  boxShadow: `0 30px 80px ${secondaryColor}40, inset 0 0 50px rgba(0,0,0,0.5)` 
                }}>
                  <img
                    src={couplePhoto.url || couplePhoto}
                    alt="Royal Couple"
                    className="w-full aspect-[4/3] object-cover relative"
                    style={{ filter: 'contrast(1.1) saturate(1.1)' }}
                  />
                  {/* Royal overlay with ornamental corners */}
                  <div className="absolute top-0 left-0 w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                      <circle cx="20" cy="20" r="8" fill="#ef4444" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 transform scale-x-[-1]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                      <circle cx="20" cy="20" r="8" fill="#ef4444" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 transform scale-y-[-1]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                      <circle cx="20" cy="20" r="8" fill="#ef4444" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 transform scale-[-1]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill={secondaryColor} opacity="0.4" />
                      <circle cx="20" cy="20" r="8" fill="#ef4444" opacity="0.8" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wedding Details - Royal Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="text-center mb-16 space-y-6 text-yellow-100"
        >
          <div className="flex items-center justify-center gap-4 text-2xl">
            <Calendar className="w-7 h-7" style={{ color: secondaryColor }} />
            <p>{wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'EEEE, MMMM d, yyyy') : 'Date TBD'}</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xl">
            <Calendar className="w-6 h-6" style={{ color: secondaryColor }} />
            <p>{wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'Time TBD'}</p>
          </div>
          {wedding.location && (
            <div className="flex items-center justify-center gap-4 text-xl">
              <MapPin className="w-6 h-6" style={{ color: secondaryColor }} />
              <p>{wedding.location}</p>
            </div>
          )}
          {description && (
            <p className="text-yellow-200 max-w-2xl mx-auto mt-10 text-xl leading-relaxed">
              {description}
            </p>
          )}
        </motion.div>

        {/* Pre-Wedding Video - Royal Frame */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.1 }}
            className="mb-20"
          >
            <motion.h2
              className="text-5xl text-center mb-12"
              style={{ fontFamily: `${customFont}, serif`, color: secondaryColor }}
            >
              ✦ Royal Love Story ✦
            </motion.h2>
            <div className="max-w-4xl mx-auto border-8 rounded-lg overflow-hidden" style={{ borderColor: secondaryColor, boxShadow: `0 30px 80px ${secondaryColor}40` }}>
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="550px"
                controls
                light
                playIcon={
                  <motion.button 
                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ backgroundColor: secondaryColor }}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Play className="w-12 h-12 ml-1" style={{ color: primaryColor }} fill={primaryColor} />
                  </motion.button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* Photo Gallery - Royal Collection with ORNAMENTAL BORDERS */}
        {preciousMoments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.4 }}
            className="mb-20"
            data-testid="precious-moments"
          >
            <h2
              className="text-6xl text-center mb-16"
              style={{ fontFamily: `${customFont}, serif`, color: secondaryColor }}
            >
              ✦ Royal Gallery ✦
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {preciousMoments.slice(0, 6).map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 2.6 + idx * 0.15 }}
                  whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
                  className="relative group"
                >
                  {/* Layered frame effect */}
                  <div
                    className="absolute inset-0 border-4 transform translate-x-4 translate-y-4"
                    style={{ borderColor: secondaryColor, opacity: 0.4 }}
                  />
                  <div className="relative border-4 overflow-hidden" style={{ 
                    borderColor: secondaryColor,
                    boxShadow: `0 15px 40px ${secondaryColor}30`,
                  }}>
                    {/* Ornamental border overlay on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                      <RoyalBorder className="top-0 left-0 w-24 h-24" style={{ opacity: 0.9 }} />
                      <RoyalBorder className="bottom-0 right-0 w-24 h-24 transform scale-[-1]" style={{ opacity: 0.9 }} />
                    </div>
                    
                    <img
                      src={photo?.url || photo}
                      alt={`Royal Photo ${idx + 1}`}
                      className="w-full aspect-[4/3] object-cover"
                      style={{ filter: 'contrast(1.1) saturate(1.1)' }}
                    />
                    
                    {/* Corner jewels */}
                    <div className="absolute top-2 left-2">
                      <Crown className="w-6 h-6" style={{ color: secondaryColor }} opacity="0.8" />
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Sparkles className="w-6 h-6" style={{ color: secondaryColor }} opacity="0.8" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Studio Section - Royal Presentation */}
        {studioDetails && (studioDetails.name || studioDetails.logo_url) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3 }}
            className="mb-20"
          >
            <div className="text-center py-16 px-12 border-t-4 border-b-4 rounded-2xl" style={{ 
              borderColor: secondaryColor, 
              background: 'linear-gradient(135deg, rgba(127,29,29,0.5), rgba(153,27,27,0.5))' 
            }}>
              <p className="text-sm text-yellow-300 mb-6 tracking-widest uppercase font-bold">✦ Presented By ✦</p>
              
              {studioDetails.logo_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 3.3 }}
                  className="mb-8"
                >
                  <img src={studioDetails.logo_url} alt="Studio Logo" className="h-16 mx-auto object-contain" />
                </motion.div>
              )}
              
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 3.5 }}
                className="text-4xl font-bold tracking-wide mb-4"
                style={{ color: secondaryColor, fontFamily: `${customFont}, serif` }}
              >
                {studioDetails.name || 'Royal Studio'}
              </motion.h3>
              
              {(studioDetails.contact || studioDetails.email || studioDetails.phone || studioDetails.website) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 3.7 }}
                  className="space-y-2 text-yellow-200 text-base"
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

        {/* Royal Watch Live Button */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.5 }}
          className="flex justify-center mb-20"
        >
          <motion.button
            onClick={onEnter}
            className="px-16 py-8 text-2xl font-bold tracking-wider uppercase shadow-2xl border-4 rounded-full"
            style={{
              backgroundColor: secondaryColor,
              color: primaryColor,
              borderColor: secondaryColor,
              fontFamily: `${customFont}, serif`,
              boxShadow: `0 20px 60px ${secondaryColor}60`
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: `0 25px 80px ${secondaryColor}`,
              rotate: [0, -2, 2, 0]
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Crown className="w-7 h-7 mr-3 inline" />
            Enter Royal Wedding
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
