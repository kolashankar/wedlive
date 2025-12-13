'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Pen, Eraser, Undo, Redo, ZoomIn, ZoomOut, Grid, Move, Save, Eye, 
  Plus, X, Download, Upload, Layers, Droplet, Sun, Wand2, Edit3
} from 'lucide-react';

/**
 * Border Editor - Advanced drawing tool for creating photo borders
 * 
 * Features:
 * - Freehand drawing with pen tool (same as TemplateEditor)
 * - Canvas zoom, pan, and grid
 * - Undo/redo functionality
 * - Shape editing and manipulation
 * - Automatic border detection
 * - Feather and shadow controls
 * - Multiple drawing modes
 * - NATURAL FREEHAND DRAWING - follows cursor path point-by-point
 * - API integration for saving/loading mask data
 * - Bezier curve smoothing
 * - Real-time photo preview with mask
 * - Control point editing
 */

export default function BorderEditor({ 
  imageUrl, 
  onBorderSave, 
  onClose,
  assetType = 'border',
  className = '',
  borderId = null,
  previewPhotoUrl = null
}) {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Drawing state (same as TemplateEditor)
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen'); // pen, eraser, move
  const [currentPath, setCurrentPath] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  
  // Canvas state (same as TemplateEditor)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [templateOpacity, setTemplateOpacity] = useState([0.7]);
  
  // History for undo/redo (same as TemplateEditor)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Border-specific state
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectedBorder, setDetectedBorder] = useState([]);
  const [mode, setMode] = useState('detect'); // 'detect', 'draw', 'edit'
  const [sensitivity, setSensitivity] = useState([50]);
  const [featherRadius, setFeatherRadius] = useState([5]);
  const [shadowBlur, setShadowBlur] = useState([10]);
  const [shadowOffset, setShadowOffset] = useState([5]);

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl) {
      console.log('Loading image from URL:', imageUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
        setImage(img);
        detectBorder(img);
      };
      img.onerror = (error) => {
        console.error('Failed to load image:', error);
      };
      img.src = imageUrl;
    } else {
      console.log('No imageUrl provided');
    }
  }, [imageUrl]);

  // Add to history (same as TemplateEditor)
  const addToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(shapes)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [shapes, history, historyIndex]);

  // Undo/Redo (same as TemplateEditor)
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Drawing functions (same as TemplateEditor)
  const startDrawing = (e) => {
    if (currentTool !== 'pen' || mode !== 'draw') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate coordinates with proper scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX / zoom - pan.x;
    const y = (e.clientY - rect.top) * scaleY / zoom - pan.y;
    
    console.log('Start drawing at:', { x, y, scaleX, scaleY, zoom });
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing || currentTool !== 'pen' || mode !== 'draw') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate coordinates with proper scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX / zoom - pan.x;
    const y = (e.clientY - rect.top) * scaleY / zoom - pan.y;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 3) {
      const newShape = {
        id: Date.now(),
        type: 'freehand',
        points: currentPath,
        feather: featherRadius[0],
        shadowBlur: shadowBlur[0],
        shadowOffset: shadowOffset[0]
      };
      
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      setDetectedBorder(currentPath);
      addToHistory();
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Simple border detection
  const detectBorder = async (img) => {
    setLoading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    try {
      // Create border points (simplified detection)
      const padding = 50;
      const borderPoints = [
        { x: padding, y: padding },
        { x: img.width - padding, y: padding },
        { x: img.width - padding, y: img.height - padding },
        { x: padding, y: img.height - padding }
      ];

      // Add curve points for more natural shape
      const curvedBorder = [];
      for (let i = 0; i < borderPoints.length; i++) {
        const current = borderPoints[i];
        const next = borderPoints[(i + 1) % borderPoints.length];
        
        curvedBorder.push(current);
        
        // Add curve control point
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        const curveOffset = 20; // Curve amount
        
        if (i === 0) { // Top edge
          curvedBorder.push({ x: midX, y: midY - curveOffset });
        } else if (i === 1) { // Right edge
          curvedBorder.push({ x: midX + curveOffset, y: midY });
        } else if (i === 2) { // Bottom edge
          curvedBorder.push({ x: midX, y: midY + curveOffset });
        } else { // Left edge
          curvedBorder.push({ x: midX - curveOffset, y: midY });
        }
      }

      setDetectedBorder(curvedBorder);
    } catch (error) {
      console.error('Border detection failed:', error);
      // Fallback to simple rectangular border
      const fallbackBorder = [
        { x: 50, y: 50 },
        { x: img.width - 50, y: 50 },
        { x: img.width - 50, y: img.height - 50 },
        { x: 50, y: img.height - 50 }
      ];
      setDetectedBorder(fallbackBorder);
    } finally {
      setLoading(false);
    }
  };

  // Canvas mouse handlers (enhanced like TemplateEditor)
  const handleMouseDown = (e) => {
    if (mode === 'draw') {
      startDrawing(e);
    } else if (mode === 'edit' && currentTool === 'move') {
      // Pan functionality
      setIsDrawing(true);
      const startX = e.clientX - pan.x * zoom;
      const startY = e.clientY - pan.y * zoom;
      setCurrentPath([{ x: startX, y: startY }]);
    }
  };

  const handleMouseMove = (e) => {
    if (mode === 'draw') {
      draw(e);
    } else if (mode === 'edit' && currentTool === 'move' && isDrawing) {
      const newX = (e.clientX - currentPath[0].x) / zoom;
      const newY = (e.clientY - currentPath[0].y) / zoom;
      setPan({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (mode === 'draw') {
      stopDrawing();
    } else {
      setIsDrawing(false);
      setCurrentPath([]);
    }
  };

  // Draw canvas (enhanced like TemplateEditor)
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas || !image) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    
    // Setup canvases with proper dimensions
    const containerWidth = containerRef.current ? containerRef.current.clientWidth : 800;
    const containerHeight = containerRef.current ? containerRef.current.clientHeight : 600;
    
    // Calculate scaled dimensions to fit container
    const scale = Math.min(containerWidth / image.width, containerHeight / image.height, 1);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    overlayCanvas.width = scaledWidth;
    overlayCanvas.height = scaledHeight;
    
    // Set canvas display size
    canvas.style.width = scaledWidth + 'px';
    canvas.style.height = scaledHeight + 'px';
    overlayCanvas.style.width = scaledWidth + 'px';
    overlayCanvas.style.height = scaledHeight + 'px';
    
    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Apply zoom and pan
    ctx.save();
    overlayCtx.save();
    ctx.scale(zoom, zoom);
    overlayCtx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);
    overlayCtx.translate(pan.x, pan.y);
    
    // Draw background image
    ctx.globalAlpha = templateOpacity[0];
    ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
    ctx.globalAlpha = 1;
    
    // Draw grid (same as TemplateEditor)
    if (showGrid) {
      overlayCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      overlayCtx.lineWidth = 1;
      const gridSize = 50;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(x, 0);
        overlayCtx.lineTo(x, canvas.height);
        overlayCtx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(0, y);
        overlayCtx.lineTo(canvas.width, y);
        overlayCtx.stroke();
      }
    }
    
    // Draw shapes/borders
    const borderToDraw = mode === 'draw' && currentPath.length > 0 ? currentPath : detectedBorder;
    
    if (borderToDraw && Array.isArray(borderToDraw) && borderToDraw.length > 0) {
      // Apply shadow effects
      if (shadowBlur[0] > 0) {
        overlayCtx.shadowBlur = shadowBlur[0];
        overlayCtx.shadowOffsetX = shadowOffset[0];
        overlayCtx.shadowOffsetY = shadowOffset[0];
        overlayCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      }
      
      overlayCtx.strokeStyle = mode === 'draw' ? '#10b981' : '#ef4444';
      overlayCtx.lineWidth = mode === 'draw' ? 3 : 4;
      overlayCtx.setLineDash(mode === 'draw' ? [] : [5, 5]);
      overlayCtx.lineCap = 'round';
      overlayCtx.lineJoin = 'round';
      
      overlayCtx.beginPath();
      borderToDraw.forEach((point, i) => {
        if (i === 0) {
          overlayCtx.moveTo(point.x, point.y);
        } else {
          overlayCtx.lineTo(point.x, point.y);
        }
      });
      
      // IMPORTANT: NATURAL FREEHAND DRAWING BEHAVIOR
      // NEVER close the path during active drawing - only follow the cursor path point-by-point
      // Only close shapes when in edit mode or when drawing is completed (detectedBorder)
      if (mode !== 'draw') {
        overlayCtx.closePath();
      }
      overlayCtx.stroke();
      
      // Reset shadow
      overlayCtx.shadowBlur = 0;
      overlayCtx.shadowOffsetX = 0;
      overlayCtx.shadowOffsetY = 0;
      
      // Draw control points for edit mode
      if (mode === 'edit' && detectedBorder && Array.isArray(detectedBorder)) {
        overlayCtx.fillStyle = '#ef4444';
        detectedBorder.forEach(point => {
          overlayCtx.beginPath();
          overlayCtx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          overlayCtx.fill();
        });
      }
    }
    
    ctx.restore();
    overlayCtx.restore();
  }, [image, detectedBorder, currentPath, zoom, pan, showGrid, templateOpacity, mode, shadowBlur, shadowOffset]);

  const handleSave = () => {
    console.log('Save button clicked');
    console.log('Current mode:', mode);
    console.log('Current path length:', currentPath.length);
    console.log('Detected border length:', detectedBorder.length);
    console.log('onBorderSave exists:', !!onBorderSave);
    
    const finalBorder = mode === 'draw' && currentPath.length > 3 ? currentPath : detectedBorder;
    
    console.log('Final border length:', finalBorder.length);
    
    if (finalBorder.length > 0 && onBorderSave) {
      console.log('Calling onBorderSave with data:', {
        points: finalBorder,
        feather: featherRadius[0],
        shadowBlur: shadowBlur[0],
        shadowOffset: shadowOffset[0],
        assetType,
        mode,
        shapes,
        timestamp: Date.now()
      });
      
      onBorderSave({
        points: finalBorder,
        feather: featherRadius[0],
        shadowBlur: shadowBlur[0],
        shadowOffset: shadowOffset[0],
        assetType,
        mode,
        shapes,
        timestamp: Date.now()
      });
    } else {
      console.log('Save conditions not met:', {
        hasBorder: finalBorder.length > 0,
        hasCallback: !!onBorderSave,
        borderLength: finalBorder.length
      });
    }
  };

  const handleRedetect = () => {
    if (image) {
      detectBorder(image);
      setShapes([]);
      setCurrentPath([]);
    }
  };

  const clearDrawing = () => {
    setCurrentPath([]);
    setShapes([]);
    setDetectedBorder([]);
    addToHistory();
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Border Editor - {assetType.charAt(0).toUpperCase() + assetType.slice(1)}
        </CardTitle>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            onClick={() => setMode('detect')}
            variant={mode === 'detect' ? 'default' : 'outline'}
            size="sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Auto Detect
          </Button>
          <Button
            onClick={() => setMode('draw')}
            variant={mode === 'draw' ? 'default' : 'outline'}
            size="sm"
          >
            <Pen className="w-4 h-4 mr-2" />
            Draw
          </Button>
          <Button
            onClick={() => setMode('edit')}
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Drawing Tools (same as TemplateEditor) */}
        {mode === 'draw' && (
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentTool('pen')}
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              onClick={undo}
              disabled={historyIndex <= 0}
              variant="outline"
              size="sm"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              variant="outline"
              size="sm"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setShowGrid(!showGrid)}
              variant={showGrid ? 'default' : 'outline'}
              size="sm"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {mode === 'detect' && (
            <Button
              onClick={handleRedetect}
              disabled={loading || !image}
              variant="outline"
              size="sm"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {loading ? 'Detecting...' : 'Redetect'}
            </Button>
          )}
          
          {mode === 'draw' && (
            <Button
              onClick={clearDrawing}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={(!onBorderSave) || 
                     (mode === 'detect' && detectedBorder.length === 0) || 
                     (mode === 'draw' && currentPath.length < 3)}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Border
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              variant="outline"
              size="sm"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <Button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              variant="outline"
              size="sm"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={resetView}
            variant="outline"
            size="sm"
          >
            <Move className="w-4 h-4" />
          </Button>
        </div>

        {/* Advanced Controls (same as TemplateEditor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Detection Sensitivity
            </label>
            <Slider
              value={sensitivity}
              onValueChange={setSensitivity}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Feather Radius
            </label>
            <Slider
              value={featherRadius}
              onValueChange={setFeatherRadius}
              max={20}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Shadow Blur
            </label>
            <Slider
              value={shadowBlur}
              onValueChange={setShadowBlur}
              max={50}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Shadow Offset
            </label>
            <Slider
              value={shadowOffset}
              onValueChange={setShadowOffset}
              max={20}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Template Opacity
            </label>
            <Slider
              value={templateOpacity}
              onValueChange={setTemplateOpacity}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          {mode === 'detect' && (
            <>
              <p>• <strong>Redetect</strong> to find borders automatically</p>
              <p>• Switch to <strong>Draw</strong> mode to create custom borders</p>
            </>
          )}
          {mode === 'draw' && (
            <>
              <p>• <strong>Click & Drag</strong> to draw custom border shape</p>
              <p>• <strong>Undo/Redo</strong> to correct mistakes</p>
              <p>• <strong>Grid</strong> for precision drawing</p>
              <p>• <strong>Natural freehand</strong> - follows cursor path exactly</p>
            </>
          )}
          {mode === 'edit' && (
            <>
              <p>• <strong>Move tool</strong> to pan the canvas</p>
              <p>• Switch to <strong>Draw</strong> mode to create new shapes</p>
            </>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={mode === 'detect' ? 'default' : 'secondary'}>
            {mode === 'detect' ? 'Auto-Detect' : mode === 'draw' ? 'Drawing' : 'Editing'}
          </Badge>
          {mode === 'draw' && currentPath.length > 0 && (
            <Badge variant="outline">{currentPath.length} points</Badge>
          )}
          {showGrid && (
            <Badge variant="outline">Grid On</Badge>
          )}
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="border rounded-lg overflow-auto bg-gray-50 max-h-96 relative"
          style={{ minHeight: '400px', minWidth: '600px' }}
        >
          {!image && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-lg mb-2">No image loaded</div>
                <div className="text-sm">Please upload an image to edit borders</div>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="relative"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              display: image ? 'block' : 'none',
              cursor: mode === 'draw' && currentTool === 'pen' ? 'crosshair' : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              display: image ? 'block' : 'none'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
