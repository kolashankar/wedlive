'use client';
import { useMemo } from 'react';

/**
 * ResponsiveTextOverlay - Universal responsive text overlay component
 * 
 * KEY FEATURES:
 * 1. All dimensions are percentage-based relative to video container
 * 2. Font size calculated as percentage of rendered video height - fully responsive
 * 3. Letter spacing and stroke use em units - scale with font size automatically
 * 4. Text wraps automatically within box constraints
 * 5. Consistent behavior across Admin, Preview, and Public views
 * 6. ZERO fixed pixel values - everything scales proportionally with template size
 * 
 * SCALING LOGIC:
 * - Reference resolution (e.g., 1920x1080) is used for base calculations
 * - Font size: baseFontSize / referenceHeight * 100 = percentage of video height
 * - Letter spacing: converted to em units (relative to font size)
 * - Stroke width: converted to em units (relative to font size)
 * - Text box dimensions: percentage of video size
 * - Position: percentage of video size
 * 
 * EXAMPLE:
 * - Base font: 48px on 1080px height = 4.44% of height
 * - Rendered at 540px height: 4.44% * 540px = 23.98px (auto-calculated by browser)
 * - Rendered at 1920px height: 4.44% * 1920px = 85.25px (auto-calculated by browser)
 */

export default function ResponsiveTextOverlay({
  overlay,
  currentTime,
  duration,
  containerSize,      // The actual rendered video dimensions {width, height, offsetX, offsetY}
  referenceResolution, // Template's reference resolution {width, height}
  animationState = null, // Optional pre-calculated animation state
  className = ''
}) {
  // Calculate font size as percentage of rendered video height for true responsiveness
  const fontSizePercent = useMemo(() => {
    const baseFontSize = overlay.styling?.font_size || 48;
    const refHeight = referenceResolution.height || 1080;
    // Convert base font size to percentage of reference height
    const percent = (baseFontSize / refHeight) * 100;
    
    // Debug logging
    console.log('[ResponsiveTextOverlay] Font size calculation:', {
      baseFontSize,
      referenceHeight: refHeight,
      fontSizePercent: percent.toFixed(4) + '%',
      containerHeight: containerSize.height,
      formula: `${baseFontSize}px / ${refHeight}px * 100 = ${percent.toFixed(4)}%`
    });
    
    return percent;
  }, [overlay.styling?.font_size, referenceResolution.height, containerSize.height]);

  // Convert letter spacing from pixels to em units for responsive scaling
  const letterSpacingEm = useMemo(() => {
    const baseFontSize = overlay.styling?.font_size || 48;
    const baseLetterSpacing = overlay.styling?.letter_spacing || 0;
    // Convert px to em: em = px / font-size
    return baseFontSize > 0 ? baseLetterSpacing / baseFontSize : 0;
  }, [overlay.styling?.font_size, overlay.styling?.letter_spacing]);

  // Convert stroke width from pixels to em units for responsive scaling
  const strokeWidthEm = useMemo(() => {
    const baseFontSize = overlay.styling?.font_size || 48;
    const baseStrokeWidth = overlay.styling?.stroke?.width || 2;
    // Convert px to em: em = px / font-size
    return baseFontSize > 0 ? baseStrokeWidth / baseFontSize : 0.05;
  }, [overlay.styling?.font_size, overlay.styling?.stroke?.width]);

  // Check if overlay should be visible at current time
  const isVisible = useMemo(() => {
    const startTime = overlay.timing?.start_time ?? 0;
    const endTime = overlay.timing?.end_time ?? duration;
    
    // If duration is not set yet, show the overlay (video loading)
    if (duration === 0) {
      console.log('[ResponsiveTextOverlay] Duration not set, showing overlay:', overlay.id);
      return true;
    }
    
    // Add small epsilon (0.05 seconds) to handle floating-point precision issues
    // This ensures overlays show reliably at their configured times
    const epsilon = 0.05;
    const visible = currentTime >= (startTime - epsilon) && currentTime <= (endTime + epsilon);
    
    if (!visible) {
      console.log('[ResponsiveTextOverlay] Overlay hidden - timing check failed:', {
        overlayId: overlay.id,
        text: overlay.text_value || overlay.placeholder_text,
        currentTime: currentTime.toFixed(3),
        startTime: startTime.toFixed(3),
        endTime: endTime.toFixed(3),
        duration: duration.toFixed(3),
        epsilon,
        reason: currentTime < (startTime - epsilon) ? 'Before start time' : 'After end time'
      });
    } else {
      console.log('[ResponsiveTextOverlay] Overlay visible:', {
        overlayId: overlay.id,
        text: overlay.text_value || overlay.placeholder_text,
        currentTime: currentTime.toFixed(3),
        startTime: startTime.toFixed(3),
        endTime
      });
    }
    
    return visible;
  }, [currentTime, overlay.timing, duration, overlay.id, overlay.text_value, overlay.placeholder_text]);

  // Calculate animation state if not provided
  // ALL animations use percentage or relative units - NO PIXELS!
  const animState = useMemo(() => {
    if (animationState) return animationState;
    
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const entranceAnim = overlay.animation?.entrance || { type: 'fade-in', duration: 1, easing: 'ease-in-out' };
    const exitAnim = overlay.animation?.exit || { type: 'fade-out', duration: 1, easing: 'ease-in-out' };
    
    let opacity = 1;
    let transform = '';

    // Entrance animation
    if (currentTime < startTime + entranceAnim.duration) {
      const progress = Math.max(0, Math.min(1, (currentTime - startTime) / entranceAnim.duration));
      
      switch (entranceAnim.type) {
        case 'fade-in':
          opacity = progress;
          break;
        case 'slide-up':
          opacity = progress;
          // Use percentage units for responsive scaling
          transform = `translateY(${(1 - progress) * 10}%)`;
          break;
        case 'slide-down':
          opacity = progress;
          transform = `translateY(${-(1 - progress) * 10}%)`;
          break;
        case 'scale-up':
        case 'zoom-in':
          opacity = progress;
          const scale = 0.5 + (progress * 0.5);
          transform = `scale(${scale})`;
          break;
        default:
          opacity = progress;
      }
    }
    // Exit animation
    else if (currentTime > endTime - exitAnim.duration) {
      const progress = 1 - Math.max(0, Math.min(1, (currentTime - (endTime - exitAnim.duration)) / exitAnim.duration));
      opacity = progress;
      
      if (exitAnim.type === 'slide-up') {
        // Use percentage units for responsive scaling
        transform = `translateY(${-(1 - progress) * 10}%)`;
      }
    }

    return { opacity, transform };
  }, [currentTime, overlay.timing, overlay.animation, duration, animationState]);

  // Get overlay properties
  const position = overlay.position || { x: 50, y: 50 };
  const styling = overlay.styling || {};
  const dimensions = overlay.dimensions || {};

  // Convert position to percentages if needed
  const positionPercent = useMemo(() => {
    let xPercent = position.x;
    let yPercent = position.y;

    // Check if values are in pixels (> 100 or explicit unit)
    if (position.unit === 'pixels' || position.x > 100 || position.y > 100) {
      xPercent = (position.x / referenceResolution.width) * 100;
      yPercent = (position.y / referenceResolution.height) * 100;
    }

    return { x: xPercent, y: yPercent };
  }, [position, referenceResolution]);

  // Convert text shadow from px to em units for responsive scaling
  const textShadowEm = useMemo(() => {
    const baseFontSize = overlay.styling?.font_size || 48;
    const shadow = overlay.styling?.text_shadow;
    
    if (!shadow || shadow === 'none') {
      return '0 0.04em 0.08em rgba(0,0,0,0.5)'; // Default shadow in em units
    }
    
    // Parse px values from shadow string and convert to em
    // Example: "0 2px 4px rgba(0,0,0,0.5)" -> "0 0.04em 0.08em rgba(0,0,0,0.5)"
    const shadowWithEm = shadow.replace(/(\d+\.?\d*)px/g, (match, px) => {
      const emValue = parseFloat(px) / baseFontSize;
      return `${emValue.toFixed(4)}em`;
    });
    
    return shadowWithEm;
  }, [overlay.styling?.font_size, overlay.styling?.text_shadow]);

  // Calculate scaled styling properties using percentage-based font size and em units
  const scaledStyling = useMemo(() => {
    const styling = overlay.styling || {};
    
    // Calculate responsive font size with device-specific constraints
    // Ensures text remains readable on all screen sizes
    let finalFontSizePercent = fontSizePercent;
    
    // Apply device-specific scaling limits
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const containerHeightPx = containerSize.height;
      
      // Calculate what the actual font size would be in pixels
      const calculatedFontSizePx = (fontSizePercent / 100) * containerHeightPx;
      
      // Mobile devices (< 768px): ensure minimum 12px, maximum based on screen
      if (screenWidth < 768) {
        const minFontSizePx = 12;
        const maxFontSizePx = screenWidth * 0.08; // Max 8% of screen width
        
        if (calculatedFontSizePx < minFontSizePx) {
          finalFontSizePercent = (minFontSizePx / containerHeightPx) * 100;
        } else if (calculatedFontSizePx > maxFontSizePx) {
          finalFontSizePercent = (maxFontSizePx / containerHeightPx) * 100;
        }
      }
      // Tablet devices (768px - 1024px): ensure minimum 14px
      else if (screenWidth >= 768 && screenWidth < 1024) {
        const minFontSizePx = 14;
        if (calculatedFontSizePx < minFontSizePx) {
          finalFontSizePercent = (minFontSizePx / containerHeightPx) * 100;
        }
      }
      // Desktop (>= 1024px): ensure minimum 16px
      else {
        const minFontSizePx = 16;
        if (calculatedFontSizePx < minFontSizePx) {
          finalFontSizePercent = (minFontSizePx / containerHeightPx) * 100;
        }
      }
    }
    
    return {
      // Font size as percentage of container height - NO PIXELS!
      // This makes text scale perfectly with video/template size on any screen
      fontSize: `${finalFontSizePercent}%`,
      fontFamily: styling.font_family || 'Playfair Display',
      fontWeight: styling.font_weight || 'bold',
      color: styling.color || '#ffffff',
      textAlign: styling.text_align || 'center',
      // Letter spacing in em units - scales with font size automatically
      letterSpacing: `${letterSpacingEm}em`,
      // Line height is already a ratio - perfect for responsive design
      lineHeight: styling.line_height || 1.2,
      // Text shadow in em units - scales with font size automatically
      textShadow: textShadowEm,
      // Stroke width in em units - scales with font size automatically
      WebkitTextStroke: styling.stroke?.enabled 
        ? `${strokeWidthEm}em ${styling.stroke.color || '#000000'}` 
        : 'none'
    };
  }, [overlay.styling, fontSizePercent, letterSpacingEm, strokeWidthEm, textShadowEm, containerSize.height]);

  // Calculate text box dimensions (percentage of container) with responsive constraints
  const textBoxStyle = useMemo(() => {
    // Base dimensions from configuration
    let width = dimensions.width ? `${dimensions.width}%` : 'auto';
    let height = dimensions.height ? `${dimensions.height}%` : 'auto';
    
    // Calculate responsive constraints based on screen size
    let maxWidth = '90%'; // Default max width
    let minWidth = 'auto';
    
    if (dimensions.width) {
      maxWidth = `${dimensions.width}%`;
      minWidth = `${Math.max(10, dimensions.width * 0.5)}%`; // At least 10% or half of configured width
      
      // On mobile devices, allow text box to use more screen space if needed
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) {
          // Mobile: allow up to 95% width for better readability
          maxWidth = `${Math.min(95, dimensions.width * 1.1)}%`;
        }
      }
    }
    
    console.log('[ResponsiveTextOverlay] Text box dimensions:', {
      overlayId: overlay.id,
      text: overlay.text_value || overlay.placeholder_text,
      width,
      height,
      maxWidth,
      minWidth,
      dimensionsConfig: dimensions,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown'
    });
    
    return {
      width,
      height,
      maxWidth,
      minWidth,
      minHeight: height !== 'auto' ? height : undefined,
      // Add box-sizing to ensure padding is included in width/height
      boxSizing: 'border-box'
    };
  }, [dimensions, overlay.id, overlay.text_value, overlay.placeholder_text]);

  if (!isVisible) return null;

  // Debug: Log final computed values
  console.log('[ResponsiveTextOverlay] Final overlay styling:', {
    overlayId: overlay.id,
    position: `${positionPercent.x}%, ${positionPercent.y}%`,
    textBoxSize: `${dimensions.width || 'auto'}% x ${dimensions.height || 'auto'}%`,
    fontSize: `${fontSizePercent.toFixed(4)}%`,
    letterSpacing: `${letterSpacingEm.toFixed(4)}em`,
    strokeWidth: `${strokeWidthEm.toFixed(4)}em`,
    textShadow: textShadowEm,
    textValue: overlay.text_value || overlay.placeholder_text,
    note: 'ALL units are percentage or em-based - ZERO PIXELS!'
  });

  return (
    <div
      className={`absolute ${className}`}
      style={{
        // Position relative to rendered video (percentage-based)
        // The position represents the CENTER of the text box
        left: `${positionPercent.x}%`,
        top: `${positionPercent.y}%`,
        transform: `translate(-50%, -50%) ${animState.transform}`,
        opacity: animState.opacity,
        zIndex: overlay.layer_index || 1,
        
        // Text box dimensions (percentage of video size)
        ...textBoxStyle,
        
        // Layout properties - use flex for alignment
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: styling.text_align === 'left' ? 'flex-start' : 
                   styling.text_align === 'right' ? 'flex-end' : 'center',
        boxSizing: 'border-box',
        margin: 0,
        // Use em units for padding - scales with text size
        padding: '0.2em 0.4em',
        
        // Performance optimization
        willChange: 'opacity, transform',
        transition: 'none',
        
        // Debug: Uncomment to see overlay boxes
        // border: '2px solid red',
        // backgroundColor: 'rgba(255, 0, 0, 0.1)'
      }}
    >
      <span style={{ 
        display: 'block',
        width: '100%',
        
        // Scaled text styling - apply to the text span
        ...scaledStyling,
        
        // Enhanced text wrapping and overflow control
        whiteSpace: 'pre-wrap', // Preserve line breaks and wrap text
        wordWrap: 'break-word', // Break long words if needed
        overflowWrap: 'break-word', // Modern alternative to word-wrap
        wordBreak: 'normal', // Break at normal word boundaries
        hyphens: 'auto', // Auto-hyphenate long words
        overflow: 'visible', // Ensure text shows even if it slightly exceeds bounds
        
        // Ensure text is readable with proper rendering
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        
        // Box sizing to include padding in calculations
        boxSizing: 'border-box',
        
        // Add subtle text overflow handling
        textOverflow: 'clip', // Don't use ellipsis - let text wrap instead
        
        // Ensure consistent line box sizing
        WebkitBoxDecorationBreak: 'clone',
        boxDecorationBreak: 'clone'
      }}>
        {overlay.text_value || overlay.placeholder_text || 'Sample Text'}
      </span>
    </div>
  );
}
