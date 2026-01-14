'use client';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

const HANDLE_SIZE = 12;
const MIN_OVERLAY_WIDTH = 50;
const MIN_OVERLAY_HEIGHT = 20;

/**
 * Coordinate System:
 * - Canvas renders at video's actual resolution (from template video_data)
 * - Overlays stored as percentages (0-100) in database
 * - Convert percentage to pixels for canvas rendering
 * - Convert pixels back to percentage when updating position
 * 
 * CRITICAL: Canvas dimensions MUST match video aspect ratio for correct overlay positioning
 */

export default function InteractiveOverlayCanvas({
  overlays = [],
  currentTime,
  duration,
  selectedOverlay,
  showOverlays = true,
  onSelectOverlay,
  onUpdateOverlay,
  containerRef,
  videoResolution = null  // { width, height } from template.video_data
}) {
  // Use video's actual resolution if provided, otherwise default to 1920x1080
  const CANVAS_WIDTH = videoResolution?.width || 1920;
  const CANVAS_HEIGHT = videoResolution?.height || 1080;
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [overlayStart, setOverlayStart] = useState({ x: 0, y: 0 });
  const [hoveredOverlay, setHoveredOverlay] = useState(null);
  const [overlayDimensions, setOverlayDimensions] = useState({});
  const [shiftPressed, setShiftPressed] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Check if fonts are loaded
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    } else {
      // Fallback for browsers that don't support font loading API
      setFontsLoaded(true);
    }
  }, []);

  // Convert percentage position to canvas pixels
  const percentToPixels = useCallback((percentPos) => {
    const x = percentPos.x !== undefined ? percentPos.x : 50;
    const y = percentPos.y !== undefined ? percentPos.y : 50;
    
    return {
      x: (x / 100) * CANVAS_WIDTH,
      y: (y / 100) * CANVAS_HEIGHT
    };
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Convert canvas pixels to percentage position
  const pixelsToPercent = useCallback((pixelPos) => {
    return {
      x: Math.round(((pixelPos.x / CANVAS_WIDTH) * 100) * 100) / 100,
      y: Math.round(((pixelPos.y / CANVAS_HEIGHT) * 100) * 100) / 100,
      unit: 'percent'
    };
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Helper function for resize handles
  const getResizeHandles = useCallback((x, y, width, height) => {
    return [
      { x: x, y: y, cursor: 'nw-resize', position: 'nw' },
      { x: x + width / 2, y: y, cursor: 'n-resize', position: 'n' },
      { x: x + width, y: y, cursor: 'ne-resize', position: 'ne' },
      { x: x + width, y: y + height / 2, cursor: 'e-resize', position: 'e' },
      { x: x + width, y: y + height, cursor: 'se-resize', position: 'se' },
      { x: x + width / 2, y: y + height, cursor: 's-resize', position: 's' },
      { x: x, y: y + height, cursor: 'sw-resize', position: 'sw' },
      { x: x, y: y + height / 2, cursor: 'w-resize', position: 'w' }
    ];
  }, []);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Implement undo logic
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Implement redo logic
    }
  }, [historyIndex, history.length]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setShiftPressed(true);
      
      if (!selectedOverlay) return;

      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // Handled by parent component
      }

      // Arrow keys for fine adjustment
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1; // pixels
        const position = { ...selectedOverlay.position };
        const pixelPos = percentToPixels(position);
        
        switch (e.key) {
          case 'ArrowLeft':
            pixelPos.x -= step;
            break;
          case 'ArrowRight':
            pixelPos.x += step;
            break;
          case 'ArrowUp':
            pixelPos.y -= step;
            break;
          case 'ArrowDown':
            pixelPos.y += step;
            break;
        }
        
        // Convert back to percentage
        const newPercentPos = pixelsToPercent(pixelPos);
        onUpdateOverlay(selectedOverlay.id, { 
          position: { ...position, ...newPercentPos }
        });
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedOverlay, shiftPressed, onUpdateOverlay, handleUndo, handleRedo]);

  // Helper function to wrap text into multiple lines based on max width
  const wrapText = useCallback((ctx, text, maxWidth, letterSpacing = 0) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      let testWidth = ctx.measureText(testLine).width;
      
      // Add letter spacing to width calculation
      if (letterSpacing > 0) {
        testWidth += letterSpacing * (testLine.length - 1);
      }

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }, []);

  // Measure text dimensions for each overlay with word wrapping support
  useEffect(() => {
    if (!fontsLoaded) return; // Wait for fonts to be ready
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dimensions = {};

    overlays.forEach(overlay => {
      const text = overlay.placeholder_text || overlay.endpoint_key || 'Sample Text';
      const styling = overlay.styling || {};
      const dimensions_data = overlay.dimensions || {};
      
      const fontSize = styling.font_size || 48;
      const fontWeight = styling.font_weight || 'normal';
      const fontFamily = styling.font_family || 'Arial';
      const letterSpacing = styling.letter_spacing || 0;
      const lineHeight = styling.line_height || 1.2;
      
      // Get text box width - default to auto-width if not set
      const boxWidthPercent = dimensions_data.width || null;
      const boxWidth = boxWidthPercent ? (boxWidthPercent / 100) * CANVAS_WIDTH : null;
      
      // Get text box height - if explicitly set, use it; otherwise calculate
      const boxHeightPercent = dimensions_data.height || null;
      const explicitHeight = boxHeightPercent ? (boxHeightPercent / 100) * CANVAS_HEIGHT : null;
      
      // Wrap font family in quotes if it contains spaces for proper canvas rendering
      const formattedFontFamily = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
      ctx.font = `${fontWeight} ${fontSize}px ${formattedFontFamily}`;
      
      let width, height;
      let wrappedLines = [text]; // Default to single line
      
      if (boxWidth) {
        // Word wrap text within the box width
        wrappedLines = wrapText(ctx, text, boxWidth, letterSpacing);
        width = boxWidth;
        
        // Use explicit height if set, otherwise calculate based on text
        if (explicitHeight) {
          height = explicitHeight;
        } else {
          height = wrappedLines.length * fontSize * lineHeight;
        }
      } else {
        // Auto-width: single line
        const metrics = ctx.measureText(text);
        width = metrics.width;
        if (letterSpacing > 0) {
          width += letterSpacing * (text.length - 1);
        }
        
        // Use explicit height if set, otherwise calculate
        if (explicitHeight) {
          height = explicitHeight;
        } else {
          height = fontSize * lineHeight;
        }
      }
      
      dimensions[overlay.id] = {
        width: width,
        height: height,
        baseline: fontSize,
        lines: wrappedLines,
        lineHeight: fontSize * lineHeight
      };
    });

    setOverlayDimensions(dimensions);
  }, [overlays, wrapText, fontsLoaded, CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Helper functions for rendering
  const renderTextWithLetterSpacing = useCallback((ctx, text, x, y, spacing, isStroke) => {
    const chars = text.split('');
    let currentX = x;
    
    // Calculate total width for alignment
    const totalWidth = chars.reduce((width, char) => {
      return width + ctx.measureText(char).width + spacing;
    }, -spacing);
    
    // Adjust starting position based on text align
    if (ctx.textAlign === 'center') {
      currentX = x - totalWidth / 2;
    } else if (ctx.textAlign === 'right') {
      currentX = x - totalWidth;
    }
    
    // Render each character
    chars.forEach((char) => {
      if (isStroke) {
        ctx.strokeText(char, currentX, y);
      } else {
        ctx.fillText(char, currentX, y);
      }
      currentX += ctx.measureText(char).width + spacing;
    });
  }, []);

  const applyEasing = useCallback((t, easing) => {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'cubic-bezier(0.68, -0.55, 0.265, 1.55)': // Bounce
        const c1 = 0.68;
        const c2 = -0.55;
        const c3 = 0.265;
        const c4 = 1.55;
        return (1 - t) * (1 - t) * (1 - t) * 0 + 3 * (1 - t) * (1 - t) * t * c2 + 3 * (1 - t) * t * t * c4 + t * t * t * 1;
      default:
        return t;
    }
  }, []);

  const applyAnimationType = useCallback((type, progress, isEntrance) => {
    const state = { opacity: 1, scale: 1, rotation: 0, translateX: 0, translateY: 0 };
    const inverseProgress = 1 - progress;
    const p = isEntrance ? progress : inverseProgress;

    switch (type) {
      case 'fade-in':
      case 'fade-out':
        state.opacity = p;
        break;
      
      case 'slide-up':
        state.opacity = p;
        state.translateY = isEntrance ? -(100 * inverseProgress) : (100 * progress);
        break;
      
      case 'slide-down':
        state.opacity = p;
        state.translateY = isEntrance ? (100 * inverseProgress) : -(100 * progress);
        break;
      
      case 'slide-left':
        state.opacity = p;
        state.translateX = isEntrance ? -(100 * inverseProgress) : (100 * progress);
        break;
      
      case 'slide-right':
        state.opacity = p;
        state.translateX = isEntrance ? (100 * inverseProgress) : -(100 * progress);
        break;
      
      case 'scale-up':
        state.opacity = p;
        state.scale = isEntrance ? (0.5 + 0.5 * progress) : (0.5 + 0.5 * inverseProgress);
        break;
      
      case 'scale-down':
        state.opacity = p;
        state.scale = isEntrance ? (1.5 - 0.5 * progress) : (1.5 - 0.5 * inverseProgress);
        break;
      
      case 'zoom-in':
        state.opacity = p;
        state.scale = isEntrance ? progress : inverseProgress;
        break;
      
      case 'bounce-in':
      case 'bounce-out':
        state.opacity = p;
        const bounceProgress = isEntrance ? progress : inverseProgress;
        state.scale = 1 + Math.sin(bounceProgress * Math.PI * 3) * 0.1 * (1 - bounceProgress);
        break;
      
      case 'rotate-in':
        state.opacity = p;
        state.rotation = isEntrance ? (Math.PI * 2 * inverseProgress) : (Math.PI * 2 * progress);
        state.scale = p;
        break;
      
      case 'spin':
        state.opacity = p;
        state.rotation = isEntrance ? (Math.PI * 4 * inverseProgress) : (Math.PI * 4 * progress);
        break;
      
      case 'blur-in':
      case 'blur-out':
        state.opacity = p;
        state.scale = 1 - (inverseProgress * 0.05);
        break;
      
      case 'fade-slide-up':
        state.opacity = p;
        state.translateY = isEntrance ? -(50 * inverseProgress) : (50 * progress);
        break;
      
      case 'scale-fade':
        state.opacity = p;
        state.scale = isEntrance ? (0.8 + 0.2 * progress) : (0.8 + 0.2 * inverseProgress);
        break;
      
      case 'typewriter':
        state.opacity = 1;
        // Typewriter effect would need special handling in text rendering
        break;
      
      default:
        state.opacity = p;
    }

    return state;
  }, []);

  const calculateAnimationState = useCallback((overlay, time) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const entranceAnim = overlay.animation?.entrance || { type: 'fade-in', duration: 1, easing: 'ease-in-out' };
    const exitAnim = overlay.animation?.exit || { type: 'fade-out', duration: 1, easing: 'ease-in-out' };
    
    let state = {
      opacity: 1,
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0
    };

    // Entrance animation
    if (time < startTime + entranceAnim.duration) {
      const progress = Math.min(1, (time - startTime) / entranceAnim.duration);
      const easedProgress = applyEasing(progress, entranceAnim.easing);
      state = applyAnimationType(entranceAnim.type, easedProgress, true);
    }
    // Exit animation
    else if (time > endTime - exitAnim.duration) {
      const progress = Math.min(1, (time - (endTime - exitAnim.duration)) / exitAnim.duration);
      const easedProgress = applyEasing(progress, exitAnim.easing);
      state = applyAnimationType(exitAnim.type, easedProgress, false);
    }

    return state;
  }, [duration, applyEasing, applyAnimationType]);

  const renderOverlay = useCallback((ctx, overlay) => {
    const text = overlay.placeholder_text || overlay.endpoint_key || 'Sample Text';
    const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
    const styling = overlay.styling || {};
    const dims = overlayDimensions[overlay.id];

    // Convert percentage position to canvas pixels
    const pixelPos = percentToPixels(position);

    // Set font
    const fontSize = styling.font_size || 48;
    const fontWeight = styling.font_weight || 'normal';
    const fontFamily = styling.font_family || 'Arial';
    const letterSpacing = styling.letter_spacing || 0;
    const lineHeight = styling.line_height || 1.2;
    const textAlign = styling.text_align || 'center';
    
    // Wrap font family in quotes if it contains spaces for proper canvas rendering
    const formattedFontFamily = fontFamily.includes(' ') ? `"${fontFamily}"` : fontFamily;
    ctx.font = `${fontWeight} ${fontSize}px ${formattedFontFamily}`;
    ctx.fillStyle = styling.color || '#ffffff';
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    // Calculate animation progress and transformations
    const animState = calculateAnimationState(overlay, currentTime);
    
    // Get wrapped lines from dimensions
    const lines = dims?.lines || [text];
    const totalHeight = dims?.height || fontSize * lineHeight;
    const lineHeightPx = fontSize * lineHeight;
    
    // Save context for transformations
    ctx.save();
    
    // Apply animation transformations at pixel position
    ctx.translate(pixelPos.x, pixelPos.y);
    ctx.globalAlpha = animState.opacity;
    ctx.scale(animState.scale, animState.scale);
    ctx.rotate(animState.rotation);
    ctx.translate(animState.translateX, animState.translateY);

    // Calculate starting Y position for multi-line text (centered vertically)
    const startY = -(totalHeight / 2) + (lineHeightPx / 2);

    // Render each line of text
    lines.forEach((line, index) => {
      const yPos = startY + (index * lineHeightPx);
      
      // Apply stroke if enabled
      if (styling.stroke?.enabled) {
        ctx.strokeStyle = styling.stroke.color || '#000000';
        ctx.lineWidth = styling.stroke.width || 2;
        
        // Apply letter spacing for stroke
        if (letterSpacing > 0) {
          renderTextWithLetterSpacing(ctx, line, 0, yPos, letterSpacing, true);
        } else {
          ctx.strokeText(line, 0, yPos);
        }
      }

      // Add text shadow
      if (styling.text_shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      // Render text with letter spacing
      if (letterSpacing > 0) {
        renderTextWithLetterSpacing(ctx, line, 0, yPos, letterSpacing, false);
      } else {
        ctx.fillText(line, 0, yPos);
      }
    });

    // Reset
    ctx.restore();
  }, [currentTime, calculateAnimationState, renderTextWithLetterSpacing, percentToPixels, overlayDimensions]);

  const renderSelectionBox = useCallback((ctx, overlay) => {
    const dims = overlayDimensions[overlay.id];
    if (!dims) return;

    const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
    const pixelPos = percentToPixels(position);
    const padding = 10;
    
    // Calculate bounding box - always centered for multi-line text
    const boxX = pixelPos.x - dims.width / 2 - padding;
    const boxY = pixelPos.y - dims.height / 2 - padding;
    const boxWidth = dims.width + padding * 2;
    const boxHeight = dims.height + padding * 2;

    // Draw text box background (semi-transparent)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Draw selection box
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.setLineDash([]);

    // Draw resize handles
    const handles = getResizeHandles(boxX, boxY, boxWidth, boxHeight);
    handles.forEach(handle => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    });

    // Draw position and size label
    const dimensions_data = overlay.dimensions || {};
    const widthPercent = dimensions_data.width ? dimensions_data.width.toFixed(1) : 'auto';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillRect(boxX, boxY - 25, 180, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`(${position.x?.toFixed(1)}%, ${position.y?.toFixed(1)}%) W:${widthPercent}%`, boxX + 5, boxY - 23);
  }, [overlayDimensions, getResizeHandles, percentToPixels]);

  const renderHoverEffect = useCallback((ctx, overlay) => {
    const dims = overlayDimensions[overlay.id];
    if (!dims) return;

    const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
    const pixelPos = percentToPixels(position);
    const padding = 10;
    
    // Always center the box
    const boxX = pixelPos.x - dims.width / 2 - padding;
    const boxY = pixelPos.y - dims.height / 2 - padding;
    const boxWidth = dims.width + padding * 2;
    const boxHeight = dims.height + padding * 2;

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.setLineDash([]);
  }, [overlayDimensions, percentToPixels]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter visible overlays at current time - with floating-point tolerance
    const visibleOverlays = overlays.filter(overlay => {
      const startTime = overlay.timing?.start_time || 0;
      const endTime = overlay.timing?.end_time || duration;
      // Small epsilon (0.016 seconds ~= 1 frame at 60fps) for precise timing
      const epsilon = 0.016;
      return currentTime >= (startTime - epsilon) && currentTime <= (endTime + epsilon);
    });

    // Sort by layer index
    visibleOverlays.sort((a, b) => (a.layer_index || 0) - (b.layer_index || 0));

    // Render each overlay
    visibleOverlays.forEach(overlay => {
      renderOverlay(ctx, overlay);
    });

    // Render selection box and handles for selected overlay
    if (selectedOverlay && overlayDimensions[selectedOverlay.id]) {
      renderSelectionBox(ctx, selectedOverlay);
    }

    // Render hover effect
    if (hoveredOverlay && hoveredOverlay.id !== selectedOverlay?.id && overlayDimensions[hoveredOverlay.id]) {
      renderHoverEffect(ctx, hoveredOverlay);
    }
  }, [currentTime, overlays, duration, selectedOverlay, hoveredOverlay, overlayDimensions, renderOverlay, renderSelectionBox, renderHoverEffect]);

  useEffect(() => {
    if (!showOverlays) return;
    renderCanvas();
  }, [showOverlays, renderCanvas]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getOverlayAtPosition = (x, y) => {
    // Check in reverse order (top layers first)
    const visibleOverlays = overlays.filter(overlay => {
      const startTime = overlay.timing?.start_time || 0;
      const endTime = overlay.timing?.end_time || duration;
      // Small epsilon (0.016 seconds ~= 1 frame at 60fps) for precise timing
      const epsilon = 0.016;
      return currentTime >= (startTime - epsilon) && currentTime <= (endTime + epsilon);
    }).sort((a, b) => (b.layer_index || 0) - (a.layer_index || 0));

    for (const overlay of visibleOverlays) {
      const dims = overlayDimensions[overlay.id];
      if (!dims) continue;

      const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
      const pixelPos = percentToPixels(position);
      const padding = 10;
      
      // Always center the box
      const boxX = pixelPos.x - dims.width / 2 - padding;
      const boxY = pixelPos.y - dims.height / 2 - padding;
      const boxWidth = dims.width + padding * 2;
      const boxHeight = dims.height + padding * 2;

      if (x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight) {
        return overlay;
      }
    }

    return null;
  };

  const getResizeHandleAtPosition = (x, y, overlay) => {
    const dims = overlayDimensions[overlay.id];
    if (!dims) return null;

    const position = overlay.position || { x: 50, y: 50, unit: 'percent' };
    const pixelPos = percentToPixels(position);
    const padding = 10;
    
    // Always center the box
    const boxX = pixelPos.x - dims.width / 2 - padding;
    const boxY = pixelPos.y - dims.height / 2 - padding;
    const boxWidth = dims.width + padding * 2;
    const boxHeight = dims.height + padding * 2;

    const handles = getResizeHandles(boxX, boxY, boxWidth, boxHeight);
    
    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
      );
      
      if (distance <= HANDLE_SIZE) {
        return handle;
      }
    }

    return null;
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);
    
    // Check if clicking on a resize handle of the selected overlay
    if (selectedOverlay) {
      const handle = getResizeHandleAtPosition(coords.x, coords.y, selectedOverlay);
      if (handle) {
        const pixelPos = percentToPixels(selectedOverlay.position);
        const dims = overlayDimensions[selectedOverlay.id];
        const dimensions_data = selectedOverlay.dimensions || {};
        
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart(coords);
        setOverlayStart({
          x: pixelPos.x,
          y: pixelPos.y,
          fontSize: selectedOverlay.styling?.font_size || 48,
          width: dims?.width || 200,
          height: dims?.height || 100,
          widthPercent: dimensions_data.width || ((dims?.width || 200) / CANVAS_WIDTH * 100),
          heightPercent: dimensions_data.height || ((dims?.height || 100) / CANVAS_HEIGHT * 100),
          percentX: selectedOverlay.position.x,
          percentY: selectedOverlay.position.y
        });
        return;
      }
    }

    // Check if clicking on an overlay
    const clickedOverlay = getOverlayAtPosition(coords.x, coords.y);
    
    if (clickedOverlay) {
      onSelectOverlay(clickedOverlay);
      const pixelPos = percentToPixels(clickedOverlay.position);
      setIsDragging(true);
      setDragStart(coords);
      setOverlayStart({
        x: pixelPos.x,
        y: pixelPos.y,
        percentX: clickedOverlay.position.x,
        percentY: clickedOverlay.position.y
      });
    } else {
      onSelectOverlay(null);
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resizing
    if (isResizing && selectedOverlay && resizeHandle) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      
      const dims = overlayDimensions[selectedOverlay.id];
      if (!dims) return;

      const handle = resizeHandle.position;
      let newWidth = overlayStart.width;
      let newHeight = overlayStart.height;
      
      // Proportional resizing with shift key
      if (shiftPressed) {
        // Use diagonal resize for proportional scaling
        const avgDelta = (dx + dy) / 2;
        newWidth = Math.max(MIN_OVERLAY_WIDTH, overlayStart.width + avgDelta);
        newHeight = Math.max(MIN_OVERLAY_HEIGHT, overlayStart.height + avgDelta);
      } else {
        // Resize width based on horizontal handles
        if (handle.includes('e')) {
          // Resize from right edge
          newWidth = Math.max(MIN_OVERLAY_WIDTH, overlayStart.width + dx);
        } else if (handle.includes('w')) {
          // Resize from left edge
          newWidth = Math.max(MIN_OVERLAY_WIDTH, overlayStart.width - dx);
        }

        // Resize height based on vertical handles
        if (handle.includes('s')) {
          // Resize from bottom edge
          newHeight = Math.max(MIN_OVERLAY_HEIGHT, overlayStart.height + dy);
        } else if (handle.includes('n')) {
          // Resize from top edge
          newHeight = Math.max(MIN_OVERLAY_HEIGHT, overlayStart.height - dy);
        }
      }

      // Convert dimensions to percentage
      const newWidthPercent = (newWidth / CANVAS_WIDTH) * 100;
      const newHeightPercent = (newHeight / CANVAS_HEIGHT) * 100;

      // Update overlay with new dimensions (NOT font size)
      onUpdateOverlay(selectedOverlay.id, {
        dimensions: {
          width: Math.round(newWidthPercent * 100) / 100,
          height: Math.round(newHeightPercent * 100) / 100,
          unit: 'percent'
        }
      });

      canvas.style.cursor = resizeHandle.cursor;
      return;
    }

    // Handle dragging
    if (isDragging && selectedOverlay) {
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;

      const newX = Math.max(0, Math.min(CANVAS_WIDTH, overlayStart.x + dx));
      const newY = Math.max(0, Math.min(CANVAS_HEIGHT, overlayStart.y + dy));

      // Convert pixel position back to percentage
      const newPercentPos = pixelsToPercent({ x: newX, y: newY });

      onUpdateOverlay(selectedOverlay.id, {
        position: {
          ...selectedOverlay.position,
          ...newPercentPos
        }
      });

      canvas.style.cursor = 'move';
      return;
    }

    // Update cursor and hover state
    if (selectedOverlay) {
      const handle = getResizeHandleAtPosition(coords.x, coords.y, selectedOverlay);
      if (handle) {
        canvas.style.cursor = handle.cursor;
        return;
      }
    }

    const hoveredOvl = getOverlayAtPosition(coords.x, coords.y);
    setHoveredOverlay(hoveredOvl);
    canvas.style.cursor = hoveredOvl ? 'move' : 'default';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="absolute top-0 left-0 w-full h-full cursor-default"
      style={{ display: showOverlays ? 'block' : 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      data-testid="interactive-overlay-canvas"
    />
  );
}
