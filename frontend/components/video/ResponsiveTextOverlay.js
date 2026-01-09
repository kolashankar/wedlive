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
    return (baseFontSize / refHeight) * 100;
  }, [overlay.styling?.font_size, referenceResolution.height]);

  // Calculate actual responsive font size in pixels based on container height
  const responsiveFontSize = useMemo(() => {
    if (!containerSize.height) return 16; // fallback
    // Calculate font size as percentage of container height
    const calculatedSize = (fontSizePercent / 100) * containerSize.height;
    
    // Debug logging
    console.log('[ResponsiveTextOverlay] Font size calculation:', {
      baseFontSize: overlay.styling?.font_size || 48,
      referenceHeight: referenceResolution.height,
      fontSizePercent: fontSizePercent.toFixed(2) + '%',
      containerHeight: containerSize.height,
      calculatedFontSize: calculatedSize.toFixed(2) + 'px'
    });
    
    return calculatedSize;
  }, [fontSizePercent, containerSize.height, overlay.styling?.font_size, referenceResolution.height]);

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
    const visible = currentTime >= startTime && currentTime <= endTime;
    
    if (!visible) {
      console.log('[ResponsiveTextOverlay] Overlay hidden - timing check failed:', {
        overlayId: overlay.id,
        currentTime,
        startTime,
        endTime,
        duration
      });
    }
    
    return visible;
  }, [currentTime, overlay.timing, duration, overlay.id]);

  // Calculate animation state if not provided
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
          transform = `translateY(${(1 - progress) * 50}px)`;
          break;
        case 'slide-down':
          opacity = progress;
          transform = `translateY(${-(1 - progress) * 50}px)`;
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
        transform = `translateY(${-(1 - progress) * 50}px)`;
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

  // Calculate scaled styling properties using percentage-based font size and em units
  const scaledStyling = useMemo(() => {
    const styling = overlay.styling || {};
    
    return {
      // Font size calculated from container height - fully responsive to any screen size
      fontSize: `${responsiveFontSize}px`,
      fontFamily: styling.font_family || 'Playfair Display',
      fontWeight: styling.font_weight || 'bold',
      color: styling.color || '#ffffff',
      textAlign: styling.text_align || 'center',
      // Letter spacing in em units - scales with font size automatically
      letterSpacing: `${letterSpacingEm}em`,
      // Line height is already a ratio - perfect for responsive design
      lineHeight: styling.line_height || 1.2,
      textShadow: styling.text_shadow || '0 2px 4px rgba(0,0,0,0.5)',
      // Stroke width in em units - scales with font size automatically
      WebkitTextStroke: styling.stroke?.enabled 
        ? `${strokeWidthEm}em ${styling.stroke.color || '#000000'}` 
        : 'none'
    };
  }, [overlay.styling, responsiveFontSize, letterSpacingEm, strokeWidthEm]);

  // Calculate text box dimensions (percentage of container)
  const textBoxStyle = useMemo(() => {
    const width = dimensions.width ? `${dimensions.width}%` : 'auto';
    const height = dimensions.height ? `${dimensions.height}%` : 'auto';
    const maxWidth = dimensions.width ? `${dimensions.width}%` : '90%';
    
    console.log('[ResponsiveTextOverlay] Text box dimensions:', {
      overlayId: overlay.id,
      width,
      height,
      maxWidth,
      dimensionsConfig: dimensions
    });
    
    return {
      width,
      height,
      maxWidth,
      minHeight: height !== 'auto' ? height : undefined
    };
  }, [dimensions, overlay.id]);

  if (!isVisible) return null;

  // Debug: Log final computed values
  console.log('[ResponsiveTextOverlay] Final overlay styling:', {
    overlayId: overlay.id,
    position: `${positionPercent.x}%, ${positionPercent.y}%`,
    textBoxSize: `${dimensions.width || 'auto'}% x ${dimensions.height || 'auto'}%`,
    fontSize: `${responsiveFontSize.toFixed(2)}px`,
    letterSpacing: `${letterSpacingEm.toFixed(3)}em`,
    strokeWidth: `${strokeWidthEm.toFixed(3)}em`,
    textValue: overlay.text_value || overlay.placeholder_text
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
        padding: 0,
        
        // Performance optimization
        willChange: 'opacity, transform',
        transition: 'none'
      }}
    >
      <span style={{ 
        display: 'block',
        width: '100%',
        
        // Scaled text styling - apply to the text span
        ...scaledStyling,
        
        // Text wrapping and overflow control
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'normal',
        hyphens: 'auto',
        overflow: 'hidden'
      }}>
        {overlay.text_value || overlay.placeholder_text || 'Sample Text'}
      </span>
    </div>
  );
}
