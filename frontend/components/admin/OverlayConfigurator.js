'use client';
import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Save, Sparkles } from 'lucide-react';

const ENDPOINT_OPTIONS = [
  { value: 'bride_name', label: "Bride's Name" },
  { value: 'groom_name', label: "Groom's Name" },
  { value: 'bride_first_name', label: "Bride's First Name" },
  { value: 'groom_first_name', label: "Groom's First Name" },
  { value: 'couple_names', label: 'Couple Names' },
  { value: 'event_date', label: 'Event Date (Day)' },
  { value: 'event_date_full', label: 'Event Date (Full)' },
  { value: 'event_month', label: 'Event Month' },
  { value: 'event_year', label: 'Event Year' },
  { value: 'event_day', label: 'Event Day' },
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
  { value: 'fade-in', label: 'Fade In' },
  { value: 'fade-out', label: 'Fade Out' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'scale-up', label: 'Scale Up' },
  { value: 'scale-down', label: 'Scale Down' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'bounce-in', label: 'Bounce In' },
  { value: 'bounce-out', label: 'Bounce Out' },
  { value: 'rotate-in', label: 'Rotate In' },
  { value: 'spin', label: 'Spin' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'blur-in', label: 'Blur In' },
  { value: 'blur-out', label: 'Blur Out' },
  { value: 'fade-slide-up', label: 'Fade + Slide Up' },
  { value: 'scale-fade', label: 'Scale + Fade' }
];

const FONT_FAMILIES = [
  'Playfair Display',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Impact'
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

const EASING_OPTIONS = [
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'linear', label: 'Linear' },
  { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: 'Bounce' }
];

export default function OverlayConfigurator({ overlay, duration, currentTime, onUpdate, onSeek }) {
  const [formData, setFormData] = useState(getDefaultFormData());
  const [pendingChanges, setPendingChanges] = useState({});
  const isSavingRef = useRef(false);

  // Reference resolution for percentage calculations (default: 1920x1080)
  const referenceResolution = overlay?.template?.reference_resolution || { width: 1920, height: 1080 };

  // Helper functions to convert between pixels and responsive units
  const fontSizeToPercent = (pixelSize) => {
    const refHeight = referenceResolution.height || 1080;
    return ((pixelSize / refHeight) * 100).toFixed(2);
  };

  const letterSpacingToEm = (pixelSpacing, fontSize) => {
    if (!fontSize || fontSize === 0) return 0;
    return (pixelSpacing / fontSize).toFixed(3);
  };

  const strokeWidthToEm = (pixelWidth, fontSize) => {
    if (!fontSize || fontSize === 0) return 0;
    return (pixelWidth / fontSize).toFixed(3);
  };

  function getDefaultFormData() {
    return {
      endpoint_key: overlay?.endpoint_key ?? 'couple_names',
      label: overlay?.label ?? 'Couple Names',
      placeholder_text: overlay?.placeholder_text ?? 'Sample Text',
      position: overlay?.position ?? { x: 50, y: 50, alignment: 'center', anchor_point: 'center', unit: 'percent' },
      dimensions: overlay?.dimensions ?? { width: 50, height: null, unit: 'percent' },
      timing: overlay?.timing ?? { start_time: 0, end_time: duration || 10 },
      styling: {
        font_family: overlay?.styling?.font_family ?? 'Playfair Display',
        font_size: overlay?.styling?.font_size ?? 72,
        font_weight: overlay?.styling?.font_weight ?? 'bold',
        color: overlay?.styling?.color ?? '#ffffff',
        text_align: overlay?.styling?.text_align ?? 'center',
        letter_spacing: overlay?.styling?.letter_spacing ?? 2,
        line_height: overlay?.styling?.line_height ?? 1.2,
        text_shadow: overlay?.styling?.text_shadow ?? '0 2px 4px rgba(0,0,0,0.3)',
        stroke: overlay?.styling?.stroke ?? {
          enabled: false,
          color: '#000000',
          width: 2
        }
      },
      animation: {
        type: overlay?.animation?.type ?? 'fade-in',
        duration: overlay?.animation?.duration ?? 1.0,
        easing: overlay?.animation?.easing ?? 'ease-in-out',
        entrance: overlay?.animation?.entrance ?? {
          type: 'fade-in',
          duration: 1.0,
          easing: 'ease-in-out'
        },
        exit: overlay?.animation?.exit ?? {
          type: 'fade-out',
          duration: 1.0,
          easing: 'ease-in-out'
        }
      },
      responsive: overlay?.responsive ?? {
        mobile_font_size: 48,
        mobile_position: { x: 50, y: 30, unit: 'percent' }
      }
    };
  }

  useEffect(() => {
    if (overlay && !isSavingRef.current) {
      setFormData(getDefaultFormData());
      setPendingChanges({});
    }
  }, [overlay?.id, duration]);

  // Load Google Fonts for preview
  useEffect(() => {
    const googleFonts = ['Playfair+Display:wght@400;600;700', 'Montserrat:wght@400;600;700', 'Roboto:wght@400;700', 'Open+Sans:wght@400;700', 'Lato:wght@400;700'];
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${googleFonts.join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    if (!document.querySelector(`link[href*="fonts.googleapis.com"]`)) {
      document.head.appendChild(link);
    }
  }, []);

  const handleUpdate = (path, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        } else {
          current[keys[i]] = { ...current[keys[i]] };
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });

    // Track which fields have changed
    setPendingChanges(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });

    // Auto-save after a short delay for real-time updates
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 100); // Reduced from 800ms to 100ms for immediate feedback
  };

  const autoSaveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      return;
    }

    isSavingRef.current = true;

    // Build update payload with complete nested objects for changed sections
    const updatePayload = {};
    
    // If any field in pendingChanges exists, include the complete parent object
    if (pendingChanges.endpoint_key !== undefined) updatePayload.endpoint_key = formData.endpoint_key;
    if (pendingChanges.label !== undefined) updatePayload.label = formData.label;
    if (pendingChanges.placeholder_text !== undefined) updatePayload.placeholder_text = formData.placeholder_text;
    if (pendingChanges.position) updatePayload.position = formData.position;
    if (pendingChanges.dimensions) updatePayload.dimensions = formData.dimensions;
    if (pendingChanges.timing) updatePayload.timing = formData.timing;
    if (pendingChanges.responsive) updatePayload.responsive = formData.responsive;
    if (pendingChanges.layer_index !== undefined) updatePayload.layer_index = formData.layer_index;
    
    // For styling and animation, send complete nested objects when any sub-field changes
    if (pendingChanges.styling) {
      updatePayload.styling = {
        font_family: formData.styling.font_family,
        font_size: formData.styling.font_size,
        font_weight: formData.styling.font_weight,
        color: formData.styling.color,
        text_align: formData.styling.text_align,
        letter_spacing: formData.styling.letter_spacing,
        line_height: formData.styling.line_height,
        text_shadow: formData.styling.text_shadow,
        stroke: {
          enabled: formData.styling.stroke.enabled,
          color: formData.styling.stroke.color,
          width: formData.styling.stroke.width
        }
      };
    }
    
    if (pendingChanges.animation) {
      updatePayload.animation = {
        type: formData.animation.type,
        duration: formData.animation.duration,
        easing: formData.animation.easing,
        entrance: {
          type: formData.animation.entrance.type,
          duration: formData.animation.entrance.duration,
          easing: formData.animation.entrance.easing
        },
        exit: {
          type: formData.animation.exit.type,
          duration: formData.animation.exit.duration,
          easing: formData.animation.exit.easing
        }
      };
    }
    
    console.log('Saving overlay update with changes:', updatePayload);
    
    try {
      await onUpdate(updatePayload);
      setPendingChanges({});
    } finally {
      // Small delay before allowing overlay updates to prevent race conditions
      setTimeout(() => {
        isSavingRef.current = false;
      }, 100); // Reduced from 500ms to 100ms for faster updates
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Configure Overlay
        </h3>
        <Button size="sm" onClick={handleSave} data-testid="save-overlay-btn">
          <Save className="w-4 h-4" />
        </Button>
      </div>

      {/* Interactive Tips */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Interactive Controls</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Drag</strong> the overlay on the video to reposition</li>
          <li>• <strong>Resize</strong> using the corner/edge handles</li>
          <li>• Hold <strong>Shift</strong> while resizing for proportional scaling</li>
        </ul>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="animation">Animation</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div>
              <Label>Data Source</Label>
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
              <Label>Preview Text</Label>
              <Input
                value={formData.placeholder_text}
                onChange={(e) => handleUpdate('placeholder_text', e.target.value)}
                placeholder="Sample text for preview"
                className="mt-1"
                data-testid="placeholder-text-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                This text will be shown in preview. Real wedding data will populate automatically.
              </p>
            </div>

            <div>
              <Label>Position (Drag on video or use inputs)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <Label className="text-xs">X (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.position.x}
                    onChange={(e) => handleUpdate('position.x', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    data-testid="position-x-input"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.position.y}
                    onChange={(e) => handleUpdate('position.y', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    data-testid="position-y-input"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Percentage-based positioning (0-100%). Center: (50%, 50%)
              </p>
            </div>

            <div>
              <Label>Text Box Width: {formData.dimensions?.width || 'Auto'}%</Label>
              <Slider
                value={[formData.dimensions?.width || 50]}
                onValueChange={([value]) => handleUpdate('dimensions.width', value)}
                min={10}
                max={100}
                step={1}
                className="mt-2"
                data-testid="textbox-width-slider"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls text wrapping width. Text will automatically wrap to new lines when it exceeds this width.
              </p>
            </div>

            <div>
              <Label>Text Box Height: {formData.dimensions?.height ? `${formData.dimensions.height}%` : 'Auto'}</Label>
              <Slider
                value={[formData.dimensions?.height || 20]}
                onValueChange={([value]) => handleUpdate('dimensions.height', value)}
                min={5}
                max={100}
                step={1}
                className="mt-2"
                data-testid="textbox-height-slider"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls text box height. Set to control vertical space for text. Text will wrap within this box.
              </p>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4 mt-4">
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
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <p 
                  className="text-2xl font-medium"
                  style={{ fontFamily: formData.styling.font_family }}
                >
                  {overlay?.placeholder_text || formData.placeholder_text || 'Sample Text'}
                </p>
              </div>
            </div>

            <div>
              <Label>Font Size: {formData.styling.font_size}px ({fontSizeToPercent(formData.styling.font_size)}% of video height)</Label>
              <Slider
                value={[formData.styling.font_size]}
                onValueChange={([value]) => handleUpdate('styling.font_size', value)}
                min={12}
                max={200}
                step={1}
                className="mt-2"
                data-testid="font-size-slider"
              />
              <p className="text-xs text-gray-500 mt-1">
                Font will automatically scale on all devices. {fontSizeToPercent(formData.styling.font_size)}% = {formData.styling.font_size}px on {referenceResolution.height}px video
              </p>
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
                  onChange={(e) => {
                    handleUpdate('styling.color', e.target.value);
                    // Force immediate save for color changes
                    setTimeout(() => handleSave(), 10);
                  }}
                  onInput={(e) => {
                    // Also handle onInput for immediate feedback during color picker drag
                    handleUpdate('styling.color', e.target.value);
                  }}
                  className="w-20 h-10 p-1"
                  data-testid="text-color-input"
                />
                <Input
                  type="text"
                  value={formData.styling.color}
                  onChange={(e) => {
                    handleUpdate('styling.color', e.target.value);
                  }}
                  onBlur={() => {
                    // Save immediately when user finishes typing
                    handleSave();
                  }}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Text Alignment</Label>
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

            <div>
              <Label>Letter Spacing: {formData.styling.letter_spacing}px ({letterSpacingToEm(formData.styling.letter_spacing, formData.styling.font_size)}em)</Label>
              <Slider
                value={[formData.styling.letter_spacing]}
                onValueChange={([value]) => handleUpdate('styling.letter_spacing', value)}
                min={0}
                max={20}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Responsive unit: {letterSpacingToEm(formData.styling.letter_spacing, formData.styling.font_size)}em scales automatically with font size
              </p>
            </div>

            <div>
              <Label>Line Height: {formData.styling.line_height}</Label>
              <Slider
                value={[formData.styling.line_height]}
                onValueChange={([value]) => handleUpdate('styling.line_height', value)}
                min={0.8}
                max={3.0}
                step={0.1}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Already using responsive ratio (1.0 = normal, 1.5 = 1.5x spacing). Scales automatically with all screen sizes.
              </p>
            </div>

            {/* Text Stroke */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Text Stroke/Outline</Label>
                <Switch
                  checked={formData.styling.stroke.enabled}
                  onCheckedChange={(checked) => handleUpdate('styling.stroke.enabled', checked)}
                  data-testid="stroke-enabled-switch"
                />
              </div>
              
              {formData.styling.stroke.enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                  <div>
                    <Label className="text-xs">Stroke Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={formData.styling.stroke.color}
                        onChange={(e) => handleUpdate('styling.stroke.color', e.target.value)}
                        className="w-16 h-8 p-1"
                      />
                      <Input
                        type="text"
                        value={formData.styling.stroke.color}
                        onChange={(e) => handleUpdate('styling.stroke.color', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Stroke Width: {formData.styling.stroke.width}px ({strokeWidthToEm(formData.styling.stroke.width, formData.styling.font_size)}em)</Label>
                    <Slider
                      value={[formData.styling.stroke.width]}
                      onValueChange={([value]) => handleUpdate('styling.stroke.width', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {strokeWidthToEm(formData.styling.stroke.width, formData.styling.font_size)}em scales proportionally with font size
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-4 mt-4">
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
                Set to Current Time ({formatTime(currentTime)})
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
                Set to Current Time ({formatTime(currentTime)})
              </Button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900">
                <strong>Duration:</strong> {formatTime(formData.timing.end_time - formData.timing.start_time)}
              </p>
            </div>
          </TabsContent>

          {/* Animation Tab */}
          <TabsContent value="animation" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Entrance Animation</h4>
              
              <div>
                <Label>Animation Type</Label>
                <Select
                  value={formData.animation.entrance.type}
                  onValueChange={(value) => handleUpdate('animation.entrance.type', value)}
                >
                  <SelectTrigger className="mt-1" data-testid="entrance-animation-select">
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
                <Label>Duration: {formData.animation.entrance.duration}s</Label>
                <Slider
                  value={[formData.animation.entrance.duration]}
                  onValueChange={([value]) => handleUpdate('animation.entrance.duration', value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Easing</Label>
                <Select
                  value={formData.animation.entrance.easing}
                  onValueChange={(value) => handleUpdate('animation.entrance.easing', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EASING_OPTIONS.map(easing => (
                      <SelectItem key={easing.value} value={easing.value}>
                        {easing.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Exit Animation</h4>
              
              <div>
                <Label>Animation Type</Label>
                <Select
                  value={formData.animation.exit.type}
                  onValueChange={(value) => handleUpdate('animation.exit.type', value)}
                >
                  <SelectTrigger className="mt-1" data-testid="exit-animation-select">
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
                <Label>Duration: {formData.animation.exit.duration}s</Label>
                <Slider
                  value={[formData.animation.exit.duration]}
                  onValueChange={([value]) => handleUpdate('animation.exit.duration', value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Easing</Label>
                <Select
                  value={formData.animation.exit.easing}
                  onValueChange={(value) => handleUpdate('animation.exit.easing', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EASING_OPTIONS.map(easing => (
                      <SelectItem key={easing.value} value={easing.value}>
                        {easing.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-900">
                <strong>Tip:</strong> Entrance plays when text appears, exit when it disappears
              </p>
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
