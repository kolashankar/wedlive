'use client';
import React, { useRef, useEffect, useState } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

export default function TransitionCanvas({ 
    prevSrc, 
    nextSrc, 
    maskSrc, 
    duration = 2, // seconds
    onComplete 
}) {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const startTimeRef = useRef();
    const [status, setStatus] = useState('loading'); // loading, ready, playing, error

    useEffect(() => {
        let isMounted = true;
        const loadAssets = async () => {
            try {
                // 1. Load Images
                const loadImage = (src) => new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
                    img.src = src;
                });

                const [imgA, imgB] = await Promise.all([
                    loadImage(prevSrc),
                    loadImage(nextSrc)
                ]);

                if (!isMounted) return;

                // 2. Load and Parse GIF Mask
                const response = await fetch(maskSrc);
                const buffer = await response.arrayBuffer();
                const gif = parseGIF(buffer);
                const frames = decompressFrames(gif, true);

                // 3. Start Animation
                startAnimation(imgA, imgB, frames);

            } catch (err) {
                console.error("Transition Error:", err);
                if (isMounted) setStatus('error');
                if (onComplete) onComplete(); // Fallback to finish
            }
        };

        loadAssets();

        return () => {
            isMounted = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [prevSrc, nextSrc, maskSrc]);

    const startAnimation = (imgA, imgB, frames) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Set canvas dimensions to match the display size or image size
        // For best quality, match the image aspect ratio
        // But for full screen slideshow, we likely want to fill screen?
        // Let's assume standard behavior: cover or contain. 
        // Based on SlideshowPlayer, it uses object-contain. 
        // We should match the container size.
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 1920;
        canvas.height = rect.height || 1080;
        
        const totalDuration = duration * 1000;
        
        // Helper to draw image cover/contain
        // We will implement a simplified 'cover' or 'contain' here
        // matching the "object-contain" class from SlideshowPlayer
        
        const drawImageContain = (ctx, img, cw, ch) => {
             const scale = Math.min(cw / img.width, ch / img.height);
             const w = img.width * scale;
             const h = img.height * scale;
             const x = (cw - w) / 2;
             const y = (ch - h) / 2;
             ctx.drawImage(img, x, y, w, h);
             return { x, y, w, h }; // Return drawn rect for masking if needed
        };

        // We need to render the transition
        // The Prompt Algorithm:
        // Result = A * (1 - alpha) + B * alpha
        // But doing pixel manipulation in JS on full HD images is SLOW (CPU bound).
        // 1920x1080 * 4 bytes = ~8MB per frame. 60fps = 480MB/s throughput.
        // It might be janky on main thread. 
        
        // OPTIMIZATION: 
        // Instead of per-pixel CPU loop, use GlobalCompositeOperation if possible.
        // Can we do: 
        // 1. Draw Image A
        // 2. Draw Image B (masked by GIF) on top?
        
        // Logic:
        // Layer 1: Image A (Base)
        // Layer 2: Image B with Mask. 
        // To achieve "Mask determines where B is seen":
        //    Draw Mask (Luminance to Alpha) -> Destination-In? No.
        //    
        //    Standard Canvas approach for Masking:
        //    1. Draw Mask.
        //    2. set gCO = 'source-in' (Keep source where dest is opaque).
        //    3. Draw Image B. 
        //    4. Reset gCO.
        //    5. Draw Image A (behind? No, we need A where B is NOT).
        
        //    Correct Composition:
        //    1. Clear Canvas.
        //    2. Draw Image A (Background).
        //    3. Create an offscreen canvas for the "Masked B".
        //       a. Draw MaskFrame on offscreen.
        //       b. gCO = 'source-in'
        //       c. Draw Image B on offscreen.
        //    4. Draw offscreen canvas onto Main Canvas.
        
        //    Wait, the mask is a GIF frames. They are likely opaque grayscale pixels?
        //    If GIF is grayscale: White = Show B? Black = Show A?
        //    Prompt says: "mix(ImageA, ImageB, MaskAlpha)".
        //    If Mask is Grayscale, we can treat Luminance as Alpha.
        
        //    If 'source-in' uses Alpha, and GIF is opaque but grayscale, we need to convert Luma to Alpha?
        //    Or we can use 'luminosity' blend mode? No.
        
        //    If the GIF has transparency, 'source-in' works directly.
        //    If the GIF is black-and-white (Luma mask):
        //    We might need a temp canvas to convert Luma to Alpha or use a custom filter.
        //    However, most "transition masks" are black/white.
        //    
        //    Let's stick to the prompt's suggested Pixel Manipulation loop first.
        //    If it's too slow, we optimize.
        //    Actually, prompt says "Step 3 — Render animation ... ctx.createImageData ... loop".
        //    This is CPU intensive but explicit.
        
        //    Optimization for "Luma Mask" using Composite Operations:
        //    (Avoids pixel loop)
        //    1. Draw Image A.
        //    2. Draw Image B.
        //    3. Draw Mask using 'destination-in'? -> This would clip B to Mask.
        //       But we want A to show where B is clipped out.
        //       
        //       Flow:
        //       1. Draw Image A (Full).
        //       2. Save Context.
        //       3. Begin Path/Clip? No, mask is raster.
        //       
        //       Flow:
        //       1. Offscreen: Draw Mask.
        //       2. Offscreen: gCO = 'source-in' -> Draw Image B. (B is now shaped like Mask).
        //       3. Main: Draw Image A.
        //       4. Main: Draw Offscreen (B).
        //       
        //       This works IF the Mask has ALPHA channel (Transparency).
        //       If the Mask is JPG/GIF with Black/White pixels (no alpha), 'source-in' treats Black (opaque) same as White (opaque).
        //       
        //    Most "transition masks" are Grayscale.
        //    We need "Luma to Alpha".
        //    
        //    If the prompt specifically gave the pixel loop code, I should probably use it or a WebGL shader.
        //    WebGL is best but complex to setup quickly.
        //    Pixel loop is easiest to implement but slow.
        //    
        //    Let's try the Pixel Loop first as requested.
        //    But I will downscale the canvas if performance is bad.
        
        const animate = (time) => {
            if (!startTimeRef.current) startTimeRef.current = time;
            const progress = (time - startTimeRef.current) / totalDuration;
            
            if (progress >= 1) {
                if (onComplete) onComplete();
                return;
            }

            // Find current frame based on progress
            // GIFs have their own delays, but we want to stretch/squash GIF to fit 'duration'.
            // Or loop it?
            // Prompt says: "if (i < frames.length) requestAnimationFrame".
            // This implies playing GIF at its native speed? 
            // OR "transition: { duration: 5 }" suggests stretching.
            // Let's map progress (0-1) to frame index (0 - length).
            
            const frameIndex = Math.floor(progress * frames.length);
            const frame = frames[Math.min(frameIndex, frames.length - 1)];

            // RENDER FRAME
            // 1. Get Image Data for A and B
            // Note: calling getImageData frequently is slow. 
            // Ideally we get A and B data ONCE if they are static.
            // But they might be scaled.
            
            // Optimization: Cache resized ImageData for A and B?
            // For now, let's just implement the loop.
            
            renderFrame(ctx, frame, imgA, imgB, canvas.width, canvas.height);

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
    };

    const renderFrame = (ctx, frame, imgA, imgB, w, h) => {
        // This function handles the pixel mixing
        // frame.patch is the raw GIF pixels for this frame
        // frame.dims are dimensions
        
        // We need to draw the GIF frame to an offscreen canvas to scale it to w/h?
        // Or assume GIF matches? 
        // The GIF is likely smaller (e.g. 640x360). Canvas is 1920x1080.
        // We need to scale the mask.
        
        if (!frame || !frame.patch) return;

        // 1. Draw Mask to Temp Canvas (scaled)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d');
        
        // Create ImageData from GIF frame
        const gifData = new ImageData(
            new Uint8ClampedArray(frame.patch),
            frame.dims.width,
            frame.dims.height
        );
        
        // Draw GIF data to a temporary small canvas
        const tempGifCanvas = document.createElement('canvas');
        tempGifCanvas.width = frame.dims.width;
        tempGifCanvas.height = frame.dims.height;
        tempGifCanvas.getContext('2d').putImageData(gifData, 0, 0);
        
        // Scale draw to maskCanvas
        maskCtx.drawImage(tempGifCanvas, 0, 0, w, h);
        
        // 2. Get Data
        // Optimization: We could cache these if A and B don't change per frame (they don't).
        // But scaling them to canvas size is needed.
        
        // Draw A and B to temp canvases to get their data scaled
        const cA = document.createElement('canvas'); cA.width = w; cA.height = h;
        const ctxA = cA.getContext('2d');
        // use contain logic
        drawContain(ctxA, imgA, w, h);
        
        const cB = document.createElement('canvas'); cB.width = w; cB.height = h;
        const ctxB = cB.getContext('2d');
        drawContain(ctxB, imgB, w, h);

        const idA = ctxA.getImageData(0,0,w,h);
        const idB = ctxB.getImageData(0,0,w,h);
        const idMask = maskCtx.getImageData(0,0,w,h);
        
        const output = ctx.createImageData(w, h);
        const data = output.data;
        const dataA = idA.data;
        const dataB = idB.data;
        const dataMask = idMask.data;

        const len = data.length;
        
        for (let i = 0; i < len; i += 4) {
            // Calculate Alpha from Mask
            // Assume Grayscale, so R=G=B. Use Red channel.
            // If GIF is transparent, use Alpha channel?
            // "The GIF is NOT a visual layer — it is a luminance / alpha mask"
            // Let's use Luminance if opaque, or Alpha if transparent.
            // Safe bet: Use Average(R,G,B) * (Alpha/255).
            
            const r = dataMask[i];
            const g = dataMask[i+1];
            const b = dataMask[i+2];
            // const a = dataMask[i+3]; 
            
            // Just use R value for Luma as most masks are B/W.
            // 0 (Black) -> Show A? 255 (White) -> Show B?
            // Usually White = Reveal.
            const maskVal = r / 255; 

            data[i]     = dataA[i] * (1 - maskVal) + dataB[i] * maskVal;     // R
            data[i+1]   = dataA[i+1] * (1 - maskVal) + dataB[i+1] * maskVal; // G
            data[i+2]   = dataA[i+2] * (1 - maskVal) + dataB[i+2] * maskVal; // B
            data[i+3]   = 255; // Alpha
        }
        
        ctx.putImageData(output, 0, 0);
    };
    
    // Helper
    const drawContain = (ctx, img, cw, ch) => {
         const scale = Math.min(cw / img.width, ch / img.height);
         const w = img.width * scale;
         const h = img.height * scale;
         const x = (cw - w) / 2;
         const y = (ch - h) / 2;
         ctx.drawImage(img, x, y, w, h);
    };

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
    );
}
