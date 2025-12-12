'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Heart, Sparkles, Mail, Phone, Flower2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function TraditionalSouthIndian({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  
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
  
  const customFontName = theme.custom_font || 'Rozha One';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Rozha One', serif";
  const primaryColor = theme.primary_color || '#f59e0b';
  const secondaryColor = theme.secondary_color || '#dc2626';
  const welcomeText = theme.custom_messages?.welcome_text || 'வரவேற்கை / Swagath';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Enhanced temple bells animation
  const bells = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 10 + i * 10,
    delay: i * 0.2,
  }));

  // Enhanced floating flower petals (marigold)
  const flowers = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 10 + Math.random() * 10,
    size: 15 + Math.random() * 25
  }));

  // Traditional Floral Garland SVG Component
  const FloralGarland = ({ className, size = 100 }) => (
    <svg 
      className={`absolute ${className} pointer-events-none`}
      width={size} 
      height={size} 
      viewBox="0 0 100 100"
      style={{ opacity: 0.8 }}
    >
      <defs>
        <linearGradient id="marigoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      {/* Marigold flower cluster */}
      <g transform="translate(50, 50)">
        {/* Outer petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            <ellipse 
              cx="0" 
              cy="-18" 
              rx="8" 
              ry="15" 
              fill="url(#marigoldGradient)"
            />
          </g>
        ))}
        {/* Inner petals */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
          <g key={`inner-${i}`} transform={`rotate(${angle})`}>
            <ellipse 
              cx="0" 
              cy="-12" 
              rx="6" 
              ry="10" 
              fill={secondaryColor}
              opacity="0.8"
            />
          </g>
        ))}
        {/* Center */}
        <circle cx="0" cy="0" r="8" fill="#dc2626" />
        <circle cx="0" cy="0" r="4" fill="#f59e0b" opacity="0.8" />
      </g>
      {/* Leaves */}
      <ellipse cx="20" cy="80" rx="8" ry="20" fill="#22c55e" opacity="0.7" transform="rotate(-30 20 80)" />
      <ellipse cx="80" cy="20" rx="8" ry="20" fill="#22c55e" opacity="0.7" transform="rotate(30 80 20)" />
    </svg>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 25%, #fff 50%, #fed7aa 75%, #fef3c7 100%)' }}>
      {/* Traditional pattern overlay */}
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(primaryColor)}' fill-opacity='0.4'%3E%3Cpath d='M0 0h80v80H0V0zm20 20v40h40V20H20zm5 5h30v30H25V25z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px'
      }} />

      {/* Enhanced Temple background with rangoli patterns */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96">
          {/* Enhanced Rangoli pattern */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke={primaryColor} strokeWidth="2" />
            <circle cx="100" cy="100" r="60" fill="none" stroke={secondaryColor} strokeWidth="2" />
            <circle cx="100" cy="100" r="40" fill="none" stroke={primaryColor} strokeWidth="2" />
            <circle cx="100" cy="100" r="20" fill="none" stroke={secondaryColor} strokeWidth="2" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                <line x1="100" y1="20" x2="100" y2="180" stroke={primaryColor} strokeWidth="1.5" />
                <circle cx="100" cy="30" r="8" fill={secondaryColor} />
                <circle cx="100" cy="170" r="8" fill={primaryColor} />
                {/* Additional decorative elements */}
                <circle cx="100" cy="50" r="5" fill={primaryColor} opacity="0.6" />
                <circle cx="100" cy="150" r="5" fill={secondaryColor} opacity="0.6" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Enhanced temple bells at top */}
      <div className="fixed top-0 left-0 right-0 h-20 sm:h-24 z-30 flex items-center justify-center gap-6 sm:gap-8 md:gap-12">
        {bells.map((bell) => (
          <motion.div
            key={bell.id}
            animate={{ 
              rotate: [0, -15, 15, 0],
              y: [0, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              delay: bell.delay,
              repeat: Infinity 
            }}
          >
            <svg width="28" height="36" viewBox="0 0 32 40" className="sm:w-8 sm:h-10">
              <path d="M16 0 L8 12 L8 28 Q8 32 12 34 L12 40 L20 40 L20 34 Q24 32 24 28 L24 12 Z" fill={primaryColor} />
              <circle cx="16" cy="36" r="3" fill={secondaryColor} />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Enhanced floating marigold flowers */}
      {flowers.map((flower) => (
        <motion.div
          key={`flower-${flower.id}`}
          className="absolute pointer-events-none"
          style={{
            left: `${flower.x}%`,
            width: `${flower.size}px`,
            height: `${flower.size}px`,
          }}
          initial={{ y: -20, rotate: 0 }}
          animate={{
            y: '110vh',
            rotate: 360,
            x: [0, 30, -30, 0],
          }}
          transition={{
            duration: flower.duration,
            delay: flower.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Flower2 fill={flower.id % 2 === 0 ? primaryColor : secondaryColor} style={{ color: flower.id % 2 === 0 ? primaryColor : secondaryColor }} opacity="0.6" />
        </motion.div>
      ))}

      {/* Scrollable Watch Live Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="sticky top-24 sm:top-28 right-0 z-50 flex justify-end px-4 sm:px-6 md:px-8 py-2 sm:py-4"
      >
        <motion.button
          onClick={onEnter}
          className="px-5 py-2.5 sm:px-8 sm:py-4 text-sm sm:text-base font-bold rounded-full shadow-xl border-2 sm:border-3 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
            border: '3px solid white'
          }}
          whileHover={{ scale: 1.1, boxShadow: `0 15px 40px ${primaryColor}60` }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="white" />
          <span className="hidden sm:inline">Watch Live</span>
          <span className="sm:hidden">Live</span>
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-28">
        {/* Welcome with Om Symbol */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6"
            style={{ color: primaryColor }}
          >
            ॐ
          </motion.div>
          <p className="text-2xl sm:text-3xl tracking-wide font-medium" style={{ color: secondaryColor }}>
            {welcomeText}
          </p>
        </motion.div>

        {/* Couple Names - Traditional Tamil/Telugu Style with Enhanced Floral Garlands */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-16 sm:mb-20 md:mb-24"
        >
          <div className="relative p-10 sm:p-12 md:p-16 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(254,243,199,0.8), rgba(253,230,138,0.8))', border: `4px solid ${primaryColor}` }}>
            {/* Enhanced Traditional corner decorations */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-14 h-14 sm:w-16 sm:h-16">
              <svg viewBox="0 0 64 64">
                <path d="M0,0 L32,0 L32,8 L8,8 L8,32 L0,32 Z" fill={primaryColor} />
                <circle cx="16" cy="16" r="6" fill={secondaryColor} />
              </svg>
            </div>
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-14 h-14 sm:w-16 sm:h-16 transform scale-x-[-1]">
              <svg viewBox="0 0 64 64">
                <path d="M0,0 L32,0 L32,8 L8,8 L8,32 L0,32 Z" fill={primaryColor} />
                <circle cx="16" cy="16" r="6" fill={secondaryColor} />
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-14 h-14 sm:w-16 sm:h-16 transform scale-y-[-1]">
              <svg viewBox="0 0 64 64">
                <path d="M0,0 L32,0 L32,8 L8,8 L8,32 L0,32 Z" fill={primaryColor} />
                <circle cx="16" cy="16" r="6" fill={secondaryColor} />
              </svg>
            </div>
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-14 h-14 sm:w-16 sm:h-16 transform scale-[-1]">
              <svg viewBox="0 0 64 64">
                <path d="M0,0 L32,0 L32,8 L8,8 L8,32 L0,32 Z" fill={primaryColor} />
                <circle cx="16" cy="16" r="6" fill={secondaryColor} />
              </svg>
            </div>
            
            {/* Floral garland decorations in all corners */}
            <FloralGarland className="top-0 left-0" size={80} />
            <FloralGarland className="top-0 right-0 transform scale-x-[-1]" size={80} />
            <FloralGarland className="bottom-0 left-0 transform scale-y-[-1]" size={80} />
            <FloralGarland className="bottom-0 right-0 transform scale-[-1]" size={80} />
            
            <div className="text-center space-y-8 sm:space-y-10">
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold"
                style={{ fontFamily: `${customFont}, serif`, color: primaryColor, textShadow: `3px 3px 0px ${secondaryColor}40` }}
              >
                {wedding.bride_name}
              </motion.h1>
              
              {/* Traditional kalash symbol */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex justify-center"
              >
                <svg width="70" height="90" viewBox="0 0 80 100" className="sm:w-20 sm:h-28">
                  {/* Kalash pot */}
                  <path d="M20,40 Q15,50 15,60 L15,75 Q15,80 20,80 L60,80 Q65,80 65,75 L65,60 Q65,50 60,40 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
                  {/* Coconut */}
                  <ellipse cx="40" cy="35" rx="18" ry="15" fill="#8B4513" />
                  <ellipse cx="40" cy="30" rx="15" ry="12" fill="#A0522D" />
                  {/* Mango leaves */}
                  <path d="M30,30 Q25,20 30,15" stroke="#22c55e" strokeWidth="3" fill="none" />
                  <path d="M40,28 Q40,18 40,13" stroke="#22c55e" strokeWidth="3" fill="none" />
                  <path d="M50,30 Q55,20 50,15" stroke="#22c55e" strokeWidth="3" fill="none" />
                  <ellipse cx="28" cy="18" rx="6" ry="10" fill="#22c55e" transform="rotate(-30 28 18)" />
                  <ellipse cx="40" cy="13" rx="6" ry="10" fill="#22c55e" />
                  <ellipse cx="52" cy="18" rx="6" ry="10" fill="#22c55e" transform="rotate(30 52 18)" />
                  {/* Base */}
                  <rect x="30" y="80" width="20" height="5" fill={secondaryColor} />
                </svg>
              </motion.div>
              
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold"
                style={{ fontFamily: `${customFont}, serif`, color: primaryColor, textShadow: `3px 3px 0px ${secondaryColor}40` }}
              >
                {wedding.groom_name}
              </motion.h1>
            </div>
          </div>
        </motion.div>

        {/* Couple Photo with Traditional Frame and Enhanced Floral Garlands */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mb-16 sm:mb-20 md:mb-24 flex justify-center"
          >
            <div className="relative max-w-3xl w-full px-2">
              <div className="absolute -inset-8 opacity-40 blur-2xl" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
              
              {/* Enhanced Traditional temple-style frame with floral garlands */}
              <div className="relative border-4 sm:border-6 md:border-8 rounded-lg overflow-hidden" style={{ borderColor: primaryColor, boxShadow: `0 25px 60px ${primaryColor}60` }}>
                <img
                  src={coverPhotos[0]?.url || coverPhotos[0]}
                  alt="Couple"
                  className="w-full aspect-[4/3] object-cover"
                />
                {/* Temple arch overlay */}
                <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 opacity-60" style={{
                  background: `linear-gradient(to bottom, ${primaryColor}, transparent)`
                }} />
                
                {/* Enhanced Flower garland decorations - top */}
                <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-center">
                  <Flower2 className="w-6 h-6 sm:w-8 sm:h-8" fill={secondaryColor} style={{ color: secondaryColor }} />
                  <Flower2 className="w-6 h-6 sm:w-8 sm:h-8" fill={primaryColor} style={{ color: primaryColor }} />
                  <Flower2 className="w-7 h-7 sm:w-9 sm:h-9" fill={secondaryColor} style={{ color: secondaryColor }} />
                  <Flower2 className="w-6 h-6 sm:w-8 sm:h-8" fill={primaryColor} style={{ color: primaryColor }} />
                  <Flower2 className="w-6 h-6 sm:w-8 sm:h-8" fill={secondaryColor} style={{ color: secondaryColor }} />
                </div>
                
                {/* Floral SVG garlands in corners */}
                <FloralGarland className="top-2 left-2 sm:top-4 sm:left-4" size={100} />
                <FloralGarland className="top-2 right-2 sm:top-4 sm:right-4 transform scale-x-[-1]" size={100} />
                <FloralGarland className="bottom-2 left-2 sm:bottom-4 sm:left-4 transform scale-y-[-1]" size={100} />
                <FloralGarland className="bottom-2 right-2 sm:bottom-4 sm:right-4 transform scale-[-1]" size={100} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Wedding Details - Traditional Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mb-16 sm:mb-20 md:mb-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 sm:p-10 rounded-2xl border-4" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: primaryColor }}>
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: secondaryColor }} />
              <p className="text-xs uppercase tracking-widest mb-2 sm:mb-3 font-bold" style={{ color: secondaryColor }}>தேதி / Date</p>
              <p className="text-lg sm:text-xl font-bold" style={{ color: primaryColor }}>
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </div>
            
            <div className="text-center p-8 sm:p-10 rounded-2xl border-4" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: primaryColor }}>
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: secondaryColor }} />
              <p className="text-xs uppercase tracking-widest mb-2 sm:mb-3 font-bold" style={{ color: secondaryColor }}>நேரம் / Time</p>
              <p className="text-lg sm:text-xl font-bold" style={{ color: primaryColor }}>
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'TBD'}
              </p>
            </div>
            
            {wedding.location && (
              <div className="text-center p-8 sm:p-10 rounded-2xl border-4 sm:col-span-2 md:col-span-1" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: primaryColor }}>
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: secondaryColor }} />
                <p className="text-xs uppercase tracking-widest mb-2 sm:mb-3 font-bold" style={{ color: secondaryColor }}>இடம் / Venue</p>
                <p className="text-lg sm:text-xl font-bold" style={{ color: primaryColor }}>{wedding.location}</p>
              </div>
            )}
          </div>
          
          {description && (
            <div className="max-w-3xl mx-auto text-center mt-8 sm:mt-12 p-6 sm:p-8 rounded-2xl" style={{ background: 'rgba(254,243,199,0.6)' }}>
              <p className="text-gray-800 text-lg sm:text-xl leading-relaxed">{description}</p>
            </div>
          )}
        </motion.div>

        {/* Pre-Wedding Video */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mb-16 sm:mb-20 md:mb-24"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-center mb-8 sm:mb-10 md:mb-12 font-bold" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
              மண சினிமா / Wedding Film
            </h2>
            <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border-4 sm:border-6 md:border-8" style={{ borderColor: primaryColor }}>
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="650px"
                controls
                light
                playIcon={
                  <button className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                    <Play className="w-12 h-12 sm:w-14 sm:h-14 text-white ml-2" fill="white" />
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
            transition={{ duration: 1, delay: 1.5 }}
            className="mb-16 sm:mb-20 md:mb-24"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-center mb-8 sm:mb-10 md:mb-12 font-bold" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
              நினைவுகள் / Memories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden border-4 sm:border-6" style={{ borderColor: idx % 2 === 0 ? primaryColor : secondaryColor }}>
                    <img src={photo?.url || photo} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
                    {/* Flower overlay */}
                    <Flower2 className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8" fill={primaryColor} style={{ color: primaryColor }} opacity="0.7" />
                    
                    {/* Floral garland overlay on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <FloralGarland className="top-0 left-0" size={60} />
                      <FloralGarland className="top-0 right-0 transform scale-x-[-1]" size={60} />
                    </div>
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
            transition={{ duration: 1, delay: 2 }}
            className="mb-16 sm:mb-20 md:mb-24"
          >
            <div className="text-center p-12 sm:p-14 md:p-16 rounded-2xl border-4" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: primaryColor }}>
              <p className="text-sm uppercase tracking-widest mb-6 sm:mb-8 font-bold" style={{ color: secondaryColor }}>சுன்னதி / Presented By</p>
              
              {studioDetails.logo_url && (
                <img src={studioDetails.logo_url} alt="Studio Logo" className="h-16 sm:h-18 md:h-20 mx-auto mb-4 sm:mb-6 object-contain" />
              )}
              
              <h3 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6" style={{ fontFamily: `${customFont}, serif`, color: primaryColor }}>
                {studioDetails.name || 'Studio'}
              </h3>
              
              {(studioDetails.contact || studioDetails.email || studioDetails.phone || studioDetails.website) && (
                <div className="space-y-2 text-gray-700 text-base sm:text-lg font-medium">
                  {studioDetails.contact && <p>{studioDetails.contact}</p>}
                  {studioDetails.email && <p><Mail className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />{studioDetails.email}</p>}
                  {studioDetails.phone && <p><Phone className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />{studioDetails.phone}</p>}
                  {studioDetails.website && <p>{studioDetails.website}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CTA Button (Natural scroll position) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <motion.button
            onClick={onEnter}
            className="px-12 py-5 sm:px-14 sm:py-6 md:px-16 md:py-8 text-xl sm:text-2xl md:text-3xl font-bold rounded-full shadow-2xl border-2 sm:border-4"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white',
              borderColor: 'white',
              fontFamily: `${customFont}, serif`
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: `0 25px 60px ${primaryColor}80`,
              rotate: [0, -2, 2, 0]
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 sm:mr-3 inline" fill="white" />
            <span className="hidden sm:inline">நேரலை பார்க்க / Watch Live</span>
            <span className="sm:hidden">Watch Live</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
