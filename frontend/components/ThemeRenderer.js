'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// DEPRECATED: Old theme-based system removed
// New system uses LayoutRenderer with schema-driven layouts
// This file is kept for backward compatibility only

// Default fallback component
const DefaultLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center p-8">
      <p className="text-gray-700 text-lg mb-4">This wedding uses the legacy theme system.</p>
      <p className="text-gray-500">Please update to the new Layout system.</p>
    </div>
  </div>
);

// Theme component map - all deprecated
const THEME_COMPONENTS = {
  floral_garden: DefaultLayout,
  royal_palace: DefaultLayout,
  modern_minimalist: DefaultLayout,
  cinema_scope: DefaultLayout,
  premium_wedding_card: DefaultLayout,
  romantic_pastel: DefaultLayout,
  traditional_south_indian: DefaultLayout,
  default_modern: DefaultLayout,
};

export default function ThemeRenderer({ wedding, onEnter }) {
  // CRITICAL FIX: Enhanced safety checks to prevent React error #130
  if (!wedding || typeof wedding !== 'object') {
    console.error('ThemeRenderer: Invalid wedding prop', wedding);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-red-500">Invalid wedding data</p>
        </div>
      </div>
    );
  }

  // Ensure theme_settings exists and is valid
  if (!wedding.theme_settings || typeof wedding.theme_settings !== 'object') {
    console.error('ThemeRenderer: Missing or invalid theme_settings', wedding.theme_settings);
    
    // Create default theme_settings to prevent crashes
    wedding.theme_settings = {
      theme_id: 'layout_1',
      custom_font: 'Playfair Display',
      primary_color: '#f43f5e',
      secondary_color: '#a855f7',
      pre_wedding_video: '',
      cover_photos: [],
      studio_details: {
        studio_id: '',
        name: '',
        logo_url: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        contact: ''
      },
      custom_messages: {
        welcome_text: 'Welcome to our big day',
        description: ''
      }
    };
  }

  const themeId = wedding.theme_settings?.theme_id || 'layout_1';
  const ThemeComponent = THEME_COMPONENTS[themeId] || DefaultLayout;

  console.log('ThemeRenderer: Rendering theme', themeId, 'with wedding:', wedding);

  return <ThemeComponent 
    weddingData={wedding} 
    themeSettings={wedding.theme_settings || {}}
    themeAssets={wedding.theme_settings?.theme_assets || {}}
    onEnter={onEnter} 
  />;
}
