'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Film, Video, Star, Sparkles, Camera, Heart, Flower2 } from 'lucide-react';
import ExactFitPhotoFrame from '@/components/ExactFitPhotoFrame';

export default function CinemaScope({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  const themeAssets = wedding.theme_assets || {};
  
  // Get dynamic theme assets
  const brideBorderUrl = themeAssets.bride_border_url;
  const groomBorderUrl = themeAssets.groom_border_url;
  const coupleStyleUrl = themeAssets.couple_style_url;
  const backgroundUrl = themeAssets.background_url;
  
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
  
  const customFontName = theme.custom_font || 'Bebas Neue';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Bebas Neue', cursive";
  const primaryColor = theme.primary_color || '#ef4444';
  const secondaryColor = theme.secondary_color || '#1f2937';
  const welcomeText = theme.custom_messages?.welcome_text || 'Now Showing';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Enhanced film strip effect
  const filmHoles = Array.from({ length: 50 }, (_, i) => i);

  // Enhanced floating particles for cinematic effect
  const particles = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10
  }));

  // Enhanced floral corner decorations with roses
  const FloralCorner = ({ className, rotation }) => (
    <motion.div 
      className={`absolute ${className} w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 pointer-events-none`} 
      style={{ transform: `rotate(${rotation}deg)` }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.4, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id={`floral-${rotation}`}>
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.6" />
            <stop offset="70%" stopColor={primaryColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        {/* Main rose */}
        <g transform="translate(50, 50)">
          <ellipse cx="0" cy="0" rx="35" ry="30" fill={`url(#floral-${rotation})`} opacity="0.7" />
          <ellipse cx="-15" cy="-10" rx="25" ry="20" fill={`url(#floral-${rotation})`} opacity="0.6" />
          <ellipse cx="15" cy="-10" rx="25" ry="20" fill={`url(#floral-${rotation})`} opacity="0.6" />
          <ellipse cx="-10" cy="15" rx="20" ry="18" fill={`url(#floral-${rotation})`} opacity="0.5" />
          <ellipse cx="10" cy="15" rx="20" ry="18" fill={`url(#floral-${rotation})`} opacity="0.5" />
        </g>
        {/* Leaves */}
        <g opacity="0.5">
          <ellipse cx="30" cy="80" rx="18" ry="35" fill={primaryColor} opacity="0.3" transform="rotate(-30 30 80)" />
          <ellipse cx="70" cy="30" rx="18" ry="35" fill={primaryColor} opacity="0.3" transform="rotate(45 70 30)" />
        </g>
        {/* Small accent flowers */}
        <circle cx="25" cy="25" r="8" fill={primaryColor} opacity="0.4" />
        <circle cx="40" cy="20" r="6" fill={primaryColor} opacity="0.3" />
      </svg>
    </motion.div>
  );

  return (
    <div 
      className="min-h-screen bg-slate-900 relative overflow-hidden"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced Animated Background with Cinematic Glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${primaryColor}60 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${secondaryColor}60 0%, transparent 50%)`
          }}
        />
        {/* Spotlight effect */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{ 
            background: [
              'radial-gradient(circle at 30% 30%, rgba(239,68,68,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 70%, rgba(239,68,68,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 30%, rgba(239,68,68,0.3) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      {/* Enhanced Floral Corner Decorations */}
      <FloralCorner className="top-0 left-0" rotation={0} />
      <FloralCorner className="top-0 right-0" rotation={90} />
      <FloralCorner className="bottom-0 left-0" rotation={270} />
      <FloralCorner className="bottom-0 right-0" rotation={180} />
      
      {/* Enhanced Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.8, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * particle.duration,
          }}
        />
      ))}
      
      {/* Enhanced film strip top with animated ribbons */}
      <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-b from-black via-slate-950 to-transparent border-b-4 z-50 flex items-center justify-between px-3 sm:px-4 shadow-2xl" style={{ borderColor: primaryColor }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: primaryColor }} />
          </motion.div>
          <span style={{ color: primaryColor }} className="font-black text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.3em]">CINEMASCOPE</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {filmHoles.slice(0, 30).map((i) => (
            <div key={i} className="w-2 h-8 sm:w-3 sm:h-10 bg-slate-950 rounded-full border-2" style={{ borderColor: primaryColor }} />
          ))}
        </div>
        <div style={{ color: primaryColor }} className="text-[0.65rem] sm:text-xs font-mono font-bold tracking-widest">PREMIERE</div>
      </div>

      {/* Cinematic Film Frame Outline Effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="w-full h-full" style={{
          boxShadow: 'inset 0 0 100px 20px rgba(0,0,0,0.9), inset 0 0 50px 10px rgba(0,0,0,0.7)'
        }} />
        <div className="absolute inset-0 border-4 sm:border-8 border-black opacity-30" />
        {/* Corner brackets for film frame */}
        <div className="absolute top-12 sm:top-16 left-2 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-4 border-t-4" style={{ borderColor: primaryColor }} />
        <div className="absolute top-12 sm:top-16 right-2 sm:right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-4 border-t-4" style={{ borderColor: primaryColor }} />
        <div className="absolute bottom-12 sm:bottom-16 left-2 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 border-l-4 border-b-4" style={{ borderColor: primaryColor }} />
        <div className="absolute bottom-12 sm:bottom-16 right-2 sm:right-4 w-12 h-12 sm:w-16 sm:h-16 border-r-4 border-b-4" style={{ borderColor: primaryColor }} />
      </div>

      {/* Scrollable Watch Live Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="sticky top-20 sm:top-24 right-0 z-50 flex justify-end px-4 sm:px-6 py-2 sm:py-4"
      >
        <motion.button
          onClick={onEnter}
          className="px-5 py-2.5 sm:px-8 sm:py-4 text-sm sm:text-base font-bold rounded-full shadow-2xl transition-all duration-300 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
            border: '2px solid white',
            boxShadow: `0 10px 40px ${primaryColor}80`
          }}
          whileHover={{ scale: 1.1, boxShadow: `0 15px 50px ${primaryColor}` }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline relative z-10" fill="white" />
          <span className="relative z-10 hidden sm:inline">Watch Live</span>
          <span className="relative z-10 sm:hidden">Live</span>
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-20 md:pb-24">
        {/* Enhanced Movie Title Card with Soft Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-center mb-16 sm:mb-20 md:mb-24"
        >
          {/* Enhanced Film Icon with Rotating Glow Ring */}
          <motion.div
            className="inline-block mb-8 sm:mb-10 md:mb-12 relative"
          >
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 blur-2xl"
              style={{ background: primaryColor }}
            />
            <Film className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto relative z-10" style={{ color: primaryColor }} />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 rounded-full opacity-40"
              style={{ borderColor: primaryColor, transform: 'scale(1.8)' }}
            />
          </motion.div>
          
          {/* Enhanced Welcome Text */}
          <motion.p
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-10 sm:mb-12 md:mb-16 font-black"
            style={{ 
              color: primaryColor, 
              fontFamily: `${customFont}, sans-serif`,
              textShadow: `0 0 30px ${primaryColor}, 0 0 60px ${primaryColor}80, 0 0 90px ${primaryColor}40`,
            }}
          >
            {welcomeText}
          </motion.p>
          
          {/* Enhanced Names */}
          <div className="space-y-6 sm:space-y-8">
            <motion.h1
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 1, type: "spring", damping: 10 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl uppercase tracking-wider font-black px-2"
              style={{
                fontFamily: `${customFont}, sans-serif`,
                color: 'white',
                textShadow: `0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}80, 0 0 120px ${primaryColor}40, 6px 6px 0px ${primaryColor}40`,
                lineHeight: '0.9'
              }}
            >
              {wedding.bride_name}
            </motion.h1>
            
            {/* Enhanced Separator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1.2, delay: 1.5 }}
              className="flex items-center justify-center gap-6 sm:gap-8 my-6 sm:my-8 md:my-10"
            >
              <motion.div 
                className="h-2 w-20 sm:w-24 md:w-32 rounded-full"
                style={{ background: `linear-gradient(to right, transparent, ${primaryColor})` }}
                animate={{ scaleX: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <Heart className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: primaryColor }} fill={primaryColor} />
                <div className="absolute inset-0 rounded-full opacity-50 blur-xl" style={{ background: primaryColor }} />
              </motion.div>
              <motion.div 
                className="h-2 w-20 sm:w-24 md:w-32 rounded-full"
                style={{ background: `linear-gradient(to left, transparent, ${primaryColor})` }}
                animate={{ scaleX: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 1.2, type: "spring", damping: 10 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl uppercase tracking-wider font-black px-2"
              style={{
                fontFamily: `${customFont}, sans-serif`,
                color: 'white',
                textShadow: `0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}80, 0 0 120px ${primaryColor}40, 6px 6px 0px ${primaryColor}40`,
                lineHeight: '0.9'
              }}
            >
              {wedding.groom_name}
            </motion.h1>
          </div>
        </motion.div>

        {/* Enhanced Couple Photo Section with Cinematic Frame and Floral Decorations */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 2 }}
            className="mb-16 sm:mb-20 md:mb-24 flex justify-center"
          >
            <div className="relative max-w-4xl w-full px-2">
              {/* Soft Spotlight Glow */}
              <div className="absolute -inset-16 opacity-60 blur-3xl" style={{ background: `radial-gradient(circle, ${primaryColor}40, transparent)` }} />
              
              {/* Film Frame with Enhanced Border and Floral SVG Decorations */}
              <div className="relative border-4 sm:border-8 rounded-lg overflow-hidden" style={{ borderColor: primaryColor, boxShadow: `0 20px 60px ${primaryColor}60, inset 0 0 30px rgba(0,0,0,0.5)` }}>
                <img
                  src={coverPhotos[0]?.url || coverPhotos[0]}
                  alt="Couple"
                  className="w-full aspect-[16/10] object-cover"
                  style={{ filter: 'contrast(1.2) saturate(1.1)' }}
                />
                {/* Film grain overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" /%3E%3C/svg%3E")',
                  backgroundSize: '100px 100px'
                }} />
                
                {/* Enhanced Floral SVG corner accents */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top-left floral SVG */}
                  <svg className="absolute top-2 left-2 sm:top-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80">
                    <g fill={primaryColor} opacity="0.8">
                      <ellipse cx="20" cy="20" rx="18" ry="15" transform="rotate(-45 20 20)" />
                      <ellipse cx="35" cy="15" rx="15" ry="12" />
                      <ellipse cx="15" cy="35" rx="15" ry="12" />
                      <circle cx="25" cy="25" r="10" opacity="0.6" />
                    </g>
                  </svg>
                  {/* Top-right */}
                  <svg className="absolute top-2 right-2 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80" style={{ transform: 'scaleX(-1)' }}>
                    <g fill={primaryColor} opacity="0.8">
                      <ellipse cx="20" cy="20" rx="18" ry="15" transform="rotate(-45 20 20)" />
                      <ellipse cx="35" cy="15" rx="15" ry="12" />
                      <ellipse cx="15" cy="35" rx="15" ry="12" />
                      <circle cx="25" cy="25" r="10" opacity="0.6" />
                    </g>
                  </svg>
                  {/* Bottom-left */}
                  <svg className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80" style={{ transform: 'scaleY(-1)' }}>
                    <g fill={primaryColor} opacity="0.8">
                      <ellipse cx="20" cy="20" rx="18" ry="15" transform="rotate(-45 20 20)" />
                      <ellipse cx="35" cy="15" rx="15" ry="12" />
                      <ellipse cx="15" cy="35" rx="15" ry="12" />
                      <circle cx="25" cy="25" r="10" opacity="0.6" />
                    </g>
                  </svg>
                  {/* Bottom-right */}
                  <svg className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80" style={{ transform: 'scale(-1)' }}>
                    <g fill={primaryColor} opacity="0.8">
                      <ellipse cx="20" cy="20" rx="18" ry="15" transform="rotate(-45 20 20)" />
                      <ellipse cx="35" cy="15" rx="15" ry="12" />
                      <ellipse cx="15" cy="35" rx="15" ry="12" />
                      <circle cx="25" cy="25" r="10" opacity="0.6" />
                    </g>
                  </svg>
                </div>
                
                {/* Flower icons in corners */}
                <Flower2 className="absolute top-2 left-2 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} />
                <Flower2 className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} />
                <Flower2 className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} />
                <Flower2 className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Film Credits Style Wedding Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.5 }}
          className="text-center mb-20 sm:mb-24 md:mb-28 space-y-8 sm:space-y-10 md:space-y-12"
        >
          <div className="text-white space-y-4 sm:space-y-6">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gray-400 font-bold">✦ Starring ✦</p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-light px-2" style={{ fontFamily: `${customFont}, sans-serif`, textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
              {wedding.bride_name} & {wedding.groom_name}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-5xl mx-auto px-4">
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              </motion.div>
              <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 font-bold mb-2 sm:mb-3">Release Date</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-white">
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              </motion.div>
              <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 font-bold mb-2 sm:mb-3">Showtime</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-white">
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'TBD'}
              </p>
            </motion.div>
            
            {wedding.location && (
              <motion.div 
                className="text-center sm:col-span-2 md:col-span-1"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1], y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <MapPin className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
                </motion.div>
                <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 font-bold mb-2 sm:mb-3">Venue</p>
                <p className="text-lg sm:text-xl md:text-2xl font-medium text-white">{wedding.location}</p>
              </motion.div>
            )}
          </div>

          {description && (
            <div className="max-w-4xl mx-auto mt-12 sm:mt-14 md:mt-16 px-4">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 font-bold mb-4 sm:mb-6">✦ Synopsis ✦</p>
              <p className="text-gray-200 text-base sm:text-lg md:text-xl leading-relaxed font-light" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.9)' }}>
                {description}
              </p>
            </div>
          )}
        </motion.div>

        {/* Pre-Wedding Video - Enhanced Trailer Section */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 3 }}
            className="mb-20 sm:mb-24 md:mb-28"
          >
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase text-center mb-12 sm:mb-14 md:mb-16 tracking-[0.2em] sm:tracking-[0.3em] font-black px-2"
              style={{ fontFamily: `${customFont}, sans-serif`, color: primaryColor, textShadow: `0 0 30px ${primaryColor}` }}
            >
              ✦ Official Trailer ✦
            </h2>
            <div className="max-w-7xl mx-auto relative px-2">
              <div className="absolute -inset-12 opacity-40 blur-3xl animate-pulse" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
              <div className="relative rounded-2xl overflow-hidden border-4 sm:border-8" style={{ borderColor: primaryColor, boxShadow: `0 25px 80px ${primaryColor}80` }}>
                <ReactPlayer
                  url={preWeddingVideo}
                  width="100%"
                  height="700px"
                  controls
                  light
                  playIcon={
                    <motion.button 
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      whileHover={{ scale: 1.2, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Play className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white ml-2 sm:ml-3" fill="white" />
                    </motion.button>
                  }
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Photo Gallery - Behind the Scenes */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 3.5 }}
            className="mb-20 sm:mb-24 md:mb-28"
          >
            <h2
              className="text-4xl sm:text-5xl md:text-6xl uppercase text-center mb-12 sm:mb-14 md:mb-16 tracking-[0.15em] sm:tracking-[0.2em] font-black px-2"
              style={{ fontFamily: `${customFont}, sans-serif`, color: 'white' }}
            >
              ✦ Behind The Scenes ✦
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-2">
              {coverPhotos.slice(1).map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
                  className="relative group"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-red-400 rounded-lg opacity-0 group-hover:opacity-75 blur-lg transition duration-300" />
                  <div className="relative border-2 sm:border-4 rounded-lg overflow-hidden" style={{ borderColor: primaryColor }}>
                    {/* Use dynamic border for bride photos */}
                    {index === 0 && brideBorderUrl ? (
                      <ExactFitPhotoFrame
                        photoUrl={photo.url}
                        borderUrl={brideBorderUrl}
                        aspectRatio="4:6"
                        className="w-full h-48 sm:h-56 md:h-64 object-cover"
                        alt={`Behind the scenes ${index + 1}`}
                        feather={8}
                        shadow={true}
                      />
                    ) : index === 1 && groomBorderUrl ? (
                      <ExactFitPhotoFrame
                        photoUrl={photo.url}
                        borderUrl={groomBorderUrl}
                        aspectRatio="4:6"
                        className="w-full h-48 sm:h-56 md:h-64 object-cover"
                        alt={`Behind the scenes ${index + 1}`}
                        feather={8}
                        shadow={true}
                      />
                    ) : (
                      <img
                        src={photo.url}
                        alt={`Behind the scenes ${index + 1}`}
                        className="w-full h-48 sm:h-56 md:h-64 object-cover"
                        style={{ filter: 'contrast(1.2) saturate(1.1)' }}
                      />
                    )}
                    {/* Film strip overlay effect */}
                    <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-black to-transparent opacity-70" />
                    <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black to-transparent opacity-70" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enhanced Studio Section - Cinematic Presentation */}
        {studioDetails && (studioDetails.name || studioDetails.logo_url) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 4 }}
            className="mb-20 sm:mb-24 md:mb-28"
          >
            <div className="relative max-w-6xl mx-auto px-2">
              {/* Cinematic Frame */}
              <div className="relative rounded-3xl overflow-hidden border-2 sm:border-4" style={{ borderColor: primaryColor, background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                {/* Letterbox bars */}
                <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 md:h-24 bg-gradient-to-b from-black to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 bg-gradient-to-t from-black to-transparent z-10" />
                
                {/* Studio Content */}
                <div className="relative py-20 sm:py-24 md:py-32 px-8 sm:px-12 md:px-16 text-center">
                  {/* Studio Logo with Cinematic Glow */}
                  {studioDetails.logo_url && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 2.5, delay: 4.5, type: "spring" }}
                      className="relative z-10 mb-8 sm:mb-10 md:mb-12"
                    >
                      <div className="relative inline-block">
                        <div className="absolute -inset-8 rounded-full opacity-60 blur-3xl animate-pulse" style={{ background: primaryColor }} />
                        <img 
                          src={studioDetails.logo_url} 
                          alt={`${studioDetails.name} Logo`} 
                          className="relative h-24 sm:h-32 md:h-40 object-contain"
                          style={{ filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.8))' }}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Studio Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 5 }}
                  >
                    <p className="text-xs uppercase tracking-[0.4em] sm:tracking-[0.5em] text-gray-400 font-bold mb-4 sm:mb-6">✦ Presented By ✦</p>
                    <h2
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl uppercase tracking-widest font-black mb-6 sm:mb-8 px-2"
                      style={{ 
                        color: 'white',
                        fontFamily: `${customFont}, sans-serif`,
                        textShadow: `0 0 50px ${primaryColor}, 0 0 100px ${primaryColor}80, 8px 8px 0px ${primaryColor}40`,
                      }}
                    >
                      {studioDetails.name || 'STUDIO PRODUCTIONS'}
                    </h2>
                  </motion.div>
                  
                  {/* Studio Contact Details */}
                  {(studioDetails.email || studioDetails.phone || studioDetails.website || studioDetails.contact) && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.5, delay: 5.5 }}
                      className="space-y-3 sm:space-y-4 text-gray-300 relative z-10"
                    >
                      {studioDetails.contact && <p className="text-lg sm:text-xl font-medium">{studioDetails.contact}</p>}
                      {studioDetails.email && <p className="text-base sm:text-lg font-medium">📧 {studioDetails.email}</p>}
                      {studioDetails.phone && <p className="text-base sm:text-lg font-medium">📞 {studioDetails.phone}</p>}
                      {studioDetails.website && <p className="text-base sm:text-lg font-medium">🌐 {studioDetails.website}</p>}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Watch Live Premiere Button (Natural scroll position) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="text-center px-2"
        >
          <motion.button
            onClick={onEnter}
            className="px-10 py-5 sm:px-12 sm:py-6 md:px-16 md:py-8 text-xl sm:text-2xl md:text-3xl font-black rounded-full transition-all duration-300 uppercase tracking-widest"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white',
              fontFamily: `${customFont}, sans-serif`,
              boxShadow: `0 20px 60px ${primaryColor}80, 0 0 80px ${primaryColor}60`,
              textShadow: '0 4px 15px rgba(0,0,0,0.8)',
              border: '3px solid white'
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: `0 25px 80px ${primaryColor}, 0 0 120px ${primaryColor}80`,
              rotate: [0, -1, 1, 0]
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="inline-block"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Play className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-3 sm:mr-4 inline" fill="white" />
            </motion.span>
            <span className="hidden sm:inline">Watch Live Premiere</span>
            <span className="sm:hidden">Watch Premiere</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Enhanced film strip bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-black via-slate-950 to-transparent border-t-4 z-50 flex items-center justify-between px-3 sm:px-4 shadow-2xl" style={{ borderColor: primaryColor }}>
        <div style={{ color: primaryColor }} className="text-[0.65rem] sm:text-xs font-mono font-bold tracking-widest">WEDDING CINEMA</div>
        <div className="hidden md:flex items-center gap-1">
          {filmHoles.slice(0, 30).map((i) => (
            <div key={`bottom-${i}`} className="w-2 h-8 sm:w-3 sm:h-10 bg-slate-950 rounded-full border-2" style={{ borderColor: primaryColor }} />
          ))}
        </div>
        <div style={{ color: primaryColor }} className="text-[0.65rem] sm:text-xs font-mono font-bold tracking-widest">PREMIERE EVENT</div>
      </div>
    </div>
  );
}