'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import OverlayConfigurator from './OverlayConfigurator';
import { Plus, Play, Pause, Save, Trash2, Eye, EyeOff, MoveUp, MoveDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function TemplateEditor({ template, onSave }) {
  const { toast } = useToast();
  const playerRef = useRef(null);
  const canvasRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [overlays, setOverlays] = useState(template?.text_overlays || []);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Update overlays when template changes
    setOverlays(template?.text_overlays || []);
  }, [template]);

  useEffect(() => {
    // Render overlays on canvas
    if (canvasRef.current && showOverlays) {
      renderOverlays();
    }
  }, [currentTime, overlays, showOverlays]);

  const renderOverlays = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter overlays visible at current time
    const visibleOverlays = overlays.filter(overlay => {
      const startTime = overlay.timing?.start_time || 0;
      const endTime = overlay.timing?.end_time || duration;
      return currentTime >= startTime && currentTime <= endTime;
    });

    // Render each visible overlay
    visibleOverlays.forEach(overlay => {
      const text = overlay.placeholder_text || overlay.endpoint_key || 'Sample Text';
      const position = overlay.position || { x: 960, y: 540 };
      const styling = overlay.styling || {};

      // Set font
      ctx.font = `${styling.font_weight || 'normal'} ${styling.font_size || 48}px ${styling.font_family || 'Arial'}`;
      ctx.fillStyle = styling.color || '#ffffff';
      ctx.textAlign = styling.text_align || 'center';

      // Add text shadow
      if (styling.text_shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      // Calculate animation progress
      const progress = calculateAnimationProgress(overlay, currentTime);
      ctx.globalAlpha = progress;

      // Render text
      ctx.fillText(text, position.x, position.y);

      // Reset shadow and alpha
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
    });
  };

  const calculateAnimationProgress = (overlay, time) => {
    const startTime = overlay.timing?.start_time || 0;
    const endTime = overlay.timing?.end_time || duration;
    const animDuration = overlay.animation?.duration || 1;

    // Entrance animation
    if (time < startTime + animDuration) {
      return (time - startTime) / animDuration;
    }

    // Exit animation
    if (time > endTime - animDuration) {
      return 1 - ((time - (endTime - animDuration)) / animDuration);
    }

    return 1; // Fully visible
  };

  const handleAddOverlay = async () => {
    const newOverlay = {
      endpoint_key: 'couple_names',
      label: 'Couple Names',
      placeholder_text: 'John & Jane',
      position: { x: 960, y: 540, alignment: 'center', anchor_point: 'center' },
      timing: { start_time: 0, end_time: duration || 10 },
      styling: {
        font_family: 'Arial',
        font_size: 48,
        font_weight: 'bold',
        color: '#ffffff',
        text_align: 'center'
      },
      animation: {
        type: 'fade',
        duration: 1.0,
        easing: 'ease-in-out'
      },
      layer_index: overlays.length
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays`,
        { overlays: [newOverlay] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOverlays(response.data.text_overlays);
      toast({
        title: 'Success',
        description: 'Overlay added successfully'
      });
    } catch (error) {
      console.error('Failed to add overlay:', error);
      toast({
        title: 'Error',
        description: 'Failed to add overlay',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateOverlay = async (overlayId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays/${overlayId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setOverlays(prevOverlays =>
        prevOverlays.map(o => (o.id === overlayId ? response.data : o))
      );

      toast({
        title: 'Success',
        description: 'Overlay updated'
      });
    } catch (error) {
      console.error('Failed to update overlay:', error);
      toast({
        title: 'Error',
        description: 'Failed to update overlay',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOverlay = async (overlayId) => {
    if (!confirm('Are you sure you want to delete this overlay?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays/${overlayId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOverlays(prevOverlays => prevOverlays.filter(o => o.id !== overlayId));
      setSelectedOverlay(null);

      toast({
        title: 'Success',
        description: 'Overlay deleted'
      });
    } catch (error) {
      console.error('Failed to delete overlay:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete overlay',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Trigger save callback
      if (onSave) {
        await onSave();
      }
      toast({
        title: 'Success',
        description: 'Template saved successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Player Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          {/* Player Controls */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Video Preview</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOverlays(!showOverlays)}
                data-testid="toggle-overlays-btn"
              >
                {showOverlays ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                {showOverlays ? 'Hide' : 'Show'} Overlays
              </Button>
              <Button
                size="sm"
                onClick={() => setPlaying(!playing)}
                data-testid="play-pause-btn"
              >
                {playing ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {playing ? 'Pause' : 'Play'}
              </Button>
            </div>
          </div>

          {/* Video with Canvas Overlay */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <ReactPlayer
              ref={playerRef}
              url={template?.video_data?.original_url}
              playing={playing}
              controls
              width="100%"
              height="100%"
              onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
              onDuration={setDuration}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ display: showOverlays ? 'block' : 'none' }}
            />
          </div>

          {/* Timeline */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const time = parseFloat(e.target.value);
                setCurrentTime(time);
                if (playerRef.current) {
                  playerRef.current.seekTo(time);
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              data-testid="timeline-slider"
            />
          </div>
        </Card>

        {/* Overlays List */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Text Overlays ({overlays.length})</h3>
            <Button size="sm" onClick={handleAddOverlay} data-testid="add-overlay-btn">
              <Plus className="w-4 h-4 mr-1" />
              Add Overlay
            </Button>
          </div>

          <ScrollArea className="h-64">
            {overlays.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No overlays added yet</p>
            ) : (
              <div className="space-y-2">
                {overlays.map((overlay, index) => (
                  <div
                    key={overlay.id || index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedOverlay?.id === overlay.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOverlay(overlay)}
                    data-testid={`overlay-item-${index}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{overlay.label || overlay.endpoint_key}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(overlay.timing?.start_time || 0)} - {formatTime(overlay.timing?.end_time || 0)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOverlay(overlay.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Overlay Configurator Sidebar */}
      <div className="lg:col-span-1">
        <Card className="p-4 sticky top-6">
          {selectedOverlay ? (
            <OverlayConfigurator
              overlay={selectedOverlay}
              duration={duration}
              currentTime={currentTime}
              onUpdate={(updates) => handleUpdateOverlay(selectedOverlay.id, updates)}
              onSeek={(time) => {
                setCurrentTime(time);
                if (playerRef.current) {
                  playerRef.current.seekTo(time);
                }
              }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Select an overlay to configure</p>
            </div>
          )}
        </Card>
      </div>

      {/* Save Button */}
      <div className="lg:col-span-3">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" data-testid="save-template-btn">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
