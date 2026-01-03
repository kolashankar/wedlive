'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const HANDLE_SIZE = 12;
const MIN_OVERLAY_WIDTH = 50;
const MIN_OVERLAY_HEIGHT = 20;

export default function InteractiveOverlayCanvas({
  overlays = [],
  currentTime,
  duration,
  selectedOverlay,
  showOverlays = true,
  onSelectOverlay,
  onUpdateOverlay,
  containerRef
}) {
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
        const step = e.shiftKey ? 10 : 1;
        const position = { ...selectedOverlay.position };
        
        switch (e.key) {
          case 'ArrowLeft':
            position.x -= step;
            break;
          case 'ArrowRight':
            position.x += step;
            break;
          case 'ArrowUp':
            position.y -= step;
            break;
          case 'ArrowDown':
            position.y += step;
            break;
        }
        
        onUpdateOverlay(selectedOverlay.id, { position });
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
  }, [selectedOverlay, shiftPressed, history, historyIndex]);

  // Measure text dimensions for each overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dimensions = {};

    overlays.forEach(overlay => {
      const text = overlay.placeholder_text || overlay.endpoint_key || 'Sample Text';
      const styling = overlay.styling || {};
      
      const fontSize = styling.font_size || 48;
      const fontWeight = styling.font_weight || 'normal';
      const fontFamily = styling.font_family || 'Arial';
      
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      
      dimensions[overlay.id] = {
        width: metrics.width,
        height: fontSize * 1.2, // Approximate height
        baseline: fontSize
      };
    });

    setOverlayDimensions(dimensions);
  }, [overlays]);

  // Render canvas
  useEffect(() => {
    if (!showOverlays) return;
    renderCanvas();
  }, [currentTime, overlays, showOverlays, selectedOverlay, hoveredOverlay, overlayDimensions]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter visible overlays at current time
    const visibleOverlays = overlays.filter(overlay => {
      const startTime = overlay.timing?.start_time || 0;
      const endTime = overlay.timing?.end_time || duration;
      return currentTime >= startTime && currentTime <= endTime;
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
  };

  const renderOverlay = (ctx, overlay) => {
    const text = overlay.placeholder_text || overlay.endpoint_key || 'Sample Text';
    const position = overlay.position || { x: 960, y: 540 };
    const styling = overlay.styling || {};

    // Set font
    const fontSize = styling.font_size || 48;
    const fontWeight = styling.font_weight || 'normal';
    const fontFamily = styling.font_family || 'Arial';
    const letterSpacing = styling.letter_spacing || 0;
    const lineHeight = styling.line_height || 1.2;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = styling.color || '#ffffff';
    ctx.textAlign = styling.text_align || 'center';
    ctx.textBaseline = 'middle';

    // Calculate animation progress and transformations
    const animState = calculateAnimationState(overlay, currentTime);
    
    // Save context for transformations
    ctx.save();
    
    // Apply animation transformations
    ctx.translate(position.x, position.y);
    ctx.globalAlpha = animState.opacity;
    ctx.scale(animState.scale, animState.scale);
    ctx.rotate(animState.rotation);
    ctx.translate(animState.translateX, animState.translateY);

    // Apply stroke if enabled
    if (styling.stroke?.enabled) {
      ctx.strokeStyle = styling.stroke.color || '#000000';
      ctx.lineWidth = styling.stroke.width || 2;
      
      // Apply letter spacing for stroke
      if (letterSpacing > 0) {
        renderTextWithLetterSpacing(ctx, text, 0, 0, letterSpacing, true);
      } else {
        ctx.strokeText(text, 0, 0);
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
      renderTextWithLetterSpacing(ctx, text, 0, 0, letterSpacing, false);
    } else {
      ctx.fillText(text, 0, 0);
    }

    // Reset
    ctx.restore();
  };

  const renderTextWithLetterSpacing = (ctx, text, x, y, spacing, isStroke) => {
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
  };

  const renderSelectionBox = (ctx, overlay) => {
    const dims = overlayDimensions[overlay.id];
    if (!dims) return;

    const position = overlay.position || { x: 960, y: 540 };
    const padding = 10;
    
    // Calculate bounding box based on text alignment
    const textAlign = overlay.styling?.text_align || 'center';
    let boxX, boxY;
    
    switch (textAlign) {
      case 'left':
        boxX = position.x - padding;
        break;
      case 'right':
        boxX = position.x - dims.width - padding;
        break;
      case 'center':
      default:
        boxX = position.x - dims.width / 2 - padding;
        break;
    }
    
    boxY = position.y - dims.height / 2 - padding;
    const boxWidth = dims.width + padding * 2;
    const boxHeight = dims.height + padding * 2;

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

    // Draw position label
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillRect(boxX, boxY - 25, 120, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`(${Math.round(position.x)}, ${Math.round(position.y)})`, boxX + 5, boxY - 23);
  };

  const renderHoverEffect = (ctx, overlay) => {
    const dims = overlayDimensions[overlay.id];
    if (!dims) return;

    const position = overlay.position || { x: 960, y: 540 };
    const padding = 10;
    const textAlign = overlay.styling?.text_align || 'center';
    
    let boxX;
    switch (textAlign) {
      case 'left':
        boxX = position.x - padding;
        break;
      case 'right':
        boxX = position.x - dims.width - padding;
        break;
      case 'center':
      default:
        boxX = position.x - dims.width / 2 - padding;
        break;
    }
    
    const boxY = position.y - dims.height / 2 - padding;
    const boxWidth = dims.width + padding * 2;
    const boxHeight = dims.height + padding * 2;

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.setLineDash([]);
  };

  const getResizeHandles = (x, y, width, height) => {
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
  };

  const calculateAnimationProgress = (overlay, time) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const animDuration = overlay.animation?.entrance?.duration || 1;

    if (time < startTime + animDuration) {
      return Math.min(1, (time - startTime) / animDuration);
    }

    if (time > endTime - animDuration) {
      return Math.max(0, 1 - ((time - (endTime - animDuration)) / animDuration));
    }

    return 1;
  };

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
      return currentTime >= startTime && currentTime <= endTime;
    }).sort((a, b) => (b.layer_index || 0) - (a.layer_index || 0));

    for (const overlay of visibleOverlays) {
      const dims = overlayDimensions[overlay.id];
      if (!dims) continue;

      const position = overlay.position || { x: 960, y: 540 };
      const padding = 10;
      const textAlign = overlay.styling?.text_align || 'center';
      
      let boxX;
      switch (textAlign) {
        case 'left':
          boxX = position.x - padding;
          break;
        case 'right':
          boxX = position.x - dims.width - padding;
          break;
        case 'center':
        default:
          boxX = position.x - dims.width / 2 - padding;
          break;
      }
      
      const boxY = position.y - dims.height / 2 - padding;
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

    const position = overlay.position || { x: 960, y: 540 };
    const padding = 10;
    const textAlign = overlay.styling?.text_align || 'center';
    
    let boxX;
    switch (textAlign) {
      case 'left':
        boxX = position.x - padding;
        break;
      case 'right':
        boxX = position.x - dims.width - padding;
        break;
      case 'center':
      default:
        boxX = position.x - dims.width / 2 - padding;
        break;
    }
    
    const boxY = position.y - dims.height / 2 - padding;
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
        setIsResizing(true);
        setResizeHandle(handle);
        setDragStart(coords);
        setOverlayStart({
          x: selectedOverlay.position.x,
          y: selectedOverlay.position.y,
          fontSize: selectedOverlay.styling?.font_size || 48
        });
        return;
      }
    }

    // Check if clicking on an overlay
    const clickedOverlay = getOverlayAtPosition(coords.x, coords.y);
    
    if (clickedOverlay) {
      onSelectOverlay(clickedOverlay);
      setIsDragging(true);
      setDragStart(coords);
      setOverlayStart({
        x: clickedOverlay.position.x,
        y: clickedOverlay.position.y
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

      let newFontSize = overlayStart.fontSize;
      let newX = overlayStart.x;
      let newY = overlayStart.y;

      // Calculate new font size based on resize direction
      const handle = resizeHandle.position;
      
      if (handle.includes('e')) {
        const scale = (dims.width + dx) / dims.width;
        newFontSize = Math.max(12, overlayStart.fontSize * scale);
      } else if (handle.includes('w')) {
        const scale = (dims.width - dx) / dims.width;
        newFontSize = Math.max(12, overlayStart.fontSize * scale);
        newX = overlayStart.x + dx / 2;
      }
      
      if (handle.includes('s')) {
        const scale = (dims.height + dy) / dims.height;
        newFontSize = Math.max(12, overlayStart.fontSize * scale);
      } else if (handle.includes('n')) {
        const scale = (dims.height - dy) / dims.height;
        newFontSize = Math.max(12, overlayStart.fontSize * scale);
        newY = overlayStart.y + dy / 2;
      }

      // Proportional resizing with shift key
      if (shiftPressed && handle.length === 2) {
        const avgScale = ((coords.x - dragStart.x) + (coords.y - dragStart.y)) / 2;
        const scale = (dims.width + avgScale) / dims.width;
        newFontSize = Math.max(12, overlayStart.fontSize * scale);
      }

      onUpdateOverlay(selectedOverlay.id, {
        styling: {
          ...selectedOverlay.styling,
          font_size: Math.round(newFontSize)
        },
        position: {
          ...selectedOverlay.position,
          x: Math.round(newX),
          y: Math.round(newY)
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

      onUpdateOverlay(selectedOverlay.id, {
        position: {
          ...selectedOverlay.position,
          x: Math.round(newX),
          y: Math.round(newY)
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

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Implement undo logic
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Implement redo logic
    }
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
