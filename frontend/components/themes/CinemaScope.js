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
        {/* Movie Title Card */}
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
          <div className="space-y-4">
            <h1
              className="text-7xl md:text-9xl uppercase tracking-wider"
              style={{
                fontFamily: `${customFont}, sans-serif`,
                color: 'white',
                textShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
              }}
            >
              {wedding.bride_name}
            </h1>
            <div className="flex items-center justify-center gap-6 my-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent to-red-600" />
              <Video className="w-8 h-8" style={{ color: primaryColor }} />
              <div className="h-1 w-32 bg-gradient-to-l from-transparent to-red-600" />
            </div>
            <h1
              className="text-7xl md:text-9xl uppercase tracking-wider"
              style={{
                fontFamily: `${customFont}, sans-serif`,
                color: 'white',
                textShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
              }}
            >
              {wedding.groom_name}
            </h1>
          </div>
        </motion.div>

        {/* Cinematic Photo */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-20"
          >
            <div className="relative">
              {/* Letterbox bars */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-black z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-black z-10" />
              
              <img
                src={coverPhotos[0]}
                alt="Couple"
                className="w-full h-[70vh] object-cover"
                style={{ filter: 'contrast(1.2) saturate(1.1)' }}
              />
              
              {/* Film grain overlay */}
              <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url(data:image/png;base64,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)' }} />
            </div>
          </motion.div>
        )}

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
              <p className="text-lg">{format(new Date(wedding.scheduled_date), 'MMM d, yyyy')}</p>
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

        {/* Production Company */}
        {studioDetails.name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="text-center py-12 border-t-2"
            style={{ borderColor: primaryColor }}
          >
            <p className="text-xs uppercase tracking-[0.5em] text-gray-500 mb-4">A Production By</p>
            <div className="flex items-center justify-center gap-4">
              {studioDetails.logo_url && (
                <img src={studioDetails.logo_url} alt="Studio Logo" className="h-12" />
              )}
              <p
                className="text-3xl uppercase tracking-widest"
                style={{ color: primaryColor, fontFamily: `${customFont}, sans-serif` }}
              >
                {studioDetails.name}
              </p>
            </div>
            {studioDetails.contact && (
              <p className="text-sm text-gray-400 mt-3">{studioDetails.contact}</p>
            )}
          </motion.div>
        )}
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
