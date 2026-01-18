import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/config';

const SOCKET_URL = getApiBaseUrl();

export function useSocket(weddingId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!weddingId) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join wedding room
      socket.emit('join_wedding', {
        wedding_id: weddingId,
        guest_name: localStorage.getItem('guest_name') || 'Anonymous'
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Viewer count updates
    socket.on('viewer_count', (data) => {
      if (data.wedding_id === weddingId) {
        setViewerCount(data.count);
      }
    });

    // New chat messages
    socket.on('new_message', (data) => {
      if (data.wedding_id === weddingId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    // New reactions
    socket.on('new_reaction', (data) => {
      if (data.wedding_id === weddingId) {
        setReactions((prev) => [...prev, data]);
        
        // Remove reaction after 3 seconds
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.timestamp !== data.timestamp));
        }, 3000);
      }
    });

    // Camera switch event
    socket.on('camera_switched', (data) => {
      console.log('Camera switched:', data);
    });

    return () => {
      if (socket) {
        socket.emit('leave_wedding', { wedding_id: weddingId });
        socket.disconnect();
      }
    };
  }, [weddingId]);

  // Send chat message
  const sendMessage = (message, guestName = 'Anonymous') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        wedding_id: weddingId,
        message,
        guest_name: guestName,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Send reaction
  const sendReaction = (emoji, guestName = 'Anonymous') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_reaction', {
        wedding_id: weddingId,
        emoji,
        guest_name: guestName,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Switch camera
  const switchCamera = (cameraId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('camera_switch', {
        wedding_id: weddingId,
        camera_id: cameraId
      });
    }
  };

  return {
    isConnected,
    viewerCount,
    messages,
    reactions,
    sendMessage,
    sendReaction,
    switchCamera
  };
}
