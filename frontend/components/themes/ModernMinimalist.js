'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Play, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function ModernMinimalist({ wedding, onEnter }) {
  const theme = wedding.theme_settings || {};
  const customFont = theme.custom_font || 'Inter';
  const primaryColor = theme.primary_color || '#000000';
  const secondaryColor = theme.secondary_color || '#e5e5e5';
  const welcomeText = theme.custom_messages?.welcome_text || 'Welcome';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  return (
    <div className="min-h-screen bg-white relative">
      {/* Clean Header */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black to-transparent opacity-20" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-8">
            {welcomeText}
          </p>
        </motion.div>

        {/* Couple Names */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-24"
        >
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight mb-6"
            style={{
              fontFamily: `${customFont}, sans-serif`,
              color: primaryColor,
            }}
          >
            {wedding.bride_name}
          </h1>
          <div className="flex items-center justify-center gap-4 my-10">
            <div className="h-px w-16 bg-black" />
            <span className="text-2xl font-light">&</span>
            <div className="h-px w-16 bg-black" />
          </div>
          <h1
            className="text-5xl md:text-7xl font-light tracking-tight"
            style={{
              fontFamily: `${customFont}, sans-serif`,
              color: primaryColor,
            }}
          >
            {wedding.groom_name}
          </h1>
        </motion.div>

        {/* Featured Photo - Full Width */}
        {coverPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-24"
          >
            <div className="relative h-[70vh] overflow-hidden">
              <img
                src={coverPhotos[0]}
                alt="Couple"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-30" />
            </div>
          </motion.div>
        )}

        {/* Wedding Details - Grid Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid md:grid-cols-3 gap-12 mb-24 max-w-5xl mx-auto"
        >
          <div className="text-center space-y-2">
            <Calendar className="w-8 h-8 mx-auto mb-4" style={{ color: primaryColor }} />
            <p className="text-sm uppercase tracking-widest text-gray-500">Date</p>
            <p className="text-lg font-light">{format(new Date(wedding.scheduled_date), 'MMMM d, yyyy')}</p>
          </div>
          <div className="text-center space-y-2">
            <Calendar className="w-8 h-8 mx-auto mb-4" style={{ color: primaryColor }} />
            <p className="text-sm uppercase tracking-widest text-gray-500">Time</p>
            <p className="text-lg font-light">{format(new Date(wedding.scheduled_date), 'h:mm a')}</p>
          </div>
          {wedding.location && (
            <div className="text-center space-y-2">
              <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: primaryColor }} />
              <p className="text-sm uppercase tracking-widest text-gray-500">Location</p>
              <p className="text-lg font-light">{wedding.location}</p>
            </div>
          )}
        </motion.div>

        {/* Description */}
        {description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-3xl mx-auto mb-24 text-center"
          >
            <p className="text-gray-600 text-lg font-light leading-relaxed">
              {description}
            </p>
          </motion.div>
        )}

        {/* Pre-Wedding Video */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mb-24"
          >
            <div className="max-w-5xl mx-auto">
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="600px"
                controls
                light
                playIcon={
                  <button className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-black ml-1" fill="black" />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* Photo Gallery - Masonry Style */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mb-24"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {coverPhotos.slice(1).map((photo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 + idx * 0.1 }}
                  whileHover={{ scale: 0.98 }}
                  className="aspect-square overflow-hidden bg-gray-100"
                >
                  <img
                    src={photo}
                    alt={`Photo ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Watch Live CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex justify-center mb-24"
        >
          <Button
            onClick={onEnter}
            size="lg"
            className="px-12 py-6 text-base uppercase tracking-[0.2em] rounded-none border-2 bg-black text-white hover:bg-white hover:text-black transition-all duration-300"
            style={{
              fontFamily: `${customFont}, sans-serif`,
              borderColor: primaryColor,
            }}
          >
            Watch Live
            <ArrowRight className="w-5 h-5 ml-3" />
          </Button>
        </motion.div>

        {/* Studio Footer */}
        {studioDetails.name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-center py-12 border-t border-gray-200"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">Presented by</p>
            <div className="flex items-center justify-center gap-4">
              {studioDetails.logo_url && (
                <img src={studioDetails.logo_url} alt="Studio Logo" className="h-8 grayscale" />
              )}
              <p className="text-lg font-light tracking-wide" style={{ color: primaryColor }}>
                {studioDetails.name}
              </p>
            </div>
            {studioDetails.contact && (
              <p className="text-sm text-gray-500 mt-3">{studioDetails.contact}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
