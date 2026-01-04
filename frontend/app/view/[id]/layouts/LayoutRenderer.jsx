'use client';
import { motion } from 'framer-motion';
import ClassicSplitHero from './ClassicSplitHero';
import CenterFocus from './CenterFocus';
import HorizontalTimeline from './HorizontalTimeline';
import ModernScrapbook from './ModernScrapbook';
import MinimalistCard from './MinimalistCard';
import RomanticOverlay from './RomanticOverlay';
import EditorialGrid from './EditorialGrid';
import ZenMinimalist from './ZenMinimalist';

export default function LayoutRenderer({ wedding, themeSettings, media, videoTemplate }) {
  const layoutId = themeSettings?.layout_id || 'layout_1';
  
  console.log('LayoutRenderer - videoTemplate prop:', videoTemplate);
  console.log('LayoutRenderer - layoutId:', layoutId);

  // Helper to ensure media has array
  const safeMedia = {
      ...media,
      recent_items: Array.isArray(media?.recent_items) ? media.recent_items : []
  };

  const renderLayout = () => {
    switch (layoutId) {
      case 'layout_1':
        return <ClassicSplitHero wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_2':
        return <CenterFocus wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_3':
        return <HorizontalTimeline wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_4':
        return <ModernScrapbook wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_5':
        return <MinimalistCard wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_6':
        return <RomanticOverlay wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_7':
        return <EditorialGrid wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      case 'layout_8':
        return <ZenMinimalist wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
      default:
        return <ClassicSplitHero wedding={wedding} themeSettings={themeSettings} media={safeMedia} videoTemplate={videoTemplate} />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      {renderLayout()}
    </div>
  );
}
