'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * Cinema Scope Theme
 * Cinematic widescreen theme for modern weddings
 * 
 * Required Sections:
 * - Bride Photo
 * - Groom Photo
 * - Couple Photo
 * - Precious Moments (3-5 photos)
 */

export default function CinemaScope({ weddingData, themeSettings, themeAssets }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const {
    bride_name,
    groom_name,
    scheduled_date,
    location,
    description
  } = weddingData || {};

  const {
    custom_font = 'Bebas Neue',
    primary_color = '#000000',
    secondary_color = '#ffffff',
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

  return (
    <div className="bg-black text-white" ref={ref}>
      {/* Cinematic Bars */}
      <div className="fixed top-0 left-0 w-full h-16 bg-black z-50" />
      <div className="fixed bottom-0 left-0 w-full h-16 bg-black z-50" />

      {/* Hero Section with Parallax */}
      <motion.section 
        className="relative h-screen overflow-hidden"
        style={{ y }}
      >
        {couplePhoto && (
          <div className="absolute inset-0">
            <img 
              src={couplePhoto} 
              alt="Couple"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
        )}

        <div className="relative h-full flex items-end justify-center pb-32 px-4">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <h1 
              className="text-9xl md:text-[12rem] font-bold tracking-wider mb-4"
              style={{ fontFamily: custom_font, color: secondary_color }}
            >
              {bride_name}
            </h1>
            <div className="text-5xl mb-4">×</div>
            <h1 
              className="text-9xl md:text-[12rem] font-bold tracking-wider"
              style={{ fontFamily: custom_font, color: secondary_color }}
            >
              {groom_name}
            </h1>
          </motion.div>
        </div>
      </motion.section>

      {/* Split Screen Section */}
      <section className="relative h-screen flex">
        {/* Bride Side */}
        <motion.div 
          className="w-1/2 relative overflow-hidden"
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {bridePhoto && (
            <>
              <img src={bridePhoto} alt={bride_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-16 left-16">
                <h2 
                  className="text-7xl font-bold"
                  style={{ fontFamily: custom_font }}
                >
                  {bride_name}
                </h2>
              </div>
            </>
          )}
        </motion.div>

        {/* Groom Side */}
        <motion.div 
          className="w-1/2 relative overflow-hidden"
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {groomPhoto && (
            <>
              <img src={groomPhoto} alt={groom_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-16 right-16">
                <h2 
                  className="text-7xl font-bold text-right"
                  style={{ fontFamily: custom_font }}
                >
                  {groom_name}
                </h2>
              </div>
            </>
          )}
        </motion.div>
      </section>

      {/* Date & Location Banner */}
      <section className="py-20 px-4 text-center bg-white text-black">
        {scheduled_date && (
          <motion.h3 
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: custom_font }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {new Date(scheduled_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </motion.h3>
        )}
        {location && (
          <motion.p 
            className="text-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {location}
          </motion.p>
        )}
      </section>

      {/* Precious Moments - Horizontal Scroll */}
      {precious_moment_photos.length > 0 && (
        <section className="py-20 bg-gray-900">
          <motion.h2 
            className="text-6xl font-bold text-center mb-16"
            style={{ fontFamily: custom_font }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            HIGHLIGHTS
          </motion.h2>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-hide">
            {precious_moment_photos.map((photo, idx) => (
              <motion.div
                key={idx}
                className="flex-shrink-0 w-96 h-72 rounded-lg overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img src={photo} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Credits (Studio) */}
      {studio_details?.name && (
        <section className="py-16 text-center">
          <motion.p 
            className="text-2xl font-bold tracking-widest"
            style={{ fontFamily: custom_font }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            PRODUCED BY {studio_details.name.toUpperCase()}
          </motion.p>
        </section>
      )}
    </div>
  );
}