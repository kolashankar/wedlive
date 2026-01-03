'use client';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save } from 'lucide-react';

const ENDPOINT_OPTIONS = [
  { value: 'bride_name', label: "Bride's Name" },
  { value: 'groom_name', label: "Groom's Name" },
  { value: 'bride_first_name', label: "Bride's First Name" },
  { value: 'groom_first_name', label: "Groom's First Name" },
  { value: 'couple_names', label: 'Couple Names' },
  { value: 'event_date', label: 'Event Date' },
  { value: 'event_time', label: 'Event Time' },
  { value: 'venue', label: 'Venue' },
  { value: 'venue_address', label: 'Venue Address' },
  { value: 'city', label: 'City' },
  { value: 'welcome_message', label: 'Welcome Message' },
  { value: 'description', label: 'Description' },
  { value: 'countdown_days', label: 'Countdown Days' },
  { value: 'custom_text_1', label: 'Custom Text 1' },
  { value: 'custom_text_2', label: 'Custom Text 2' },
  { value: 'custom_text_3', label: 'Custom Text 3' },
  { value: 'custom_text_4', label: 'Custom Text 4' },
  { value: 'custom_text_5', label: 'Custom Text 5' }
];

const ANIMATION_TYPES = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'scale', label: 'Scale' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'typewriter', label: 'Typewriter' }
];

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Comic Sans MS',
  'Impact',
  'Playfair Display',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato'
];

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: '100', label: 'Thin' },
  { value: '300', label: 'Light' },
  { value: '500', label: 'Medium' },
  { value: '700', label: 'Bold' },
  { value: '900', label: 'Black' }
];

const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

export default function OverlayConfigurator({ overlay, duration, currentTime, onUpdate, onSeek }) {
  const [formData, setFormData] = useState({
    endpoint_key: overlay?.endpoint_key || 'couple_names',
    label: overlay?.label || 'Couple Names',
    placeholder_text: overlay?.placeholder_text || 'Sample Text',
    position: overlay?.position || { x: 960, y: 540, alignment: 'center', anchor_point: 'center' },
    timing: overlay?.timing || { start_time: 0, end_time: duration || 10 },
    styling: overlay?.styling || {
      font_family: 'Arial',
      font_size: 48,
      font_weight: 'bold',
      color: '#ffffff',
      text_align: 'center',
      text_shadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    animation: overlay?.animation || {
      type: 'fade',
      duration: 1.0,
      easing: 'ease-in-out'
    }
  });

  useEffect(() => {
    // Update form when overlay changes
    if (overlay) {
      setFormData({
        endpoint_key: overlay.endpoint_key || 'couple_names',
        label: overlay.label || 'Couple Names',
        placeholder_text: overlay.placeholder_text || 'Sample Text',
        position: overlay.position || { x: 960, y: 540, alignment: 'center', anchor_point: 'center' },
        timing: overlay.timing || { start_time: 0, end_time: duration || 10 },
        styling: overlay.styling || {
          font_family: 'Arial',
          font_size: 48,
          font_weight: 'bold',
          color: '#ffffff',
          text_align: 'center',
          text_shadow: '0 2px 4px rgba(0,0,0,0.3)'
        },
        animation: overlay.animation || {
          type: 'fade',
          duration: 1.0,
          easing: 'ease-in-out'
        }
      });
    }
  }, [overlay, duration]);

  const handleUpdate = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updated[parent] = { ...updated[parent], [child]: value };
      } else {
        updated[field] = value;
      }
      return updated;
    });
  };

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Configure Overlay</h3>
        <Button size="sm" onClick={handleSave} data-testid="save-overlay-btn">
          <Save className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label>Data Endpoint</Label>
              <Select
                value={formData.endpoint_key}
                onValueChange={(value) => {
                  handleUpdate('endpoint_key', value);
                  const endpoint = ENDPOINT_OPTIONS.find(e => e.value === value);
                  if (endpoint) {
                    handleUpdate('label', endpoint.label);
                  }
                }}
              >
                <SelectTrigger className="mt-1" data-testid="endpoint-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Placeholder Text</Label>
              <Input
                value={formData.placeholder_text}
                onChange={(e) => handleUpdate('placeholder_text', e.target.value)}
                placeholder="Sample text for preview"
                className="mt-1"
                data-testid="placeholder-text-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                This text will be shown in preview. Real data will be populated from wedding details.
              </p>
            </div>
          </TabsContent>

          {/* Position Tab */}
          <TabsContent value="position" className="space-y-4">
            <div>
              <Label>X Position (px)</Label>
              <Input
                type="number"
                value={formData.position.x}
                onChange={(e) => handleUpdate('position.x', parseInt(e.target.value) || 0)}
                className="mt-1"
                data-testid="position-x-input"
              />
            </div>

            <div>
              <Label>Y Position (px)</Label>
              <Input
                type="number"
                value={formData.position.y}
                onChange={(e) => handleUpdate('position.y', parseInt(e.target.value) || 0)}
                className="mt-1"
                data-testid="position-y-input"
              />
            </div>

            <div>
              <Label>Alignment</Label>
              <Select
                value={formData.styling.text_align}
                onValueChange={(value) => handleUpdate('styling.text_align', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXT_ALIGNMENTS.map(align => (
                    <SelectItem key={align.value} value={align.value}>
                      {align.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900">
                <strong>Tip:</strong> Video dimensions are 1920x1080. Center is at (960, 540).
              </p>
            </div>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-4">
            <div>
              <Label>Start Time: {formatTime(formData.timing.start_time)}</Label>
              <Slider
                value={[formData.timing.start_time]}
                onValueChange={([value]) => handleUpdate('timing.start_time', value)}
                max={duration || 100}
                step={0.1}
                className="mt-2"
                data-testid="start-time-slider"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  handleUpdate('timing.start_time', currentTime);
                  onSeek(currentTime);
                }}
                className="mt-2 w-full"
              >
                Set to Current Time
              </Button>
            </div>

            <div>
              <Label>End Time: {formatTime(formData.timing.end_time)}</Label>
              <Slider
                value={[formData.timing.end_time]}
                onValueChange={([value]) => handleUpdate('timing.end_time', value)}
                max={duration || 100}
                step={0.1}
                className="mt-2"
                data-testid="end-time-slider"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  handleUpdate('timing.end_time', currentTime);
                  onSeek(currentTime);
                }}
                className="mt-2 w-full"
              >
                Set to Current Time
              </Button>
            </div>

            <div>
              <Label>Animation Type</Label>
              <Select
                value={formData.animation.type}
                onValueChange={(value) => handleUpdate('animation.type', value)}
              >
                <SelectTrigger className="mt-1" data-testid="animation-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANIMATION_TYPES.map(anim => (
                    <SelectItem key={anim.value} value={anim.value}>
                      {anim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Animation Duration: {formData.animation.duration}s</Label>
              <Slider
                value={[formData.animation.duration]}
                onValueChange={([value]) => handleUpdate('animation.duration', value)}
                min={0.1}
                max={5}
                step={0.1}
                className="mt-2"
              />
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4">
            <div>
              <Label>Font Family</Label>
              <Select
                value={formData.styling.font_family}
                onValueChange={(value) => handleUpdate('styling.font_family', value)}
              >
                <SelectTrigger className="mt-1" data-testid="font-family-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(font => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Font Size: {formData.styling.font_size}px</Label>
              <Slider
                value={[formData.styling.font_size]}
                onValueChange={([value]) => handleUpdate('styling.font_size', value)}
                min={12}
                max={200}
                step={1}
                className="mt-2"
                data-testid="font-size-slider"
              />
            </div>

            <div>
              <Label>Font Weight</Label>
              <Select
                value={formData.styling.font_weight}
                onValueChange={(value) => handleUpdate('styling.font_weight', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map(weight => (
                    <SelectItem key={weight.value} value={weight.value}>
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={formData.styling.color}
                  onChange={(e) => handleUpdate('styling.color', e.target.value)}
                  className="w-20 h-10 p-1"
                  data-testid="text-color-input"
                />
                <Input
                  type="text"
                  value={formData.styling.color}
                  onChange={(e) => handleUpdate('styling.color', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
