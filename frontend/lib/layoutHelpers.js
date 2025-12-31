/**
 * Layout Helper Utilities
 * Provides deterministic random asset selection and layout schema helpers
 */

import { getLayoutSchema } from '@/components/layouts';

/**
 * Deterministic random selection using seed
 * @param {Array} array - Array to select from
 * @param {string} seed - Seed for deterministic randomness
 * @returns {*} - Selected item
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Get random assets for a layout (deterministic based on wedding ID + layout ID)
 * @param {string} layoutId - Layout ID
 * @param {string} weddingId - Wedding ID for seed
 * @param {Array} borders - Available borders
 * @param {Array} backgrounds - Available backgrounds
 * @returns {object} - Random assets
 */
export function getRandomLayoutAssets(layoutId, weddingId, borders = [], backgrounds = []) {
  if (!layoutId || !weddingId) return {};
  
  // Create seed from wedding ID + layout ID
  const seed = (weddingId + layoutId).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const randomBorders = borders.length > 0 ? borders[Math.floor(seededRandom(seed) * borders.length)] : null;
  const randomBackground = backgrounds.length > 0 ? backgrounds[Math.floor(seededRandom(seed + 1) * backgrounds.length)] : null;

  // Random font selection
  const fonts = [
    'Inter',
    'Great Vibes',
    'Playfair Display',
    'Cinzel',
    'Montserrat',
    'Lato',
    'Caveat',
    'Bebas Neue',
    'Rozha One',
    'Pinyon Script'
  ];
  const randomFont = fonts[Math.floor(seededRandom(seed + 2) * fonts.length)];

  return {
    border: randomBorders,
    background: randomBackground,
    font: randomFont,
  };
}

/**
 * Check if layout supports a specific photo slot
 * @param {string} layoutId - Layout ID
 * @param {string} slotName - Slot name (e.g., 'bridePhoto', 'groomPhoto')
 * @returns {boolean} - True if supported
 */
export function layoutSupportsSlot(layoutId, slotName) {
  try {
    const schema = getLayoutSchema(layoutId);
    return !!schema?.supported_slots?.photos?.[slotName];
  } catch (error) {
    console.error('Error checking layout slot support:', error);
    return false;
  }
}

/**
 * Get required photo slots for a layout
 * @param {string} layoutId - Layout ID
 * @returns {Array} - Array of required slot names
 */
export function getRequiredPhotoSlots(layoutId) {
  try {
    const schema = getLayoutSchema(layoutId);
    const photos = schema?.supported_slots?.photos || {};
    return Object.entries(photos)
      .filter(([key, config]) => config.required)
      .map(([key]) => key);
  } catch (error) {
    console.error('Error getting required slots:', error);
    return [];
  }
}

/**
 * Get all supported photo slots for a layout
 * @param {string} layoutId - Layout ID
 * @returns {object} - Object with slot names as keys
 */
export function getSupportedPhotoSlots(layoutId) {
  try {
    const schema = getLayoutSchema(layoutId);
    return schema?.supported_slots?.photos || {};
  } catch (error) {
    console.error('Error getting supported slots:', error);
    return {};
  }
}

/**
 * Get max count for array-type photo slots
 * @param {string} layoutId - Layout ID
 * @param {string} slotName - Slot name
 * @returns {number} - Max count or 0 if not applicable
 */
export function getPhotoSlotMaxCount(layoutId, slotName) {
  try {
    const schema = getLayoutSchema(layoutId);
    const slot = schema?.supported_slots?.photos?.[slotName];
    return slot?.type === 'array' ? (slot.max_count || 20) : 1;
  } catch (error) {
    console.error('Error getting slot max count:', error);
    return 0;
  }
}

/**
 * Validate if photo slots meet layout requirements
 * @param {string} layoutId - Layout ID
 * @param {object} photos - Photo data object
 * @returns {object} - { valid: boolean, errors: Array }
 */
export function validateLayoutPhotos(layoutId, photos = {}) {
  const errors = [];
  const requiredSlots = getRequiredPhotoSlots(layoutId);

  requiredSlots.forEach(slotName => {
    if (!photos[slotName] || (Array.isArray(photos[slotName]) && photos[slotName].length === 0)) {
      errors.push(`${slotName} is required for this layout`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Map old theme ID to new layout ID
 * @param {string} themeId - Old theme ID
 * @returns {string} - Corresponding layout ID
 */
export function mapThemeToLayout(themeId) {
  const mapping = {
    'floral_garden': 'layout_1',
    'royal_palace': 'layout_2',
    'modern_minimalist': 'layout_3',
    'cinema_scope': 'layout_4',
    'premium_wedding_card': 'layout_5',
    'romantic_pastel': 'layout_6',
    'traditional_south_indian': 'layout_7',
  };

  return mapping[themeId] || 'layout_1'; // Default to layout_1
}

/**
 * Get layout display name and description
 * @param {string} layoutId - Layout ID
 * @returns {object} - { name, description }
 */
export function getLayoutInfo(layoutId) {
  try {
    const schema = getLayoutSchema(layoutId);
    return {
      name: schema?.name || layoutId,
      description: schema?.description || '',
      thumbnail: schema?.thumbnail || null,
    };
  } catch (error) {
    return {
      name: layoutId,
      description: '',
      thumbnail: null,
    };
  }
}
