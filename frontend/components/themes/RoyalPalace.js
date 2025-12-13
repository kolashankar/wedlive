'use client';
import { motion } from 'framer-motion';

/**
 * Royal Palace Theme
 * Luxurious palace-inspired theme with golden accents
 * 
 * Required Sections:
 * - Bride Photo
 * - Groom Photo  
 * - Couple Photo
 * - Precious Moments (4-8 photos)
 */

export default function RoyalPalace({ weddingData, themeSettings, themeAssets }) {
  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Cinzel',
    primary_color = '#d4af37',
    secondary_color = '#8b0000',
    cover_photos = [],
    custom_messages = {},
    studio_details = {}
  } = themeSettings || {};

  const {
    precious_moment_photos = []
  } = themeAssets || {};

  const bridePhoto = cover_photos.find(p => p.category === 'bride')?.url || cover_photos[0];
  const groomPhoto = cover_photos.find(p => p.category === 'groom')?.url || cover_photos[1];
  const couplePhoto = cover_photos.find(p => p.category === 'couple')?.url || cover_photos[2];

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50">
      {/* Ornamental Border Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-900 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-amber-900 to-transparent" />
      </div>

      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center px-4 py-20"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Royal Crown Icon */}
          <motion.div
            className="text-8xl mb-8"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            👑
          </motion.div>

          {/* Names with Royal Font */}
          <motion.h1 
            className="text-7xl md:text-9xl mb-8 font-bold tracking-wide"
            style={{ 
              fontFamily: custom_font,
              background: `linear-gradient(135deg, ${primary_color}, ${secondary_color})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            variants={fadeIn}
          >
            {bride_name}
          </motion.h1>

          <motion.div className="text-5xl mb-8" style={{ color: primary_color }}>
            &
          </motion.div>

          <motion.h1 
            className="text-7xl md:text-9xl mb-12 font-bold tracking-wide"
            style={{ 
              fontFamily: custom_font,
              background: `linear-gradient(135deg, ${secondary_color}, ${primary_color})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            variants={fadeIn}
          >
            {groom_name}
          </motion.h1>

          {/* Photos in Royal Frame Layout */}
          <div className="flex justify-center gap-12 mb-12">
            {bridePhoto && (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, rotate: -2 }}
              >
                <div className="w-64 h-80 rounded-lg overflow-hidden border-8 shadow-2xl" style={{ borderColor: primary_color }}>
                  <img src={bridePhoto} alt={bride_name} className="w-full h-full object-cover" />
                </div>
              </motion.div>
            )}
            
            {couplePhoto && (
              <motion.div
                className="relative -mt-8"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-80 h-96 rounded-lg overflow-hidden border-8 shadow-2xl" style={{ borderColor: primary_color }}>
                  <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover" />
                </div>
              </motion.div>
            )}

            {groomPhoto && (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, rotate: 2 }}
              >
                <div className="w-64 h-80 rounded-lg overflow-hidden border-8 shadow-2xl" style={{ borderColor: secondary_color }}>
                  <img src={groomPhoto} alt={groom_name} className="w-full h-full object-cover" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Date & Location */}
          <motion.div 
            className="text-2xl font-semibold"
            style={{ color: primary_color }}
            variants={fadeIn}
          >
            {scheduled_date && new Date(scheduled_date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </motion.div>
          {location && (
            <motion.div className="text-xl text-gray-700 mt-4" variants={fadeIn}>
              {location}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Precious Moments Gallery */}
      {precious_moment_photos.length > 0 && (
        <motion.section 
          className="py-20 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-7xl mx-auto">
            <h2 
              className="text-6xl text-center mb-16 font-bold"
              style={{ fontFamily: custom_font, color: primary_color }}
            >
              Royal Memories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {precious_moment_photos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden border-4 shadow-xl"
                  style={{ borderColor: idx % 2 === 0 ? primary_color : secondary_color }}
                  whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
                >
                  <img src={photo} alt={`Memory ${idx + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Studio Details */}
      {studio_details?.name && (
        <motion.section 
          className="py-12 px-4 text-center bg-gradient-to-r from-amber-100 to-yellow-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <p className="text-xl font-semibold" style={{ color: primary_color }}>
            {studio_details.name}
          </p>
          {studio_details.phone && <p className="text-gray-700 mt-2">{studio_details.phone}</p>}
        </motion.section>
      )}
    </div>
  );
}