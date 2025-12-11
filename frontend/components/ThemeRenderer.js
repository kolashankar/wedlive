'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic imports for all themes
const FloralGarden = dynamic(() => import('@/components/themes/FloralGarden'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
    </div>
  ),
});

const RoyalPalace = dynamic(() => import('@/components/themes/RoyalPalace'), {
  loading: () => <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-400" /></div>,
});

const ModernMinimalist = dynamic(() => import('@/components/themes/ModernMinimalist'), {
  loading: () => <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>,
});

const CinemaScope = dynamic(() => import('@/components/themes/CinemaScope'), {
  loading: () => <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>,
});

// Theme component map
const THEME_COMPONENTS = {
  floral_garden: FloralGarden,
  royal_palace: RoyalPalace,
  modern_minimalist: ModernMinimalist,
  cinema_scope: CinemaScope,
  default_modern: FloralGarden, // Default fallback
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
      theme_id: 'floral_garden',
      custom_font: 'Great Vibes',
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

  const themeId = wedding.theme_settings?.theme_id || 'floral_garden';
  const ThemeComponent = THEME_COMPONENTS[themeId] || FloralGarden;

  console.log('ThemeRenderer: Rendering theme', themeId, 'with wedding:', wedding);

  return <ThemeComponent wedding={wedding} onEnter={onEnter} />;
}
