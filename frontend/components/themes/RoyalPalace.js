'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Crown, Play, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function RoyalPalace({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  
  // CRITICAL FIX: Map font name to actual CSS font family
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
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Floating sparkles
  const sparkles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden">
      {/* Golden ornamental borders */}
      <div className="fixed top-0 left-0 w-full h-24 opacity-50 pointer-events-none">
        <svg viewBox="0 0 1920 100" className="w-full h-full" preserveAspectRatio="none">
          <rect x="0" y="0" width="1920" height="4" fill={secondaryColor} />
          <rect x="0" y="8" width="1920" height="2" fill={secondaryColor} opacity="0.5" />
        </svg>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-24 opacity-50 pointer-events-none">
        <svg viewBox="0 0 1920 100" className="w-full h-full" preserveAspectRatio="none">
          <rect x="0" y="96" width="1920" height="4" fill={secondaryColor} />
          <rect x="0" y="90" width="1920" height="2" fill={secondaryColor} opacity="0.5" />
        </svg>
      </div>

      {/* Sparkle animations */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: secondaryColor }} />
        </motion.div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        {/* Crown & Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Crown className="w-16 h-16 mx-auto" style={{ color: secondaryColor }} fill={secondaryColor} />
          </motion.div>
          <p className="text-yellow-100 text-xl font-light tracking-widest uppercase">
            {welcomeText}
          </p>
        </motion.div>

        {/* Couple Names */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mb-16"
        >
          <h1
            className="text-6xl md:text-8xl mb-6 tracking-wide"
            style={{
              fontFamily: `${customFont}, serif`,
              color: secondaryColor,
              textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
            }}
          >
            {wedding.bride_name}
          </h1>
          <div className="flex items-center justify-center gap-4 my-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-300" />
            <Crown className="w-6 h-6" style={{ color: secondaryColor }} />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-300" />
          </div>
          <h1
            className="text-6xl md:text-8xl tracking-wide"
            style={{
              fontFamily: `${customFont}, serif`,
              color: secondaryColor,
              textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
            }}
          >
            {wedding.groom_name}
          </h1>
        </motion.div>

        {/* Featured Photo */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mb-16 flex justify-center"
          >
            <div className="relative max-w-2xl">
              <div
                className="absolute inset-0 border-4 transform translate-x-4 translate-y-4"
                style={{ borderColor: secondaryColor }}
              />
              <div className="relative overflow-hidden border-4" style={{ borderColor: secondaryColor }}>
                <img
                  src={coverPhotos[0]}
                  alt="Couple"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Wedding Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-center mb-12 space-y-4 text-yellow-100"
        >
          <div className="flex items-center justify-center gap-3 text-xl">
            <Calendar className="w-6 h-6" style={{ color: secondaryColor }} />
            <p>{format(new Date(wedding.scheduled_date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg">
            <Calendar className="w-5 h-5" style={{ color: secondaryColor }} />
            <p>{format(new Date(wedding.scheduled_date), 'h:mm a')}</p>
          </div>
          {wedding.location && (
            <div className="flex items-center justify-center gap-3 text-lg">
              <MapPin className="w-5 h-5" style={{ color: secondaryColor }} />
              <p>{wedding.location}</p>
            </div>
          )}
          {description && (
            <p className="text-yellow-200 max-w-2xl mx-auto mt-8 text-lg leading-relaxed">
              {description}
            </p>
          )}
        </motion.div>

        {/* Pre-Wedding Video */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mb-16"
          >
            <div className="max-w-4xl mx-auto border-4" style={{ borderColor: secondaryColor }}>
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="500px"
                controls
                light
                playIcon={
                  <button className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: secondaryColor }}>
                    <Play className="w-10 h-10 ml-1" style={{ color: primaryColor }} fill={primaryColor} />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* Photo Gallery */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mb-16"
          >
            <h2
              className="text-5xl text-center mb-12"
              style={{ fontFamily: `${customFont}, serif`, color: secondaryColor }}
            >
              Royal Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.7 + idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <div
                    className="absolute inset-0 border-2 transform translate-x-3 translate-y-3"
                    style={{ borderColor: secondaryColor }}
                  />
                  <div className="relative border-2 overflow-hidden" style={{ borderColor: secondaryColor }}>
                    <img
                      src={photo}
                      alt={`Photo ${idx + 2}`}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Watch Live Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="flex justify-center mb-16"
        >
          <Button
            onClick={onEnter}
            size="lg"
            className="px-12 py-6 text-xl font-bold tracking-wider uppercase shadow-2xl border-2 hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: secondaryColor,
              color: primaryColor,
              borderColor: secondaryColor,
              fontFamily: `${customFont}, serif`,
            }}
          >
            <Crown className="w-6 h-6 mr-2" />
            Enter Royal Wedding
          </Button>
        </motion.div>

        {/* Studio Footer */}
        {studioDetails.name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="text-center py-8 border-t-2"
            style={{ borderColor: secondaryColor }}
          >
            <p className="text-sm text-yellow-300 mb-2 tracking-widest">PRESENTED BY</p>
            <div className="flex items-center justify-center gap-3">
              {studioDetails.logo_url && (
                <img src={studioDetails.logo_url} alt="Studio Logo" className="h-10" />
              )}
              <p className="text-xl font-bold tracking-wide" style={{ color: secondaryColor, fontFamily: `${customFont}, serif` }}>
                {studioDetails.name}
              </p>
            </div>
            {studioDetails.contact && (
              <p className="text-sm text-yellow-200 mt-2">{studioDetails.contact}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
