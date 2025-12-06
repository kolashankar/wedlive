// Stream.com configuration and utilities
import { StreamVideoClient } from '@stream-io/video-react-sdk';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'hhdxgg9s2qq2';
const apiSecret = process.env.NEXT_PUBLIC_STREAM_API_SECRET;

export const createStreamClient = async (userId, userName) => {
  // For viewing public streams, we can create a client with minimal auth
  // The backend handles RTMP stream creation and authentication
  try {
    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: userId || `guest_${Date.now()}`,
        name: userName || 'Guest',
      },
      // For public viewing, we'll use a simplified token approach
      // In production, you'd want proper token generation from backend
    });
    
    return client;
  } catch (error) {
    console.error('Failed to create Stream client:', error);
    return null;
  }
};

export const getStreamCallId = (weddingId) => {
  return `wedding_${weddingId}`;
};
