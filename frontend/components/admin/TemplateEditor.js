'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import OverlayConfigurator from './OverlayConfigurator';
import TimelineEditor from './TimelineEditor';
import InteractiveOverlayCanvas from './InteractiveOverlayCanvas';
import { Plus, Play, Pause, Save, Trash2, Eye, EyeOff, Layers, Lock, Unlock, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

export default function TemplateEditor({ template, onSave }) {
  const { toast } = useToast();
  const playerRef = useRef(null);
  const canvasRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [overlays, setOverlays] = useState(template?.text_overlays || []);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorMode, setEditorMode] = useState('timeline'); // 'timeline' or 'list'
  const [lockedOverlays, setLockedOverlays] = useState(new Set());
  const [gridSnap, setGridSnap] = useState(false);
  const [newOverlayType, setNewOverlayType] = useState('couple_names');
  const [aspectRatio, setAspectRatio] = useState(template?.video_data?.aspect_ratio || '16:9');

  useEffect(() => {
    // Update overlays when template changes
    setOverlays(template?.text_overlays || []);
    setAspectRatio(template?.video_data?.aspect_ratio || '16:9');
  }, [template]);

  const handleAddOverlay = async () => {
    // Get endpoint details based on selected type
    const endpointOptions = {
      'bride_name': { label: "Bride's Name", placeholder: 'Sarah' },
      'groom_name': { label: "Groom's Name", placeholder: 'Michael' },
      'bride_first_name': { label: "Bride's First Name", placeholder: 'Sarah' },
      'groom_first_name': { label: "Groom's First Name", placeholder: 'Michael' },
      'couple_names': { label: 'Couple Names', placeholder: 'John & Jane' },
      'event_date': { label: 'Event Date (Day)', placeholder: '15' },
      'event_date_full': { label: 'Event Date (Full)', placeholder: 'June 15, 2025' },
      'event_month': { label: 'Event Month', placeholder: 'June' },
      'event_year': { label: 'Event Year', placeholder: '2025' },
      'event_day': { label: 'Event Day', placeholder: 'Monday' },
      'event_time': { label: 'Event Time', placeholder: '3:00 PM' },
      'venue': { label: 'Venue', placeholder: 'Grand Hotel' },
      'venue_address': { label: 'Venue Address', placeholder: '123 Main St' },
      'city': { label: 'City', placeholder: 'New York' },
      'welcome_message': { label: 'Welcome Message', placeholder: 'Welcome to Our Wedding' },
      'description': { label: 'Description', placeholder: 'Join us for our special day' },
      'countdown_days': { label: 'Countdown Days', placeholder: '30 Days' },
      'custom_text_1': { label: 'Custom Text 1', placeholder: 'Custom Text' },
      'custom_text_2': { label: 'Custom Text 2', placeholder: 'Custom Text' },
      'custom_text_3': { label: 'Custom Text 3', placeholder: 'Custom Text' },
      'custom_text_4': { label: 'Custom Text 4', placeholder: 'Custom Text' },
      'custom_text_5': { label: 'Custom Text 5', placeholder: 'Custom Text' }
    };

    const selectedEndpoint = endpointOptions[newOverlayType] || endpointOptions['couple_names'];

    // Create new overlay with proper structure matching TextOverlayCreate model
    const newOverlay = {
      endpoint_key: newOverlayType,
      label: selectedEndpoint.label,
      placeholder_text: selectedEndpoint.placeholder,
      position: { 
        x: 50,  // Center X as percentage
        y: 50,  // Center Y as percentage
        alignment: 'center', 
        anchor_point: 'center',
        unit: 'percent'
      },
      dimensions: {
        width: 50,  // Default text box width as percentage (50% of video width)
        height: null,  // Auto-height based on text content
        unit: 'percent'
      },
      timing: { 
        start_time: 0, 
        end_time: duration || 10 
      },
      styling: {
        font_family: 'Playfair Display',
        font_size: 72,
        font_weight: 'bold',
        color: '#ffffff',
        text_align: 'center',
        letter_spacing: 2,
        line_height: 1.2,
        text_shadow: '0 2px 4px rgba(0,0,0,0.3)',
        stroke: {
          enabled: false,
          color: '#000000',
          width: 2
        }
      },
      animation: {
        type: 'fade-in',
        duration: 1.0,
        easing: 'ease-in-out',
        entrance: {
          type: 'fade-in',
          duration: 1.0,
          easing: 'ease-in-out'
        },
        exit: {
          type: 'fade-out',
          duration: 1.0,
          easing: 'ease-in-out'
        }
      },
      responsive: {
        mobile_font_size: 48,
        mobile_position: { x: 50, y: 30, unit: 'percent' }
      },
      layer_index: overlays.length
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays`,
        newOverlay,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOverlays(response.data.text_overlays);
      toast({
        title: 'Success',
        description: `${selectedEndpoint.label} overlay added successfully`
      });
    } catch (error) {
      console.error('Failed to add overlay:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to add overlay',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateOverlay = async (overlayId, updates) => {
    // Check if overlay is locked
    if (lockedOverlays.has(overlayId)) {
      toast({
        title: 'Overlay Locked',
        description: 'Unlock the overlay to make changes',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Updating overlay:', overlayId, 'with updates:', updates);
      
      // OPTIMISTIC UPDATE: Apply changes immediately to local state for instant visual feedback
      setOverlays(prevOverlays => {
        return prevOverlays.map(overlay => {
          if (overlay.id === overlayId) {
            // Deep merge the updates into the overlay
            const updatedOverlay = { ...overlay };
            
            // Handle nested objects properly
            if (updates.styling) {
              updatedOverlay.styling = { 
                ...overlay.styling, 
                ...updates.styling,
                stroke: updates.styling.stroke 
                  ? { ...overlay.styling?.stroke, ...updates.styling.stroke }
                  : overlay.styling?.stroke
              };
            }
            
            if (updates.animation) {
              updatedOverlay.animation = {
                ...overlay.animation,
                ...updates.animation,
                entrance: updates.animation.entrance 
                  ? { ...overlay.animation?.entrance, ...updates.animation.entrance }
                  : overlay.animation?.entrance,
                exit: updates.animation.exit
                  ? { ...overlay.animation?.exit, ...updates.animation.exit }
                  : overlay.animation?.exit
              };
            }
            
            if (updates.position) {
              updatedOverlay.position = { ...overlay.position, ...updates.position };
            }
            
            if (updates.dimensions) {
              updatedOverlay.dimensions = { ...overlay.dimensions, ...updates.dimensions };
            }
            
            if (updates.timing) {
              updatedOverlay.timing = { ...overlay.timing, ...updates.timing };
            }
            
            // Handle other top-level fields
            Object.keys(updates).forEach(key => {
              if (!['styling', 'animation', 'position', 'dimensions', 'timing'].includes(key)) {
                updatedOverlay[key] = updates[key];
              }
            });
            
            return updatedOverlay;
          }
          return overlay;
        });
      });
      
      // Also update selectedOverlay for immediate feedback in the configurator
      if (selectedOverlay?.id === overlayId) {
        setSelectedOverlay(prev => {
          const updated = { ...prev };
          
          if (updates.styling) {
            updated.styling = { 
              ...prev.styling, 
              ...updates.styling,
              stroke: updates.styling.stroke 
                ? { ...prev.styling?.stroke, ...updates.styling.stroke }
                : prev.styling?.stroke
            };
          }
          
          if (updates.animation) {
            updated.animation = {
              ...prev.animation,
              ...updates.animation,
              entrance: updates.animation.entrance 
                ? { ...prev.animation?.entrance, ...updates.animation.entrance }
                : prev.animation?.entrance,
              exit: updates.animation.exit
                ? { ...prev.animation?.exit, ...updates.animation.exit }
                : prev.animation?.exit
            };
          }
          
          if (updates.position) updated.position = { ...prev.position, ...updates.position };
          if (updates.dimensions) updated.dimensions = { ...prev.dimensions, ...updates.dimensions };
          if (updates.timing) updated.timing = { ...prev.timing, ...updates.timing };
          
          Object.keys(updates).forEach(key => {
            if (!['styling', 'animation', 'position', 'dimensions', 'timing'].includes(key)) {
              updated[key] = updates[key];
            }
          });
          
          return updated;
        });
      }
      
      // Now make the API call in the background
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays/${overlayId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Update response:', response.data);
      console.log('Returned overlays:', response.data.text_overlays);
      
      // Update with server response to ensure consistency
      const updatedOverlays = response.data.text_overlays;
      setOverlays(updatedOverlays);
      
      // Update selected overlay with server data
      if (selectedOverlay?.id === overlayId) {
        const updatedOverlay = updatedOverlays.find(o => o.id === overlayId);
        if (updatedOverlay) {
          console.log('Updated overlay data from server:', JSON.stringify(updatedOverlay.styling, null, 2));
          console.log('Updated overlay animation from server:', JSON.stringify(updatedOverlay.animation, null, 2));
          setSelectedOverlay(updatedOverlay);
        }
      }
      
      // Only show toast for manual updates (not drag/resize which happens frequently)
      if (!updates.position || Object.keys(updates).length > 1) {
        toast({
          title: 'Success',
          description: 'Overlay updated successfully'
        });
      }
    } catch (error) {
      console.error('Failed to update overlay:', error);
      console.error('Error details:', error.response?.data);
      
      // Revert optimistic update on error by reloading from template
      setOverlays(template?.text_overlays || []);
      if (selectedOverlay?.id === overlayId) {
        const originalOverlay = template?.text_overlays?.find(o => o.id === overlayId);
        if (originalOverlay) {
          setSelectedOverlay(originalOverlay);
        }
      }
      
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update overlay',
        variant: 'destructive'
      });
      throw error; // Re-throw so OverlayConfigurator knows the save failed
    }
  };

  const handleDeleteOverlay = async (overlayId) => {
    if (!confirm('Are you sure you want to delete this overlay?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays/${overlayId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOverlays(response.data.text_overlays);
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

  const handleReorderOverlays = async (newOrder) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays/reorder`,
        newOrder,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const reordered = newOrder.map(id => overlays.find(o => o.id === id)).filter(Boolean);
      setOverlays(reordered);
    } catch (error) {
      console.error('Failed to reorder overlays:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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

  const handleDuplicateOverlay = async () => {
    if (!selectedOverlay) return;

    const duplicateData = {
      ...selectedOverlay,
      position: {
        ...selectedOverlay.position,
        x: selectedOverlay.position.x + 50,
        y: selectedOverlay.position.y + 50
      },
      label: `${selectedOverlay.label} (Copy)`,
      layer_index: overlays.length
    };

    // Remove id to create a new overlay
    delete duplicateData.id;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/admin/video-templates/${template.id}/overlays`,
        duplicateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOverlays(response.data.text_overlays);
      toast({
        title: 'Success',
        description: 'Overlay duplicated successfully'
      });
    } catch (error) {
      console.error('Failed to duplicate overlay:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate overlay',
        variant: 'destructive'
      });
    }
  };

  const toggleLockOverlay = () => {
    if (!selectedOverlay) return;

    setLockedOverlays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(selectedOverlay.id)) {
        newSet.delete(selectedOverlay.id);
        toast({
          title: 'Overlay Unlocked',
          description: 'You can now edit this overlay'
        });
      } else {
        newSet.add(selectedOverlay.id);
        toast({
          title: 'Overlay Locked',
          description: 'This overlay is now protected from changes'
        });
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedOverlay) {
      handleDeleteOverlay(selectedOverlay.id);
    }
  };

  const handleAspectRatioChange = async (newAspectRatio) => {
    if (!confirm(`Changing aspect ratio from ${aspectRatio} to ${newAspectRatio} may affect overlay positioning. Continue?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/admin/video-templates/${template.id}/aspect-ratio`,
        { aspect_ratio: newAspectRatio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAspectRatio(newAspectRatio);
      toast({
        title: 'Success',
        description: `Aspect ratio changed to ${newAspectRatio}. Please review overlay positions.`
      });

      // Reload template to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to change aspect ratio:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to change aspect ratio',
        variant: 'destructive'
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete selected overlay
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedOverlay) {
        e.preventDefault();
        handleDeleteSelected();
      }

      // Duplicate with Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedOverlay) {
        e.preventDefault();
        handleDuplicateOverlay();
      }

      // Toggle lock with Ctrl+L or Cmd+L
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && selectedOverlay) {
        e.preventDefault();
        toggleLockOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOverlay]);


  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className="ml-2" variant="default">In Progress</Badge>
            </div>
            <div className="text-sm text-gray-600">
              <strong>{overlays.length}</strong> overlays configured
            </div>
            <div className="flex items-center gap-2 pl-4 border-l">
              <span className="text-sm text-gray-600">Aspect Ratio:</span>
              <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
                <SelectTrigger className="w-[120px]" data-testid="aspect-ratio-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedOverlay && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                <span className="text-sm text-gray-600">Selected:</span>
                <Badge variant="secondary">{selectedOverlay.label || selectedOverlay.endpoint_key}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLockOverlay}
                  data-testid="toggle-lock-btn"
                >
                  {lockedOverlays.has(selectedOverlay.id) ? (
                    <Lock className="w-4 h-4 mr-1" />
                  ) : (
                    <Unlock className="w-4 h-4 mr-1" />
                  )}
                  {lockedOverlays.has(selectedOverlay.id) ? 'Unlock' : 'Lock'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateOverlay}
                  data-testid="duplicate-overlay-btn"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:text-red-700"
                  data-testid="delete-selected-btn"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorMode(editorMode === 'timeline' ? 'list' : 'timeline')}
              data-testid="toggle-editor-mode-btn"
            >
              <Layers className="w-4 h-4 mr-2" />
              {editorMode === 'timeline' ? 'List View' : 'Timeline View'}
            </Button>
          </div>
        </div>
      </Card>

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
                  onClick={() => setGridSnap(!gridSnap)}
                  data-testid="toggle-grid-snap-btn"
                  className={gridSnap ? 'bg-blue-100' : ''}
                >
                  Grid Snap {gridSnap ? 'ON' : 'OFF'}
                </Button>
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

            {/* Video with Interactive Canvas Overlay */}
            <div 
              className={`relative bg-black rounded-lg overflow-hidden ${
                aspectRatio === '9:16' 
                  ? 'aspect-[9/16] max-w-md mx-auto' 
                  : 'aspect-video'
              }`}
              ref={videoContainerRef}
            >
              <ReactPlayer
                ref={playerRef}
                url={template?.video_data?.original_url}
                playing={playing}
                controls={false}
                width="100%"
                height="100%"
                onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                onDuration={setDuration}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      disablePictureInPicture: true
                    }
                  }
                }}
              />
              <InteractiveOverlayCanvas
                overlays={overlays}
                currentTime={currentTime}
                duration={duration}
                selectedOverlay={selectedOverlay}
                showOverlays={showOverlays}
                onSelectOverlay={setSelectedOverlay}
                onUpdateOverlay={handleUpdateOverlay}
                containerRef={videoContainerRef}
                videoResolution={{
                  width: template?.video_data?.width || 1920,
                  height: template?.video_data?.height || 1080
                }}
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

          {/* Timeline or List View */}
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">
                Text Overlays ({overlays.length})
              </h3>
              <div className="flex gap-2 items-center">
                <Select value={newOverlayType} onValueChange={setNewOverlayType}>
                  <SelectTrigger className="w-[180px]" data-testid="overlay-type-select">
                    <SelectValue placeholder="Select overlay type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride_name">Bride's Name</SelectItem>
                    <SelectItem value="groom_name">Groom's Name</SelectItem>
                    <SelectItem value="bride_first_name">Bride's First Name</SelectItem>
                    <SelectItem value="groom_first_name">Groom's First Name</SelectItem>
                    <SelectItem value="couple_names">Couple Names</SelectItem>
                    <SelectItem value="event_date">Event Date (Day)</SelectItem>
                    <SelectItem value="event_date_full">Event Date (Full)</SelectItem>
                    <SelectItem value="event_month">Event Month</SelectItem>
                    <SelectItem value="event_year">Event Year</SelectItem>
                    <SelectItem value="event_day">Event Day</SelectItem>
                    <SelectItem value="event_time">Event Time</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="venue_address">Venue Address</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="welcome_message">Welcome Message</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="countdown_days">Countdown Days</SelectItem>
                    <SelectItem value="custom_text_1">Custom Text 1</SelectItem>
                    <SelectItem value="custom_text_2">Custom Text 2</SelectItem>
                    <SelectItem value="custom_text_3">Custom Text 3</SelectItem>
                    <SelectItem value="custom_text_4">Custom Text 4</SelectItem>
                    <SelectItem value="custom_text_5">Custom Text 5</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAddOverlay} data-testid="add-overlay-btn">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Overlay
                </Button>
              </div>
            </div>

            {editorMode === 'timeline' ? (
              <TimelineEditor
                overlays={overlays}
                duration={duration}
                currentTime={currentTime}
                selectedOverlay={selectedOverlay}
                onSelectOverlay={setSelectedOverlay}
                onUpdateOverlay={handleUpdateOverlay}
                onDeleteOverlay={handleDeleteOverlay}
                onReorder={handleReorderOverlays}
                onSeek={(time) => {
                  setCurrentTime(time);
                  if (playerRef.current) {
                    playerRef.current.seekTo(time);
                  }
                }}
              />
            ) : (
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
            )}
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
      </div>

      {/* Save Button */}
      <div className="flex justify-between items-center">
        <Card className="p-4 flex-1 mr-4">
          <h4 className="font-semibold text-sm mb-2">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div><kbd className="px-2 py-1 bg-gray-100 rounded">Delete</kbd> - Delete selected overlay</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl/Cmd + D</kbd> - Duplicate overlay</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded">Arrow Keys</kbd> - Move overlay (1px)</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded">Shift + Arrow</kbd> - Move overlay (10px)</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl/Cmd + L</kbd> - Lock/Unlock overlay</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded">Shift + Drag</kbd> - Proportional resize</div>
          </div>
        </Card>
        <Button onClick={handleSave} disabled={saving} size="lg" data-testid="save-template-btn">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
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
