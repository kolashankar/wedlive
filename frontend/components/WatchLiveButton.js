'use client';
import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * WatchLiveButton - Floating button to redirect to live stream
 * Appears on wedding layout pages with sticky positioning
 * FIX: Prevent hydration mismatch by only rendering after mount
 */
export default function WatchLiveButton({ weddingId, weddingStatus }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  // FIX: Only run after component mounts to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
    // Check if we're on the live stream page
    setShouldHide(window.location.search.includes('live=true'));
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  // Don't render on server or if we should hide
  if (!isMounted || shouldHide) {
    return null;
  }

  const handleWatchLive = () => {
    // Use window.location.href for immediate redirect without manual refresh
    window.location.href = `/weddings/${weddingId}?live=true`;
  };

  const isLive = weddingStatus === 'live';

  return (
    <button
      onClick={handleWatchLive}
      data-testid="watch-live-button"
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-2
        px-4 py-3 rounded-full
        font-semibold text-white
        shadow-lg hover:shadow-xl
        transition-all duration-300
        ${isLive 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
          : 'bg-purple-600 hover:bg-purple-700'
        }
        ${isScrolled ? 'scale-90' : 'scale-100'}
      `}
      style={{
        backdropFilter: 'blur(10px)',
      }}
    >
      {isLive && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
      <Play className="w-5 h-5" fill="white" />
      <span>Watch Wedding</span>
    </button>
  );
}
