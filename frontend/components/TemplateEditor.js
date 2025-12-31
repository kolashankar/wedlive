'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Pen, Eraser, Undo, Redo, ZoomIn, ZoomOut, Grid, Move, Save, Eye, 
  Plus, X, Download, Upload, Layers, Droplet, Sun
} from 'lucide-react';

/**
 * Template Editor - Advanced freehand drawing tool for creating photo templates
 * 
 * Features:
 * - Freehand drawing with pen tool
 * - Canvas zoom, pan, and grid
 * - Undo/redo functionality
 * - Shape editing and manipulation
 * - Automatic mask generation
 * - Preview with sample photos
 * - Feather and shadow controls
 */

export default function TemplateEditor({ 
  templateUrl, 
  onTemplateSave, 
  onShapeAdd,
  className = ''
}) {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen'); // pen, eraser, move
  const [currentPath, setCurrentPath] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [templateOpacity, setTemplateOpacity] = useState(0.7);
  
  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Shape properties
  const [featherRadius, setFeatherRadius] = useState(8);
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowDepth, setShadowDepth] = useState(4);
  
  // Template image
  const [templateImage, setTemplateImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load template image
  useEffect(() => {
    if (templateUrl) {
      const img = new Image();
      img.onload = () => {
        setTemplateImage(img);
        setImageLoaded(true);
      };
      img.src = templateUrl;
      img.onerror = (error) => {
        console.error('Error loading template:', error);
      };
    }
  }, [templateUrl]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    
    // Set canvas size
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      overlayCanvas.width = container.clientWidth;
      overlayCanvas.height = container.clientHeight;
      
      redrawCanvas();
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    
    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    overlayCtx.save();
    overlayCtx.translate(pan.x, pan.y);
    overlayCtx.scale(zoom, zoom);
    
    // Draw template image
    if (templateImage && imageLoaded) {
      ctx.globalAlpha = templateOpacity;
      ctx.drawImage(templateImage, 0, 0);
      ctx.globalAlpha = 1;
    }
    
    // Draw grid
    if (showGrid) {
      drawGrid(ctx, canvas.width / zoom, canvas.height / zoom);
    }
    
    // Draw shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape, shape === selectedShape);
    });
    
    // Draw current path
    if (currentPath.length > 0) {
      drawPath(ctx, currentPath, true);
    }
    
    ctx.restore();
    overlayCtx.restore();
  }, [templateImage, imageLoaded, zoom, pan, showGrid, templateOpacity, shapes, selectedShape, currentPath]);

  // Draw grid
  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw shape
  const drawShape = (ctx, shape, isSelected) => {
    if (!shape.points || shape.points.length < 3) return;
    
    ctx.save();
    
    // Draw filled shape
    ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)';
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#22c55e';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    shape.points.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw control points if selected
    if (isSelected) {
      ctx.fillStyle = '#3b82f6';
      shape.points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    ctx.restore();
  };

  // Draw current path
  const drawPath = (ctx, path, isActive) => {
    if (path.length < 2) return;
    
    ctx.strokeStyle = isActive ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  };

  // Handle mouse events
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (currentTool === 'pen') {
      setIsDrawing(true);
      setCurrentPath([pos]);
    } else if (currentTool === 'move') {
      // Handle panning
      const startX = e.clientX - pan.x;
      const startY = e.clientY - pan.y;
      
      const handleMouseMove = (e) => {
        setPan({
          x: e.clientX - startX,
          y: e.clientY - startY
        });
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || currentTool !== 'pen') return;
    
    const pos = getMousePos(e);
    setCurrentPath(prev => [...prev, pos]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentTool !== 'pen') return;
    
    setIsDrawing(false);
    
    if (currentPath.length > 10) {
      // Create new shape from path
      const newShape = {
        id: Date.now().toString(),
        points: currentPath,
        feather: featherRadius,
        shadow: shadowEnabled,
        shadowDepth: shadowDepth,
        boundingBox: calculateBoundingBox(currentPath),
        path: pointsToSVGPath(currentPath)
      };
      
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      addToHistory(newShapes);
      
      if (onShapeAdd) {
        onShapeAdd(newShape);
      }
    }
    
    setCurrentPath([]);
  };

  // Calculate bounding box
  const calculateBoundingBox = (points) => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  };

  // Convert points to SVG path
  const pointsToSVGPath = (points) => {
    if (points.length < 2) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    path += ' Z';
    return path;
  };

  // History management
  const addToHistory = (newShapes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <Card className={`template-editor ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Template Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Tools */}
          <div className="flex gap-1">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('pen')}
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('move')}
            >
              <Move className="w-4 h-4" />
            </Button>
          </div>
          
          {/* History */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Zoom */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2 py-1">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomReset}>Reset</Button>
          </div>
          
          {/* View options */}
          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Canvas */}
        <div 
          ref={containerRef}
          className="relative w-full h-96 border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 pointer-events-none"
          />
        </div>
        
        {/* Shape Properties */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Feather Radius: {featherRadius}px
            </label>
            <Slider
              value={[featherRadius]}
              onValueChange={(value) => setFeatherRadius(value[0])}
              min={0}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Shadow
            </label>
            <input
              type="checkbox"
              checked={shadowEnabled}
              onChange={(e) => setShadowEnabled(e.target.checked)}
            />
            {shadowEnabled && (
              <div className="flex items-center gap-2">
                <label className="text-sm">Depth:</label>
                <Slider
                  value={[shadowDepth]}
                  onValueChange={(value) => setShadowDepth(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-24"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">Template Opacity: {Math.round(templateOpacity * 100)}%</label>
            <Slider
              value={[templateOpacity]}
              onValueChange={(value) => setTemplateOpacity(value[0])}
              min={0}
              max={1}
              step={0.1}
              className="mt-2"
            />
          </div>
        </div>
        
        {/* Shapes List */}
        {shapes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Shapes ({shapes.length})</h4>
            <div className="space-y-2">
              {shapes.map((shape, index) => (
                <div
                  key={shape.id}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedShape?.id === shape.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedShape(shape)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Shape {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShapes(shapes.filter(s => s.id !== shape.id));
                        addToHistory(shapes.filter(s => s.id !== shape.id));
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {shape.boundingBox.width}x{shape.boundingBox.height}px
                    {shape.shadow && ' • Shadow'}
                    {shape.feather > 0 && ` • Feather ${shape.feather}px`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onTemplateSave && onTemplateSave(shapes)}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
