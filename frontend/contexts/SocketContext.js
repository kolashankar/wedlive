'use client';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/config';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || getApiBaseUrl();

export function SocketProvider({ children, weddingId }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState(null);
  const [qualityChanged, setQualityChanged] = useState(null);
  const [newMedia, setNewMedia] = useState(null);

  useEffect(() => {
    if (!weddingId) return;

    // Initialize socket connection
    console.log('🔌 Connecting to Socket.IO server:', SOCKET_URL);
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io/',
      secure: SOCKET_URL.startsWith('https'),
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      
      // Join wedding room
      socket.emit('join_wedding', {
        wedding_id: weddingId,
        guest_name: localStorage.getItem('guest_name') || 'Anonymous'
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
    });

    // Viewer count updates
    socket.on('viewer_count', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('👥 Viewer count updated:', data.count);
        setViewerCount(data.count);
      }
    });

    // New chat messages
    socket.on('new_message', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('💬 New message received:', data);
        setMessages((prev) => [...prev, data]);
      }
    });

    // New reactions
    socket.on('new_reaction', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('❤️ New reaction:', data.emoji);
        setReactions((prev) => [...prev, data]);
        
        // Remove reaction after 3 seconds
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.timestamp !== data.timestamp));
        }, 3000);
      }
    });

    // Recording events
    socket.on('recording_started', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('📹 Recording started:', data);
        setRecordingStatus({
          status: 'recording',
          recording_id: data.recording_id,
          started_at: data.started_at,
          quality: data.quality
        });
      }
    });

    socket.on('recording_completed', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('✅ Recording completed:', data);
        setRecordingStatus({
          status: 'completed',
          recording_id: data.recording_id,
          recording_url: data.recording_url,
          duration: data.duration_seconds,
          completed_at: data.completed_at
        });
      }
    });

    // Quality change events
    socket.on('quality_changed', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('📊 Quality changed:', data.quality);
        setQualityChanged({
          quality: data.quality,
          changed_by: data.changed_by,
          timestamp: data.timestamp
        });
        
        // Clear after 5 seconds
        setTimeout(() => setQualityChanged(null), 5000);
      }
    });

    // Photo/video upload events
    socket.on('photo_uploaded', (data) => {
      if (data.wedding_id === weddingId) {
        console.log('📸 New media uploaded:', data);
        setNewMedia(data);
        
        // Clear after 3 seconds
        setTimeout(() => setNewMedia(null), 3000);
      }
    });

    // Camera switch event
    socket.on('camera_switched', (data) => {
      console.log('🎥 Camera switched:', data);
    });

    return () => {
      if (socket) {
        console.log('🔌 Disconnecting socket');
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

  // Update stream quality
  const updateQuality = (quality) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stream_quality_update', {
        wedding_id: weddingId,
        quality: { level: quality }
      });
    }
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    viewerCount,
    messages,
    reactions,
    recordingStatus,
    qualityChanged,
    newMedia,
    sendMessage,
    sendReaction,
    switchCamera,
    updateQuality
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  
  // Return empty functions if context is null (prevents issues when provider is not available)
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      viewerCount: 0,
      messages: [],
      reactions: [],
      recordingStatus: null,
      qualityChanged: null,
      newMedia: null,
      sendMessage: () => {},
      sendReaction: () => {},
      switchCamera: () => {},
      updateQuality: () => {}
    };
  }
  
  return context;
}
