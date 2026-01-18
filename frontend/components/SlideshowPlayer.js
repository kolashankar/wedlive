'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isImaginationTransition, getImaginationAnimationPath } from '@/lib/slideshowAnimations';
import TransitionCanvas from './TransitionCanvas';

// Transition Variants
const transitions = {
  none: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
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
    exit: { zIndex: 0 },
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

// Ken Burns Animation Variants
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
      // Logic handled in component
  }
};

export default function SlideshowPlayer({ 
  album, 
  onClose, 
  autoPlay = true, 
  embedded = false,
  controlledIndex = null,
  onIndexChange,
  showControls = true
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  // Use controlled index if provided, otherwise internal state
  const currentIndex = controlledIndex !== null ? controlledIndex : internalIndex;
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Custom Transition State
  const [transitionState, setTransitionState] = useState({
      isActive: false,
      fromIndex: null,
      toIndex: null,
      type: null,
      duration: 1
  });

  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const slides = album.slides || [];
  const currentSlide = slides[currentIndex];
  
  // Sync controlled index
  useEffect(() => {
    if (controlledIndex !== null && controlledIndex !== internalIndex) {
        // If external control forces a change, we might bypass transition or handle it
        // For now, snap to it.
        setInternalIndex(controlledIndex);
        setTransitionState({ isActive: false }); // Cancel any active transition
    }
  }, [controlledIndex]);

  const handleSlideChange = useCallback((newIndex) => {
    const nextSlide = slides[newIndex];
    if (!nextSlide) return;

    // Check if next slide has Imagination Transition
    const transType = nextSlide.transition || 'fade';
    
    if (isImaginationTransition(transType)) {
        // Start Custom Transition
        setTransitionState({
            isActive: true,
            fromIndex: currentIndex,
            toIndex: newIndex,
            type: transType,
            duration: nextSlide.transition_duration || 2
        });
        // We do NOT update internalIndex yet. 
        // We wait for Canvas to finish.
    } else {
        // Standard Transition
        setInternalIndex(newIndex);
        if (onIndexChange) onIndexChange(newIndex);
    }
  }, [currentIndex, slides, onIndexChange]);

  // Auto Play Logic
  useEffect(() => {
    if (isPlaying && currentSlide && !embedded && !transitionState.isActive) { 
      const rawDuration = parseFloat(currentSlide.duration);
      const slideDuration = (isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 5) * 1000;
      
      timerRef.current = setTimeout(() => {
        handleSlideChange((currentIndex + 1) % slides.length);
      }, slideDuration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying, embedded, transitionState.isActive, handleSlideChange, slides.length, currentSlide]);

  // Audio Logic
  useEffect(() => {
      if (audioRef.current) {
          if (!isFinite(audioRef.current.currentTime)) {
              audioRef.current.currentTime = 0;
          }
          if (isPlaying) {
              audioRef.current.play().catch(e => console.log("Audio play failed", e));
          } else {
              audioRef.current.pause();
          }
          audioRef.current.muted = isMuted;
      }
  }, [isPlaying, isMuted]);

  // Transition Completion Handler
  const handleTransitionComplete = () => {
      if (transitionState.isActive) {
          const newIndex = transitionState.toIndex;
          setInternalIndex(newIndex);
          if (onIndexChange) onIndexChange(newIndex);
          setTransitionState({ isActive: false, fromIndex: null, toIndex: null, type: null });
      }
  };

  const nextSlide = () => {
    handleSlideChange((currentIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    handleSlideChange((currentIndex - 1 + slides.length) % slides.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentSlide) return <div className="text-white text-center p-10">No slides</div>;

  // Configuration for current slide
  const activeTransitionKey = currentSlide?.transition || 'fade';
  const isImagination = isImaginationTransition(activeTransitionKey);
  
  // If we entered via Imagination, we want NO framer motion animation (it's already done by Canvas)
  // But wait, 'activeTransitionKey' is what brought us here.
  // So if isImagination is true, we use 'none'.
  const transitionVariant = isImagination ? transitions.none : (transitions[activeTransitionKey] || transitions.fade);
  
  const transitionDuration = currentSlide?.transition_duration || 1;
  
  // Configuration for animation
  let animationVariant = animations[currentSlide?.animation || 'none'] || animations.none;
  if (currentSlide?.animation === 'random') {
      animationVariant = animations.ken_burns; 
  }

  const rawSlideDuration = parseFloat(currentSlide?.duration);
  const validSlideDuration = isFinite(rawSlideDuration) && rawSlideDuration > 0 ? rawSlideDuration : 5;

  const activeTransition = {
      ...transitionVariant,
      transition: { ...transitionVariant.transition, duration: transitionDuration }
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${embedded ? 'relative w-full h-full' : 'fixed inset-0 z-50'} bg-black flex items-center justify-center overflow-hidden group`}
    >
        {/* Background Music */}
        {album.music_url && (
            <audio ref={audioRef} src={album.music_url} loop />
        )}

      {/* Main Slide Display */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Canvas Overlay for Imagination Transitions */}
        {transitionState.isActive && transitionState.type && (
            <div className="absolute inset-0 z-50">
                <TransitionCanvas 
                    prevSrc={slides[transitionState.fromIndex]?.media_url}
                    nextSrc={slides[transitionState.toIndex]?.media_url}
                    maskSrc={getImaginationAnimationPath(transitionState.type)}
                    duration={transitionState.duration}
                    onComplete={handleTransitionComplete}
                />
            </div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {/* Only render standard slides if NOT transitioning (or maybe keep them underneath?) 
              If we unmount them, we might lose state. 
              But if transitionState is active, Canvas covers everything.
              We can keep the 'from' slide visible underneath until switch happens.
          */}
          {!transitionState.isActive && (
            <motion.div
                key={`${currentIndex}-${activeTransitionKey}-${currentSlide?.animation || 'none'}`}
                variants={activeTransition}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
                style={{ zIndex: 10 }}
            >
                <div className="relative overflow-hidden flex items-center justify-center">
                    <motion.img 
                        src={currentSlide.media_url} 
                        alt="" 
                        className={`block max-w-[100vw] max-h-[100vh] w-auto h-auto object-contain ${embedded ? 'max-w-full max-h-full' : ''}`}
                        variants={animationVariant}
                        transition={{ duration: validSlideDuration + transitionDuration, ease: "linear" }}
                    />
                    
                    {currentSlide.caption && (
                        <div className="absolute bottom-10 left-0 right-0 text-center z-30 px-4 pointer-events-none">
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
          )}
        </AnimatePresence>
      </div>

      {/* Controls Overlay - Conditional */}
      {showControls && (
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between p-4 z-50">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
            {!embedded && (
                <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 text-white">
                    <h3 className="font-bold">{album.title}</h3>
                    <p className="text-xs opacity-75">{currentIndex + 1} / {slides.length}</p>
                </div>
            )}
            <div className="flex gap-2 ml-auto">
                 <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX /> : <Volume2 />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize /> : <Maximize />}
                </Button>
                {!embedded && onClose && (
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-red-500" onClick={onClose}>
                        <X />
                    </Button>
                )}
            </div>
        </div>

        {/* Center Play/Pause */}
        <div className="flex-1" />

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

            {/* Progress Bar */}
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-rose-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
      </div>
      )}
    </motion.div>
  );
}
