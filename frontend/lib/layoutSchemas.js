/**
 * Layout Schema Configuration System (Frontend)
 * Mirrors backend layout_schemas.py for frontend validation and UI rendering
 */

// Photo Slot Definition
export const PHOTO_SLOTS = {
  layout_1: {
    bridePhoto: { name: 'bridePhoto', required: false, supports_border: true, max_count: 1, description: "Bride's individual photo" },
    groomPhoto: { name: 'groomPhoto', required: false, supports_border: true, max_count: 1, description: "Groom's individual photo" },
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: true, max_count: 1, description: 'Main couple photo' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: true, max_count: 5, description: 'Gallery photos with precious moments' },
    studioImage: { name: 'studioImage', required: false, supports_border: true, max_count: 1, description: 'Studio partner logo/photo' }
  },
  layout_2: {
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: true, max_count: 1, description: 'Main couple photo (hero image)' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: true, max_count: 5, description: 'Gallery photos' },
    studioImage: { name: 'studioImage', required: false, supports_border: false, max_count: 1, description: 'Studio partner logo' }
  },
  layout_3: {
    bridePhoto: { name: 'bridePhoto', required: false, supports_border: true, max_count: 1, description: "Bride's individual photo" },
    groomPhoto: { name: 'groomPhoto', required: false, supports_border: true, max_count: 1, description: "Groom's individual photo" },
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: true, max_count: 1, description: 'Main couple photo' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: true, max_count: 5, description: 'Horizontal scrolling gallery' }
  },
  layout_4: {
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: true, max_count: 1, description: 'Main couple photo for magazine cover' },
    bridePhoto: { name: 'bridePhoto', required: false, supports_border: false, max_count: 1, description: 'Bride feature photo' },
    groomPhoto: { name: 'groomPhoto', required: false, supports_border: false, max_count: 1, description: 'Groom feature photo' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: false, max_count: 5, description: 'Gallery in magazine grid layout' },
    studioImage: { name: 'studioImage', required: false, supports_border: false, max_count: 1, description: 'Studio logo for credits' }
  },
  layout_5: {
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: false, max_count: 1, description: 'Main couple photo in card' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: false, max_count: 5, description: 'Minimal gallery (3x3 grid max)' },
    studioImage: { name: 'studioImage', required: false, supports_border: false, max_count: 1, description: 'Studio logo minimal' }
  },
  layout_6: {
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: false, max_count: 1, description: 'Full-screen background couple photo' },
    bridePhoto: { name: 'bridePhoto', required: false, supports_border: false, max_count: 1, description: 'Bride photo (circular overlay)' },
    groomPhoto: { name: 'groomPhoto', required: false, supports_border: false, max_count: 1, description: 'Groom photo (circular overlay)' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: false, max_count: 5, description: 'Floating card gallery' }
  },
  layout_7: {
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: false, max_count: 1, description: 'Large feature photo in grid' },
    bridePhoto: { name: 'bridePhoto', required: false, supports_border: true, max_count: 1, description: 'Bride photo in offset grid position' },
    groomPhoto: { name: 'groomPhoto', required: false, supports_border: true, max_count: 1, description: 'Groom photo in offset grid position' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: false, max_count: 5, description: 'Staggered grid gallery' }
  },
  layout_8: {
    couplePhoto: { name: 'couplePhoto', required: true, supports_border: false, max_count: 1, description: 'Primary couple photo (full-width)' },
    preciousMoments: { name: 'preciousMoments', required: false, supports_border: false, max_count: 3, description: 'Three-column minimal gallery (max 3)' }
  }
};

// Border Slots Definition
export const BORDER_SLOTS = {
  layout_1: {
    brideGroomBorder: { name: 'brideGroomBorder', applies_to: ['bridePhoto', 'groomPhoto'], description: 'Border for bride/groom photos (shared, groom mirrored)' },
    coupleBorder: { name: 'coupleBorder', applies_to: ['couplePhoto'], description: 'Border for couple photo' },
    preciousMomentsBorder: { name: 'preciousMomentsBorder', applies_to: ['preciousMoments'], description: 'Border for gallery photos' },
    studioBorder: { name: 'studioBorder', applies_to: ['studioImage'], description: 'Border for studio image' }
  },
  layout_2: {
    coupleBorder: { name: 'coupleBorder', applies_to: ['couplePhoto'], description: 'Border for couple photo' },
    preciousMomentsBorder: { name: 'preciousMomentsBorder', applies_to: ['preciousMoments'], description: 'Border for gallery photos' }
  },
  layout_3: {
    brideGroomBorder: { name: 'brideGroomBorder', applies_to: ['bridePhoto', 'groomPhoto'], description: 'Border for individual photos' },
    coupleBorder: { name: 'coupleBorder', applies_to: ['couplePhoto'], description: 'Border for couple photo' },
    preciousMomentsBorder: { name: 'preciousMomentsBorder', applies_to: ['preciousMoments'], description: 'Border for gallery photos' }
  },
  layout_4: {
    coupleBorder: { name: 'coupleBorder', applies_to: ['couplePhoto'], description: 'Border for cover photo' }
  },
  layout_5: {}, // No borders in minimalist layout
  layout_6: {}, // No borders in overlay layout
  layout_7: {
    brideGroomBorder: { name: 'brideGroomBorder', applies_to: ['bridePhoto', 'groomPhoto'], description: 'Border for individual photos' }
  },
  layout_8: {} // No borders in zen layout
};

// Layout Metadata
export const LAYOUT_METADATA = {
  layout_1: {
    layout_id: 'layout_1',
    name: 'Classic Split Hero',
    description: 'Side-by-side bride and groom photos with centered couple photo below',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_2: {
    layout_id: 'layout_2',
    name: 'Center Focus',
    description: 'Large centered couple photo as hero with gallery below',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_3: {
    layout_id: 'layout_3',
    name: 'Horizontal Timeline',
    description: 'Journey-style layout with bride and groom photos connected by timeline',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_4: {
    layout_id: 'layout_4',
    name: 'Magazine Style',
    description: 'Editorial magazine-inspired layout with multi-column text and images',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_5: {
    layout_id: 'layout_5',
    name: 'Minimalist Card',
    description: 'Ultra-clean card-based design with emphasis on negative space',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_6: {
    layout_id: 'layout_6',
    name: 'Romantic Overlay',
    description: 'Full-screen couple photo with elegant text overlay and floating cards',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_7: {
    layout_id: 'layout_7',
    name: 'Editorial Grid',
    description: 'Asymmetric grid layout inspired by editorial design with bold typography',
    supports_youtube: true,
    supports_studio_image: true
  },
  layout_8: {
    layout_id: 'layout_8',
    name: 'Zen Minimalist',
    description: 'Ultra-minimalist vertical flow with maximum white space',
    supports_youtube: true,
    supports_studio_image: true
  }
};

/**
 * Get supported photo placeholders for a layout
 * @param {string} layoutId - Layout ID (e.g., 'layout_1')
 * @returns {Object} Photo slots object
 */
export function getSupportedPhotoSlots(layoutId) {
  return PHOTO_SLOTS[layoutId] || {};
}

/**
 * Get supported border slots for a layout
 * @param {string} layoutId - Layout ID
 * @returns {Object} Border slots object
 */
export function getSupportedBorderSlots(layoutId) {
  return BORDER_SLOTS[layoutId] || {};
}

/**
 * Get layout metadata
 * @param {string} layoutId - Layout ID
 * @returns {Object} Layout metadata
 */
export function getLayoutMetadata(layoutId) {
  return LAYOUT_METADATA[layoutId] || null;
}

/**
 * Check if a placeholder is supported by the layout
 * @param {string} layoutId - Layout ID
 * @param {string} placeholderName - Placeholder name
 * @returns {boolean}
 */
export function isPlaceholderSupported(layoutId, placeholderName) {
  const slots = getSupportedPhotoSlots(layoutId);
  return !!slots[placeholderName];
}

/**
 * Get max count for a placeholder
 * @param {string} layoutId - Layout ID
 * @param {string} placeholderName - Placeholder name
 * @returns {number}
 */
export function getPlaceholderMaxCount(layoutId, placeholderName) {
  const slots = getSupportedPhotoSlots(layoutId);
  return slots[placeholderName]?.max_count || 1;
}

/**
 * Check if a placeholder is required
 * @param {string} layoutId - Layout ID
 * @param {string} placeholderName - Placeholder name
 * @returns {boolean}
 */
export function isPlaceholderRequired(layoutId, placeholderName) {
  const slots = getSupportedPhotoSlots(layoutId);
  return slots[placeholderName]?.required || false;
}

/**
 * Check if a placeholder supports borders
 * @param {string} layoutId - Layout ID
 * @param {string} placeholderName - Placeholder name
 * @returns {boolean}
 */
export function doesPlaceholderSupportBorder(layoutId, placeholderName) {
  const slots = getSupportedPhotoSlots(layoutId);
  return slots[placeholderName]?.supports_border || false;
}

/**
 * Check if layout supports YouTube videos
 * @param {string} layoutId - Layout ID
 * @returns {boolean}
 */
export function supportsYouTube(layoutId) {
  const metadata = getLayoutMetadata(layoutId);
  return metadata?.supports_youtube || false;
}

/**
 * Check if layout supports studio images
 * @param {string} layoutId - Layout ID
 * @returns {boolean}
 */
export function supportsStudioImage(layoutId) {
  const metadata = getLayoutMetadata(layoutId);
  return metadata?.supports_studio_image || false;
}

/**
 * Get all supported placeholder names for a layout
 * @param {string} layoutId - Layout ID
 * @returns {string[]} Array of placeholder names
 */
export function getPlaceholderNames(layoutId) {
  const slots = getSupportedPhotoSlots(layoutId);
  return Object.keys(slots);
}

/**
 * Get border slot that applies to a placeholder
 * @param {string} layoutId - Layout ID
 * @param {string} placeholderName - Placeholder name
 * @returns {string|null} Border slot name or null
 */
export function getBorderSlotForPlaceholder(layoutId, placeholderName) {
  const borderSlots = getSupportedBorderSlots(layoutId);
  
  for (const [slotName, slotData] of Object.entries(borderSlots)) {
    if (slotData.applies_to.includes(placeholderName)) {
      return slotName;
    }
  }
  
  return null;
}

/**
 * Get layout capabilities summary for UI display
 * @param {string} layoutId - Layout ID
 * @returns {Object} Capabilities summary
 */
export function getLayoutCapabilities(layoutId) {
  const photoSlots = getSupportedPhotoSlots(layoutId);
  const borderSlots = getSupportedBorderSlots(layoutId);
  const metadata = getLayoutMetadata(layoutId);
  
  const photoCount = Object.keys(photoSlots).length;
  const borderCount = Object.keys(borderSlots).length;
  const preciousMomentsMax = photoSlots.preciousMoments?.max_count || 0;
  
  return {
    photoPlaceholderCount: photoCount,
    borderSlotCount: borderCount,
    hasBridePhoto: !!photoSlots.bridePhoto,
    hasGroomPhoto: !!photoSlots.groomPhoto,
    hasCouplePhoto: !!photoSlots.couplePhoto,
    hasPreciousMoments: !!photoSlots.preciousMoments,
    preciousMomentsMax,
    hasStudioImage: !!photoSlots.studioImage,
    supportsYouTube: metadata?.supports_youtube || false,
    supportsBorders: borderCount > 0,
    layoutName: metadata?.name || layoutId,
    layoutDescription: metadata?.description || ''
  };
}

/**
 * Validate if all required placeholders have photos
 * @param {string} layoutId - Layout ID
 * @param {Object} layoutPhotos - Layout photos object from API
 * @returns {Object} Validation result { isValid, missingRequired }
 */
export function validateRequiredPhotos(layoutId, layoutPhotos = {}) {
  const photoSlots = getSupportedPhotoSlots(layoutId);
  const missingRequired = [];
  
  for (const [slotName, slotData] of Object.entries(photoSlots)) {
    if (slotData.required && !layoutPhotos[slotName]) {
      missingRequired.push({
        name: slotName,
        description: slotData.description
      });
    }
  }
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired
  };
}
