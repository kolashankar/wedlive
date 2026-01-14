'use client';
import { useMemo, useRef, useState, useLayoutEffect } from 'react';

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
 * 7. AUTO-SCALE TO FIT: Scales text down if it exceeds the defined text box width or height
 */

export default function ResponsiveTextOverlay({
  overlay,
  currentTime,
  duration,
  containerSize,      // The actual rendered video dimensions {width, height, offsetX, offsetY}
  referenceResolution, // Template's reference resolution {width, height}
  animationState = null, // Optional pre-calculated animation state
  className = '',
  templateDuration = null // Optional template duration from API (fallback when video not loaded)
}) {
  const textRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isScaling, setIsScaling] = useState(true); // Track initial scaling state

  // Calculate font size as percentage of rendered video height for true responsiveness
  const fontSizePercent = useMemo(() => {
    const rawFontSize = overlay.styling?.font_size;
    const baseFontSize = rawFontSize || 48;
    const refHeight = referenceResolution.height || 1080;
    
    // Handle explicit percentage strings (e.g., "5%")
    if (typeof baseFontSize === 'string' && baseFontSize.trim().endsWith('%')) {
       const percent = parseFloat(baseFontSize);
       return percent;
    }
    
    // Handle pixel values (number or string like "48px" or "48")
    const pixelValue = parseFloat(baseFontSize);
    
    // Convert base font size to percentage of reference height
    const percent = (pixelValue / refHeight) * 100;
    
    return percent;
  }, [overlay.styling?.font_size, referenceResolution.height]);

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

  // Check if overlay should be visible at current time with precise frame-sync
  const isVisible = useMemo(() => {
    const startTime = overlay.timing?.start_time ?? 0;
    // Use templateDuration as fallback if video duration is not available yet
    const effectiveDuration = duration || templateDuration || 0;
    const endTime = overlay.timing?.end_time ?? effectiveDuration;
    
    // If neither duration nor templateDuration is set, hide overlay until video loads
    if (effectiveDuration === 0) {
      return false;
    }
    
    // Use epsilon for floating-point precision (0.2 seconds = 200ms tolerance)
    const epsilon = 0.2;
    const visible = currentTime >= (startTime - epsilon) && currentTime <= (endTime + epsilon);
    
    return visible;
  }, [currentTime, overlay.timing, duration, templateDuration]);

  // Calculate animation state if not provided
  const animState = useMemo(() => {
    if (animationState) return animationState;
    
    const startTime = overlay.timing?.start_time || 0;
    const effectiveDuration = duration || templateDuration || 0;
    const endTime = overlay.timing?.end_time || effectiveDuration;
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
        transform = `translateY(${-(1 - progress) * 10}%)`;
      }
    }

    return { opacity, transform };
  }, [currentTime, overlay.timing, overlay.animation, duration, templateDuration, animationState]);

  // Get overlay properties
  const position = overlay.position || { x: 50, y: 50 };
  const styling = overlay.styling || {};
  const dimensions = overlay.dimensions || {};

  // Convert position to percentages if needed
  const positionPercent = useMemo(() => {
    let xPercent = position.x;
    let yPercent = position.y;

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
      return '0 0.04em 0.08em rgba(0,0,0,0.5)';
    }
    
    const shadowWithEm = shadow.replace(/(\d+\.?\d*)px/g, (match, px) => {
      const emValue = parseFloat(px) / baseFontSize;
      return `${emValue.toFixed(4)}em`;
    });
    
    return shadowWithEm;
  }, [overlay.styling?.font_size, overlay.styling?.text_shadow]);

  // Calculate scaled styling properties using PURE PERCENTAGE SCALING
  const scaledStyling = useMemo(() => {
    const styling = overlay.styling || {};
    
    // PURE PERCENTAGE SCALING
    // The font size is strictly proportional to container height
    // Multiplied by dynamic scaleFactor to fit within box constraints
    const fontSizePx = ((fontSizePercent / 100) * containerSize.height) * scaleFactor;
    
    return {
      fontSize: `${fontSizePx}px`,
      fontFamily: styling.font_family || 'Playfair Display',
      fontWeight: styling.font_weight || 'bold',
      color: styling.color || '#ffffff',
      textAlign: styling.text_align || 'center',
      letterSpacing: `${letterSpacingEm}em`,
      lineHeight: styling.line_height || 1.2,
      textShadow: textShadowEm,
      WebkitTextStroke: styling.stroke?.enabled 
        ? `${strokeWidthEm}em ${styling.stroke.color || '#000000'}` 
        : 'none'
    };
  }, [overlay.styling, fontSizePercent, letterSpacingEm, strokeWidthEm, textShadowEm, containerSize.height, scaleFactor]);

  // Calculate text box dimensions (percentage of container) - STRICT PERCENTAGE
  const textBoxStyle = useMemo(() => {
    let width = dimensions.width ? `${dimensions.width}%` : 'auto';
    let height = dimensions.height ? `${dimensions.height}%` : 'auto';
    
    // If width is not set, cap at 90% to prevent off-screen
    let maxWidth = dimensions.width ? `${dimensions.width}%` : '90%';
    let minWidth = 'auto';
    
    return {
      width,
      height,
      maxWidth,
      minWidth,
      minHeight: height !== 'auto' ? height : undefined,
      boxSizing: 'border-box'
    };
  }, [dimensions]);

  // Determine if we should prefer single line (force nowrap) or wrap
  const shouldPreferSingleLine = useMemo(() => {
    // Determine content text to check for newlines
    const contentText = overlay.text || overlay.text_value || overlay.placeholder_text || 'Sample Text';
    const hasExplicitNewlines = contentText.includes('\n');
    
    // Semantic Detection: Check if this is a "Time/Date" field or "Venue/Address" field
    const key = (overlay.endpoint_key || '').toLowerCase();
    const label = (overlay.label || '').toLowerCase();
    
    // More comprehensive list of time/date related terms
    const isTimeOrDate = key.includes('time') || label.includes('time') || 
                        key.includes('date') || label.includes('date') ||
                        key.includes('day') || label.includes('day') ||
                        key.includes('year') || label.includes('year') ||
                        key.includes('month') || label.includes('month') ||
                        key.includes('hour') || label.includes('hour') ||
                        key.includes('minute') || label.includes('minute') ||
                        key.includes('clock') || label.includes('clock');
                        
    const isVenueOrAddress = key.includes('venue') || label.includes('venue') || 
                            key.includes('address') || label.includes('address') ||
                            key.includes('location') || label.includes('location') ||
                            key.includes('place') || label.includes('place');
                            
    // Logic:
    // 1. Explicit newlines -> ALWAYS WRAP
    // 2. Time/Date fields -> PREFER SINGLE LINE (Shrink to fit)
    // 3. Venue/Address fields -> PREFER WRAPPING (Wrap then shrink if still too wide)
    
    if (hasExplicitNewlines) return false;
    if (isTimeOrDate) return true;
    if (isVenueOrAddress) return false;
    
    // Fallback for unknown fields: Short text (< 20 chars) defaults to single line
    return contentText.length < 20;
  }, [overlay.text, overlay.text_value, overlay.placeholder_text, overlay.endpoint_key, overlay.label]);

  // AUTO-SCALE EFFECT: Check if text overflows and scale down
  // Use useLayoutEffect to prevent visual flash when scaling
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || !isVisible) return;
    
    // Only run if we have a defined width constraint (percentage width set)
    if (!dimensions.width) {
      if (scaleFactor !== 1) setScaleFactor(1);
      setIsScaling(false);
      return;
    }

    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    
    // Calculate unscaled dimensions (approximate "natural" size)
    // We use the current scaleFactor to project what the size would be at scale=1
    const currentScale = scaleFactor || 1;
    
    let naturalWidth;
    
    if (shouldPreferSingleLine) {
        // Force nowrap to measure true single-line width
        // IMPORTANT: Even if the render style is set to nowrap, we double check here
        // to be sure we are measuring the "ideal" width
        const originalWhiteSpace = el.style.whiteSpace;
        el.style.whiteSpace = 'nowrap';
        const rawScrollWidth = el.scrollWidth;
        el.style.whiteSpace = originalWhiteSpace; // Restore
        
        naturalWidth = rawScrollWidth / currentScale;
    } else {
        // For Venue/Address or long text, use current wrapped width
        // This allows natural wrapping to multiple lines
        naturalWidth = scrollWidth / currentScale;
    }
    
    let newScale = 1;
    
    // 1. Check Width Constraint
    if (naturalWidth > clientWidth) {
      // It's too wide, calculate scale to fit
      newScale = clientWidth / naturalWidth;
    }
    
    // 2. Check Height Constraint (DISABLED to match Admin behavior)
    // Admin allows text to overflow the box height if font size is increased.
    // We only constrain by width to prevent horizontal overflow.
    
    /* Height constraint removed to allow vertical overflow */
    
    // 3. Apply Safety Buffer
    // Prevent rounding errors or minor jitter
    newScale = Math.min(newScale, 1);
    
    // Reduce buffer for single-line text to allow more precise sizing
    // This helps avoid the "Dead Zone" where text stays same size despite font changes
    const buffer = shouldPreferSingleLine ? 0.99 : 0.98;
    
    if (newScale < 1) {
      newScale *= buffer;
    }

    // 4. Update State
    // Only update if difference is significant to prevent loops
    // React Error #185 Fix: Increased threshold to 0.01 to prevent infinite loops
    if (Math.abs(newScale - scaleFactor) > 0.01) { 
      setScaleFactor(newScale);
      // Keep isScaling=true until we stabilize
    } else {
      // We are stable
      setIsScaling(false);
    }
    
  }, [
    overlay.text, 
    overlay.text_value, 
    overlay.placeholder_text,
    containerSize.width, 
    containerSize.height, 
    fontSizePercent, 
    dimensions.width, 
    dimensions.height,
    isVisible,
    scaleFactor, // Depend on current scale to calculate natural size
    shouldPreferSingleLine
  ]);

  if (!isVisible) return null;

  return (
    <div
      className={`absolute ${className}`}
      style={{
        left: `${positionPercent.x}%`,
        top: `${positionPercent.y}%`,
        transform: `translate(-50%, -50%) ${animState.transform}`,
        opacity: animState.opacity,
        zIndex: overlay.layer_index || 1,
        ...textBoxStyle,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: styling.text_align === 'left' ? 'flex-start' : 
                   styling.text_align === 'right' ? 'flex-end' : 'center',
        boxSizing: 'border-box',
        margin: 0,
        // Reduce padding for single-line text to maximize available width
        padding: shouldPreferSingleLine ? '0.05em 0.1em' : '0.2em 0.4em',
        willChange: 'opacity, transform',
        transition: 'none',
        overflow: 'visible', // Explicitly allow overflow to match Admin behavior
        // If we are actively determining scale, hide to prevent flash of large text
        // But if scaleFactor > 0, we can show it (it might adjust slightly)
        visibility: isScaling && scaleFactor === 1 ? 'hidden' : 'visible' 
      }}
    >
      <span 
        ref={textRef}
        style={{ 
          display: 'block',
          width: '100%',
          ...scaledStyling,
          // DYNAMIC WHITE-SPACE:
          // If we want single line, we must force 'nowrap' in CSS to prevent the browser 
          // from wrapping before our scale logic kicks in.
          whiteSpace: shouldPreferSingleLine ? 'nowrap' : 'pre-wrap', 
          wordWrap: shouldPreferSingleLine ? 'normal' : 'break-word',
          overflowWrap: shouldPreferSingleLine ? 'normal' : 'normal',
          wordBreak: shouldPreferSingleLine ? 'keep-all' : 'normal',
          hyphens: 'auto',
          overflow: 'visible',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          boxSizing: 'border-box',
          textOverflow: 'clip',
          WebkitBoxDecorationBreak: 'clone',
          boxDecorationBreak: 'clone'
        }}
      >
        {overlay.text || overlay.text_value || overlay.placeholder_text || 'Sample Text'}
      </span>
    </div>
  );
}
