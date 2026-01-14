'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect handler for /google/callback -> /auth/google/callback
 * 
 * This page handles the case where Google OAuth redirects to /google/callback
 * instead of /auth/google/callback. It preserves all query parameters and
 * redirects to the correct route.
 */
export default function GoogleCallbackRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Get current URL with all query parameters
    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.searchParams.toString();
    
    // Redirect to the correct callback route with all params preserved
    const redirectUrl = `/auth/google/callback${searchParams ? `?${searchParams}` : ''}`;
    
    console.log('Redirecting from /google/callback to:', redirectUrl);
    router.replace(redirectUrl);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-rose-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
