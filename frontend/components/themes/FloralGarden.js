'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Floral Garden Theme
 * Elegant floral theme with romantic garden vibes
 * 
 * Required Sections:
 * - Bride Photo
 * - Groom Photo
 * - Couple Photo
 * - Precious Moments (3-6 photos)
 */

export default function FloralGarden({ weddingData, themeSettings, themeAssets }) {
  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Great Vibes',
    primary_color = '#f43f5e',
    secondary_color = '#a855f7',
    cover_photos = [],
    pre_wedding_video = '',
    custom_messages = {},
    studio_details = {}
  } = themeSettings || {};

  const {
    borders = {},
    precious_moment_style_id,
    background_template_id,
    animation = {},
    precious_moment_photos = []
  } = themeAssets || {};

  // Extract photos by category
  const bridePhoto = cover_photos.find(p => p.category === 'bride')?.url || cover_photos[0];
  const groomPhoto = cover_photos.find(p => p.category === 'groom')?.url || cover_photos[1];
  const couplePhoto = cover_photos.find(p => p.category === 'couple')?.url || cover_photos[2];

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const floralFloat = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            variants={floralFloat}
            animate="animate"
            transition={{ delay: i * 0.2 }}
          >
            <div className="w-8 h-8 text-rose-400">🌸</div>
          </motion.div>
        ))}
      </div>

      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center px-4 py-20"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Couple Photos with Borders */}
          <div className="flex justify-center items-end gap-8 mb-12">
            {/* Bride Photo */}
            {bridePhoto && (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img 
                    src={bridePhoto} 
                    alt={bride_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg"
                  style={{ backgroundColor: primary_color }}
                >
                  {bride_name}
                </div>
              </motion.div>
            )}

            {/* Couple Photo (Center, Larger) */}
            {couplePhoto && (
              <motion.div
                className="relative -mb-8"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img 
                    src={couplePhoto} 
                    alt="Couple"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            )}

            {/* Groom Photo */}
            {groomPhoto && (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img 
                    src={groomPhoto} 
                    alt={groom_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg"
                  style={{ backgroundColor: secondary_color }}
                >
                  {groom_name}
                </div>
              </motion.div>
            )}
          </div>

          {/* Names */}
          <motion.h1 
            className="text-6xl md:text-8xl mb-6"
            style={{ fontFamily: custom_font, color: primary_color }}
            variants={fadeIn}
          >
            {bride_name} & {groom_name}
          </motion.h1>

          {/* Welcome Text */}
          <motion.p 
            className="text-2xl text-gray-700 mb-8"
            variants={fadeIn}
          >
            {custom_messages.welcome_text || "Welcome to our big day"}
          </motion.p>

          {/* Date & Location */}
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg text-gray-600"
            variants={fadeIn}
          >
            {scheduled_date && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <span>{new Date(scheduled_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span>{location}</span>
              </div>
            )}
          </motion.div>

          {description && (
            <motion.p 
              className="mt-8 text-gray-600 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              {description}
            </motion.p>
          )}
        </div>
      </motion.section>

      {/* Precious Moments Section */}
      {precious_moment_photos.length > 0 && (
        <motion.section 
          className="py-20 px-4 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-5xl text-center mb-16"
              style={{ fontFamily: custom_font, color: primary_color }}
            >
              Precious Moments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {precious_moment_photos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={photo} 
                    alt={`Moment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Studio Details */}
      {studio_details?.name && (
        <motion.section 
          className="py-12 px-4 text-center bg-white/50 backdrop-blur-sm relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-4xl mx-auto">
            {studio_details.logo_url && (
              <img 
                src={studio_details.logo_url} 
                alt={studio_details.name}
                className="h-16 mx-auto mb-4"
              />
            )}
            <p className="text-lg font-medium text-gray-700">{studio_details.name}</p>
            {studio_details.phone && (
              <p className="text-gray-600 mt-2">{studio_details.phone}</p>
            )}
            {studio_details.email && (
              <p className="text-gray-600">{studio_details.email}</p>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}