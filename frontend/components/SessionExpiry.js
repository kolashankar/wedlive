'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * SessionExpiry Component
 * Shows a warning when the user's session is about to expire
 * and provides a button to refresh/re-login
 */
export default function SessionExpiry() {
  const { token, logout, isTokenExpired } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    // Check token expiry every 30 seconds
    const checkExpiry = () => {
      if (isTokenExpired && isTokenExpired()) {
        setShowWarning(true);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 30 * 1000);

    return () => clearInterval(interval);
  }, [token, isTokenExpired]);

  if (!showWarning) return null;

  const handleRefresh = () => {
    // Logout and redirect to login
    logout();
    router.push('/login?expired=true');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive" className="shadow-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Session Expired</p>
            <p className="text-sm">Your session has expired. Please log in again to continue.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-login
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
