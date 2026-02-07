'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface StreamCredentials {
  token: string;
  serverUrl: string;
  roomName: string;
}

interface UseWeddingStreamReturn {
  credentials: StreamCredentials | null;
  loading: boolean;
  error: string | null;
  refreshCredentials: () => Promise<void>;
}

/**
 * useWeddingStream Hook
 * 
 * Manages LiveKit stream credentials for a wedding.
 * Fetches tokens from Pulse API via backend.
 * 
 * Usage:
 * ```tsx
 * const { credentials, loading, error } = useWeddingStream(weddingId, 'guest');
 * 
 * if (credentials) {
 *   return <WeddingLiveStream {...credentials} weddingId={weddingId} />;
 * }
 * ```
 * 
 * @param {string} weddingId - Wedding ID
 * @param {string} participantRole - 'host' or 'guest'
 * @returns {UseWeddingStreamReturn} Stream credentials and state
 */
export function useWeddingStream(
  weddingId: string,
  participantRole: 'host' | 'guest' = 'guest'
): UseWeddingStreamReturn {
  const [credentials, setCredentials] = useState<StreamCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    if (!weddingId) {
      setError('Wedding ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call backend endpoint that generates LiveKit token via Pulse
      const response = await api.post(`/api/streams/token/${weddingId}`, {
        participant_role: participantRole,
        can_publish: participantRole === 'host',
        can_subscribe: true
      });

      if (response.data.token && response.data.server_url) {
        setCredentials({
          token: response.data.token,
          serverUrl: response.data.server_url,
          roomName: response.data.room_name || `wedding-${weddingId}`
        });
      } else {
        throw new Error('Invalid credentials response');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to get stream credentials';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Stream credentials error:', err);
    } finally {
      setLoading(false);
    }
  }, [weddingId, participantRole]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return {
    credentials,
    loading,
    error,
    refreshCredentials: fetchCredentials
  };
}

export default useWeddingStream;
