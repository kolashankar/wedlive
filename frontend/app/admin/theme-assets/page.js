'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is deprecated - redirecting to unified borders management page
export default function ThemeAssetsManagement() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the unified borders management page
    router.push('/admin/borders');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to Borders & Masks Management...</p>
      </div>
    </div>
  );
}
