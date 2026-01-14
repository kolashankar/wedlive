'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedBackground - Dynamic background with multiple animation types
 * 
 * Features:
 * - Multiple animation types (fade, zoom, parallax, slow_pan, etc.)
 * - Animation speed controls
 * - Smooth transitions
 * - Performance optimized with GPU acceleration
 * - Responsive behavior
 */

export default function AnimatedBackground({
  backgroundUrl,
  animationType = 'none', // none, fade, zoom, parallax, slow_pan, floral_float, light_shimmer
  speed = 1, // 0.5 = slow, 1 = normal, 2 = fast
  overlay = true,
  overlayOpacity = 0.3,
  overlayColor = 'black',
  className = '',
  children
}) {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle scroll for parallax effect
  useEffect(() => {
    if (animationType === 'parallax') {
      const handleScroll = () => {
        setScrollY(window.scrollY);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [animationType]);

  // Handle mouse move for interactive effects
  useEffect(() => {
    if (animationType === 'parallax') {
      const handleMouseMove = (e) => {
        setMousePos({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2
        });
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [animationType]);

  // Animation variants based on type
  const getAnimationVariants = useMemo(() => {
    const duration = 10 / speed; // Base duration adjusted by speed

    switch (animationType) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { 
            opacity: [0, 1, 1, 0],
            transition: { 
              duration: duration * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }
        };

      case 'zoom':
        return {
          initial: { scale: 1 },
          animate: { 
            scale: [1, 1.1, 1],
            transition: { 
              duration: duration * 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }
        };

      case 'parallax':
        return {
          animate: {
            y: -scrollY * 0.5,
            x: mousePos.x * 20,
            transition: { type: 'spring', stiffness: 50, damping: 20 }
          }
        };

      case 'slow_pan':
        return {
          initial: { x: 0, y: 0 },
          animate: { 
            x: [0, -50, 0],
            y: [0, -30, 0],
            transition: { 
              duration: duration * 5,
              repeat: Infinity,
              ease: 'linear'
            }
          }
        };

      case 'floral_float':
        return {
          initial: { y: 0, rotate: 0 },
          animate: { 
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            transition: { 
              duration: duration * 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }
        };

      case 'light_shimmer':
        return {
          initial: { opacity: 0.8 },
          animate: { 
            opacity: [0.8, 1, 0.8],
            filter: [
              'brightness(1)',
              'brightness(1.2)',
              'brightness(1)'
            ],
            transition: { 
              duration: duration * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }
        };

      default:
        return {};
    }
  }, [animationType, speed, scrollY, mousePos]);

  // Background style
  const backgroundStyle = {
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    willChange: animationType !== 'none' ? 'transform' : 'auto'
  };

  return (
    <div className={`animated-background-container relative ${className}`}>
      {/* Animated Background Layer */}
      {backgroundUrl && (
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={backgroundStyle}
          variants={getAnimationVariants}
          initial="initial"
          animate="animate"
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 w-full h-full z-10"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity
          }}
        />
      )}

      {/* Content Layer */}
      <div className="relative z-20">
        {children}
      </div>

      {/* Performance optimization styles */}
      <style jsx>{`
        .animated-background-container {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}

/**
 * Speed presets for easy use
 */
export const AnimationSpeed = {
  SLOW: 0.5,
  NORMAL: 1,
  FAST: 2
};

/**
 * Animation type presets
 */
export const AnimationType = {
  NONE: 'none',
  FADE: 'fade',
  ZOOM: 'zoom',
  PARALLAX: 'parallax',
  SLOW_PAN: 'slow_pan',
  FLORAL_FLOAT: 'floral_float',
  LIGHT_SHIMMER: 'light_shimmer'
};
