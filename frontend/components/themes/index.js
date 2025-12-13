// Theme Components Export
import FloralGarden from './FloralGarden';
import RoyalPalace from './RoyalPalace';
import ModernMinimalist from './ModernMinimalist';
import CinemaScope from './CinemaScope';
import RomanticPastel from './RomanticPastel';
import PremiumWeddingCard from './PremiumWeddingCard';
import TraditionalSouthIndian from './TraditionalSouthIndian';

// Theme Registry - Maps theme IDs to components
export const THEME_COMPONENTS = {
  'floral-garden': FloralGarden,
  'royal-palace': RoyalPalace,
  'modern-minimalist': ModernMinimalist,
  'cinema-scope': CinemaScope,
  'romantic-pastel': RomanticPastel,
  'premium-wedding-card': PremiumWeddingCard,
  'traditional-south-indian': TraditionalSouthIndian,
};

// Helper function to get theme component
export function getThemeComponent(themeId) {
  return THEME_COMPONENTS[themeId] || FloralGarden; // Default to FloralGarden
}

// Export individual components
export {
  FloralGarden,
  RoyalPalace,
  ModernMinimalist,
  CinemaScope,
  RomanticPastel,
  PremiumWeddingCard,
  TraditionalSouthIndian,
};
