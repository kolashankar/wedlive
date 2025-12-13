'use client';
import { motion } from 'framer-motion';

/**
 * Romantic Pastel Theme
 * Soft pastel colors with dreamy romantic feel
 * 
 * Required Sections:
 * - Bride Photo
 * - Groom Photo
 * - Couple Photo
 * - Precious Moments (4-6 photos)
 */

export default function RomanticPastel({ weddingData, themeSettings, themeAssets }) {
  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Parisienne',
    primary_color = '#ffc8dd',
    secondary_color = '#cdb4db',
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Floating Hearts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-pink-300 text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            💕
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
          {/* Watercolor Circle Background */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" 
               style={{ background: `radial-gradient(circle, ${primary_color}, ${secondary_color})` }} />

          {/* Couple Photo Center */}
          {couplePhoto && (
            <motion.div
              className="relative inline-block mb-12"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative w-80 h-96 mx-auto">
                <div className="absolute inset-0 rounded-[50%_50%_0_0] overflow-hidden border-8 border-white shadow-2xl">
                  <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Names */}
          <motion.h1 
            className="text-7xl md:text-8xl mb-4"
            style={{ fontFamily: custom_font, color: primary_color }}
            variants={fadeIn}
          >
            {bride_name}
          </motion.h1>

          <motion.div className="text-5xl mb-4" style={{ color: secondary_color }}>
            💗
          </motion.div>

          <motion.h1 
            className="text-7xl md:text-8xl mb-12"
            style={{ fontFamily: custom_font, color: secondary_color }}
            variants={fadeIn}
          >
            {groom_name}
          </motion.h1>

          {/* Welcome Message */}
          <motion.p 
            className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto"
            variants={fadeIn}
          >
            {custom_messages.welcome_text || "Love is in the air"}
          </motion.p>

          {/* Date & Location */}
          {scheduled_date && (
            <motion.div 
              className="text-xl text-gray-700 mb-2"
              variants={fadeIn}
            >
              📅 {new Date(scheduled_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </motion.div>
          )}
          {location && (
            <motion.div className="text-xl text-gray-700" variants={fadeIn}>
              📍 {location}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Bride & Groom Section */}
      {(bridePhoto || groomPhoto) && (
        <motion.section 
          className="py-20 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 justify-center items-center">
            {bridePhoto && (
              <motion.div
                className="text-center"
                whileHover={{ y: -10 }}
              >
                <div className="w-64 h-80 rounded-3xl overflow-hidden border-8 border-white shadow-xl mb-4">
                  <img src={bridePhoto} alt={bride_name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-3xl" style={{ fontFamily: custom_font, color: primary_color }}>
                  {bride_name}
                </h3>
              </motion.div>
            )}

            {groomPhoto && (
              <motion.div
                className="text-center"
                whileHover={{ y: -10 }}
              >
                <div className="w-64 h-80 rounded-3xl overflow-hidden border-8 border-white shadow-xl mb-4">
                  <img src={groomPhoto} alt={groom_name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-3xl" style={{ fontFamily: custom_font, color: secondary_color }}>
                  {groom_name}
                </h3>
              </motion.div>
            )}
          </div>
        </motion.section>
      )}

      {/* Precious Moments */}
      {precious_moment_photos.length > 0 && (
        <motion.section 
          className="py-20 px-4 bg-white/50 backdrop-blur-sm"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-6xl text-center mb-16"
              style={{ fontFamily: custom_font, color: primary_color }}
            >
              Our Love Story
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {precious_moment_photos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  className="aspect-square rounded-3xl overflow-hidden shadow-lg border-4 border-white"
                  whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 3 : -3 }}
                  transition={{ duration: 0.3 }}
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
          className="py-12 px-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <p className="text-lg text-gray-600">{studio_details.name}</p>
        </motion.section>
      )}
    </div>
  );
}