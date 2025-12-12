'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Heart, Sparkles, Mail, Phone, Flower2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function RomanticPastel({ wedding, onEnter }) {
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
  
  const customFontName = theme.custom_font || 'Caveat';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Caveat', cursive";
  const primaryColor = theme.primary_color || '#fda4af';
  const secondaryColor = theme.secondary_color || '#e9d5ff';
  const welcomeText = theme.custom_messages?.welcome_text || 'Love is in the air';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Enhanced floating hearts animation
  const hearts = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 8,
    size: 20 + Math.random() * 30
  }));

  // Enhanced floating butterflies/petals
  const petals = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 10 + Math.random() * 10,
    size: 8 + Math.random() * 12
  }));

  // Floral SVG Border Component
  const FloralBorder = ({ className }) => (
    <svg 
      className={`absolute ${className} pointer-events-none`}
      width="120" 
      height="120" 
      viewBox="0 0 120 120"
      style={{ opacity: 0.7 }}
    >
      <defs>
        <radialGradient id="pastelFloral">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      {/* Multiple layered flowers */}
      <g transform="translate(30, 30)">
        {/* Large outer flower */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-20"
            rx="12"
            ry="18"
            fill="url(#pastelFloral)"
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Center */}
        <circle cx="0" cy="0" r="10" fill={primaryColor} opacity="0.6" />
        {/* Small inner flowers */}
        {[0, 120, 240].map((angle, i) => (
          <circle
            key={`small-${i}`}
            cx={Math.cos((angle * Math.PI) / 180) * 8}
            cy={Math.sin((angle * Math.PI) / 180) * 8}
            r="4"
            fill={secondaryColor}
            opacity="0.8"
          />
        ))}
      </g>
      {/* Small accent flowers */}
      <circle cx="15" cy="15" r="6" fill={primaryColor} opacity="0.5" />
      <circle cx="105" cy="15" r="6" fill={secondaryColor} opacity="0.5" />
      <circle cx="15" cy="105" r="6" fill={secondaryColor} opacity="0.5" />
      <circle cx="105" cy="105" r="6" fill={primaryColor} opacity="0.5" />
    </svg>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 25%, #fff 50%, #ddd6fe 75%, #e9d5ff 100%)' }}>
      {/* Soft pastel gradient overlay */}
      <div className="fixed inset-0 opacity-40" style={{
        background: 'radial-gradient(circle at 30% 20%, rgba(253,164,175,0.3), transparent 50%), radial-gradient(circle at 70% 80%, rgba(233,213,255,0.3), transparent 50%)'
      }} />

      {/* Enhanced floating hearts */}
      {hearts.map((heart) => (
        <motion.div
          key={`heart-${heart.id}`}
          className="absolute pointer-events-none"
          style={{
            left: `${heart.x}%`,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
          }}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{
            y: '-20vh',
            opacity: [0, 0.6, 0.6, 0],
            rotate: [0, 360],
            x: [0, 30, -30, 0]
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Heart fill={primaryColor} style={{ color: primaryColor }} opacity="0.5" />
        </motion.div>
      ))}

      {/* Enhanced floating petals */}
      {petals.map((petal) => (
        <motion.div
          key={`petal-${petal.id}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${petal.x}%`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            background: petal.id % 2 === 0 ? primaryColor : secondaryColor,
            opacity: 0.4,
          }}
          initial={{ y: -20, rotate: 0 }}
          animate={{
            y: '110vh',
            rotate: 360,
            x: [0, 40, -40, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Scrollable Watch Live Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="sticky top-6 sm:top-8 right-0 z-50 flex justify-end px-4 sm:px-6 md:px-8 py-2 sm:py-4"
      >
        <motion.button
          onClick={onEnter}
          className="px-5 py-2.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-full shadow-xl transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
            border: '2px solid white'
          }}
          whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(253,164,175,0.4)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="white" />
          <span className="hidden sm:inline">Watch Live</span>
          <span className="sm:hidden">Live</span>
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-4 sm:mb-6" fill={primaryColor} style={{ color: primaryColor }} />
          </motion.div>
          <p className="text-xl sm:text-2xl tracking-wide" style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}>
            {welcomeText}
          </p>
        </motion.div>

        {/* Couple Names - Soft Romantic Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mb-16 sm:mb-20 md:mb-24"
        >
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-6 sm:mb-8 font-light"
            style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
          >
            {wedding.bride_name}
          </motion.h1>
          
          {/* Heart with sparkles separator */}
          <motion.div className="flex items-center justify-center gap-4 sm:gap-6 my-8 sm:my-10 md:my-12">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: secondaryColor }} />
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-10 h-10 sm:w-12 sm:h-12" fill={primaryColor} style={{ color: primaryColor }} />
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: secondaryColor }} />
            </motion.div>
          </motion.div>
          
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light"
            style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
          >
            {wedding.groom_name}
          </motion.h1>
        </motion.div>

        {/* Featured Couple Photo - Heart Shaped Frame with Enhanced Floral Borders */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mb-16 sm:mb-20 md:mb-24 flex justify-center"
          >
            <div className="relative max-w-2xl w-full px-2">
              {/* Soft glow */}
              <div className="absolute -inset-8 opacity-40 blur-3xl" style={{ background: `radial-gradient(circle, ${primaryColor}, ${secondaryColor})` }} />
              
              {/* Heart-shaped photo container with floral decorations */}
              <div className="relative w-full max-w-md mx-auto">
                <div className="relative aspect-square rounded-3xl overflow-hidden border-4 sm:border-6 md:border-8" style={{ borderColor: primaryColor, boxShadow: '0 25px 60px rgba(253,164,175,0.4)' }}>
                  <img
                    src={coverPhotos[0]?.url || coverPhotos[0]}
                    alt="Couple"
                    className="w-full h-full object-cover"
                  />
                  {/* Soft overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-100/30 to-transparent" />
                  
                  {/* Enhanced Floral SVG Borders in corners */}
                  <FloralBorder className="top-0 left-0" />
                  <FloralBorder className="top-0 right-0 transform scale-x-[-1]" />
                  <FloralBorder className="bottom-0 left-0 transform scale-y-[-1]" />
                  <FloralBorder className="bottom-0 right-0 transform scale-[-1]" />
                </div>
                
                {/* Enhanced floating hearts around photo */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${8 + i * 10}%`,
                      left: i % 2 === 0 ? '-8%' : '108%',
                    }}
                    animate={{
                      y: [0, -15, 0],
                      x: [0, i % 2 === 0 ? 5 : -5, 0],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 3 + i * 0.3,
                      repeat: Infinity,
                      delay: i * 0.4
                    }}
                  >
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6" fill={i % 2 === 0 ? primaryColor : secondaryColor} style={{ color: i % 2 === 0 ? primaryColor : secondaryColor }} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Wedding Details - Soft Pastel Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mb-16 sm:mb-20 md:mb-24"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <motion.div 
              whileHover={{ y: -10, scale: 1.05 }}
              className="text-center p-8 sm:p-10 rounded-3xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ffffff, #fce7f3)' }}
            >
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest mb-2 sm:mb-3 text-gray-500">Date</p>
              <p className="text-lg sm:text-xl font-medium" style={{ color: primaryColor }}>
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10, scale: 1.05 }}
              className="text-center p-8 sm:p-10 rounded-3xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ffffff, #fce7f3)' }}
            >
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest mb-2 sm:mb-3 text-gray-500">Time</p>
              <p className="text-lg sm:text-xl font-medium" style={{ color: primaryColor }}>
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'TBD'}
              </p>
            </motion.div>
            
            {wedding.location && (
              <motion.div 
                whileHover={{ y: -10, scale: 1.05 }}
                className="text-center p-8 sm:p-10 rounded-3xl shadow-lg sm:col-span-2 md:col-span-1"
                style={{ background: 'linear-gradient(135deg, #ffffff, #fce7f3)' }}
              >
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
                <p className="text-xs uppercase tracking-widest mb-2 sm:mb-3 text-gray-500">Venue</p>
                <p className="text-lg sm:text-xl font-medium" style={{ color: primaryColor }}>{wedding.location}</p>
              </motion.div>
            )}
          </div>
          
          {description && (
            <div className="max-w-3xl mx-auto text-center mt-8 sm:mt-12">
              <p className="text-gray-700 text-lg sm:text-xl leading-relaxed font-light">{description}</p>
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
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-center mb-8 sm:mb-10 md:mb-12" style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}>
              Our Love Journey
            </h2>
            <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border-4 sm:border-6 md:border-8 shadow-2xl" style={{ borderColor: primaryColor }}>
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="650px"
                controls
                light
                playIcon={
                  <motion.button 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-2" fill="white" />
                  </motion.button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* Photo Gallery - Romantic Grid with Floral Frames */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mb-16 sm:mb-20 md:mb-24"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-center mb-8 sm:mb-10 md:mb-12" style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}>
              Sweet Memories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.7 + idx * 0.1 }}
                  whileHover={{ scale: 1.08, rotate: idx % 2 === 0 ? 5 : -5 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-3xl overflow-hidden border-4 sm:border-6 shadow-lg" style={{ borderColor: idx % 2 === 0 ? primaryColor : secondaryColor }}>
                    <img
                      src={photo?.url || photo}
                      alt={`Photo ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Heart overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Heart className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" fill="white" style={{ color: 'white' }} />
                    </div>
                    
                    {/* Floral border overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Flower2 className="absolute top-2 left-2 w-6 h-6 sm:w-8 sm:h-8" fill={primaryColor} style={{ color: primaryColor }} />
                      <Flower2 className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8" fill={secondaryColor} style={{ color: secondaryColor }} />
                      <Flower2 className="absolute bottom-2 left-2 w-6 h-6 sm:w-8 sm:h-8" fill={secondaryColor} style={{ color: secondaryColor }} />
                      <Flower2 className="absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8" fill={primaryColor} style={{ color: primaryColor }} />
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
            <div className="text-center p-12 sm:p-14 md:p-16 rounded-3xl shadow-xl" style={{ background: 'linear-gradient(135deg, #ffffff, #fce7f3, #e9d5ff)' }}>
              <p className="text-sm uppercase tracking-widest mb-6 sm:mb-8 text-gray-500">Lovingly Captured By</p>
              
              {studioDetails.logo_url && (
                <img src={studioDetails.logo_url} alt="Studio Logo" className="h-12 sm:h-14 md:h-16 mx-auto mb-4 sm:mb-6 object-contain" />
              )}
              
              <h3 className="text-3xl sm:text-4xl mb-4 sm:mb-6" style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}>
                {studioDetails.name || 'Studio'}
              </h3>
              
              {(studioDetails.contact || studioDetails.email || studioDetails.phone || studioDetails.website) && (
                <div className="space-y-2 text-gray-600 text-base sm:text-lg">
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
            className="px-12 py-5 sm:px-14 sm:py-6 md:px-16 md:py-8 text-xl sm:text-2xl md:text-3xl font-semibold rounded-full shadow-2xl border-2 sm:border-4"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white',
              borderColor: 'white',
              fontFamily: `${customFont}, cursive`
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: '0 25px 60px rgba(253,164,175,0.5)',
              rotate: [0, -2, 2, 0]
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 sm:mr-3 inline" fill="white" />
            <span className="hidden sm:inline">Watch Our Wedding Live</span>
            <span className="sm:hidden">Watch Live</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}