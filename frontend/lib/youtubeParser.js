/**
 * YouTube URL Parser Utility
 * Converts any YouTube URL format to embed-safe iframe URL
 * 
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&extra=params
 * - https://youtube.com/watch?v=VIDEO_ID
 * - URLs with timestamps, playlists, etc.
 */

/**
 * Extract YouTube video ID from any format
 * @param {string} url - YouTube URL in any format
 * @returns {string|null} - Video ID or null if invalid
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove whitespace
  url = url.trim();

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  const watchPattern = /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/;
  const watchMatch = url.match(watchPattern);
  if (watchMatch) {
    return watchMatch[1];
  }

  // Pattern 2: youtu.be/VIDEO_ID
  const shortPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const shortMatch = url.match(shortPattern);
  if (shortMatch) {
    return shortMatch[1];
  }

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedPattern = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
  const embedMatch = url.match(embedPattern);
  if (embedMatch) {
    return embedMatch[1];
  }

  // Pattern 4: youtube.com/v/VIDEO_ID
  const vPattern = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/;
  const vMatch = url.match(vPattern);
  if (vMatch) {
    return vMatch[1];
  }

  return null;
}

/**
 * Convert any YouTube URL to embed-safe iframe URL
 * @param {string} url - YouTube URL in any format
 * @param {object} options - Additional embed options
 * @returns {string|null} - Embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url, options = {}) {
  const videoId = getYouTubeVideoId(url);
  
  if (!videoId) {
    return null;
  }

  // Build embed URL with options
  const {
    autoplay = 0,
    mute = 0,
    controls = 1,
    modestbranding = 1,
    rel = 0,
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    mute: mute.toString(),
    controls: controls.toString(),
    modestbranding: modestbranding.toString(),
    rel: rel.toString(),
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Check if URL is a valid YouTube URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
export function isYouTubeUrl(url) {
  return getYouTubeVideoId(url) !== null;
}

/**
 * Get YouTube thumbnail URL
 * @param {string} url - YouTube URL
 * @param {string} quality - Thumbnail quality (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns {string|null} - Thumbnail URL or null if invalid
 */
export function getYouTubeThumbnail(url, quality = 'hqdefault') {
  const videoId = getYouTubeVideoId(url);
  
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
