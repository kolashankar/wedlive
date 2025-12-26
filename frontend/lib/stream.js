// NGINX-RTMP Stream utilities
// This file provides helper functions for HLS streaming with self-hosted NGINX-RTMP

/**
 * Format RTMP URL for broadcaster (OBS Studio)
 * 
 * @param {string} rtmpServerUrl - Base RTMP server URL (e.g., rtmp://your-ip/live)
 * @param {string} streamKey - Unique stream key
 * @returns {object} Object with server and stream_key separated
 */
export const formatRTMPCredentials = (rtmpServerUrl, streamKey) => {
  return {
    server: rtmpServerUrl,
    stream_key: streamKey,
    full_url: `${rtmpServerUrl}/${streamKey}`
  };
};

/**
 * Format HLS playback URL for viewers
 * 
 * @param {string} hlsServerUrl - Base HLS server URL (e.g., http://your-ip:8080/hls)
 * @param {string} streamKey - Stream key used for broadcasting
 * @returns {string} Full HLS playback URL (.m3u8)
 */
export const formatHLSPlaybackUrl = (hlsServerUrl, streamKey) => {
  return `${hlsServerUrl}/${streamKey}.m3u8`;
};

/**
 * Check if a stream is likely live by attempting to fetch the HLS manifest
 * 
 * @param {string} playbackUrl - HLS playback URL
 * @returns {Promise<boolean>} True if stream appears to be live
 */
export const checkStreamStatus = async (playbackUrl) => {
  try {
    const response = await fetch(playbackUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking stream status:', error);
    return false;
  }
};

export default {
  formatRTMPCredentials,
  formatHLSPlaybackUrl,
  checkStreamStatus
};
