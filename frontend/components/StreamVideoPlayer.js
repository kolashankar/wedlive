'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

/**
 * StreamVideoPlayer Component
 * 
 * Generic HLS video player using react-player.
 * Replaces Stream.io SDK with self-hosted NGINX-RTMP streaming.
 * 
 * @param {Object} props
 * @param {string} props.playbackUrl - HLS playback URL (.m3u8 file)
 * @param {boolean} props.autoPlay - Auto-play video when ready (default: true)
 * @param {boolean} props.controls - Show video controls (default: true)
 * @param {boolean} props.muted - Mute video (default: false)
 * @param {string} props.themeId - Theme ID for styling
 * @param {string} props.streamBorderUrl - URL of border to apply around video player (FIX 4)
 * @param {Object} props.streamBorderMask - Mask data for stream border (FIX 4)
 */
export default function StreamVideoPlayer({ 
  playbackUrl, 
  autoPlay = true, 
  controls = true,
  muted = false,
  themeId = null,
  streamBorderUrl = null,  // FIX 4: Stream border
  streamBorderMask = null   // FIX 4: Stream border mask data
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // FIX 4: Debug border URL to verify it's being received
  console.log('[StreamVideoPlayer] Border Debug:', {
    streamBorderUrl,
    hasBorderUrl: !!streamBorderUrl,
    themeId
  });

  useEffect(() => {
    if (!playbackUrl) {
      setError('No playback URL provided');
      setLoading(false);
      return;
    }

    // Reset states when playback URL changes
    setLoading(true);
    setError(null);
    setIsReady(false);
    setIsOffline(false);
  }, [playbackUrl]);

  const handleReady = () => {
    setIsReady(true);
    setLoading(false);
    setError(null);
    setIsOffline(false);
  };

  const handleError = (e) => {
    console.error('Stream playback error:', e);
    setLoading(false);
    setIsOffline(true);
    setError('Stream is currently offline or not available');
  };

  const handleBuffer = () => {
    // Stream is buffering, keep loading state
  };

  const handleBufferEnd = () => {
    setLoading(false);
  };

  if (!playbackUrl) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg">No stream URL available</p>
        </div>
      </div>
    );
  }

  // FIX 4: Prepare stream border styling with overlay approach
  // Apply border as overlay above the video player
  const hasBorder = !!streamBorderUrl;
  
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    ...(themeId === 'modern-minimalist' && {
      backgroundImage: 'url(/assets/images/bg2.png), url(/assets/images/bg2-2.png)',
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundAttachment: 'scroll, fixed',
      opacity: 1
    })
  };

  const borderOverlayStyle = hasBorder ? {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${streamBorderUrl})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    pointerEvents: 'none', // Allow clicks to pass through to video controls
    zIndex: 10
  } : null;

  console.log('[StreamVideoPlayer] Styles applied:', {
    hasBorder,
    containerStyle: !!containerStyle,
    borderOverlayStyle: !!borderOverlayStyle
  });

  return (
    <div 
      className={`w-full h-full relative ${themeId === 'modern-minimalist' ? '' : 'bg-black'}`}
      style={containerStyle}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
      )}

      {isOffline && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
          <div className="text-center text-white p-8">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-semibold mb-2">Stream Offline</h3>
            <p className="text-gray-400 mb-4">
              The stream is currently offline. Waiting for broadcaster to start...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Checking for stream...</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {themeId === 'modern-minimalist' ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div 
            className="w-full h-full rounded-lg overflow-hidden"
            style={{
              backgroundImage: 'url(/assets/images/studiobg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <ReactPlayer
                url={playbackUrl}
                playing={autoPlay}
                controls={controls}
                muted={muted}
                width="100%"
                height="100%"
                onReady={handleReady}
                onError={handleError}
                onBuffer={handleBuffer}
                onBufferEnd={handleBufferEnd}
                config={{
                  file: {
                    forceHLS: true,
                    hlsOptions: {
                      enableWorker: true,
                      lowLatencyMode: true,
                      backBufferLength: 90,
                    },
                  },
                }}
                style={{ backgroundColor: '#000' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <ReactPlayer
          url={playbackUrl}
          playing={autoPlay}
          controls={controls}
          muted={muted}
          width="100%"
          height="100%"
          onReady={handleReady}
          onError={handleError}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          config={{
            file: {
              forceHLS: true,
              hlsOptions: {
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
              },
            },
          }}
          style={{ backgroundColor: '#000' }}
        />
      )}

      {/* FIX 4: Border Overlay - Applied on top of video */}
      {borderOverlayStyle && (
        <div 
          style={borderOverlayStyle}
          className="border-overlay"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
