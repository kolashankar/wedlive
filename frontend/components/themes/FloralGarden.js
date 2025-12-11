'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Heart, Play, Phone, Mail, MapPinned, Sparkles, Bell, Flower2, Gift } from 'lucide-react';
import { format } from 'date-fns';
import ReactPlayer from 'react-player';

export default function FloralGarden({ wedding, onEnter }) {
  const [bookOpened, setBookOpened] = useState(false);
  
  const theme = wedding.theme_settings || {};
  
  // CRITICAL FIX: Map font name to actual CSS font family
  const FONT_FAMILY_MAP = {
    'Inter': 'Inter, sans-serif',
    'Great Vibes': "'Great Vibes', cursive",
    'Playfair Display': "'Playfair Display', serif",
    'Cinzel': "'Cinzel', serif",
    'Montserrat': "'Montserrat', sans-serif",
    'Lato': "'Lato', sans-serif",
    'Caveat': "'Caveat', cursive",
    'Bebas Neue': "'Bebas Neue', cursive",
    'Rozha One': "'Rozha One', serif",
    'Pinyon Script': "'Pinyon Script', cursive"
  };
  
  const customFontName = theme.custom_font || 'Great Vibes';
  const customFont = FONT_FAMILY_MAP[customFontName] || "'Great Vibes', cursive";
  const primaryColor = theme.primary_color || '#f43f5e';
  const secondaryColor = theme.secondary_color || '#a855f7';
  const welcomeText = theme.custom_messages?.welcome_text || 'Welcome to our celebration';
  const description = theme.custom_messages?.description || '';
  const coverPhotos = theme.cover_photos || [];
  
  // Enhanced Cover Photos with Categories - Fix media endpoints
  const groomPhoto = coverPhotos.find(photo => photo.category === 'groom') || (coverPhotos[1]?.url ? coverPhotos[1] : null);
  const bridePhoto = coverPhotos.find(photo => photo.category === 'bride') || (coverPhotos[0]?.url ? coverPhotos[0] : null);
  const couplePhoto = coverPhotos.find(photo => photo.category === 'couple') || (coverPhotos[2]?.url ? coverPhotos[2] : null);
  const preciousMoments = coverPhotos.filter(photo => photo.category === 'moment') || coverPhotos.slice(3, 8).filter(photo => photo?.url);
  const preWeddingVideo = theme.pre_wedding_video || '';
  const studioDetails = theme.studio_details || {};

  // Auto-open book after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setBookOpened(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Falling petals animation - increased count for premium feel
  const petals = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 12,
  }));

  // Floating fireflies/sparkles
  const fireflies = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 20 + Math.random() * 60,
    delay: Math.random() * 3,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden" 
         style={{
           background: 'linear-gradient(135deg, #fce7f3 0%, #fff1f2 25%, #ffffff 50%, #fae8ff 75%, #fce7f3 100%)'
         }}>
      
      {/* Book Opening Animation Cover */}
      <AnimatePresence>
        {!bookOpened && (
          <>
            {/* Left Page */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: -180 }}
              exit={{ rotateY: -180 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 origin-right"
              style={{
                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Heart className="w-24 h-24 mx-auto mb-6" fill="white" />
                    <h2 className="text-5xl mb-4" style={{ fontFamily: `${customFont}, cursive` }}>
                      Wedding Invitation
                    </h2>
                    <p className="text-2xl font-light">You're Invited to Celebrate</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Right Page */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 180 }}
              exit={{ rotateY: 180 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="fixed inset-0 z-50 origin-left"
              style={{
                background: `linear-gradient(to left, ${primaryColor}, ${secondaryColor})`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Premium Floral Corner Decorations - High Quality Images */}
      <div className="fixed top-0 left-0 w-96 h-96 opacity-40 pointer-events-none z-10">
        <img 
          src="https://images.unsplash.com/photo-1693842895970-1ddaaa60f254?w=400&h=400&fit=crop" 
          alt="Roses decoration"
          className="w-full h-full object-cover"
          style={{ 
            maskImage: 'radial-gradient(circle at top left, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at top left, black 20%, transparent 70%)'
          }}
        />
      </div>
      
      <div className="fixed top-0 right-0 w-96 h-96 opacity-40 pointer-events-none z-10">
        <img 
          src="https://images.unsplash.com/photo-1693232387352-3712ed81d5d9?w=400&h=400&fit=crop" 
          alt="Garden roses decoration"
          className="w-full h-full object-cover transform scale-x-[-1]"
          style={{ 
            maskImage: 'radial-gradient(circle at top right, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at top right, black 20%, transparent 70%)'
          }}
        />
      </div>
      
      <div className="fixed bottom-0 left-0 w-96 h-96 opacity-40 pointer-events-none z-10">
        <img 
          src="https://images.unsplash.com/photo-1693842895970-1ddaaa60f254?w=400&h=400&fit=crop" 
          alt="Floral decoration"
          className="w-full h-full object-cover transform rotate-180"
          style={{ 
            maskImage: 'radial-gradient(circle at bottom left, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at bottom left, black 20%, transparent 70%)'
          }}
        />
      </div>
      
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-40 pointer-events-none z-10">
        <img 
          src="https://images.unsplash.com/photo-1693232387352-3712ed81d5d9?w=400&h=400&fit=crop" 
          alt="Garden decoration"
          className="w-full h-full object-cover transform rotate-180 scale-x-[-1]"
          style={{ 
            maskImage: 'radial-gradient(circle at bottom right, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at bottom right, black 20%, transparent 70%)'
          }}
        />
      </div>

      {/* Floating Fireflies/Lanterns */}
      {fireflies.map((firefly) => (
        <motion.div
          key={`firefly-${firefly.id}`}
          className="absolute w-2 h-2 rounded-full bg-yellow-300"
          style={{
            left: `${firefly.x}%`,
            top: `${firefly.y}%`,
            boxShadow: '0 0 20px 5px rgba(253, 224, 71, 0.6)',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: firefly.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Enhanced Falling Petals Animation */}
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute rounded-full"
          style={{
            left: `${petal.x}%`,
            width: petal.id % 3 === 0 ? '8px' : '6px',
            height: petal.id % 3 === 0 ? '8px' : '6px',
            background: petal.id % 2 === 0 
              ? `radial-gradient(circle, #fda4af, ${primaryColor})` 
              : `radial-gradient(circle, #e9d5ff, ${secondaryColor})`,
            opacity: 0.7,
          }}
          initial={{ y: -20, rotate: 0 }}
          animate={{
            y: '110vh',
            rotate: 360,
            x: [0, 40, -40, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 relative overflow-hidden">
      {/* Enhanced Floral Vine Corner Decorations */}
      {/* Top Left Corner - Vine with Flowers */}
      <div className="fixed top-0 left-0 w-80 h-80 opacity-40 pointer-events-none z-20">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Curving vine */}
          <path
            d="M10,10 Q40,40 60,80 T80,140 T90,200"
            stroke={primaryColor}
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M10,10 Q35,50 50,90 T60,150"
            stroke={secondaryColor}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          {/* Flowers along the vine */}
          <g transform="translate(60, 80)">
            <circle cx="0" cy="0" r="12" fill={primaryColor} opacity="0.7"/>
            <circle cx="-8" cy="8" r="10" fill={primaryColor} opacity="0.6"/>
            <circle cx="8" cy="8" r="10" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="16" r="10" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="5" fill="#fbbf24" opacity="0.8"/>
          </g>
          <g transform="translate(80, 140)">
            <circle cx="0" cy="0" r="10" fill={secondaryColor} opacity="0.7"/>
            <circle cx="-6" cy="6" r="8" fill={secondaryColor} opacity="0.6"/>
            <circle cx="6" cy="6" r="8" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="12" r="8" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8"/>
          </g>
          {/* Small leaves */}
          <ellipse cx="45" cy="60" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-30 45 60)"/>
          <ellipse cx="70" cy="110" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(20 70 110)"/>
          <ellipse cx="85" cy="170" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-15 85 170)"/>
        </svg>
      </div>
      
      {/* Top Right Corner */}
      <div className="fixed top-0 right-0 w-80 h-80 opacity-40 pointer-events-none z-20 transform scale-x-[-1]">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <path
            d="M10,10 Q40,40 60,80 T80,140 T90,200"
            stroke={primaryColor}
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M10,10 Q35,50 50,90 T60,150"
            stroke={secondaryColor}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          <g transform="translate(60, 80)">
            <circle cx="0" cy="0" r="12" fill={primaryColor} opacity="0.7"/>
            <circle cx="-8" cy="8" r="10" fill={primaryColor} opacity="0.6"/>
            <circle cx="8" cy="8" r="10" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="16" r="10" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="5" fill="#fbbf24" opacity="0.8"/>
          </g>
          <g transform="translate(80, 140)">
            <circle cx="0" cy="0" r="10" fill={secondaryColor} opacity="0.7"/>
            <circle cx="-6" cy="6" r="8" fill={secondaryColor} opacity="0.6"/>
            <circle cx="6" cy="6" r="8" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="12" r="8" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8"/>
          </g>
          <ellipse cx="45" cy="60" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-30 45 60)"/>
          <ellipse cx="70" cy="110" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(20 70 110)"/>
          <ellipse cx="85" cy="170" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-15 85 170)"/>
        </svg>
      </div>
      
      {/* Bottom Left Corner */}
      <div className="fixed bottom-0 left-0 w-80 h-80 opacity-40 pointer-events-none z-20 transform rotate-180">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <path
            d="M10,10 Q40,40 60,80 T80,140 T90,200"
            stroke={secondaryColor}
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M10,10 Q35,50 50,90 T60,150"
            stroke={primaryColor}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          <g transform="translate(60, 80)">
            <circle cx="0" cy="0" r="12" fill={secondaryColor} opacity="0.7"/>
            <circle cx="-8" cy="8" r="10" fill={secondaryColor} opacity="0.6"/>
            <circle cx="8" cy="8" r="10" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="16" r="10" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="5" fill="#fbbf24" opacity="0.8"/>
          </g>
          <g transform="translate(80, 140)">
            <circle cx="0" cy="0" r="10" fill={primaryColor} opacity="0.7"/>
            <circle cx="-6" cy="6" r="8" fill={primaryColor} opacity="0.6"/>
            <circle cx="6" cy="6" r="8" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="12" r="8" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8"/>
          </g>
          <ellipse cx="45" cy="60" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-30 45 60)"/>
          <ellipse cx="70" cy="110" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(20 70 110)"/>
          <ellipse cx="85" cy="170" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-15 85 170)"/>
        </svg>
      </div>
      
      {/* Bottom Right Corner */}
      <div className="fixed bottom-0 right-0 w-80 h-80 opacity-40 pointer-events-none z-20 transform rotate-180 scale-x-[-1]">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <path
            d="M10,10 Q40,40 60,80 T80,140 T90,200"
            stroke={secondaryColor}
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M10,10 Q35,50 50,90 T60,150"
            stroke={primaryColor}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
          <g transform="translate(60, 80)">
            <circle cx="0" cy="0" r="12" fill={secondaryColor} opacity="0.7"/>
            <circle cx="-8" cy="8" r="10" fill={secondaryColor} opacity="0.6"/>
            <circle cx="8" cy="8" r="10" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="16" r="10" fill={secondaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="5" fill="#fbbf24" opacity="0.8"/>
          </g>
          <g transform="translate(80, 140)">
            <circle cx="0" cy="0" r="10" fill={primaryColor} opacity="0.7"/>
            <circle cx="-6" cy="6" r="8" fill={primaryColor} opacity="0.6"/>
            <circle cx="6" cy="6" r="8" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="12" r="8" fill={primaryColor} opacity="0.6"/>
            <circle cx="0" cy="0" r="4" fill="#fbbf24" opacity="0.8"/>
          </g>
          <ellipse cx="45" cy="60" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-30 45 60)"/>
          <ellipse cx="70" cy="110" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(20 70 110)"/>
          <ellipse cx="85" cy="170" rx="8" ry="15" fill="#86efac" opacity="0.5" transform="rotate(-15 85 170)"/>
        </svg>
      </div>

      {/* Falling Petals Animation */}
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${petal.x}%`,
            background: `radial-gradient(circle, ${secondaryColor}, ${primaryColor})`,
            opacity: 0.6,
          }}
          initial={{ y: -20, rotate: 0 }}
          animate={{
            y: '100vh',
            rotate: 360,
            x: [0, 30, -30, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Top Right Watch Wedding Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="fixed top-6 right-6 z-50"
        >
          <motion.button
            onClick={onEnter}
            className="px-6 py-3 text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white',
              fontFamily: `${customFont}, cursive`,
              border: '2px solid white',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <Play className="w-4 h-4 mr-2 inline relative z-10" fill="white" />
            <span className="relative z-10">Watch Wedding</span>
          </motion.button>
        </motion.div>

      {/* Main Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 py-16">
        
        {/* Animated Wedding Icons - Top Row */}
        <div className="flex justify-center gap-8 mb-8">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Bell className="w-8 h-8" style={{ color: primaryColor }} />
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
            <Sparkles className="w-8 h-8" style={{ color: secondaryColor }} />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>
            <Heart className="w-8 h-8" style={{ color: primaryColor }} fill={primaryColor} />
          </motion.div>
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}>
            <Flower2 className="w-8 h-8" style={{ color: secondaryColor }} />
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}>
            <Gift className="w-8 h-8" style={{ color: primaryColor }} />
          </motion.div>
        </div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="text-center mb-8"
        >
          <p className="text-gray-600 text-xl font-light tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {welcomeText}
          </p>
        </motion.div>

        {/* Enhanced Romantic Wedding Card with Photos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 1.8 }}
          className="mb-16 mx-auto max-w-6xl"
          style={{
            perspective: '1000px',
          }}
        >
          <div 
            className="relative p-12 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(252,231,243,0.98) 100%)`,
              border: `3px solid ${secondaryColor}`,
              boxShadow: `0 25px 80px rgba(244, 63, 94, 0.3), 0 0 0 1px ${primaryColor}20`,
            }}
          >
            {/* Soft Background Pattern */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, ${primaryColor} 1px, transparent 1px), radial-gradient(circle at 80% 50%, ${secondaryColor} 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            
            {/* Floating Hearts Background */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${15 + (i * 10)}%`,
                    top: `${20 + (i * 8)}%`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                >
                  <Heart className="w-4 h-4" style={{ color: primaryColor }} fill={primaryColor} opacity="0.3" />
                </motion.div>
              ))}
            </div>

            {/* Romantic Layout: Photos on sides, Names in center */}
            <div className="flex items-center justify-center gap-8 md:gap-16 relative z-10">
              
              {/* Bride Photo - Left Side */}
              {bridePhoto ? (
                <motion.div
                  initial={{ opacity: 0, x: -100, rotate: -5 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  transition={{ duration: 1.5, delay: 2.2, type: "spring" }}
                  className="hidden md:block"
                >
                  <div className="relative group">
                    {/* Soft Glow Effect */}
                    <div className="absolute -inset-3 bg-gradient-to-br from-pink-200 to-rose-200 rounded-2xl opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />
                    
                    {/* Photo Frame */}
                    <div className="relative rounded-2xl overflow-hidden border-4" style={{ borderColor: primaryColor }}>
                      <img
                        src={bridePhoto.url || bridePhoto}
                        alt="Bride"
                        className="w-36 h-48 object-cover"
                        style={{ filter: 'contrast(1.1) saturate(1.2)' }}
                      />
                      
                      {/* Soft Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-100/20 to-transparent" />
                      
                      {/* Floral Corner Decorations */}
                      <div className="absolute top-2 left-2">
                        <Flower2 className="w-6 h-6" style={{ color: primaryColor }} opacity="0.7" />
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Heart className="w-5 h-5" style={{ color: primaryColor }} fill={primaryColor} opacity="0.7" />
                      </div>
                    </div>
                    
                    {/* Bride Label */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 2.8 }}
                      className="text-center mt-4"
                    >
                      <p className="text-sm font-medium text-gray-600" style={{ fontFamily: customFont }}>Bride</p>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.5, delay: 2.2, type: "spring" }}
                  className="hidden md:block"
                >
                  <div className="relative group">
                    <div className="w-36 h-48 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-solid transition-all"
                         style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
                      <Flower2 className="w-8 h-8 mb-2" style={{ color: primaryColor }} opacity="0.6" />
                      <p className="text-xs font-medium text-center px-2" style={{ color: primaryColor, fontFamily: customFont }}>
                        Upload Bride Photo
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Names in Center */}
              <div className="flex-1 text-center px-4">
                <div className="space-y-6">
                  {/* Bride Name */}
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 2.4 }}
                    className="text-5xl md:text-7xl font-light"
                    style={{
                      fontFamily: customFont,
                      color: primaryColor,
                      textShadow: '3px 3px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {wedding.bride_name}
                  </motion.h1>
                  
                  {/* Enhanced Heart Separator */}
                  <motion.div
                    className="flex justify-center items-center my-8"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="relative">
                      <Heart className="w-16 h-16" style={{ color: primaryColor }} fill={primaryColor} />
                      
                      {/* Sparkle effects around heart */}
                      <motion.div
                        className="absolute -top-3 -right-3"
                        animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color: secondaryColor }} />
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-3 -left-3"
                        animate={{ scale: [0, 1, 0], rotate: [360, 180, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color: secondaryColor }} />
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Groom Name */}
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 2.6 }}
                    className="text-5xl md:text-7xl font-light"
                    style={{
                      fontFamily: customFont,
                      color: primaryColor,
                      textShadow: '3px 3px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {wedding.groom_name}
                  </motion.h1>

                  {/* Enhanced Ribbon decoration */}
                  <div className="flex justify-center gap-6 mt-8">
                    <motion.div 
                      className="w-20 h-1.5 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                      animate={{ scaleX: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="w-20 h-1.5 rounded-full"
                      style={{ backgroundColor: secondaryColor }}
                      animate={{ scaleX: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Groom Photo - Right Side */}
              {groomPhoto ? (
                <motion.div
                  initial={{ opacity: 0, x: 100, rotate: 5 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  transition={{ duration: 1.5, delay: 2.2, type: "spring" }}
                  className="hidden md:block"
                >
                  <div className="relative group">
                    {/* Soft Glow Effect */}
                    <div className="absolute -inset-3 bg-gradient-to-br from-rose-200 to-pink-200 rounded-2xl opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />
                    
                    {/* Photo Frame */}
                    <div className="relative rounded-2xl overflow-hidden border-4" style={{ borderColor: secondaryColor }}>
                      <img
                        src={groomPhoto.url || groomPhoto}
                        alt="Groom"
                        className="w-36 h-48 object-cover"
                        style={{ filter: 'contrast(1.1) saturate(1.2)' }}
                      />
                      
                      {/* Soft Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-rose-100/20 to-transparent" />
                      
                      {/* Floral Corner Decorations */}
                      <div className="absolute top-2 right-2">
                        <Flower2 className="w-6 h-6" style={{ color: secondaryColor }} opacity="0.7" />
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Heart className="w-5 h-5" style={{ color: secondaryColor }} fill={secondaryColor} opacity="0.7" />
                      </div>
                    </div>
                    
                    {/* Groom Label */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 2.8 }}
                      className="text-center mt-4"
                    >
                      <p className="text-sm font-medium text-gray-600" style={{ fontFamily: customFont }}>Groom</p>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.5, delay: 2.2, type: "spring" }}
                  className="hidden md:block"
                >
                  <div className="relative group">
                    <div className="w-36 h-48 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-solid transition-all"
                         style={{ borderColor: secondaryColor, backgroundColor: `${secondaryColor}10` }}>
                      <Flower2 className="w-8 h-8 mb-2" style={{ color: secondaryColor }} opacity="0.6" />
                      <p className="text-xs font-medium text-center px-2" style={{ color: secondaryColor, fontFamily: customFont }}>
                        Upload Groom Photo
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Mobile Photos - Below Names */}
            <div className="md:hidden flex justify-center gap-6 mt-12 relative z-10">
              {coverPhotos.slice(0, 2).map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 3 + index * 0.2 }}
                  className="relative"
                >
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-br from-pink-200 to-rose-200 rounded-xl opacity-40 blur-lg" />
                    <div className="relative rounded-xl overflow-hidden border-3" style={{ borderColor: index === 0 ? primaryColor : secondaryColor }}>
                      <img
                        src={photo}
                        alt={index === 0 ? "Bride" : "Groom"}
                        className="w-28 h-36 object-cover"
                        style={{ filter: 'contrast(1.1) saturate(1.2)' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-100/20 to-transparent" />
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs font-medium text-gray-600" style={{ fontFamily: customFont }}>
                        {index === 0 ? "Bride" : "Groom"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Couple Photo Section */}
        {couplePhoto ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 3.0 }}
            className="mb-16 text-center"
          >
            <div className="relative inline-block">
              {/* Romantic Glow Background */}
              <div className="absolute -inset-8 bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 rounded-3xl opacity-60 blur-2xl" />
              
              {/* Couple Photo Frame - No Border Background */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={couplePhoto.url || couplePhoto}
                  alt="Couple"
                  className="w-80 h-56 object-cover"
                  style={{ filter: 'contrast(1.1) saturate(1.2)' }}
                />
                
                {/* Soft Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/10 to-transparent" />
                
                {/* Corner Decorations */}
                <div className="absolute top-3 left-3">
                  <Heart className="w-8 h-8" style={{ color: 'white' }} fill="white" opacity="0.8" />
                </div>
                <div className="absolute top-3 right-3">
                  <Heart className="w-8 h-8" style={{ color: 'white' }} fill="white" opacity="0.8" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <Flower2 className="w-6 h-6" style={{ color: 'white' }} opacity="0.7" />
                </div>
                <div className="absolute bottom-3 right-3">
                  <Flower2 className="w-6 h-6" style={{ color: 'white' }} opacity="0.7" />
                </div>
              </div>
              
              {/* Couple Photo Label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 3.4 }}
                className="mt-6"
              >
                <h3 
                  className="text-2xl font-medium"
                  style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
                >
                  Couple Photo
                </h3>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 3.0 }}
            className="mb-16 text-center"
          >
            <div className="relative inline-block">
              <div className="w-80 h-56 rounded-3xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-solid transition-all"
                   style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
                <Heart className="w-12 h-12 mb-3" style={{ color: primaryColor }} opacity="0.6" />
                <p className="text-sm font-medium text-center px-4" style={{ color: primaryColor, fontFamily: customFont }}>
                  Upload Couple Photo
                </p>
              </div>
              <h3 
                className="text-2xl font-medium mt-6"
                style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
              >
                Couple Photo
              </h3>
            </div>
          </motion.div>
        )}

        
        {/* Wedding Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.5 }}
          className="text-center mb-16 space-y-6"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <div className="flex items-center justify-center gap-3 text-gray-700">
            <Calendar className="w-6 h-6" style={{ color: primaryColor }} />
            <p className="text-2xl font-medium">
              {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'EEEE, MMMM d, yyyy') : 'Date TBD'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-700">
            <Calendar className="w-6 h-6" style={{ color: primaryColor }} />
            <p className="text-xl">
              {wedding.scheduled_date ? format(new Date(wedding.scheduled_date), 'h:mm a') : 'Time TBD'}
            </p>
          </div>
          {wedding.location && (
            <div className="flex items-center justify-center gap-3 text-gray-700">
              <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
              <p className="text-xl">{wedding.location}</p>
            </div>
          )}
          {description && (
            <p className="text-gray-600 text-lg max-w-3xl mx-auto mt-8 leading-relaxed">
              {description}
            </p>
          )}
        </motion.div>

        {/* ENHANCED STUDIO LOGO SECTION - Below Text */}
        {studioDetails.logo_url && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.8 }}
            className="mb-16 text-center"
          >
            <div className="relative inline-block">
              {/* Soft Glow Background */}
              <div className="absolute -inset-8 bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl opacity-60 blur-2xl" />
              
              {/* 16:9 Studio Logo Container */}
              <motion.div 
                className="relative rounded-2xl overflow-hidden shadow-2xl border-4"
                style={{ borderColor: primaryColor }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <img 
                  src={studioDetails.logo_url} 
                  alt="Studio Logo" 
                  className="w-96 h-54 object-cover"
                  style={{ aspectRatio: '16/9' }}
                />
                
                {/* Soft Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/10 to-transparent" />
                
                {/* Corner Decorations */}
                <div className="absolute top-3 left-3">
                  <Flower2 className="w-8 h-8" style={{ color: primaryColor }} opacity="0.8" />
                </div>
                <div className="absolute bottom-3 right-3">
                  <Heart className="w-6 h-6" style={{ color: primaryColor }} fill={primaryColor} opacity="0.8" />
                </div>
              </motion.div>
              
              {/* Studio Name Below Logo */}
              {studioDetails.name && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 3.2 }}
                  className="mt-6"
                >
                  <h3 
                    className="text-2xl font-medium"
                    style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
                  >
                    {studioDetails.name}
                  </h3>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Garden Theme Section - Romantic Ambiance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.1 }}
          className="mb-16 relative"
        >
          <div 
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              minHeight: '400px',
              backgroundImage: 'url(https://images.unsplash.com/photo-1758694485726-69771dda8a1e?w=1200&h=600&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            
            {/* Floating Lanterns */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`lantern-${i}`}
                className="absolute"
                style={{
                  left: `${15 + i * 15}%`,
                  bottom: '20%',
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.8,
                }}
              >
                <div 
                  className="w-8 h-12 rounded-full"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255, 200, 100, 0.8), rgba(255, 150, 50, 0.6))',
                    boxShadow: '0 0 30px 10px rgba(255, 200, 100, 0.5)',
                  }}
                />
              </motion.div>
            ))}

            {/* Content Overlay */}
            <div className="relative z-10 flex items-center justify-center h-full min-h-[400px] p-12">
              <div className="text-center text-white">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <h3 
                    className="text-5xl md:text-6xl mb-6"
                    style={{ fontFamily: `${customFont}, cursive`, textShadow: '3px 3px 10px rgba(0,0,0,0.5)' }}
                  >
                    Join Us in Celebration
                  </h3>
                </motion.div>
                <p className="text-xl md:text-2xl font-light" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                  A garden of love, where two hearts become one
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pre-Wedding Video */}
        {preWeddingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3.4 }}
            className="mb-16"
          >
            <h2
              className="text-5xl text-center mb-8"
              style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
            >
              Our Love Story
            </h2>
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4" style={{ borderColor: secondaryColor }}>
              <ReactPlayer
                url={preWeddingVideo}
                width="100%"
                height="600px"
                controls
                light
                playIcon={
                  <button className="w-24 h-24 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform" style={{ backgroundColor: primaryColor }}>
                    <Play className="w-12 h-12 text-white ml-2" fill="white" />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* Photo Gallery - Enhanced with Hearts */}
        {coverPhotos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3.7 }}
            className="mb-16"
          >
            {/* Gallery Header with Icons */}
            <div className="text-center mb-12">
              <div className="flex justify-center gap-4 mb-4">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Heart className="w-8 h-8" style={{ color: primaryColor }} fill={primaryColor} />
                </motion.div>
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Flower2 className="w-8 h-8" style={{ color: secondaryColor }} />
                </motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                  <Heart className="w-8 h-8" style={{ color: secondaryColor }} fill={secondaryColor} />
                </motion.div>
              </div>
              <h2
                className="text-5xl md:text-6xl"
                style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
              >
                Our Precious Moments
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {preciousMoments.length > 0 ? (
                preciousMoments.slice(0, 6).map((moment, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 3.9 + idx * 0.1 }}
                    whileHover={{ scale: 1.08, rotate: idx % 2 === 0 ? 3 : -3 }}
                    className="relative group"
                  >
                    <div 
                      className="aspect-square rounded-2xl overflow-hidden shadow-xl border-4 relative"
                      style={{ borderColor: idx % 2 === 0 ? primaryColor : secondaryColor }}
                    >
                      {(moment.type === 'video' || moment.url?.includes('.mp4') || moment.url?.includes('.mov')) ? (
                        <div className="relative">
                          <video
                            src={moment.url || moment}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-12 h-12 text-white" fill="white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={moment.url || moment}
                          alt={`Precious Moment ${idx + 1}`}
                          className="w-full h-full object-cover"
                          style={{ filter: 'contrast(1.1) saturate(1.2)' }}
                        />
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Decorative corner elements */}
                      <div className="absolute top-2 left-2">
                        <Heart className="w-6 h-6 text-white opacity-60" fill="white" />
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Sparkles className="w-6 h-6 text-white opacity-60" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Show placeholders when no precious moments are uploaded
                [...Array(6)].map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 3.9 + idx * 0.1 }}
                    className="relative group"
                  >
                    <div 
                      className="aspect-square rounded-2xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-solid transition-all"
                      style={{ 
                        borderColor: idx % 2 === 0 ? primaryColor : secondaryColor,
                        backgroundColor: `${idx % 2 === 0 ? primaryColor : secondaryColor}10`
                      }}
                    >
                      {idx === 0 ? (
                        <>
                          <Gift className="w-12 h-12 mb-3" style={{ color: idx % 2 === 0 ? primaryColor : secondaryColor }} opacity="0.6" />
                          <p className="text-sm font-medium text-center px-3" style={{ color: idx % 2 === 0 ? primaryColor : secondaryColor, fontFamily: customFont }}>
                            Upload Moments
                          </p>
                        </>
                      ) : (
                        <Sparkles className="w-8 h-8" style={{ color: idx % 2 === 0 ? primaryColor : secondaryColor }} opacity="0.4" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Watch Live Button - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4.2 }}
          className="flex justify-center mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onEnter}
              size="lg"
              className="px-16 py-8 text-2xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                color: 'white',
                fontFamily: 'Montserrat, sans-serif',
                border: '3px solid white',
              }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <Play className="w-8 h-8 mr-3 relative z-10" fill="white" />
              <span className="relative z-10">Watch Live Wedding</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Bottom Decorative Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 4.5 }}
          className="flex justify-center gap-8 mb-12"
        >
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles className="w-10 h-10" style={{ color: primaryColor }} />
          </motion.div>
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Bell className="w-10 h-10" style={{ color: secondaryColor }} />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="w-10 h-10" style={{ color: primaryColor }} fill={primaryColor} />
          </motion.div>
          <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Flower2 className="w-10 h-10" style={{ color: secondaryColor }} />
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
            <Gift className="w-10 h-10" style={{ color: primaryColor }} />
          </motion.div>
        </motion.div>

        {/* Final Message with Background */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 4.8 }}
          className="text-center mb-16 p-12 rounded-3xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
            border: `2px dashed ${primaryColor}`,
          }}
        >
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1734705797879-0c23e9edca21?w=1000&h=400&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-6"
            >
              <Heart className="w-16 h-16" style={{ color: primaryColor }} fill={primaryColor} />
            </motion.div>
            <h3 
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: `${customFont}, cursive`, color: primaryColor }}
            >
              With Love & Gratitude
            </h3>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              We look forward to celebrating this special day with you. Your presence makes our joy complete.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    </div>
  );
}
