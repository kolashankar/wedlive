'use client';
import { motion } from 'framer-motion';

/**
 * Premium Wedding Card Theme
 * Traditional wedding card design
 * 
 * Required Sections:
 * - Bride Photo
 * - Groom Photo
 * - Precious Moments (2-4 photos)
 * - Couple photo optional
 */

export default function PremiumWeddingCard({ weddingData, themeSettings, themeAssets }) {
  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Great Vibes',
    primary_color = '#8b4513',
    secondary_color = '#d4af37',
    cover_photos = [],
    custom_messages = {},
    studio_details = {}
  } = themeSettings || {};

  const {
    precious_moment_photos = []
  } = themeAssets || {};

  const bridePhoto = cover_photos.find(p => p.category === 'bride')?.url || cover_photos[0];
  const groomPhoto = cover_photos.find(p => p.category === 'groom')?.url || cover_photos[1];

  const fadeIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4">
      {/* Main Card */}
      <motion.div 
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Decorative Border Top */}
        <div className="h-4" style={{ background: `linear-gradient(90deg, ${primary_color}, ${secondary_color}, ${primary_color})` }} />

        {/* Card Content */}
        <div className="p-12 md:p-20">
          {/* Decorative Corner Ornaments */}
          <div className="relative">
            <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: secondary_color }} />
            <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: secondary_color }} />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: secondary_color }} />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: secondary_color }} />

            <div className="pt-12 pb-16">
              {/* Invitation Text */}
              <motion.div 
                className="text-center mb-12"
                variants={fadeIn}
              >
                <p className="text-xl text-gray-600 mb-4">Wedding Invitation</p>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-gray-400 to-gray-400" />
                  <span className="text-3xl" style={{ color: secondary_color }}>🕉️</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent via-gray-400 to-gray-400" />
                </div>
              </motion.div>

              {/* Photos */}
              <div className="flex justify-center gap-12 mb-12">
                {bridePhoto && (
                  <motion.div
                    className="text-center"
                    whileHover={{ y: -5 }}
                  >
                    <div className="w-40 h-52 rounded-lg overflow-hidden border-4 shadow-lg mb-4" style={{ borderColor: secondary_color }}>
                      <img src={bridePhoto} alt={bride_name} className="w-full h-full object-cover" />
                    </div>
                    <h3 
                      className="text-3xl"
                      style={{ fontFamily: custom_font, color: primary_color }}
                    >
                      {bride_name}
                    </h3>
                  </motion.div>
                )}

                {groomPhoto && (
                  <motion.div
                    className="text-center"
                    whileHover={{ y: -5 }}
                  >
                    <div className="w-40 h-52 rounded-lg overflow-hidden border-4 shadow-lg mb-4" style={{ borderColor: secondary_color }}>
                      <img src={groomPhoto} alt={groom_name} className="w-full h-full object-cover" />
                    </div>
                    <h3 
                      className="text-3xl"
                      style={{ fontFamily: custom_font, color: primary_color }}
                    >
                      {groom_name}
                    </h3>
                  </motion.div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-300 to-gray-300" />
                <span className="text-2xl" style={{ color: secondary_color }}>❖</span>
                <div className="h-px w-24 bg-gradient-to-l from-transparent via-gray-300 to-gray-300" />
              </div>

              {/* Details */}
              <motion.div 
                className="text-center space-y-6"
                variants={fadeIn}
              >
                {scheduled_date && (
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Date</p>
                    <p className="text-2xl font-semibold" style={{ color: primary_color }}>
                      {new Date(scheduled_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}

                {location && (
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Venue</p>
                    <p className="text-xl" style={{ color: primary_color }}>{location}</p>
                  </div>
                )}

                {custom_messages.welcome_text && (
                  <div className="mt-8">
                    <p className="text-lg text-gray-600 italic">
                      {custom_messages.welcome_text}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Decorative Border Bottom */}
        <div className="h-4" style={{ background: `linear-gradient(90deg, ${primary_color}, ${secondary_color}, ${primary_color})` }} />
      </motion.div>

      {/* Precious Moments Below Card */}
      {precious_moment_photos.length > 0 && (
        <motion.div 
          className="max-w-4xl mx-auto mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {precious_moment_photos.map((photo, idx) => (
              <motion.div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-white"
                whileHover={{ scale: 1.05 }}
              >
                <img src={photo} alt={`Moment ${idx + 1}`} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Studio Details */}
      {studio_details?.name && (
        <motion.div 
          className="max-w-4xl mx-auto mt-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <p className="text-sm text-gray-500">Designed by {studio_details.name}</p>
        </motion.div>
      )}
    </div>
  );
}