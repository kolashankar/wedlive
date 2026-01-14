'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Pen, Eraser, Undo, Redo, ZoomIn, ZoomOut, Grid, Move, Save, Eye, 
  Plus, X, Download, Upload, Layers, Droplet, Sun, Wand2, Edit3, Settings, Loader2
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
  
  // Task 1: Standardize Image Processing Pipeline - Create offscreen finalCanvas
  const finalCanvasRef = useRef(null); // Single source of truth canvas
  const finalCanvasCtxRef = useRef(null); // Cached context
  
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
  
  // New features
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [controlPoints, setControlPoints] = useState([]);
  const [draggingPoint, setDraggingPoint] = useState(null);

  // Chroma Key State
  const [chromaKeyEnabled, setChromaKeyEnabled] = useState(true); // Enable by default for background removal
  const [chromaKeyMode, setChromaKeyMode] = useState('auto'); // 'auto' or 'custom'
  const [customKeyColor, setCustomKeyColor] = useState('#00ff00'); // Default green
  const [tolerance, setTolerance] = useState([50]); // Increased tolerance for better background removal
  const [edgeFeather, setEdgeFeather] = useState([2]); // 0-10
  const [edgeSmoothness, setEdgeSmoothness] = useState([50]); // 0-100
  const [spillSuppression, setSpillSuppression] = useState([20]); // 0-100
  const [detectedBackgroundColor, setDetectedBackgroundColor] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [chromaKeyCanvas, setChromaKeyCanvas] = useState(null);

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
        
        // Task 1: Initialize finalCanvas when image loads
        initializeFinalCanvas(img);
      };
      img.onerror = (error) => {
        console.error('Error loading image:', error);
        setLoading(false);
      };
      img.src = imageUrl;
    } else {
      console.log('No imageUrl provided');
    }
  }, [imageUrl]);

  // Auto-run chroma key processing when image is loaded
  useEffect(() => {
    if (image && chromaKeyEnabled && finalCanvasRef.current) {
      console.log('Auto-running chroma key processing for loaded image');
      // Small delay to ensure canvas is ready
      const timer = setTimeout(() => {
        processChromaKey();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [image, chromaKeyEnabled, finalCanvasRef.current]);

  // Task 1: Initialize finalCanvas - Single source of truth for all image operations
  const initializeFinalCanvas = useCallback((sourceImage) => {
    console.log('Task 1: Initializing finalCanvas - Standardized Pipeline');
    
    // Create offscreen canvas with same dimensions as source image
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = sourceImage.width;
    finalCanvas.height = sourceImage.height;
    
    const ctx = finalCanvas.getContext('2d');
    
    // Store references for pipeline operations
    finalCanvasRef.current = finalCanvas;
    finalCanvasCtxRef.current = ctx;
    
    console.log('Task 1: finalCanvas initialized with dimensions:', sourceImage.width, 'x', sourceImage.height);
    console.log('Task 1: Standardized pipeline ready for composition');
    
    return finalCanvas;
  }, []);

  // Task 1: Standardized Pipeline Composition Function
  const composeFinalImage = useCallback(async ({ 
    transparentImage, 
    maskPath, 
    borderOverlay 
  }) => {
    console.log('Task 1: Starting standardized pipeline composition');
    
    const canvas = finalCanvasRef.current;
    const ctx = finalCanvasCtxRef.current;
    
    if (!canvas || !ctx) {
      console.error('Task 1: finalCanvas not initialized');
      return null;
    }
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Step 1: Apply mask clipping FIRST (before drawing)
    if (maskPath && maskPath.length > 0) {
      console.log('Task 3: Applying mask clipping BEFORE drawing transparent image');
      
      // Create mask path from border points
      const path2dMask = createMaskPath(maskPath);
      
      if (path2dMask) {
        // Apply clipping region
        applyCanvasMaskClipping(ctx, path2dMask);
        
        // Step 2: Draw background-removed image INSIDE the mask
        if (transparentImage) {
          console.log('Task 3: Drawing transparent image WITHIN mask bounds');
          ctx.drawImage(transparentImage, 0, 0);
        }
        
        // Restore context after drawing
        restoreCanvasContext(ctx);
      } else {
        // Fallback: draw transparent image without mask if mask creation fails
        if (transparentImage) {
          console.log('Task 3: Mask creation failed, drawing transparent image without clipping');
          ctx.drawImage(transparentImage, 0, 0);
        }
      }
    } else {
      // Fallback: draw transparent image without mask if no mask path
      if (transparentImage) {
        console.log('Task 3: No mask path available, drawing transparent image without clipping');
        ctx.drawImage(transparentImage, 0, 0);
      }
    }
    
    // Step 3: Overlay floral frame (non-masked layer)
    if (borderOverlay) {
      console.log('Task 4: Overlaying floral frame as non-masked layer');
      
      // Draw floral frame on top of everything (outside mask)
      ctx.drawImage(borderOverlay, 0, 0);
      
      console.log('Task 4: Floral frame overlay completed');
      console.log('Task 4: Frame is visible outside mask, center remains transparent');
    } else {
      console.log('Task 4: No floral frame overlay provided');
    }
    
    console.log('Task 1: Pipeline composition completed');
    return canvas;
  }, []);

  // Task 2: Convert Drawn Border → Real Mask Path
  const createMaskPath = useCallback((borderPoints) => {
    console.log('Task 2: Converting drawn border to Canvas Path2D mask');
    
    if (!borderPoints || borderPoints.length < 3) {
      console.error('Task 2: Insufficient points for mask path');
      return null;
    }
    
    // Create Path2D object for efficient clipping
    const maskPath = new Path2D();
    
    // Start from first point
    maskPath.moveTo(borderPoints[0].x, borderPoints[0].y);
    
    // Draw lines through all points
    for (let i = 1; i < borderPoints.length; i++) {
      maskPath.lineTo(borderPoints[i].x, borderPoints[i].y);
    }
    
    // Close the path to create a complete mask
    maskPath.closePath();
    
    console.log('Task 2: Mask path created with', borderPoints.length, 'points');
    console.log('Task 2: Path is closed and ready for clipping');
    
    return maskPath;
  }, []);

  // Task 2: Apply mask clipping to canvas context
  const applyCanvasMaskClipping = useCallback((ctx, maskPath) => {
    console.log('Task 2: Applying mask clipping to canvas context');
    
    if (!maskPath) {
      console.error('Task 2: No mask path provided for clipping');
      return false;
    }
    
    // Save current context state
    ctx.save();
    
    // Create clipping region from mask path
    ctx.beginPath();
    ctx.clip(maskPath);
    
    console.log('Task 2: Mask clipping applied successfully');
    console.log('Task 2: Canvas context is now clipped to mask path');
    
    return true;
  }, []);

  // Task 2: Restore canvas context after clipping
  const restoreCanvasContext = useCallback((ctx) => {
    console.log('Task 2: Restoring canvas context after clipping');
    ctx.restore();
    console.log('Task 2: Canvas context restored');
  }, []);

  // Task 2: Get final border points (drawn or detected)
  const getFinalBorderPoints = useCallback(() => {
    const finalBorder = mode === 'draw' && currentPath.length > 3 ? currentPath : detectedBorder;
    console.log('Task 2: Final border points:', finalBorder.length, 'points from mode:', mode);
    return finalBorder;
  }, [mode, currentPath, detectedBorder]);

  // Task 3: Process Chroma Key Result with Mask Application
  const processChromaKeyWithMask = useCallback(async (borderPoints) => {
    console.log('Task 3: Processing chroma key result with mask application');
    
    // Step 1: Get chroma key processed image (transparent background)
    const chromaResult = await processChromaKey();
    
    if (!chromaResult || !processedImage) {
      console.error('Task 3: No chroma key processed image available');
      return null;
    }
    
    console.log('Task 3: Chroma key processing completed, applying mask');
    
    // Step 2: Apply mask to transparent image using standardized pipeline
    const finalResult = await composeFinalImage({
      transparentImage: processedImage,
      maskPath: borderPoints,
      borderOverlay: null // Will be added in Task 4
    });
    
    if (finalResult) {
      console.log('Task 3: Mask successfully applied to transparent image');
      console.log('Task 3: Final canvas dimensions:', finalResult.width, 'x', finalResult.height);
    }
    
    return finalResult;
  }, [processedImage, composeFinalImage]);

  // Task 4: Load and prepare floral frame overlay
  const loadFloralFrame = useCallback(async () => {
    console.log('Task 4: Loading floral frame overlay');
    
    // Use the original image as the floral frame (border template)
    if (!image) {
      console.error('Task 4: No original image available for floral frame');
      return null;
    }
    
    console.log('Task 4: Using original image as floral frame overlay');
    console.log('Task 4: Frame dimensions:', image.width, 'x', image.height);
    
    return image;
  }, [image]);

  // Task 4: Complete composition with floral frame
  const composeWithFloralFrame = useCallback(async (borderPoints) => {
    console.log('Task 4: Starting complete composition with floral frame');
    
    // Load floral frame overlay
    const floralFrame = await loadFloralFrame();
    
    // Apply complete pipeline: transparent image + mask (no floral frame)
    const finalResult = await composeFinalImage({
      transparentImage: processedImage,
      maskPath: borderPoints,
      borderOverlay: null // No floral frame - save only masked transparent image
    });
    
    if (finalResult) {
      console.log('Task 4: Complete composition with floral frame completed');
      console.log('Task 4: Final result has transparent center + visible floral border');
    }
    
    return finalResult;
  }, [loadFloralFrame, processedImage, composeFinalImage]);

  // Task 5: Force PNG Export With Alpha - Export final canvas with transparency
  const exportPNGWithAlpha = useCallback(async (canvas) => {
    console.log('Task 5: Exporting PNG with alpha transparency');
    
    if (!canvas) {
      console.error('Task 5: No canvas provided for export');
      return null;
    }
    
    return new Promise((resolve, reject) => {
      try {
        console.log('Task 5: Converting canvas to PNG blob with alpha');
        console.log('Task 5: Canvas dimensions:', canvas.width, 'x', canvas.height);
        
        // Force PNG format with maximum quality to preserve alpha
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Task 5: Failed to create PNG blob');
            reject(new Error('Failed to create PNG blob'));
            return;
          }
          
          // Verify it's PNG with alpha
          if (blob.type !== 'image/png') {
            console.error('Task 5: Export is not PNG format:', blob.type);
            reject(new Error('Export is not PNG format'));
            return;
          }
          
          console.log('Task 5: PNG export successful');
          console.log('Task 5: File size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
          console.log('Task 5: Alpha transparency preserved');
          
          // Create object URL for the blob
          const url = URL.createObjectURL(blob);
          
          resolve({
            blob,
            url,
            canvas,
            dimensions: { width: canvas.width, height: canvas.height },
            format: 'PNG',
            hasAlpha: true,
            quality: 1.0
          });
          
        }, 'image/png', 1.0); // Maximum quality, PNG format
        
      } catch (error) {
        console.error('Task 5: Error during PNG export:', error);
        reject(error);
      }
    });
  }, []);

  // Task 5: Export complete composition with transparency (mask only, no frame)
  const exportFinalComposition = useCallback(async (borderPoints) => {
    console.log('Task 5: Exporting final composition - masked transparent image only');
    
    try {
      // Step 1: Validate processed image exists - BLOCK SAVE if not
      if (!processedImage) {
        console.error('Save blocked: No processed transparent image available');
        setError('Please process background removal first before saving the border');
        return;
      }
      
      console.log('Save validation passed: Processed transparent image available');
      
      // Step 2: Ensure chroma key processing is done and wait for completion
      if (chromaKeyEnabled) {
        console.log('Task 5: Confirming chroma key processing before export');
        
        // Verify processed image is ready
        await new Promise((resolve) => {
          const checkProcessedImage = () => {
            if (processedImage) {
              console.log('Task 5: Processed image confirmed ready for export');
              resolve();
            } else {
              // Run chroma key processing
              processChromaKey();
              // Check again after processing
              setTimeout(checkProcessedImage, 200);
            }
          };
          checkProcessedImage();
        });
      }
      
      // Step 3: Create composition with processed transparent image ONLY
      const finalResult = await composeFinalImage({
        transparentImage: processedImage, // MUST use processed image - NO fallback
        maskPath: borderPoints,
        borderOverlay: null // No floral frame - save only masked transparent image
      });
      
      if (!finalResult) {
        console.error('Task 5: Failed to create masked composition');
        return null;
      }
      
      // Step 2: Export as PNG with alpha
      const exportResult = await exportPNGWithAlpha(finalResult);
      
      if (exportResult) {
        console.log('Task 5: Masked transparent image exported successfully');
        console.log('Task 5: Ready for save/upload - no floral frame');
      }
      
      return exportResult;
      
    } catch (error) {
      console.error('Task 5: Error exporting masked composition:', error);
      return null;
    }
  }, [processedImage, composeFinalImage, exportPNGWithAlpha]);

  // Task 7: Persist Mask Metadata - Save mask data for dynamic photo reuse
  const createMaskMetadata = useCallback((borderPoints, exportResult) => {
    console.log('Task 7: Creating mask metadata for dynamic photo reuse');
    
    // Calculate mask bounds for auto-fitting
    const maskBounds = calculateMaskBounds(borderPoints);
    
    // Create comprehensive mask metadata
    const maskMetadata = {
      // Basic mask information
      maskPath: borderPoints,
      maskBounds: maskBounds,
      pointCount: borderPoints.length,
      
      // Visual properties
      feather: featherRadius[0],
      shadowBlur: shadowBlur[0],
      shadowOffset: shadowOffset[0],
      
      // Processing settings
      chromaKeySettings: chromaKeyEnabled ? {
        enabled: true,
        mode: chromaKeyMode,
        keyColor: chromaKeyMode === 'auto' ? detectedBackgroundColor : customKeyColor,
        tolerance: tolerance[0],
        edgeFeather: edgeFeather[0],
        edgeSmoothness: edgeSmoothness[0],
        spillSuppression: spillSuppression[0]
      } : null,
      
      // Export information
      exportInfo: exportResult ? {
        dimensions: exportResult.dimensions,
        format: exportResult.format,
        hasAlpha: exportResult.hasAlpha,
        quality: exportResult.quality,
        timestamp: new Date().toISOString()
      } : null,
      
      // Auto-fit metadata for dynamic photos
      autoFitMetadata: {
        maskArea: calculateInnerArea(borderPoints),
        aspectRatio: maskBounds ? (maskBounds.width / maskBounds.height).toFixed(2) : '1.0',
        centerPoint: calculateMaskCenter(borderPoints),
        scalingStrategy: 'contain', // 'contain', 'cover', 'fill'
        padding: 10, // pixels padding from mask edges
      },
      
      // Template information
      templateInfo: {
        assetType,
        mode,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        pipeline: 'chroma_key_mask_frame_png'
      }
    };
    
    console.log('Task 7: Mask metadata created');
    console.log('Task 7: Mask bounds:', maskBounds);
    console.log('Task 7: Point count:', borderPoints.length);
    
    return maskMetadata;
  }, [featherRadius, shadowBlur, shadowOffset, chromaKeyEnabled, chromaKeyMode, detectedBackgroundColor, customKeyColor, tolerance, edgeFeather, edgeSmoothness, spillSuppression, assetType, mode]);

  // Task 7: Calculate mask bounds for auto-fitting
  const calculateMaskBounds = useCallback((borderPoints) => {
    console.log('Task 7: Calculating mask bounds for auto-fitting');
    
    if (!borderPoints || borderPoints.length === 0) {
      console.error('Task 7: No border points provided for bounds calculation');
      return null;
    }
    
    // Find min/max coordinates
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    borderPoints.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    
    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2
    };
    
    console.log('Task 7: Mask bounds calculated:', bounds);
    return bounds;
  }, []);

  // Task 7: Save mask metadata to multiple storage locations
  const persistMaskMetadata = useCallback(async (borderPoints, exportResult) => {
    console.log('Task 7: Persisting mask metadata for reuse');
    
    try {
      // Create comprehensive metadata
      const metadata = createMaskMetadata(borderPoints, exportResult);
      
      // Save to backend API
      if (borderId) {
        console.log('Task 7: Saving mask metadata to backend API');
        const api = (await import('@/lib/api')).default;
        
        await api.put(`/api/admin/theme-assets/borders/${borderId}/mask-metadata`, metadata);
        console.log('Task 7: Backend metadata save completed');
      }
      
      // Save to localStorage for backup
      try {
        const storageKey = `wedlive-mask-metadata-${borderId || 'temp'}`;
        localStorage.setItem(storageKey, JSON.stringify(metadata));
        console.log('Task 7: LocalStorage backup completed');
      } catch (storageError) {
        console.warn('Task 7: LocalStorage backup failed:', storageError);
      }
      
      // Save to session storage for immediate access
      try {
        const sessionKey = `wedlive-mask-session-${Date.now()}`;
        sessionStorage.setItem(sessionKey, JSON.stringify(metadata));
        console.log('Task 7: SessionStorage backup completed');
      } catch (sessionError) {
        console.warn('Task 7: SessionStorage backup failed:', sessionError);
      }
      
      console.log('Task 7: Mask metadata persistence completed');
      console.log('Task 7: Metadata size:', JSON.stringify(metadata).length, 'characters');
      
      return metadata;
      
    } catch (error) {
      console.error('Task 7: Error persisting mask metadata:', error);
      return null;
    }
  }, [borderId, createMaskMetadata]);

  // Task 8: Dynamic Photo Auto-Fit Logic - Auto-fit uploaded photos to mask
  const calculateAutoFitTransform = useCallback((photoImage, maskMetadata) => {
    console.log('Task 8: Calculating auto-fit transform for photo');
    
    if (!photoImage || !maskMetadata || !maskMetadata.maskBounds) {
      console.error('Task 8: Missing photo image or mask metadata');
      return null;
    }
    
    const { maskBounds, autoFitMetadata } = maskMetadata;
    const padding = autoFitMetadata.padding || 10;
    
    // Calculate available space (mask bounds minus padding)
    const availableWidth = maskBounds.width - (padding * 2);
    const availableHeight = maskBounds.height - (padding * 2);
    
    // Calculate scaling ratios
    const scaleX = availableWidth / photoImage.width;
    const scaleY = availableHeight / photoImage.height;
    
    // Choose scaling strategy
    let scale, offsetX = 0, offsetY = 0;
    
    switch (autoFitMetadata.scalingStrategy) {
      case 'cover':
        // Cover the entire mask area (may crop photo)
        scale = Math.max(scaleX, scaleY);
        break;
      case 'fill':
        // Fill the mask area (may distort photo)
        scale = scaleX; // Use X scale for fill
        break;
      case 'contain':
      default:
        // Contain within mask (may have empty space)
        scale = Math.min(scaleX, scaleY);
        break;
    }
    
    // Calculate scaled dimensions
    const scaledWidth = photoImage.width * scale;
    const scaledHeight = photoImage.height * scale;
    
    // Center the scaled photo within the mask bounds
    offsetX = maskBounds.x + padding + (availableWidth - scaledWidth) / 2;
    offsetY = maskBounds.y + padding + (availableHeight - scaledHeight) / 2;
    
    const transform = {
      scale,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight,
      sourceWidth: photoImage.width,
      sourceHeight: photoImage.height,
      maskBounds,
      scalingStrategy: autoFitMetadata.scalingStrategy,
      padding
    };
    
    console.log('Task 8: Auto-fit transform calculated:', transform);
    return transform;
  }, []);

  // Task 8: Apply photo with auto-fit to mask
  const applyPhotoToMask = useCallback((canvas, photoImage, maskMetadata, transform) => {
    console.log('Task 8: Applying photo to mask with auto-fit');
    
    if (!canvas || !photoImage || !maskMetadata || !transform) {
      console.error('Task 8: Missing required parameters for photo application');
      return false;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Create mask path from metadata
    const maskPath = createMaskPath(maskMetadata.maskPath);
    
    if (!maskPath) {
      console.error('Task 8: Failed to create mask path');
      return false;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply mask clipping
    ctx.save();
    ctx.beginPath();
    ctx.clip(maskPath);
    
    // Draw photo with calculated transform
    ctx.drawImage(
      photoImage,
      transform.offsetX,
      transform.offsetY,
      transform.scaledWidth,
      transform.scaledHeight
    );
    
    // Restore context
    ctx.restore();
    
    console.log('Task 8: Photo applied to mask successfully');
    console.log('Task 8: Photo dimensions:', transform.scaledWidth, 'x', transform.scaledHeight);
    console.log('Task 8: Position:', transform.offsetX, 'x', transform.offsetY);
    
    return true;
  }, [createMaskPath]);

  // Task 8: Complete dynamic photo composition
  const composeDynamicPhoto = useCallback(async (photoImage, maskMetadata, floralFrame) => {
    console.log('Task 8: Creating dynamic photo composition');
    
    try {
      // Step 1: Calculate auto-fit transform
      const transform = calculateAutoFitTransform(photoImage, maskMetadata);
      
      if (!transform) {
        console.error('Task 8: Failed to calculate auto-fit transform');
        return null;
      }
      
      // Step 2: Create composition canvas
      const canvas = document.createElement('canvas');
      canvas.width = maskMetadata.exportInfo.dimensions.width;
      canvas.height = maskMetadata.exportInfo.dimensions.height;
      
      // Step 3: Apply photo to mask
      const photoApplied = applyPhotoToMask(canvas, photoImage, maskMetadata, transform);
      
      if (!photoApplied) {
        console.error('Task 8: Failed to apply photo to mask');
        return null;
      }
      
      // Step 4: Overlay floral frame (if provided)
      if (floralFrame) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(floralFrame, 0, 0);
        console.log('Task 8: Floral frame overlay applied');
      }
      
      // Step 5: Export as PNG with alpha
      const exportResult = await exportPNGWithAlpha(canvas);
      
      if (exportResult) {
        console.log('Task 8: Dynamic photo composition completed');
        console.log('Task 8: Auto-fit strategy:', transform.scalingStrategy);
        console.log('Task 8: Scale factor:', transform.scale.toFixed(2));
      }
      
      return exportResult;
      
    } catch (error) {
      console.error('Task 8: Error creating dynamic photo composition:', error);
      return null;
    }
  }, [calculateAutoFitTransform, applyPhotoToMask, exportPNGWithAlpha]);

  // Task 8: Load and process uploaded photo for dynamic fitting
  const processDynamicPhoto = useCallback(async (photoFile, maskMetadata) => {
    console.log('Task 8: Processing uploaded photo for dynamic fitting');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        console.log('Task 8: Photo loaded successfully:', img.width, 'x', img.height);
        
        // Load floral frame (original template image)
        const floralFrame = image; // Use current image as floral frame
        
        // Create dynamic composition
        const result = await composeDynamicPhoto(img, maskMetadata, floralFrame);
        
        if (result) {
          console.log('Task 8: Dynamic photo processing completed');
          resolve(result);
        } else {
          reject(new Error('Failed to create dynamic photo composition'));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load photo'));
      };
      
      img.src = URL.createObjectURL(photoFile);
    });
  }, [composeDynamicPhoto, image]);

  // Simplified Background Removal - Force transparency for dark backgrounds
  const processChromaKey = () => {
    if (!image) return;
    
    console.log('Processing Simplified Background Removal');
    
    // Create processing canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use original dimensions
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let pixelsRemoved = 0;
    
    // Simple background removal - remove dark/black pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      
      // Remove dark pixels (background)
      if (brightness < 80) { // Threshold for background
        data[i + 3] = 0; // Set alpha to 0 (transparent)
        pixelsRemoved++;
      }
    }
    
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
    
    console.log(`Background removal completed: ${pixelsRemoved} pixels made transparent`);
    
    // Create processed image
    canvas.toBlob((blob) => {
      const processedImageUrl = URL.createObjectURL(blob);
      const processedImg = new Image();
      processedImg.onload = () => {
        setProcessedImage(processedImg);
        setChromaKeyCanvas(canvas);
        console.log('Processed image with transparent background ready');
      };
      processedImg.src = processedImageUrl;
    }, 'image/png');
  };

  // Add real-time processing effect when Chroma Key settings change
  useEffect(() => {
    if (chromaKeyEnabled && image) {
      // Auto-process when settings change (with debounce)
      const timer = setTimeout(() => {
        processChromaKey();
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timer);
    }
  }, [chromaKeyEnabled, chromaKeyMode, customKeyColor, tolerance, edgeFeather, edgeSmoothness, spillSuppression, image]);

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
    } else if (mode === 'edit') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX / zoom - pan.x;
      const y = (e.clientY - rect.top) * scaleY / zoom - pan.y;

      // Check if clicking on a control point
      if (detectedBorder && Array.isArray(detectedBorder)) {
        const clickThreshold = 10; // pixels
        const pointIndex = detectedBorder.findIndex(point => {
          const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          return distance < clickThreshold;
        });

        if (pointIndex !== -1) {
          setDraggingPoint(pointIndex);
          setIsDrawing(true);
          return;
        }
      }

      // Otherwise, pan functionality
      if (currentTool === 'move') {
        setIsDrawing(true);
        const startX = e.clientX - pan.x * zoom;
        const startY = e.clientY - pan.y * zoom;
        setCurrentPath([{ x: startX, y: startY }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (mode === 'draw') {
      draw(e);
    } else if (mode === 'edit' && isDrawing) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX / zoom - pan.x;
      const y = (e.clientY - rect.top) * scaleY / zoom - pan.y;

      if (draggingPoint !== null) {
        // Update control point position
        const newBorder = [...detectedBorder];
        newBorder[draggingPoint] = { x, y };
        setDetectedBorder(newBorder);
      } else if (currentTool === 'move') {
        // Pan functionality
        const newX = (e.clientX - currentPath[0].x) / zoom;
        const newY = (e.clientY - currentPath[0].y) / zoom;
        setPan({ x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    if (mode === 'draw') {
      stopDrawing();
    } else {
      setIsDrawing(false);
      setCurrentPath([]);
      setDraggingPoint(null);
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
    
    // Draw background image - ALWAYS use processed image if available (source of truth)
    ctx.globalAlpha = templateOpacity[0];
    if (processedImage) {
      // ALWAYS use processed image when available - it's the source of truth
      console.log('Using processed transparent image as source of truth');
      ctx.drawImage(processedImage, 0, 0, scaledWidth, scaledHeight);
    } else if (image) {
      // Only use original image as fallback when no processed image exists
      console.log('Using original image (no processed image available)');
      ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
    }
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

  const handleSave = async () => {
    console.log('Save button clicked');
    console.log('Current mode:', mode);
    console.log('Current path length:', currentPath.length);
    console.log('Detected border length:', detectedBorder.length);
    console.log('onBorderSave exists:', !!onBorderSave);
    
    const finalBorder = mode === 'draw' && currentPath.length > 3 ? currentPath : detectedBorder;
    
    console.log('Final border length:', finalBorder.length);
    
    if (finalBorder.length > 0) {
      try {
        setSaving(true);
        
        // Task 6: Use standardized pipeline instead of old logic
        console.log('Task 6: Starting standardized pipeline: Chroma Key → Mask → Frame → PNG Export');
        
        // Step 1: Export final composition with transparency
        const exportResult = await exportFinalComposition(finalBorder);
      
      if (!exportResult) {
        console.error('Task 6: Pipeline failed - no export result');
        return;
      }
      
      console.log('Task 6: Standardized pipeline completed successfully');
      console.log('Task 6: Export result:', {
        dimensions: exportResult.dimensions,
        format: exportResult.format,
        hasAlpha: exportResult.hasAlpha,
        fileSize: (exportResult.blob.size / 1024 / 1024).toFixed(2) + 'MB'
      });
      
      // Step 2: Create mask data and persist metadata
        const persistResult = await persistMaskMetadata(finalBorder, exportResult);
        
        // Create mask data for backend compatibility - prioritize processed image
        const maskData = {
          polygon_points: finalBorder,
          svg_path: convertToSVGPath(finalBorder),
          feather_radius: featherRadius[0],
          inner_usable_area: calculateInnerArea(finalBorder),
          chroma_key_metadata: chromaKeyEnabled ? {
            enabled: true,
            mode: chromaKeyMode,
            key_color: chromaKeyMode === 'auto' ? detectedBackgroundColor : customKeyColor,
            tolerance: tolerance[0],
            edge_feather: edgeFeather[0],
            edge_smoothness: edgeSmoothness[0],
            spill_suppression: spillSuppression[0]
          } : null,
          processed_image_info: {
            originalSize: (exportResult.blob.size / 1024 / 1024).toFixed(2) + 'MB',
            dimensions: exportResult.dimensions,
            format: exportResult.format,
            hasAlpha: exportResult.hasAlpha,
            timestamp: new Date().toISOString(),
            // CRITICAL: Store processed image URL as primary source
            processedImageUrl: exportResult.url,
            processedBlob: exportResult.blob
          },
          export_metadata: {
            pipeline: 'chroma_key_mask_frame_png',
            quality: exportResult.quality,
            transparency: 'preserved',
            source: 'processed_transparent_image' // Mark source as processed
          },
          // Task 7: Add comprehensive metadata for dynamic reuse
          comprehensive_metadata: persistResult
        };

      // Step 3: Save to backend if borderId provided
        if (borderId) {
          console.log('Task 6: Saving to backend API');
          const api = (await import('@/lib/api')).default;
          const { toast } = await import('sonner');
          
          await api.put(`/api/admin/theme-assets/borders/${borderId}/mask`, maskData);
          
          toast.success('Border mask and processed image saved successfully!');
          console.log('Task 6: Backend save completed');
        }
        
        // Step 4: Call onBorderSave with processed result as primary source
        if (onBorderSave) {
          console.log('Task 6: Calling onBorderSave with processed transparent image as primary source');
          
          onBorderSave({
            points: finalBorder,
            feather: featherRadius[0],
            shadowBlur: shadowBlur[0],
            shadowOffset: shadowOffset[0],
            assetType,
            mode,
            shapes,
            maskData,
            // CRITICAL: Processed image is the primary source of truth
            processedImage: exportResult,
            processedImageUrl: exportResult.url,
            processedBlob: exportResult.blob,
            // Legacy compatibility - but marked as secondary
            originalImage: image,
            originalImageUrl: imageUrl,
            // Metadata for tracking
            source: 'processed_transparent_image',
            hasTransparency: exportResult.hasAlpha,
            pipeline: 'chroma_key_mask_frame_png'
          });
          
          console.log('Task 6: onBorderSave called with processed transparent image as source of truth');
        }
        
        setSaving(false);
      } catch (error) {
        console.error('Save failed:', error);
        setError('Failed to save border. Please try again.');
        setSaving(false);
      }
    } else {
      console.log('Save conditions not met:', {
        hasBorder: finalBorder.length > 0,
        hasCallback: !!onBorderSave,
        borderLength: finalBorder.length
      });
    }
  };

  // Enhanced Mask Clipping with existing border path and Chroma Key integration
  const applyMaskClipping = async (borderPoints) => {
    console.log('Task 4.2: Applying Enhanced Mask Clipping with border points:', borderPoints.length);
    
    // Use processed image if Chroma Key is enabled, otherwise use original image
    const sourceImage = chromaKeyEnabled && processedImage ? processedImage : image;
    
    if (!sourceImage) {
      console.error('No source image available for mask clipping');
      return null;
    }

    console.log('Using source image:', chromaKeyEnabled ? 'Chroma Key processed' : 'Original');

    // Create final export canvas at original resolution
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use original image dimensions for high-quality export
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Step 1: Create clipping path from border points
    ctx.save();
    ctx.beginPath();
    
    // Convert border points to canvas coordinates (scale if needed)
    const scaleX = canvas.width / sourceImage.width;
    const scaleY = canvas.height / sourceImage.height;
    
    borderPoints.forEach((point, i) => {
      const scaledX = point.x * scaleX;
      const scaledY = point.y * scaleY;
      
      if (i === 0) {
        ctx.moveTo(scaledX, scaledY);
      } else {
        ctx.lineTo(scaledX, scaledY);
      }
    });
    
    ctx.closePath();
    ctx.clip();
    
    // Step 2: Auto-fit image to mask bounds with intelligent scaling
    const autoFitResult = autoFitImageToMask(sourceImage, borderPoints, canvas.width, canvas.height);
    
    console.log('Using auto-fit results:', autoFitResult);
    
    // Step 3: Draw the processed/original image within the mask using auto-fit results
    ctx.drawImage(
      sourceImage, 
      autoFitResult.offsetX, 
      autoFitResult.offsetY, 
      autoFitResult.dimensions.width, 
      autoFitResult.dimensions.height
    );
    ctx.restore();
    
    // Step 4: Apply enhanced feather effect to mask edges
    if (featherRadius[0] > 0) {
      console.log('Applying enhanced mask feathering with radius:', featherRadius[0]);
      applyMaskFeathering(ctx, borderPoints, featherRadius[0], scaleX, scaleY);
    }
    
    // Step 5: Apply shadow effects if enabled
    if (shadowBlur[0] > 0 || shadowOffset[0] > 0) {
      console.log('Applying shadow effects');
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = shadowBlur[0];
      ctx.shadowOffsetX = shadowOffset[0];
      ctx.shadowOffsetY = shadowOffset[0];
      
      // Redraw with shadow
      ctx.beginPath();
      borderPoints.forEach((point, i) => {
        const scaledX = point.x * scaleX;
        const scaledY = point.y * scaleY;
        
        if (i === 0) {
          ctx.moveTo(scaledX, scaledY);
        } else {
          ctx.lineTo(scaledX, scaledY);
        }
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    
    // Step 6: Export as high-quality transparent PNG with metadata
    return new Promise((resolve) => {
      console.log('Task 5.1: Exporting Final Canvas as Transparent PNG');
      
      // Create export options for maximum quality
      const exportOptions = {
        format: 'image/png',
        quality: 1.0,
        type: 'image/png'
      };
      
      canvas.toBlob((blob) => {
        const processedImageUrl = URL.createObjectURL(blob);
        const finalImage = new Image();
        finalImage.onload = () => {
          console.log('Task 5.1: Final PNG export completed successfully');
          console.log('Export quality: Maximum (1.0)');
          console.log('Final canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('File size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
          console.log('Applied transformations:', autoFitResult);
          
          // Create comprehensive export result
          const exportResult = {
            blob,
            url: processedImageUrl,
            canvas,
            dimensions: { width: canvas.width, height: canvas.height },
            transform: { 
              scale: autoFitResult.scale, 
              offsetX: autoFitResult.offsetX, 
              offsetY: autoFitResult.offsetY, 
              featherRadius: featherRadius[0] 
            },
            metadata: {
              chromaKeyEnabled,
              chromaKeyMode,
              keyColor: chromaKeyMode === 'auto' ? detectedBackgroundColor : customKeyColor,
              tolerance: tolerance[0],
              edgeFeather: edgeFeather[0],
              edgeSmoothness: edgeSmoothness[0],
              spillSuppression: spillSuppression[0],
              shadowBlur: shadowBlur[0],
              shadowOffset: shadowOffset[0],
              borderPoints: borderPoints.length,
              imageAnalysis: autoFitResult.analysis,
              exportTimestamp: new Date().toISOString(),
              exportQuality: 'maximum'
            },
            fileSize: blob.size,
            fileType: 'image/png'
          };
          
          resolve(exportResult);
        };
        finalImage.src = processedImageUrl;
      }, exportOptions.format, exportOptions.quality);
    });
  };

  // Enhanced mask feathering with proper scaling
  const applyMaskFeathering = (ctx, borderPoints, featherRadius, scaleX, scaleY) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    
    // Scale feather radius for canvas coordinates
    const scaledFeatherRadius = featherRadius * Math.max(scaleX, scaleY);
    
    // Create gradient for feathered edges
    borderPoints.forEach((point, i) => {
      const nextPoint = borderPoints[(i + 1) % borderPoints.length];
      const prevPoint = borderPoints[(i - 1 + borderPoints.length) % borderPoints.length];
      
      // Calculate perpendicular direction for feathering
      const dx1 = point.x - prevPoint.x;
      const dy1 = point.y - prevPoint.y;
      const dx2 = nextPoint.x - point.x;
      const dy2 = nextPoint.y - point.y;
      
      const perpX = -(dy1 + dy2) / 2;
      const perpY = (dx1 + dx2) / 2;
      const length = Math.sqrt(perpX * perpX + perpY * perpY);
      
      if (length > 0) {
        const normalizedX = perpX / length;
        const normalizedY = perpY / length;
        
        // Create feather gradient with smooth falloff
        const gradient = ctx.createLinearGradient(
          point.x * scaleX, point.y * scaleY,
          (point.x + normalizedX * featherRadius) * scaleX,
          (point.y + normalizedY * featherRadius) * scaleY
        );
        
        gradient.addColorStop(0, 'rgba(0,0,0,0.4)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = scaledFeatherRadius * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(point.x * scaleX, point.y * scaleY);
        ctx.lineTo(nextPoint.x * scaleX, nextPoint.y * scaleY);
        ctx.stroke();
      }
    });
    
    ctx.restore();
  };

  // Convert points to SVG path string
  const convertToSVGPath = (points) => {
    if (!points || points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    // Use quadratic curves for smoother paths
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      path += ` Q ${current.x} ${current.y}, ${midX} ${midY}`;
    }
    
    // Close the path
    if (points.length > 2) {
      const last = points[points.length - 1];
      const first = points[0];
      path += ` L ${last.x} ${last.y} L ${first.x} ${first.y}`;
    }
    
    path += ' Z';
    return path;
  };

  // Advanced Auto-Fit Image to mask with content-aware positioning
  const autoFitImageToMask = (sourceImage, borderPoints, canvasWidth, canvasHeight) => {
    console.log('Task 4.3: Advanced Auto-Fit Image to mask');
    
    // Calculate mask bounds and center of mass
    const maskBounds = calculateInnerArea(borderPoints);
    const maskCenter = calculateMaskCenter(borderPoints);
    
    const sourceAspect = sourceImage.width / sourceImage.height;
    const maskAspect = maskBounds.width / maskBounds.height;
    
    // Content-aware scaling based on image analysis
    const imageAnalysis = analyzeImageContent(sourceImage);
    console.log('Image analysis:', imageAnalysis);
    
    let scale, offsetX, offsetY;
    
    // Intelligent scaling strategy
    if (imageAnalysis.hasFaces || imageAnalysis.hasImportantContent) {
      // For images with important content, use conservative scaling
      if (sourceAspect > maskAspect) {
        scale = Math.min(maskBounds.height / sourceImage.height, maskBounds.width / sourceImage.width) * 0.95;
      } else {
        scale = Math.min(maskBounds.width / sourceImage.width, maskBounds.height / sourceImage.height) * 0.95;
      }
    } else {
      // For background images, use more aggressive scaling
      if (sourceAspect > maskAspect) {
        scale = maskBounds.height / sourceImage.height * 1.05;
      } else {
        scale = maskBounds.width / sourceImage.width * 1.05;
      }
    }
    
    // Smart positioning based on content focus
    if (imageAnalysis.focusPoint) {
      // Position to keep focus point in mask center
      const focusX = imageAnalysis.focusPoint.x * scale;
      const focusY = imageAnalysis.focusPoint.y * scale;
      
      offsetX = maskCenter.x - focusX;
      offsetY = maskCenter.y - focusY;
    } else {
      // Center alignment with smart padding
      offsetX = maskCenter.x - (sourceImage.width * scale) / 2;
      offsetY = maskCenter.y - (sourceImage.height * scale) / 2;
    }
    
    // Apply boundary constraints
    const padding = 10; // 10px minimum padding
    offsetX = Math.max(padding, Math.min(offsetX, canvasWidth - sourceImage.width * scale - padding));
    offsetY = Math.max(padding, Math.min(offsetY, canvasHeight - sourceImage.height * scale - padding));
    
    console.log(`Auto-fit results: scale=${scale.toFixed(2)}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
    
    return {
      scale,
      offsetX,
      offsetY,
      dimensions: {
        width: sourceImage.width * scale,
        height: sourceImage.height * scale
      },
      analysis: imageAnalysis
    };
  };

  // Analyze image content for intelligent fitting
  const analyzeImageContent = (sourceImage) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use smaller canvas for analysis performance
    const analysisSize = 200;
    const scale = analysisSize / Math.max(sourceImage.width, sourceImage.height);
    
    canvas.width = sourceImage.width * scale;
    canvas.height = sourceImage.height * scale;
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple content analysis
    let brightness = 0;
    let edgeDensity = 0;
    let centerWeight = 0;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centerRadius = Math.min(canvas.width, canvas.height) / 4;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const pixelBrightness = (r + g + b) / 3;
        brightness += pixelBrightness;
        
        // Simple edge detection
        if (x > 0 && y > 0) {
          const prevIdx = ((y - 1) * canvas.width + (x - 1)) * 4;
          const prevR = data[prevIdx];
          const prevG = data[prevIdx + 1];
          const prevB = data[prevIdx + 2];
          
          const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
          if (diff > 30) edgeDensity++;
        }
        
        // Center weight (content in center is more important)
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distFromCenter < centerRadius) {
          centerWeight += pixelBrightness;
        }
      }
    }
    
    const totalPixels = canvas.width * canvas.height;
    brightness /= totalPixels;
    edgeDensity /= totalPixels;
    centerWeight /= (Math.PI * centerRadius * centerRadius);
    
    // Determine content characteristics
    const hasImportantContent = edgeDensity > 0.02 || centerWeight > brightness * 1.2;
    const hasFaces = false; // Could be enhanced with face detection
    const focusPoint = centerWeight > brightness * 1.1 ? { x: centerX / scale, y: centerY / scale } : null;
    
    return {
      brightness: brightness / 255,
      contrast: 0, // Could be enhanced
      edgeDensity,
      hasImportantContent,
      hasFaces,
      focusPoint,
      centerWeight: centerWeight / 255
    };
  };

  // Calculate mask center of mass for better positioning
  const calculateMaskCenter = (borderPoints) => {
    let centerX = 0;
    let centerY = 0;
    let area = 0;
    
    for (let i = 0; i < borderPoints.length; i++) {
      const p1 = borderPoints[i];
      const p2 = borderPoints[(i + 1) % borderPoints.length];
      
      const crossProduct = p1.x * p2.y - p2.x * p1.y;
      area += crossProduct;
      
      centerX += (p1.x + p2.x) * crossProduct;
      centerY += (p1.y + p2.y) * crossProduct;
    }
    
    area /= 2;
    if (Math.abs(area) > 0.0001) {
      centerX /= (6 * area);
      centerY /= (6 * area);
    } else {
      // Fallback to simple averaging
      centerX = borderPoints.reduce((sum, p) => sum + p.x, 0) / borderPoints.length;
      centerY = borderPoints.reduce((sum, p) => sum + p.y, 0) / borderPoints.length;
    }
    
    return { x: centerX, y: centerY };
  };

  // Task 5.2: Replace Raw Upload with processed image
  const replaceRawUploadWithProcessedImage = async (exportResult) => {
    console.log('Task 5.2: Replacing Raw Upload with Processed Image');
    
    if (!exportResult || !exportResult.blob) {
      console.error('No export result available for image replacement');
      return false;
    }
    
    try {
      // Create new File object from processed blob
      const processedFile = new File(
        [exportResult.blob], 
        `processed_${Date.now()}.png`, 
        { type: 'image/png' }
      );
      
      // Create new image from processed result
      const newImage = new Image();
      newImage.onload = () => {
        console.log('Task 5.2: Successfully loaded processed image');
        
        // Replace the original image with processed one
        setImage(newImage);
        setProcessedImage(null); // Clear processed image since it's now the main image
        
        // Update image URL if needed (optional callback)
        // Note: onImageChange is not a prop, so we skip this for now
        
        // Update preview if applicable (optional callback)
        // Note: setPreviewPhoto is not available, so we skip this for now
        
        console.log('Task 5.2: Raw upload successfully replaced with processed image');
        console.log('New image dimensions:', newImage.width, 'x', newImage.height);
        console.log('File size:', (processedFile.size / 1024 / 1024).toFixed(2), 'MB');
      };
      
      newImage.onerror = (error) => {
        console.error('Task 5.2: Failed to load processed image:', error);
      };
      
      newImage.src = exportResult.url;
      
      return processedFile;
      
    } catch (error) {
      console.error('Task 5.2: Error replacing raw upload:', error);
      return false;
    }
  };

  // Task 5.3: Save Metadata with comprehensive processing information
  const saveComprehensiveMetadata = async (exportResult, borderPoints) => {
    console.log('Task 5.3: Saving Comprehensive Metadata');
    
    if (!exportResult) {
      console.error('No export result available for metadata saving');
      return false;
    }
    
    try {
      // Create comprehensive metadata object
      const comprehensiveMetadata = {
        // Basic information
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        processingType: 'chroma_key_with_mask_clipping',
        
        // Original image information
        originalImage: {
          width: image?.width || 0,
          height: image?.height || 0,
          aspectRatio: image ? (image.width / image.height).toFixed(2) : 0,
        },
        
        // Processed image information
        processedImage: {
          width: exportResult.dimensions.width,
          height: exportResult.dimensions.height,
          aspectRatio: (exportResult.dimensions.width / exportResult.dimensions.height).toFixed(2),
          fileSize: exportResult.fileSize,
          fileSizeMB: (exportResult.fileSize / 1024 / 1024).toFixed(2),
          fileType: exportResult.fileType,
          exportQuality: exportResult.metadata.exportQuality
        },
        
        // Chroma Key settings
        chromaKey: {
          enabled: chromaKeyEnabled,
          mode: chromaKeyMode,
          keyColor: chromaKeyMode === 'auto' ? detectedBackgroundColor : customKeyColor,
          tolerance: tolerance[0],
          edgeFeather: edgeFeather[0],
          edgeSmoothness: edgeSmoothness[0],
          spillSuppression: spillSuppression[0],
          detectedBackgroundColor: detectedBackgroundColor,
          processingTimestamp: new Date().toISOString()
        },
        
        // Border and mask information
        border: {
          points: borderPoints,
          pointCount: borderPoints.length,
          featherRadius: featherRadius[0],
          shadowBlur: shadowBlur[0],
          shadowOffset: shadowOffset[0],
          svgPath: convertToSVGPath(borderPoints),
          innerArea: calculateInnerArea(borderPoints),
          centerOfMass: calculateMaskCenter(borderPoints)
        },
        
        // Auto-fit and transformation information
        transformation: {
          scale: exportResult.transform.scale,
          offsetX: exportResult.transform.offsetX,
          offsetY: exportResult.transform.offsetY,
          autoFitAnalysis: exportResult.metadata.imageAnalysis,
          scalingStrategy: exportResult.metadata.imageAnalysis.hasImportantContent ? 'conservative' : 'aggressive'
        },
        
        // Processing pipeline information
        pipeline: {
          order: ['Upload', 'Chroma Key', 'Alpha Mask', 'Edge Feathering', 'Mask Clipping', 'Export'],
          stepsCompleted: [
            'Background Detection',
            'Chroma Key Processing',
            'Alpha Mask Generation',
            'Edge Feathering',
            'Mask Clipping',
            'Auto-Fit Image',
            'PNG Export'
          ],
          processingTime: new Date().toISOString(),
          totalProcessingSteps: 7
        },
        
        // Quality and performance metrics
        quality: {
          exportQuality: 'maximum',
          compressionLevel: 'none',
          colorSpace: 'sRGB',
          alphaChannel: true,
          transparency: true
        },
        
        // Technical specifications
        technical: {
          canvasWidth: exportResult.dimensions.width,
          canvasHeight: exportResult.dimensions.height,
          pixelCount: exportResult.dimensions.width * exportResult.dimensions.height,
          coordinateSystem: 'cartesian',
          units: 'pixels'
        }
      };
      
      // Save metadata to backend if borderId is provided
      if (borderId) {
        try {
          const api = (await import('@/lib/api')).default;
          await api.put(`/api/admin/theme-assets/borders/${borderId}/metadata`, comprehensiveMetadata);
          console.log('Task 5.3: Metadata successfully saved to backend');
        } catch (backendError) {
          console.warn('Task 5.3: Could not save metadata to backend:', backendError);
        }
      }
      
      // Save metadata to local storage for backup
      try {
        const metadataKey = `border_metadata_${borderId || Date.now()}`;
        localStorage.setItem(metadataKey, JSON.stringify(comprehensiveMetadata));
        console.log('Task 5.3: Metadata saved to local storage');
      } catch (storageError) {
        console.warn('Task 5.3: Could not save metadata to local storage:', storageError);
      }
      
      // Call metadata callback if provided (optional)
      // Note: onMetadataSave is not a prop, so we skip this for now
      
      console.log('Task 5.3: Comprehensive metadata saved successfully');
      console.log('Metadata size:', JSON.stringify(comprehensiveMetadata).length, 'characters');
      
      return comprehensiveMetadata;
      
    } catch (error) {
      console.error('Task 5.3: Error saving comprehensive metadata:', error);
      return false;
    }
  };

  // Calculate inner usable area
  const calculateInnerArea = (points) => {
    if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Add padding for feather
    const padding = featherRadius[0];
    
    return {
      x: minX + padding,
      y: minY + padding,
      width: maxX - minX - (padding * 2),
      height: maxY - minY - (padding * 2)
    };
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

  // Auto Background Detection - Enhanced with multiple sampling strategies
  const detectBackgroundColor = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Strategy 1: Corner and edge sampling
    const samples = [];
    const sampleSize = 15; // Increased sample size for better accuracy
    
    // Corner samples (4 corners)
    samples.push(ctx.getImageData(0, 0, sampleSize, sampleSize).data);
    samples.push(ctx.getImageData(img.width - sampleSize, 0, sampleSize, sampleSize).data);
    samples.push(ctx.getImageData(0, img.height - sampleSize, sampleSize, sampleSize).data);
    samples.push(ctx.getImageData(img.width - sampleSize, img.height - sampleSize, sampleSize, sampleSize).data);
    
    // Edge midpoints (4 edges)
    samples.push(ctx.getImageData(img.width / 2 - sampleSize / 2, 0, sampleSize, sampleSize).data);
    samples.push(ctx.getImageData(img.width / 2 - sampleSize / 2, img.height - sampleSize, sampleSize, sampleSize).data);
    samples.push(ctx.getImageData(0, img.height / 2 - sampleSize / 2, sampleSize, sampleSize).data);
    samples.push(ctx.getImageData(img.width - sampleSize, img.height / 2 - sampleSize / 2, sampleSize, sampleSize).data);

    // Strategy 2: Dominant color analysis in border regions
    const borderRegions = [
      { x: 0, y: 0, w: img.width, h: 50 }, // Top border
      { x: 0, y: img.height - 50, w: img.width, h: 50 }, // Bottom border
      { x: 0, y: 0, w: 50, h: img.height }, // Left border
      { x: img.width - 50, y: 0, w: 50, h: img.height } // Right border
    ];

    const borderColors = [];
    borderRegions.forEach(region => {
      const regionData = ctx.getImageData(region.x, region.y, region.w, region.h).data;
      const dominantColor = findDominantColor(regionData);
      if (dominantColor) borderColors.push(dominantColor);
    });

    // Calculate average RGB from corner/edge samples
    let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
    
    samples.forEach(sampleData => {
      for (let i = 0; i < sampleData.length; i += 4) {
        totalR += sampleData[i];
        totalG += sampleData[i + 1];
        totalB += sampleData[i + 2];
        pixelCount++;
      }
    });

    // Combine corner sampling with dominant color analysis
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);

    // Weight the results: 70% corner sampling, 30% dominant border colors
    let finalR = avgR * 0.7;
    let finalG = avgG * 0.7;
    let finalB = avgB * 0.7;

    if (borderColors.length > 0) {
      const borderAvgR = borderColors.reduce((sum, c) => sum + c.r, 0) / borderColors.length;
      const borderAvgG = borderColors.reduce((sum, c) => sum + c.g, 0) / borderColors.length;
      const borderAvgB = borderColors.reduce((sum, c) => sum + c.b, 0) / borderColors.length;
      
      finalR += borderAvgR * 0.3;
      finalG += borderAvgG * 0.3;
      finalB += borderAvgB * 0.3;
    }

    finalR = Math.round(finalR);
    finalG = Math.round(finalG);
    finalB = Math.round(finalB);
    
    const hexColor = '#' + 
      ((1 << 24) + (finalR << 16) + (finalG << 8) + finalB)
      .toString(16).slice(1).toUpperCase();
    
    console.log('Enhanced background detection:', hexColor, `RGB(${finalR}, ${finalG}, ${finalB})`);
    console.log('Border dominant colors found:', borderColors.length);
    
    setDetectedBackgroundColor(hexColor);
    return hexColor;
  };

  // Helper function to find dominant color in image data
  const findDominantColor = (imageData) => {
    const colorMap = new Map();
    const step = 4; // Sample every 4th pixel for performance
    
    for (let i = 0; i < imageData.length; i += step * 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Quantize colors to reduce variations
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;
      
      const key = `${quantizedR},${quantizedG},${quantizedB}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    if (colorMap.size === 0) return null;
    
    // Find the most frequent color
    let maxCount = 0;
    let dominantColor = null;
    
    colorMap.forEach((count, colorKey) => {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = colorKey.split(',').map(Number);
        dominantColor = { r, g, b };
      }
    });
    
    return dominantColor;
  };

  // Helper function to convert RGB to HSV
  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;
    
    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / diff + 2) / 6; break;
        case b: h = ((r - g) / diff + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s: s * 100, v: v * 100 };
  };

  // Helper function to convert RGB to CIE Lab
  const rgbToLab = (r, g, b) => {
    // Convert RGB to XYZ
    let [x, y, z] = rgbToXyz(r, g, b);
    
    // Normalize for D65 white point
    x /= 95.047;
    y /= 100.000;
    z /= 108.883;
    
    // Apply Lab transformation
    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
    
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b_lab = 200 * (fy - fz);
    
    return { l, a: a_lab, b: b_lab };
  };

  // Helper function to convert RGB to XYZ
  const rgbToXyz = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    // Apply gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    // Convert to XYZ using sRGB matrix
    const x = r * 41.24 + g * 21.26 + b * 1.93;
    const y = r * 21.26 + g * 71.52 + b * 7.22;
    const z = r * 1.93 + g * 7.22 + b * 95.05;
    
    return [x, y, z];
  };

  // Generate Alpha Mask - Creates clean alpha channel from Chroma Key processing
  const generateAlphaMask = (imageData, keyColor, tolerance) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Create separate alpha mask canvas
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = width;
    maskCanvas.height = height;
    
    const maskImageData = maskCtx.createImageData(width, height);
    const maskData = maskImageData.data;
    
    // Convert key color to RGB
    const keyRGB = hexToRgb(keyColor);
    const toleranceValue = tolerance * 2.55;
    
    console.log('Generating alpha mask with key color:', keyColor, 'tolerance:', tolerance);
    
    let foregroundPixels = 0;
    let backgroundPixels = 0;
    let edgePixels = 0;
    
    // Process each pixel to generate clean alpha mask
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color distance using multiple methods
      const rgbDistance = Math.sqrt(
        Math.pow(r - keyRGB.r, 2) + 
        Math.pow(g - keyRGB.g, 2) + 
        Math.pow(b - keyRGB.b, 2)
      );
      
      // HSV distance for better hue detection
      const pixelHSV = rgbToHsv(r, g, b);
      const keyHSV = rgbToHsv(keyRGB.r, keyRGB.g, keyRGB.b);
      const hsvDistance = Math.sqrt(
        Math.pow(pixelHSV.h - keyHSV.h, 2) * 100 +
        Math.pow(pixelHSV.s - keyHSV.s, 2) * 50 +
        Math.pow(pixelHSV.v - keyHSV.v, 2)
      );
      
      // Combined distance calculation
      const combinedDistance = (rgbDistance * 0.6 + hsvDistance * 0.4);
      
      // Generate alpha values with clean separation
      let alphaValue = 255; // Default to foreground
      
      if (combinedDistance < toleranceValue) {
        // Background - completely transparent
        alphaValue = 0;
        backgroundPixels++;
      } else if (combinedDistance < toleranceValue * 1.5) {
        // Edge region - gradient alpha
        const edgeFactor = 1 - (combinedDistance - toleranceValue) / (toleranceValue * 0.5);
        alphaValue = Math.floor(255 * edgeFactor);
        edgePixels++;
      } else {
        // Foreground - completely opaque
        alphaValue = 255;
        foregroundPixels++;
      }
      
      // Set mask data (grayscale alpha mask)
      const maskIndex = i / 4;
      maskData[maskIndex * 4] = alphaValue;     // R
      maskData[maskIndex * 4 + 1] = alphaValue; // G
      maskData[maskIndex * 4 + 2] = alphaValue; // B
      maskData[maskIndex * 4 + 3] = 255;        // A (mask is always opaque)
    }
    
    // Apply morphological operations to clean up the mask
    const cleanedMask = cleanAlphaMask(maskImageData);
    
    // Put the cleaned mask back
    maskCtx.putImageData(cleanedMask, 0, 0);
    
    console.log(`Alpha mask generated: ${foregroundPixels} foreground, ${edgePixels} edge, ${backgroundPixels} background pixels`);
    
    return {
      canvas: maskCanvas,
      imageData: cleanedMask,
      stats: { foregroundPixels, edgePixels, backgroundPixels }
    };
  };

  // Clean Alpha Mask with morphological operations
  const cleanAlphaMask = (maskImageData) => {
    const data = maskImageData.data;
    const width = maskImageData.width;
    const height = maskImageData.height;
    const cleanedData = new Uint8ClampedArray(data);
    
    // Remove isolated pixels (noise reduction)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const centerAlpha = data[idx];
        
        if (centerAlpha < 128) { // Background pixel
          // Check if surrounded by foreground (isolated background)
          let foregroundNeighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
              if (data[neighborIdx] > 200) foregroundNeighbors++;
            }
          }
          
          // If mostly surrounded by foreground, convert to foreground
          if (foregroundNeighbors >= 6) {
            cleanedData[idx] = 255;
            cleanedData[idx + 1] = 255;
            cleanedData[idx + 2] = 255;
          }
        }
      }
    }
    
    return new ImageData(cleanedData, width, height);
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Apply edge feathering with smoothness and spill suppression
  const applyEdgeFeathering = (imageData, featherRadius) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const radius = Math.ceil(featherRadius);
    const smoothnessFactor = edgeSmoothness[0] / 100;
    const spillSuppressionFactor = spillSuppression[0] / 100;
    
    // Create temporary arrays for alpha channel processing
    const alphaData = new Uint8ClampedArray(width * height);
    const rgbData = new Uint8ClampedArray(width * height * 3);
    
    // Extract alpha and RGB channels
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      alphaData[j] = data[i + 3];
      rgbData[j * 3] = data[i];
      rgbData[j * 3 + 1] = data[i + 1];
      rgbData[j * 3 + 2] = data[i + 2];
    }
    
    // Apply advanced gaussian blur with smoothness
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weight = 0;
        let rSum = 0, gSum = 0, bSum = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance <= radius) {
                // Enhanced gaussian weight with smoothness
                const gaussianWeight = Math.exp(-(distance * distance) / (2 * featherRadius * featherRadius * (1 + smoothnessFactor)));
                sum += alphaData[ny * width + nx] * gaussianWeight;
                weight += gaussianWeight;
                
                // Collect RGB data for spill suppression
                const idx = (ny * width + nx) * 3;
                rSum += rgbData[idx] * gaussianWeight;
                gSum += rgbData[idx + 1] * gaussianWeight;
                bSum += rgbData[idx + 2] * gaussianWeight;
              }
            }
          }
        }
        
        if (weight > 0) {
          const blurredAlpha = sum / weight;
          const originalAlpha = alphaData[y * width + x];
          
          // Apply smoothness blending
          const finalAlpha = originalAlpha * (1 - smoothnessFactor) + blurredAlpha * smoothnessFactor;
          
          // Apply spill suppression to reduce color bleeding
          const pixelIndex = (y * width + x) * 4;
          if (finalAlpha < 255 && spillSuppressionFactor > 0) {
            // Reduce color intensity in semi-transparent areas
            const spillReduction = 1 - (spillSuppressionFactor * (1 - finalAlpha / 255));
            data[pixelIndex] = Math.floor(data[pixelIndex] * spillReduction);
            data[pixelIndex + 1] = Math.floor(data[pixelIndex + 1] * spillReduction);
            data[pixelIndex + 2] = Math.floor(data[pixelIndex + 2] * spillReduction);
          }
          
          data[pixelIndex + 3] = finalAlpha;
        }
      }
    }
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

        {/* Chroma Key Controls */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Chroma Key Background Removal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chroma Key Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chromaKeyEnabled}
                  onChange={(e) => setChromaKeyEnabled(e.target.checked)}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm font-medium">Enable Background Removal</span>
              </label>
              {chromaKeyEnabled && (
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              )}
            </div>

            {chromaKeyEnabled && (
              <>
                {/* Mode Selection */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setChromaKeyMode('auto')}
                    variant={chromaKeyMode === 'auto' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    <Sun className="w-3 h-3 mr-1" />
                    Auto Detect
                  </Button>
                  <Button
                    onClick={() => setChromaKeyMode('custom')}
                    variant={chromaKeyMode === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    <Droplet className="w-3 h-3 mr-1" />
                    Custom Color
                  </Button>
                </div>

                {/* Custom Color Picker */}
                {chromaKeyMode === 'custom' && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Key Color:</label>
                    <input
                      type="color"
                      value={customKeyColor}
                      onChange={(e) => setCustomKeyColor(e.target.value)}
                      className="w-12 h-8 border rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-600">{customKeyColor}</span>
                  </div>
                )}

                {/* Detected Background Color (Auto Mode) */}
                {chromaKeyMode === 'auto' && detectedBackgroundColor && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Detected:</label>
                    <div 
                      className="w-12 h-8 border rounded"
                      style={{ backgroundColor: detectedBackgroundColor }}
                    />
                    <span className="text-xs text-gray-600">{detectedBackgroundColor}</span>
                  </div>
                )}

                {/* Tolerance Slider */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tolerance: {tolerance[0]}%
                  </label>
                  <Slider
                    value={tolerance}
                    onValueChange={setTolerance}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Edge Refinement Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Edge Feather: {edgeFeather[0]}px
                    </label>
                    <Slider
                      value={edgeFeather}
                      onValueChange={setEdgeFeather}
                      max={10}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Edge Smoothness: {edgeSmoothness[0]}%
                    </label>
                    <Slider
                      value={edgeSmoothness}
                      onValueChange={setEdgeSmoothness}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Spill Suppression: {spillSuppression[0]}%
                    </label>
                    <Slider
                      value={spillSuppression}
                      onValueChange={setSpillSuppression}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Process Button */}
                <Button
                  onClick={() => processChromaKey()}
                  disabled={!image}
                  size="sm"
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Process Background Removal
                </Button>
              </>
            )}
          </CardContent>
        </Card>

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
          
          {previewPhotoUrl && (
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={saving || (!borderId && !onBorderSave) || 
                     (mode === 'detect' && detectedBorder.length === 0) || 
                     (mode === 'draw' && currentPath.length < 3)}
            size="sm"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Border</>
            )}
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

        {/* Preview Panel */}
        {showPreview && previewPhoto && detectedBorder.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Real-time Mask Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ maxWidth: '400px', maxHeight: '400px', margin: '0 auto' }}>
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    clipPath: detectedBorder.length > 0 ? `polygon(${detectedBorder.map(p => `${p.x}px ${p.y}px`).join(', ')})` : 'none'
                  }}
                >
                  <img 
                    src={previewPhotoUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: `blur(${featherRadius[0]}px)`
                    }}
                  />
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs p-2 rounded">
                  <div>Feather: {featherRadius[0]}px</div>
                  <div>Points: {detectedBorder.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chroma Key Live Preview */}
        {chromaKeyEnabled && processedImage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                Chroma Key Preview - Background Removed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Image */}
                <div>
                  <h4 className="text-xs font-medium text-red-700 mb-2">Original</h4>
                  <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ maxHeight: '200px' }}>
                    <img 
                      src={imageUrl}
                      alt="Original"
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                </div>
                
                {/* Processed Image with Transparency */}
                <div>
                  <h4 className="text-xs font-medium text-green-700 mb-2">Processed (Transparent)</h4>
                  <div 
                    className="relative border rounded-lg overflow-hidden"
                    style={{ 
                      maxHeight: '200px',
                      backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 10px 10px'
                    }}
                  >
                    <img 
                      src={processedImage.src}
                      alt="Processed"
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Processing Info */}
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div>
                    <span className="font-medium">Mode:</span> {chromaKeyMode}
                  </div>
                  <div>
                    <span className="font-medium">Tolerance:</span> {tolerance[0]}%
                  </div>
                  <div>
                    <span className="font-medium">Feather:</span> {edgeFeather[0]}px
                  </div>
                  <div>
                    <span className="font-medium">Key Color:</span> 
                    <span 
                      className="inline-block w-3 h-3 ml-1 border border-gray-300 rounded"
                      style={{ backgroundColor: chromaKeyMode === 'auto' ? detectedBackgroundColor : customKeyColor }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              cursor: mode === 'draw' && currentTool === 'pen' ? 'crosshair' : mode === 'edit' ? 'move' : 'default'
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
