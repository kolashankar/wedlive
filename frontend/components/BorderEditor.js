'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Wand2, Save, X, ZoomIn, ZoomOut, RotateCw, 
  MousePointer, Circle, Square, Triangle, PenTool, Edit3
} from 'lucide-react';

export default function BorderEditor({ 
  imageUrl, 
  onBorderSave, 
  onClose,
  assetType = 'border',
  className = '' 
}) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectedBorder, setDetectedBorder] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sensitivity, setSensitivity] = useState([50]);
  const [featherRadius, setFeatherRadius] = useState([5]);
  const [mode, setMode] = useState('detect'); // 'detect', 'draw', 'edit'
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [shapes, setShapes] = useState([]);

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        detectBorder(img);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

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

  // Drawing functions
  const startDrawing = (e) => {
    if (mode !== 'draw') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    setIsDrawing(true);
    setDrawnPoints([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    setDrawnPoints(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && drawnPoints.length > 3) {
      // Convert drawn points to a shape
      const newShape = {
        id: Date.now(),
        type: 'freehand',
        points: drawnPoints,
        feather: featherRadius[0]
      };
      setShapes(prev => [...prev, newShape]);
      setDetectedBorder(drawnPoints);
    }
    
    setIsDrawing(false);
    setDrawnPoints([]);
  };

  // Canvas mouse handlers
  const handleMouseDown = (e) => {
    if (mode === 'draw') {
      startDrawing(e);
    } else if (mode === 'edit') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - pan.x;
      const y = (e.clientY - rect.top) / zoom - pan.y;

      // Check if clicking near a border point
      const pointIndex = findNearestPoint(x, y);
      if (pointIndex !== -1) {
        setIsDragging(true);
        setDragIndex(pointIndex);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (mode === 'draw') {
      draw(e);
    } else if (isDragging && dragIndex !== null && mode === 'edit') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - pan.x;
      const y = (e.clientY - rect.top) / zoom - pan.y;

      const newBorder = [...detectedBorder];
      newBorder[dragIndex] = { x, y };
      setDetectedBorder(newBorder);
    }
  };

  const handleMouseUp = () => {
    if (mode === 'draw') {
      stopDrawing();
    } else {
      setIsDragging(false);
      setDragIndex(null);
    }
  };

  const findNearestPoint = (x, y) => {
    for (let i = 0; i < detectedBorder.length; i++) {
      const point = detectedBorder[i];
      const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (dist < 20) { // 20px threshold
        return i;
      }
    }
    return -1;
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    
    // Clear and setup
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply zoom and pan
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);
    
    // Draw image
    ctx.drawImage(image, 0, 0);
    
    // Draw detected border/shapes
    const borderToDraw = mode === 'draw' && drawnPoints.length > 0 ? drawnPoints : detectedBorder;
    
    if (borderToDraw.length > 0) {
      ctx.strokeStyle = mode === 'draw' ? '#10b981' : '#ef4444';
      ctx.lineWidth = mode === 'draw' ? 2 : 3;
      ctx.setLineDash(mode === 'draw' ? [] : [5, 5]);
      
      ctx.beginPath();
      borderToDraw.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      if (mode !== 'draw' || drawnPoints.length > 2) {
        ctx.closePath();
      }
      ctx.stroke();
      
      // Draw control points for edit mode
      if (mode === 'edit') {
        ctx.fillStyle = '#ef4444';
        detectedBorder.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    
    ctx.restore();
  }, [image, detectedBorder, drawnPoints, zoom, pan, mode]);

  const handleSave = () => {
    const finalBorder = mode === 'draw' && drawnPoints.length > 3 ? drawnPoints : detectedBorder;
    if (finalBorder.length > 0 && onBorderSave) {
      onBorderSave({
        points: finalBorder,
        feather: featherRadius[0],
        assetType,
        mode,
        shapes,
        timestamp: Date.now()
      });
    }
  };

  const handleRedetect = () => {
    if (image) {
      detectBorder(image);
      setShapes([]);
      setDrawnPoints([]);
    }
  };

  const clearDrawing = () => {
    setDrawnPoints([]);
    setShapes([]);
    setDetectedBorder([]);
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
            <PenTool className="w-4 h-4 mr-2" />
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
            disabled={(mode === 'detect' && detectedBorder.length === 0) || 
                     (mode === 'draw' && drawnPoints.length < 3)}
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
            onClick={() => setPan({ x: 0, y: 0 })}
            variant="outline"
            size="sm"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p>• <strong>Clear</strong> to start over</p>
            </>
          )}
          {mode === 'edit' && (
            <>
              <p>• <strong>Click & Drag</strong> border points to adjust</p>
              <p>• Switch to <strong>Draw</strong> mode to create new shapes</p>
            </>
          )}
        </div>

        {/* Mode Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={mode === 'detect' ? 'default' : 'secondary'}>
            {mode === 'detect' ? 'Auto-Detect' : mode === 'draw' ? 'Drawing' : 'Editing'}
          </Badge>
          {mode === 'draw' && drawnPoints.length > 0 && (
            <Badge variant="outline">{drawnPoints.length} points</Badge>
          )}
        </div>

        {/* Canvas */}
        <div className="border rounded-lg overflow-auto bg-gray-50 max-h-96">
          <canvas
            ref={canvasRef}
            width={image ? image.width : 800}
            height={image ? image.height : 600}
            className={`cursor-${mode === 'draw' ? 'crosshair' : 'pointer'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
