'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Completing Google sign in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Check for OAuth errors
        if (error) {
          setStatus('error');
          setMessage(`Google authentication failed: ${error}`);
          toast.error('Google sign in failed');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          toast.error('Invalid callback');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Verify state (CSRF protection)
        const savedState = localStorage.getItem('google_oauth_state');
        if (state && savedState && state !== savedState) {
          setStatus('error');
          setMessage('Invalid state token. Possible CSRF attack.');
          toast.error('Security error');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Exchange code for tokens
        setMessage('Verifying with Google...');
        const response = await axios.post(`${API_URL}/api/auth/google/callback`, {
          code,
          state
        });

        // Save token and user data
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        localStorage.removeItem('google_oauth_state');
        setToken(access_token);
        setUser(user);

        setStatus('success');
        setMessage('Successfully signed in with Google!');
        toast.success('Welcome to WedLive!');

        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 1500);

      } catch (err) {
        console.error('Google callback error:', err);
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Failed to complete Google sign in');
        toast.error('Authentication failed');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
                <h2 className="text-xl font-semibold text-gray-900">Processing...</h2>
                <p className="text-sm text-gray-600 text-center">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">Success!</h2>
                <p className="text-sm text-gray-600 text-center">{message}</p>
                <p className="text-xs text-gray-500">Redirecting to dashboard...</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">Error</h2>
                <p className="text-sm text-gray-600 text-center">{message}</p>
                <p className="text-xs text-gray-500">Redirecting to login...</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

import { Suspense } from 'react';
