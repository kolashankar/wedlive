'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

function YouTubeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Connecting your YouTube account...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state');
          return;
        }

        // Get stored state and wedding_id from sessionStorage
        const storedState = sessionStorage.getItem('youtube_state');
        const weddingId = sessionStorage.getItem('youtube_wedding_id');

        if (!storedState || state !== storedState) {
          setStatus('error');
          setMessage('Invalid state parameter. Please try again.');
          return;
        }

        // Exchange code for tokens
        await api.post('/api/youtube/callback', {
          code: code,
          state: state
        });

        // Auto-create broadcast after successful authentication
        setMessage('Creating YouTube broadcast...');
        await api.post(`/api/youtube/create-broadcast/${weddingId}`);

        // Clean up sessionStorage
        sessionStorage.removeItem('youtube_state');
        sessionStorage.removeItem('youtube_wedding_id');

        setStatus('success');
        setMessage('YouTube account connected successfully!');
        toast.success('YouTube connected! Broadcast created.');

        // Redirect back to wedding management page
        setTimeout(() => {
          router.push(`/weddings/manage/${weddingId}`);
        }, 2000);

      } catch (error) {
        console.error('YouTube callback error:', error);
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Failed to connect YouTube account');
        toast.error('Failed to connect YouTube');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 text-rose-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Connecting YouTube</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-800 mb-2">Success!</h1>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting you back...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-800 mb-2">Connection Failed</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function YouTubeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-rose-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Loading...</h1>
            <p className="text-gray-600">Processing YouTube callback</p>
          </div>
        </div>
      </div>
    }>
      <YouTubeCallbackContent />
    </Suspense>
  );
}
