'use client';
import { motion } from 'framer-motion';

/**
 * Traditional South Indian Theme
 * Classic South Indian wedding theme
 * 
 * Required Sections:
 * - Bride Photo
 * - Groom Photo
 * - Couple Photo
 * - Precious Moments (5-8 photos)
 */

export default function TraditionalSouthIndian({ weddingData, themeSettings, themeAssets }) {
  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Great Vibes',
    primary_color = '#dc2626',
    secondary_color = '#ca8a04',
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-yellow-50 to-orange-50">
      {/* Traditional Border Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-24 opacity-20">
          <div className="flex justify-around items-center h-full">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="text-4xl">🪔</div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center px-4 py-20"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Traditional Om Symbol */}
          <motion.div
            className="text-9xl mb-8"
            style={{ color: primary_color }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            🕉️
          </motion.div>

          {/* Main Photo (Couple) */}
          {couplePhoto && (
            <motion.div
              className="relative inline-block mb-12"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-96 h-96 mx-auto rounded-full overflow-hidden border-8 shadow-2xl" style={{ borderColor: secondary_color }}>
                <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover" />
              </div>
              {/* Traditional Decorations */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-5xl">🌺</div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-5xl">🪔</div>
            </motion.div>
          )}

          {/* Names in Traditional Style */}
          <motion.div className="space-y-6" variants={fadeIn}>
            <div className="flex items-center justify-center gap-6">
              <div className="text-3xl" style={{ color: secondary_color }}>✨</div>
              <h1 
                className="text-6xl md:text-7xl font-bold"
                style={{ fontFamily: custom_font, color: primary_color }}
              >
                {bride_name}
              </h1>
              <div className="text-3xl" style={{ color: secondary_color }}>✨</div>
            </div>

            <div className="text-5xl" style={{ color: secondary_color }}>💐</div>

            <div className="flex items-center justify-center gap-6">
              <div className="text-3xl" style={{ color: secondary_color }}>✨</div>
              <h1 
                className="text-6xl md:text-7xl font-bold"
                style={{ fontFamily: custom_font, color: primary_color }}
              >
                {groom_name}
              </h1>
              <div className="text-3xl" style={{ color: secondary_color }}>✨</div>
            </div>
          </motion.div>

          {/* Traditional Blessing */}
          <motion.p 
            className="text-2xl mt-12 text-gray-700 italic"
            variants={fadeIn}
          >
            {custom_messages.welcome_text || "May Lord Ganesha bless the couple"}
          </motion.p>

          {/* Date & Location */}
          <motion.div 
            className="mt-12 space-y-4"
            variants={fadeIn}
          >
            {scheduled_date && (
              <div className="text-2xl font-semibold" style={{ color: primary_color }}>
                {new Date(scheduled_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            )}
            {location && (
              <div className="text-xl text-gray-700">{location}</div>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Bride and Groom Portraits */}
      {(bridePhoto || groomPhoto) && (
        <motion.section 
          className="py-20 px-4 bg-white/70 backdrop-blur-sm"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-5xl text-center mb-16 font-bold"
              style={{ fontFamily: custom_font, color: primary_color }}
            >
              The Bride & The Groom
            </h2>
            <div className="flex flex-col md:flex-row gap-12 justify-center items-center">
              {bridePhoto && (
                <motion.div
                  className="text-center"
                  whileHover={{ y: -10 }}
                >
                  <div className="relative">
                    <div className="w-72 h-96 rounded-lg overflow-hidden border-8 shadow-xl" style={{ borderColor: secondary_color }}>
                      <img src={bridePhoto} alt={bride_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl">🌺</div>
                  </div>
                  <h3 
                    className="text-4xl mt-6"
                    style={{ fontFamily: custom_font, color: primary_color }}
                  >
                    {bride_name}
                  </h3>
                  <p className="text-lg text-gray-600 mt-2">The Bride</p>
                </motion.div>
              )}

              {groomPhoto && (
                <motion.div
                  className="text-center"
                  whileHover={{ y: -10 }}
                >
                  <div className="relative">
                    <div className="w-72 h-96 rounded-lg overflow-hidden border-8 shadow-xl" style={{ borderColor: secondary_color }}>
                      <img src={groomPhoto} alt={groom_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-5xl">🪔</div>
                  </div>
                  <h3 
                    className="text-4xl mt-6"
                    style={{ fontFamily: custom_font, color: primary_color }}
                  >
                    {groom_name}
                  </h3>
                  <p className="text-lg text-gray-600 mt-2">The Groom</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>
      )}

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
              className="text-5xl text-center mb-16 font-bold"
              style={{ fontFamily: custom_font, color: primary_color }}
            >
              Sacred Moments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {precious_moment_photos.map((photo, idx) => (
                <motion.div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden border-4 border-white shadow-xl"
                  whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={photo} alt={`Moment ${idx + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Traditional Footer with Lamps */}
      <section className="py-12 bg-gradient-to-r from-red-100 via-yellow-100 to-orange-100">
        <div className="flex justify-center items-center gap-8 mb-6">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="text-4xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            >
              🪔
            </motion.div>
          ))}
        </div>
        
        {studio_details?.name && (
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <p className="text-lg font-semibold" style={{ color: primary_color }}>
              {studio_details.name}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}