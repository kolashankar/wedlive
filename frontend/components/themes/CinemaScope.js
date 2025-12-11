'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Film, Video, Star, Sparkles, Camera, Heart, Flower2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function CinemaScope({ wedding, onEnter }) {
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
  
  const customFontName = theme.custom_font || 'Bebas Neue';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Bebas Neue', cursive";
  const primaryColor = theme.primary_color || '#ef4444';
  const secondaryColor = theme.secondary_color || '#1f2937';
  const welcomeText = theme.custom_messages?.welcome_text || 'Now Showing';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Film strip effect
  const filmHoles = Array.from({ length: 40 }, (_, i) => i);

  // Floating particles for cinematic effect
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10
  }));

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${primaryColor}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${secondaryColor}40 0%, transparent 50%)`
          }}
        />
      </div>
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * particle.duration,
          }}
        />
      ))}
      
      {/* Film strip top with enhanced styling */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 to-slate-900 border-b-4 border-red-600 z-50 flex items-center justify-between px-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <Camera className="w-6 h-6 text-red-500" />
          <span className="text-red-500 font-bold text-sm tracking-widest">CINEMASCOPE</span>
        </div>
        {filmHoles.map((i) => (
          <div key={i} className="w-4 h-8 bg-slate-900 rounded-full border-2 border-red-600" />
        ))}
        <div className="text-red-500 text-xs font-mono">PREMIERE</div>
      </div>

      {/* Enhanced Vignette effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="w-full h-full bg-gradient-radial from-transparent via-transparent to-black opacity-70" />
        <div className="absolute inset-0 border-8 border-black opacity-20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Enhanced Movie Title Card with Photos */}
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-center mb-20"
        >
          {/* Enhanced Film Icon with Animation */}
          <motion.div
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-12"
          >
            <div className="relative">
              <Film className="w-20 h-20 mx-auto" style={{ color: primaryColor }} />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-red-500 rounded-full opacity-30"
                style={{ transform: 'scale(1.5)' }}
              />
            </div>
          </motion.div>
          
          {/* Enhanced Welcome Text */}
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-2xl uppercase tracking-[0.3em] mb-12 font-bold"
            style={{ 
              color: primaryColor, 
              fontFamily: `${customFont}, sans-serif`,
              textShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}80`,
              letterSpacing: '0.3em'
            }}
          >
            {welcomeText}
          </motion.p>
          
          {/* Enhanced Names with Side Photos */}
          <div className="flex items-center justify-center gap-12 md:gap-20 mb-16">
            {/* Enhanced Bride Photo */}
            {coverPhotos[0] && (
              <motion.div
                initial={{ opacity: 0, x: -100, rotate: -10 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 1.5, delay: 0.8, type: "spring" }}
                className="hidden lg:block"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-lg opacity-75 group-hover:opacity-100 blur transition duration-300" />
                  <div className="relative">
                    <img
                      src={coverPhotos[0]}
                      alt="Bride"
                      className="w-40 h-60 object-cover rounded-lg"
                      style={{ filter: 'contrast(1.3) saturate(1.2)' }}
                    />
                    {/* Enhanced Film strip effect */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black to-transparent opacity-80" />
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black to-transparent opacity-60" />
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black to-transparent opacity-60" />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Enhanced Names in Center */}
            <div className="flex-1 text-center">
              <div className="space-y-6">
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 1, type: "spring" }}
                  className="text-7xl md:text-9xl uppercase tracking-wider font-black"
                  style={{
                    fontFamily: `${customFont}, sans-serif`,
                    color: 'white',
                    textShadow: `0 0 30px ${primaryColor}, 0 0 60px ${primaryColor}80, 0 0 90px ${primaryColor}40, 4px 4px 0px ${primaryColor}40`,
                    lineHeight: '0.9'
                  }}
                >
                  {wedding.bride_name}
                </motion.h1>
                
                {/* Enhanced Separator */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="flex items-center justify-center gap-8 my-8"
                >
                  <div className="h-2 w-32 bg-gradient-to-r from-transparent to-red-600 rounded-full" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="relative"
                  >
                    <Video className="w-8 h-8" style={{ color: primaryColor }} />
                    <div className="absolute inset-0 bg-red-500 rounded-full opacity-30 blur-xl" />
                  </motion.div>
                  <div className="h-2 w-32 bg-gradient-to-l from-transparent to-red-600 rounded-full" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 1.2, type: "spring" }}
                  className="text-7xl md:text-9xl uppercase tracking-wider font-black"
                  style={{
                    fontFamily: `${customFont}, sans-serif`,
                    color: 'white',
                    textShadow: `0 0 30px ${primaryColor}, 0 0 60px ${primaryColor}80, 0 0 90px ${primaryColor}40, 4px 4px 0px ${primaryColor}40`,
                    lineHeight: '0.9'
                  }}
                >
                  {wedding.groom_name}
                </motion.h1>
              </div>
            </div>
            
            {/* Enhanced Groom Photo */}
            {coverPhotos[1] && (
              <motion.div
                initial={{ opacity: 0, x: 100, rotate: 10 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 1.5, delay: 0.8, type: "spring" }}
                className="hidden lg:block"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-lg opacity-75 group-hover:opacity-100 blur transition duration-300" />
                  <div className="relative">
                    <img
                      src={coverPhotos[1]}
                      alt="Groom"
                      className="w-40 h-60 object-cover rounded-lg"
                      style={{ filter: 'contrast(1.3) saturate(1.2)' }}
                    />
                    {/* Enhanced Film strip effect */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black to-transparent opacity-80" />
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black to-transparent opacity-60" />
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black to-transparent opacity-60" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Enhanced Mobile Photos */}
          <div className="lg:hidden flex justify-center gap-6 mt-12">
            {coverPhotos.slice(0, 2).map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.5 + index * 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-lg opacity-60 blur" />
                <img
                  src={photo}
                  alt={index === 0 ? "Bride" : "Groom"}
                  className="relative w-28 h-44 object-cover rounded-lg"
                  style={{ filter: 'contrast(1.3) saturate(1.2)' }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Studio Presentation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mb-20"
        >
          <div className="relative max-w-6xl mx-auto">
            {/* Cinematic Frame */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>
              {/* Letterbox bars */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent z-10" />
              
              {/* Studio Content */}
              <div className="relative py-24 px-12 text-center">
                {/* Animated Film Strip Background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="h-full w-full bg-repeat-y" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, ${primaryColor} 30px, ${primaryColor} 34px, transparent 34px, transparent 60px)`
                  }} />
                </div>
                
                {/* Studio Logo with Enhanced Animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 2, delay: 1, type: "spring", damping: 10 }}
                  className="relative z-10 mb-12"
                >
                  {studioDetails.logo_url ? (
                    <div className="relative inline-block">
                      <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-red-400 rounded-full opacity-60 blur-2xl animate-pulse" />
                      <img 
                        src={studioDetails.logo_url} 
                        alt={`${studioDetails.name} Logo`} 
                        className="relative h-32 object-contain"
                        style={{ filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.8))' }}
                      />
                      {/* Enhanced Glow Ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 rounded-full"
                        style={{ 
                          borderColor: primaryColor,
                          filter: 'blur(4px)',
                          transform: 'scale(1.8)'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border-4 shadow-2xl" style={{ borderColor: primaryColor }}>
                      <Film className="w-20 h-20" style={{ color: primaryColor }} />
                    </div>
                  )}
                </motion.div>
                
                {/* Studio Name with Enhanced Typewriter Effect */}
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 3, delay: 2, ease: "easeOut" }}
                  className="relative z-10 overflow-hidden mb-8"
                >
                  <h2
                    className="text-6xl md:text-8xl uppercase tracking-widest font-black whitespace-nowrap"
                    style={{ 
                      color: 'white',
                      fontFamily: `${customFont}, sans-serif`,
                      textShadow: `0 0 40px ${primaryColor}, 0 0 80px ${primaryColor}80, 0 0 120px ${primaryColor}40, 6px 6px 0px ${primaryColor}40`,
                      lineHeight: '0.8'
                    }}
                  >
                    {studioDetails.name || 'STUDIO PRODUCTIONS'}
                  </h2>
                </motion.div>
                
                {/* Enhanced Studio Tagline */}
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.5, delay: 3 }}
                  className="text-2xl text-gray-200 mb-12 relative z-10 font-light tracking-wide"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                >
                  {studioDetails.contact || 'Professional Wedding Cinematography'}
                </motion.p>
                
                {/* Enhanced Studio Details */}
                {(studioDetails.email || studioDetails.phone || studioDetails.website) && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 3.5 }}
                    className="space-y-3 text-gray-300 relative z-10"
                  >
                    {studioDetails.email && <p className="text-lg font-medium">{studioDetails.email}</p>}
                    {studioDetails.phone && <p className="text-lg font-medium">{studioDetails.phone}</p>}
                    {studioDetails.website && <p className="text-lg font-medium">{studioDetails.website}</p>}
                  </motion.div>
                )}
                
                {/* Enhanced Film Reel Animation */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -right-12 -top-12 w-20 h-20 opacity-30"
                >
                  <Film className="w-full h-full" style={{ color: primaryColor }} />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute -left-12 -bottom-12 w-16 h-16 opacity-30"
                >
                  <Film className="w-full h-full" style={{ color: primaryColor }} />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Film Credits Style Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="text-center mb-24 space-y-8"
        >
          <div className="text-white space-y-4">
            <p className="text-sm uppercase tracking-widest text-gray-400 font-bold">Starring</p>
            <p className="text-4xl font-light" style={{ fontFamily: `${customFont}, sans-serif` }}>
              {wedding.bride_name} & {wedding.groom_name}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-16 text-gray-300">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
              </motion.div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Release Date</p>
              <p className="text-xl font-medium">
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </div>
            {wedding.location && (
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
                </motion.div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Location</p>
                <p className="text-xl font-medium">{wedding.location}</p>
              </div>
            )}
          </div>

          {description && (
            <div className="max-w-4xl mx-auto mt-12">
              <p className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4">Synopsis</p>
              <p className="text-gray-200 text-xl leading-relaxed font-light" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {description}
              </p>
            </div>
          )}
        </motion.div>

        {/* Enhanced Trailer Section */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 2 }}
            className="mb-24"
          >
            <h2
              className="text-6xl uppercase text-center mb-16 tracking-widest font-black"
              style={{ fontFamily: `${customFont}, sans-serif`, color: primaryColor }}
            >
              Official Trailer
            </h2>
            <div className="max-w-7xl mx-auto relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-red-600 to-red-400 opacity-30 blur-3xl animate-pulse" />
              <div className="relative rounded-2xl overflow-hidden border-4" style={{ borderColor: primaryColor }}>
                <ReactPlayer
                  url={preWeddingVideo}
                  width="100%"
                  height="700px"
                  controls
                  light
                  playIcon={
                    <motion.button 
                      className="w-32 h-32 rounded-full bg-gradient-to-r from-red-600 to-red-400 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-16 h-16 text-white ml-3" fill="white" />
                    </motion.button>
                  }
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Behind the Scenes - Photo Gallery */}
        {coverPhotos.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 2.5 }}
            className="mb-24"
          >
            <h2
              className="text-5xl uppercase text-center mb-16 tracking-widest font-black"
              style={{ fontFamily: `${customFont}, sans-serif`, color: 'white' }}
            >
              Behind The Scenes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {coverPhotos.slice(2).map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 3 + index * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition duration-300" />
                  <img
                    src={photo}
                    alt={`Behind the scenes ${index + 1}`}
                    className="relative w-full h-48 object-cover rounded-lg"
                    style={{ filter: 'contrast(1.3) saturate(1.2)' }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enhanced Watch Live Button */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 3 }}
          className="text-center"
        >
          <motion.button
            onClick={onEnter}
            className="px-12 py-6 text-2xl font-bold rounded-full transition-all duration-300 transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white',
              fontFamily: `${customFont}, sans-serif`,
              boxShadow: `0 10px 40px ${primaryColor}60, 0 0 60px ${primaryColor}40`,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 15px 50px ${primaryColor}80, 0 0 80px ${primaryColor}60` }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-8 h-8 mr-4 inline" fill="white" />
            Watch Live Premiere
          </motion.button>
        </motion.div>
      </div>

      {/* Enhanced Film strip bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-slate-900 border-t-4 border-red-600 z-50 flex items-center justify-between px-4 shadow-2xl">
        <div className="text-red-500 text-xs font-mono">WEDDING CINEMA</div>
        {filmHoles.map((i) => (
          <div key={`bottom-${i}`} className="w-4 h-8 bg-slate-900 rounded-full border-2 border-red-600" />
        ))}
        <div className="text-red-500 text-xs font-mono">PREMIERE EVENT</div>
      </div>
    </div>
  );
}
