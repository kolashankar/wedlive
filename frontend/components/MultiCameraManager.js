'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Plus, 
  Trash2, 
  Video, 
  Copy, 
  Eye,
  Loader2,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MultiCameraManager({ weddingId, isPremium, rtmpUrl }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCameraName, setNewCameraName] = useState('');
  const [addingCamera, setAddingCamera] = useState(false);

  useEffect(() => {
    if (isPremium) {
      loadCameras();
    }
  }, [weddingId, isPremium]);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/streams/${weddingId}/cameras`);
      setCameras(response.data || []);
    } catch (error) {
      console.error('Error loading cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCamera = async () => {
    if (!newCameraName.trim()) {
      toast.error('Please enter a camera name');
      return;
    }

    try {
      setAddingCamera(true);
      const response = await api.post('/api/streams/camera/add', {
        wedding_id: weddingId,
        camera_name: newCameraName
      });
      
      toast.success('Camera added successfully!');
      setNewCameraName('');
      setShowAddDialog(false);
      loadCameras();
    } catch (error) {
      console.error('Error adding camera:', error);
      toast.error(error.response?.data?.detail || 'Failed to add camera');
    } finally {
      setAddingCamera(false);
    }
  };

  const handleRemoveCamera = async (cameraId) => {
    if (!confirm('Are you sure you want to remove this camera?')) {
      return;
    }

    try {
      await api.delete(`/api/streams/camera/${weddingId}/${cameraId}`);
      toast.success('Camera removed');
      loadCameras();
    } catch (error) {
      console.error('Error removing camera:', error);
      toast.error('Failed to remove camera');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: { variant: 'secondary', label: 'Waiting' },
      connected: { variant: 'default', label: 'Connected', className: 'bg-green-500' },
      disconnected: { variant: 'destructive', label: 'Disconnected' }
    };
    
    const config = statusConfig[status] || statusConfig.waiting;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Multi-Camera Support
            <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </CardTitle>
          <CardDescription>
            Stream from multiple camera angles simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              Multi-camera support is available for Premium subscribers only.
              <Link href="/pricing" className="font-semibold underline ml-1">
                Upgrade to Premium
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Multi-Camera Sources
        </CardTitle>
        <CardDescription>
          Manage multiple camera streams for your wedding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Camera Button */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Camera Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Camera Source</DialogTitle>
              <DialogDescription>
                Add a new camera stream for multi-angle coverage
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="camera-name">Camera Name</Label>
                <Input
                  id="camera-name"
                  placeholder="e.g., Sony A7S III, iPhone Camera, Drone View"
                  value={newCameraName}
                  onChange={(e) => setNewCameraName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCamera()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddCamera} 
                disabled={addingCamera || !newCameraName.trim()}
              >
                {addingCamera ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Add Camera</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Camera List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : cameras.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No additional cameras added yet</p>
            <p className="text-xs mt-1">Click "Add Camera Source" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cameras.map((camera) => (
              <div 
                key={camera.camera_id} 
                className="border rounded-lg p-4 space-y-3 hover:border-rose-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{camera.name}</p>
                      <p className="text-xs text-gray-500">
                        Added {new Date(camera.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(camera.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCamera(camera.camera_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stream Key */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">Stream Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={camera.stream_key}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-gray-50 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(camera.stream_key, 'Stream Key')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* RTMP URL Info */}
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs text-blue-800">
                    <strong>Server:</strong> {rtmpUrl || 'rtmp://live.wedlive.app/live'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {cameras.length > 0 && (
          <Alert>
            <Video className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Each camera uses its own stream key. Configure OBS Studio or your streaming software with the corresponding stream key for each camera.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
