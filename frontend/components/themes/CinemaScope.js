'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, Film, Video } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function CinemaScope({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  const customFont = theme.custom_font || 'Bebas Neue';
  const primaryColor = theme.primary_color || '#ef4444';
  const secondaryColor = theme.secondary_color || '#1f2937';
  const welcomeText = theme.custom_messages?.welcome_text || 'Now Showing';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Film strip effect
  const filmHoles = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Film strip top */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-slate-950 border-y-4 border-red-600 z-50 flex items-center justify-between px-2">
        {filmHoles.map((i) => (
          <div key={i} className="w-3 h-6 bg-slate-900 rounded-sm" />
        ))}
      </div>

      {/* Vignette effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="w-full h-full bg-gradient-radial from-transparent via-transparent to-black opacity-50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
        {/* Movie Title Card with Photos */}
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-8"
          >
            <Film className="w-16 h-16 mx-auto" style={{ color: primaryColor }} />
          </motion.div>
          <p
            className="text-xl uppercase tracking-[0.5em] mb-8"
            style={{ color: primaryColor, fontFamily: `${customFont}, sans-serif` }}
          >
            {welcomeText}
          </p>
          
          {/* Names with Side Photos */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mb-12">
            {/* Bride Photo */}
            {coverPhotos[0] && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="hidden md:block"
              >
                <div className="relative">
                  <img
                    src={coverPhotos[0]}
                    alt="Bride"
                    className="w-32 h-48 object-cover rounded-lg"
                    style={{ filter: 'contrast(1.2) saturate(1.1)' }}
                  />
                  {/* Film strip effect */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-black opacity-50" />
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-black opacity-50" />
                </div>
              </motion.div>
            )}
            
            {/* Names in Center */}
            <div className="flex-1 text-center">
              <div className="space-y-4">
                <h1
                  className="text-6xl md:text-8xl uppercase tracking-wider"
                  style={{
                    fontFamily: `${customFont}, sans-serif`,
                    color: 'white',
                    textShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
                  }}
                >
                  {wedding.bride_name}
                </h1>
                <div className="flex items-center justify-center gap-6 my-6">
                  <div className="h-1 w-24 bg-gradient-to-r from-transparent to-red-600" />
                  <Video className="w-6 h-6" style={{ color: primaryColor }} />
                  <div className="h-1 w-24 bg-gradient-to-l from-transparent to-red-600" />
                </div>
                <h1
                  className="text-6xl md:text-8xl uppercase tracking-wider"
                  style={{
                    fontFamily: `${customFont}, sans-serif`,
                    color: 'white',
                    textShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
                  }}
                >
                  {wedding.groom_name}
                </h1>
              </div>
            </div>
            
            {/* Groom Photo */}
            {coverPhotos[1] && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="hidden md:block"
              >
                <div className="relative">
                  <img
                    src={coverPhotos[1]}
                    alt="Groom"
                    className="w-32 h-48 object-cover rounded-lg"
                    style={{ filter: 'contrast(1.2) saturate(1.1)' }}
                  />
                  {/* Film strip effect */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-black opacity-50" />
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-black opacity-50" />
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Mobile: Show photos below names if no side photos */}
          <div className="md:hidden flex justify-center gap-4 mt-8">
            {coverPhotos.slice(0, 2).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={index === 0 ? "Bride" : "Groom"}
                className="w-24 h-36 object-cover rounded-lg"
                style={{ filter: 'contrast(1.2) saturate(1.1)' }}
              />
            ))}
          </div>
        </motion.div>

        {/* Enhanced Studio Presentation - Replaces Cinematic Photo */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mb-20"
        >
          <div className="relative max-w-6xl mx-auto">
            {/* Cinematic Frame */}
            <div className="relative bg-slate-900 rounded-lg overflow-hidden border-2" style={{ borderColor: primaryColor }}>
              {/* Letterbox bars */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10" />
              
              {/* Studio Content */}
              <div className="relative py-20 px-8 text-center">
                {/* Animated Film Strip Background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="h-full w-full bg-repeat-y" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, ${primaryColor} 20px, ${primaryColor} 22px, transparent 22px, transparent 40px)`
                  }} />
                </div>
                
                {/* Studio Logo with Animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1.5, delay: 1, type: "spring" }}
                  className="relative z-10 mb-8"
                >
                  {studioDetails.logo_url ? (
                    <div className="relative inline-block">
                      <img 
                        src={studioDetails.logo_url} 
                        alt={`${studioDetails.name} Logo`} 
                        className="h-24 object-contain"
                        style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }}
                      />
                      {/* Animated Glow Ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 rounded-full"
                        style={{ 
                          borderColor: primaryColor,
                          filter: 'blur(2px)',
                          transform: 'scale(1.5)'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-slate-800 rounded-full flex items-center justify-center border-2" style={{ borderColor: primaryColor }}>
                      <Film className="w-16 h-16" style={{ color: primaryColor }} />
                    </div>
                  )}
                </motion.div>
                
                {/* Studio Name with Typewriter Effect */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
                  className="relative z-10 overflow-hidden"
                >
                  <h2
                    className="text-5xl md:text-7xl uppercase tracking-widest font-bold whitespace-nowrap"
                    style={{ 
                      color: 'white',
                      fontFamily: `${customFont}, sans-serif`,
                      textShadow: `0 0 30px ${primaryColor}, 0 0 60px ${primaryColor}, 0 0 90px ${primaryColor}`
                    }}
                  >
                    {studioDetails.name || 'STUDIO PRODUCTIONS'}
                  </h2>
                </motion.div>
                
                {/* Studio Tagline */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 2.5 }}
                  className="text-xl text-gray-300 mt-4 relative z-10"
                >
                  {studioDetails.contact || 'Professional Wedding Cinematography'}
                </motion.p>
                
                {/* Additional Studio Details */}
                {(studioDetails.email || studioDetails.phone || studioDetails.website) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 3 }}
                    className="mt-8 space-y-2 text-gray-400 relative z-10"
                  >
                    {studioDetails.email && <p className="text-sm">{studioDetails.email}</p>}
                    {studioDetails.phone && <p className="text-sm">{studioDetails.phone}</p>}
                    {studioDetails.website && <p className="text-sm">{studioDetails.website}</p>}
                  </motion.div>
                )}
                
                {/* Film Reel Animation */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -right-8 -top-8 w-16 h-16 opacity-20"
                >
                  <Film className="w-full h-full" style={{ color: primaryColor }} />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -left-8 -bottom-8 w-12 h-12 opacity-20"
                >
                  <Film className="w-full h-full" style={{ color: primaryColor }} />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Film Credits Style Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-center mb-20 space-y-6"
        >
          <div className="text-white space-y-3">
            <p className="text-sm uppercase tracking-widest text-gray-400">Starring</p>
            <p className="text-3xl font-light" style={{ fontFamily: `${customFont}, sans-serif` }}>
              {wedding.bride_name} & {wedding.groom_name}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-12 text-gray-300">
            <div>
              <Calendar className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-sm uppercase tracking-widest text-gray-500">Release Date</p>
              <p className="text-lg">
                {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'MMM d, yyyy') : 'TBD'}
              </p>
            </div>
            {wedding.location && (
              <div>
                <MapPin className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
                <p className="text-sm uppercase tracking-widest text-gray-500">Location</p>
                <p className="text-lg">{wedding.location}</p>
              </div>
            )}
          </div>

          {description && (
            <div className="max-w-3xl mx-auto mt-8">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-3">Synopsis</p>
              <p className="text-gray-300 text-lg leading-relaxed">
                {description}
              </p>
            </div>
          )}
        </motion.div>

        {/* Trailer Section */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mb-20"
          >
            <h2
              className="text-5xl uppercase text-center mb-10 tracking-widest"
              style={{ fontFamily: `${customFont}, sans-serif`, color: primaryColor }}
            >
              Official Trailer
            </h2>
            <div className="max-w-6xl mx-auto relative">
              <div className="absolute -inset-4 bg-red-600 opacity-20 blur-xl" />
              <div className="relative">
                <ReactPlayer
                  url={preWeddingVideo}
                  width="100%"
                  height="600px"
                  controls
                  light
                  playIcon={
                    <button className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play className="w-12 h-12 text-white ml-2" fill="white" />
                    </button>
                  }
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Behind the Scenes - Photo Gallery */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mb-20"
          >
            <h2
              className="text-4xl uppercase text-center mb-10 tracking-widest"
              style={{ fontFamily: `${customFont}, sans-serif`, color: 'white' }}
            >
              Behind The Scenes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.7 + idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square overflow-hidden border-2"
                  style={{ borderColor: primaryColor, filter: 'contrast(1.1)' }}
                >
                  <img
                    src={photo}
                    alt={`BTS ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Watch Live CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="text-center mb-20"
        >
          <Button
            onClick={onEnter}
            size="lg"
            className="px-16 py-8 text-2xl uppercase tracking-[0.3em] rounded-none border-4 hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: primaryColor,
              color: 'white',
              borderColor: primaryColor,
              fontFamily: `${customFont}, sans-serif`,
              boxShadow: `0 0 30px ${primaryColor}`,
            }}
          >
            <Play className="w-8 h-8 mr-4" fill="white" />
            Watch Live
          </Button>
        </motion.div>

        {/* Production Company - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="text-center py-16 border-t-2"
          style={{ borderColor: primaryColor }}
        >
          <p className="text-sm uppercase tracking-[0.5em] text-gray-400 mb-8">Presented By</p>
          
          {studioDetails.name ? (
            <div className="space-y-6">
              {/* Studio Logo */}
              {studioDetails.logo_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 2.3 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <img 
                      src={studioDetails.logo_url} 
                      alt={`${studioDetails.name} Logo`} 
                      className="h-20 object-contain"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}
                    />
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 opacity-30 blur-xl"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </motion.div>
              )}
              
              {/* Studio Name */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.5 }}
              >
                <p
                  className="text-4xl md:text-5xl uppercase tracking-widest font-bold"
                  style={{ 
                    color: 'white',
                    fontFamily: `${customFont}, sans-serif`,
                    textShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`
                  }}
                >
                  {studioDetails.name}
                </p>
              </motion.div>
              
              {/* Studio Contact Info */}
              {(studioDetails.contact || studioDetails.email || studioDetails.phone) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 2.7 }}
                  className="space-y-2"
                >
                  {studioDetails.contact && (
                    <p className="text-gray-300 text-lg">{studioDetails.contact}</p>
                  )}
                  {studioDetails.email && (
                    <p className="text-gray-400">{studioDetails.email}</p>
                  )}
                  {studioDetails.phone && (
                    <p className="text-gray-400">{studioDetails.phone}</p>
                  )}
                  {studioDetails.website && (
                    <p className="text-gray-400">{studioDetails.website}</p>
                  )}
                </motion.div>
              )}
            </div>
          ) : (
            // Default placeholder when no studio is set
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-slate-800 rounded-lg flex items-center justify-center">
                <Film className="w-16 h-16 text-gray-500" />
              </div>
              <p className="text-gray-500 text-lg">Studio Productions</p>
              <p className="text-gray-600 text-sm">Professional Wedding Cinematography</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Film strip bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-slate-950 border-y-4 border-red-600 z-50 flex items-center justify-between px-2">
        {filmHoles.map((i) => (
          <div key={`bottom-${i}`} className="w-3 h-6 bg-slate-900 rounded-sm" />
        ))}
      </div>
    </div>
  );
}
