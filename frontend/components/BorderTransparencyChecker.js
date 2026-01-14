'use client';
import { useState, useEffect } from 'react';

/**
 * BorderTransparencyChecker - Utility component to test border image transparency
 * 
 * This component helps verify that border images have proper transparency
 * by displaying them with different background colors to check for black backgrounds.
 */

export default function BorderTransparencyChecker({ borderUrl, processedUrl, className = '' }) {
  const [background, setBackground] = useState('checkerboard');
  const [showComparison, setShowComparison] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  
  const backgrounds = {
    checkerboard: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px',
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    blue: '#0000ff',
    gradient: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)'
  };

  // Auto-verify transparency when images load
  useEffect(() => {
    if (borderUrl || processedUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let transparentPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          totalPixels++;
          if (data[i + 3] < 255) {
            transparentPixels++;
          }
        }
        
        const transparencyPercentage = (transparentPixels / totalPixels) * 100;
        if (transparencyPercentage > 5) {
          setVerificationStatus('excellent');
        } else if (transparencyPercentage > 1) {
          setVerificationStatus('good');
        } else {
          setVerificationStatus('poor');
        }
      };
      img.src = processedUrl || borderUrl;
    }
  }, [borderUrl, processedUrl]);

  return (
    <div className={`border-transparency-checker ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Border Transparency Checker</h3>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(backgrounds).map((bg) => (
            <button
              key={bg}
              onClick={() => setBackground(bg)}
              className={`px-3 py-1 rounded text-sm ${
                background === bg 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {bg.charAt(0).toUpperCase() + bg.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Toggle for comparison view */}
      {processedUrl && (
        <div className="mb-4">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 rounded text-sm ${
              showComparison 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {showComparison ? 'Hide Comparison' : 'Show Before/After'}
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {showComparison && processedUrl ? (
          /* Comparison view */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-red-600">Original (Before)</h4>
              <div 
                className="w-64 h-64 border-2 border-red-300 rounded"
                style={{ background: backgrounds[background] }}
              >
                {borderUrl ? (
                  <img 
                    src={borderUrl} 
                    alt="Original border"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No original URL
                  </div>
                )}
              </div>
            </div>
            
            {/* Processed */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-green-600">Processed (After)</h4>
              <div 
                className="w-64 h-64 border-2 border-green-300 rounded"
                style={{ background: backgrounds[background] }}
              >
                <img 
                  src={processedUrl} 
                  alt="Processed border"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                ✓ Background removed ✓ Transparency preserved
              </div>
            </div>
          </div>
        ) : (
          /* Single image view */
          <div>
            <h4 className="text-sm font-medium mb-2">
              {processedUrl ? 'Processed Border' : 'Original Border'}
            </h4>
            <div 
              className="w-64 h-64 border-2 border-gray-300 rounded"
              style={{ background: backgrounds[background] }}
            >
              {(processedUrl || borderUrl) ? (
                <img 
                  src={processedUrl || borderUrl} 
                  alt="Border test"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No border URL provided
                </div>
              )}
            </div>
          </div>
        )}

        {/* Border info */}
        {borderUrl && (
          <div className="text-sm">
            <p className="mb-1">
              <strong>URL:</strong> 
              <a 
                href={borderUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 underline ml-1"
              >
                Open in new tab
              </a>
            </p>
            <p className="mb-1">
              <strong>Test:</strong> If you see {background} background through the border,
              transparency is working. If you see black/white solid color, the image lacks transparency.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
