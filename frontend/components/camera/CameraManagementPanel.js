'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, RefreshCw, AlertTriangle } from 'lucide-react';
import CameraCard from './CameraCard';
import ActiveCameraPlayer from './ActiveCameraPlayer';
import api from '@/lib/api';
import { getApiBaseUrl } from '@/lib/config';
import { toast } from 'sonner';

const CameraManagementPanel = ({ weddingId, isPremium }) => {
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const wsRef = useRef(null);

  // Load initial cameras
  useEffect(() => {
    if (weddingId && isPremium) {
      loadCameras();
      loadActiveCamera();
    }
  }, [weddingId, isPremium]);

  // WebSocket Connection
  useEffect(() => {
    if (!weddingId || !isPremium) return;

    const connectWebSocket = () => {
      const baseUrl = getApiBaseUrl();
      const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = baseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${wsHost}/api/streams/ws/camera-control/${weddingId}`;
      
      console.log('Connecting to Camera WS:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Camera WS Connected');
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'camera_switched') {
            console.log('Camera switched event:', data);
            setActiveCameraId(data.camera_id);
            toast.success(`Switched to ${data.camera_name || 'camera'}`);
            // Reload cameras to refresh status if needed
            loadCameras(); 
          }
        } catch (e) {
          console.error('WS Message Parse Error:', e);
        }
      };

      ws.onclose = () => {
        console.log('Camera WS Disconnected');
        setWsStatus('disconnected');
        // Reconnect after delay
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (err) => {
        console.error('Camera WS Error:', err);
        setWsStatus('error');
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [weddingId, isPremium]);

  const loadCameras = async () => {
    try {
      const response = await api.get(`/api/streams/${weddingId}/cameras`);
      setCameras(response.data || []);
    } catch (error) {
      console.error('Error loading cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveCamera = async () => {
    try {
      const response = await api.get(`/api/streams/camera/${weddingId}/active`);
      if (response.data.active_camera_id) {
        setActiveCameraId(response.data.active_camera_id);
      }
    } catch (error) {
      console.error('Error loading active camera:', error);
    }
  };

  const handleSwitchCamera = async (cameraId) => {
    if (switching || cameraId === activeCameraId) return;

    try {
      setSwitching(true);
      const response = await api.post(`/api/streams/camera/${weddingId}/${cameraId}/switch`);
      
      if (response.data.status === 'success') {
        setActiveCameraId(cameraId);
        toast.success('Camera switch initiated');
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Failed to switch camera');
    } finally {
      setSwitching(false);
    }
  };

  if (!isPremium) return null;

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-semibold flex items-center gap-2">
             <Camera className="w-5 h-5" /> Multi-Camera Control
           </h3>
           <Badge variant={wsStatus === 'connected' ? 'outline' : 'destructive'} className="text-xs">
             {wsStatus === 'connected' ? 'Synced' : 'Connecting...'}
           </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { loadCameras(); loadActiveCamera(); }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Main Program Output */}
      <Card className="border-2 border-gray-900 bg-gray-950 overflow-hidden">
        <div className="aspect-video relative">
          <ActiveCameraPlayer 
            weddingId={weddingId} 
            activeCameraId={activeCameraId} 
            cameras={cameras} 
          />
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="destructive" className="animate-pulse shadow-sm">
              LIVE PROGRAM
            </Badge>
          </div>
        </div>
        <div className="p-3 bg-gray-900 text-white flex justify-between items-center">
           <span className="text-sm font-medium text-gray-300">
             Active Source: <span className="text-white ml-1">
               {cameras.find(c => c.camera_id === activeCameraId)?.name || 'None'}
             </span>
           </span>
           {switching && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Switching...</span>}
        </div>
      </Card>

      {/* Camera Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Available Sources</h4>
        {loading ? (
           <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
        ) : cameras.length === 0 ? (
           <Alert>
             <AlertTriangle className="w-4 h-4"/>
             <AlertDescription>No cameras configured. Add cameras in the Multi-Camera Settings tab.</AlertDescription>
           </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map(camera => (
              <CameraCard
                key={camera.camera_id}
                camera={camera}
                isActive={camera.camera_id === activeCameraId}
                onSwitch={() => handleSwitchCamera(camera.camera_id)}
                disabled={switching}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraManagementPanel;
