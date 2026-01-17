'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// Transition Variants
const transitions = {
  none: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }, // Instant cut
    transition: { duration: 0 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 1 }
  },
  wipe_left: {
    initial: { clipPath: 'inset(0 0 0 100%)' },
    animate: { clipPath: 'inset(0 0 0 0%)' },
    exit: { zIndex: 0 }, // Stay behind next slide
    transition: { duration: 1, ease: 'easeInOut' }
  },
  wipe_right: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0 0 0%)' },
    exit: { zIndex: 0 },
    transition: { duration: 1, ease: 'easeInOut' }
  },
  zoom_in: {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 },
    transition: { duration: 1 }
  }
};

// Ken Burns Animation Variants (applied to the image inside the slide container)
const animations = {
  none: {
    animate: { scale: 1, x: 0, y: 0 },
    transition: { duration: 0 }
  },
  ken_burns: {
    initial: { scale: 1.1 },
    animate: { scale: 1.3, x: ['0%', '-5%', '5%', '0%'], y: ['0%', '5%', '-5%', '0%'] },
    transition: { duration: 10, ease: 'linear', repeat: Infinity, repeatType: "mirror" } 
  },
  random: {
      // Logic handled in component to pick random variant
  }
};

export default function SlideshowPlayer({ album, onClose, autoPlay = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const slides = album.slides || [];
  const currentSlide = slides[currentIndex];
  
  // Calculate total duration for progress bar
  const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || 5), 0);

  useEffect(() => {
    if (isPlaying) {
      const slideDuration = (currentSlide?.duration || 5) * 1000;
      
      startTimeRef.current = Date.now();
      
      timerRef.current = setTimeout(() => {
        nextSlide();
      }, slideDuration);

      // Progress bar animation (simple linear approximation for now)
      // For precise progress, we'd use requestAnimationFrame
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying]);

  useEffect(() => {
      // Handle Audio
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed)", e));
          } else {
              audioRef.current.pause();
          }
          audioRef.current.muted = isMuted;
      }
  }, [isPlaying, isMuted]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Determine transition for CURRENT entering slide
  // We use the transition defined on the CURRENT slide for entering
  const activeTransitionKey = currentSlide?.transition || 'fade';
  const transitionVariant = transitions[activeTransitionKey] || transitions.fade;
  const transitionDuration = currentSlide?.transition_duration || 1;

  // Determine animation
  const activeAnimationKey = currentSlide?.animation || 'none';
  let animationVariant = animations[activeAnimationKey] || animations.none;
  if (activeAnimationKey === 'random') {
      // Simple random pick for demo
      animationVariant = animations.ken_burns; 
  }

  // Override transition duration in variant
  const activeTransition = {
      ...transitionVariant,
      transition: { ...transitionVariant.transition, duration: transitionDuration }
  };

  if (!currentSlide) return <div className="text-white text-center p-10">No slides</div>;

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden group"
    >
        {/* Background Music */}
        {album.music_url && (
            <audio ref={audioRef} src={album.music_url} loop />
        )}

      {/* Main Slide Display */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentIndex}
            variants={activeTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 10 }}
          >
             {/* Inner image container for Ken Burns / Pan / Zoom animations */}
             <div className="w-full h-full overflow-hidden relative">
                <motion.img 
                    src={currentSlide.media_url} 
                    alt="" 
                    className="w-full h-full object-contain bg-black"
                    variants={animationVariant}
                    // Apply animation duration based on slide duration so it moves throughout the whole slide
                    transition={{ duration: (currentSlide.duration || 5) + transitionDuration, ease: "linear" }}
                />
                 {/* Caption Overlay */}
                {currentSlide.caption && (
                     <div className="absolute bottom-20 left-0 right-0 text-center z-20 px-4">
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="inline-block bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-lg font-medium"
                        >
                            {currentSlide.caption}
                        </motion.p>
                     </div>
                )}
             </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Overlay (Visible on hover) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-4 z-50">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
            <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 text-white">
                <h3 className="font-bold">{album.title}</h3>
                <p className="text-xs opacity-75">{currentIndex + 1} / {slides.length}</p>
            </div>
            <div className="flex gap-2">
                 <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX /> : <Volume2 />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize /> : <Maximize />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-red-500" onClick={onClose}>
                    <X />
                </Button>
            </div>
        </div>

        {/* Center Play/Pause */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
                 {/* Click on center to toggle play, but maybe subtle or handled by wrapper click? Keeping explicit buttons for now */}
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-xl p-3 mb-4 mx-auto w-full max-w-2xl flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={prevSlide}>
                <ChevronLeft />
            </Button>
            
            <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-12 w-12 rounded-full border border-white/20" 
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {isPlaying ? <Pause className="fill-white" /> : <Play className="fill-white ml-1" />}
            </Button>

            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={nextSlide}>
                <ChevronRight />
            </Button>

            {/* Progress Bar (Visual only for now) */}
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-rose-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentIndex) / slides.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
      </div>
    </motion.div>
  );
}
