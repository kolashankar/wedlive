'use client';
import { motion } from 'framer-motion';

/**
 * Modern Minimalist Theme
 * Clean and contemporary design
 * 
 * Required Sections:
 * - Couple Photo (required)
 * - Precious Moments (2-4 photos)
 * - Bride/Groom photos optional
 */

export default function ModernMinimalist({ weddingData, themeSettings, themeAssets }) {
  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Inter',
    primary_color = '#1f2937',
    secondary_color = '#6b7280',
    cover_photos = [],
    custom_messages = {},
    studio_details = {}
  } = themeSettings || {};

  const {
    precious_moment_photos = []
  } = themeAssets || {};

  const couplePhoto = cover_photos.find(p => p.category === 'couple')?.url || cover_photos[0];

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.5 } }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full Width Image */}
      <motion.section 
        className="relative h-screen"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {couplePhoto && (
          <div className="absolute inset-0">
            <img 
              src={couplePhoto} 
              alt="Couple"
              className="w-full h-full object-cover grayscale-[30%]"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        <div className="relative h-full flex items-center justify-center text-white px-4">
          <div className="text-center">
            <motion.h1 
              className="text-8xl md:text-9xl font-light tracking-widest mb-8"
              style={{ fontFamily: custom_font }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              {bride_name}
            </motion.h1>
            
            <motion.div 
              className="text-3xl mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              &
            </motion.div>

            <motion.h1 
              className="text-8xl md:text-9xl font-light tracking-widest"
              style={{ fontFamily: custom_font }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 1 }}
            >
              {groom_name}
            </motion.h1>

            {scheduled_date && (
              <motion.p 
                className="text-xl font-light mt-12 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {new Date(scheduled_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </motion.p>
            )}

            {location && (
              <motion.p 
                className="text-lg font-light mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                {location}
              </motion.p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Message Section */}
      {custom_messages.welcome_text && (
        <motion.section 
          className="py-32 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-3xl mx-auto text-center">
            <p 
              className="text-4xl font-light leading-relaxed"
              style={{ color: primary_color }}
            >
              {custom_messages.welcome_text}
            </p>
          </div>
        </motion.section>
      )}

      {/* Precious Moments - Asymmetric Grid */}
      {precious_moment_photos.length > 0 && (
        <motion.section 
          className="py-20 px-4 bg-gray-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {precious_moment_photos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  className={`${
                    idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  } aspect-square overflow-hidden`}
                  whileHover={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={photo} 
                    alt={`Moment ${idx + 1}`}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
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
          className="py-16 px-4 text-center border-t"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <p className="text-sm font-light tracking-widest uppercase" style={{ color: secondary_color }}>
            {studio_details.name}
          </p>
        </motion.section>
      )}
    </div>
  );
}