'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Type, Save } from 'lucide-react';

const FONT_OPTIONS = [
  'Playfair Display',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Raleway',
  'Ubuntu',
  'Merriweather',
  'Nunito',
  'PT Sans',
  'Dancing Script',
  'Great Vibes',
  'Pacifico',
  'Lobster',
  'Bebas Neue'
];

export default function TemplateCustomization({ 
  overlays, 
  customizations, 
  onSave 
}) {
  const [colorOverrides, setColorOverrides] = useState(customizations?.color_overrides || {});
  const [fontOverrides, setFontOverrides] = useState(customizations?.font_overrides || {});
  const [customTexts, setCustomTexts] = useState({
    custom_text_1: customizations?.custom_text_1 || '',
    custom_text_2: customizations?.custom_text_2 || '',
    custom_text_3: customizations?.custom_text_3 || '',
    custom_text_4: customizations?.custom_text_4 || '',
    custom_text_5: customizations?.custom_text_5 || '',
  });

  const handleColorChange = (overlayId, color) => {
    setColorOverrides(prev => ({
      ...prev,
      [overlayId]: color
    }));
  };

  const handleFontChange = (overlayId, font) => {
    setFontOverrides(prev => ({
      ...prev,
      [overlayId]: font
    }));
  };

  const handleCustomTextChange = (field, value) => {
    setCustomTexts(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave({
      color_overrides: colorOverrides,
      font_overrides: fontOverrides,
      ...customTexts
    });
  };

  return (
    <div className="space-y-6">
      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overlays && overlays.length > 0 ? (
            overlays.map((overlay) => (
              <div key={overlay.id} className="flex items-center gap-4">
                <Label className="min-w-[150px]">{overlay.label}</Label>
                <Input
                  type="color"
                  value={colorOverrides[overlay.id] || overlay.styling?.color || '#ffffff'}
                  onChange={(e) => handleColorChange(overlay.id, e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-gray-500">
                  {colorOverrides[overlay.id] || overlay.styling?.color || '#ffffff'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No overlays to customize</p>
          )}
        </CardContent>
      </Card>

      {/* Font Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Font Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overlays && overlays.length > 0 ? (
            overlays.map((overlay) => (
              <div key={overlay.id} className="flex items-center gap-4">
                <Label className="min-w-[150px]">{overlay.label}</Label>
                <Select
                  value={fontOverrides[overlay.id] || overlay.styling?.font_family}
                  onValueChange={(value) => handleFontChange(overlay.id, value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No overlays to customize</p>
          )}
        </CardContent>
      </Card>

      {/* Custom Text Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Text Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex items-center gap-4">
              <Label className="min-w-[150px]">Custom Text {num}</Label>
              <Input
                type="text"
                value={customTexts[`custom_text_${num}`]}
                onChange={(e) => handleCustomTextChange(`custom_text_${num}`, e.target.value)}
                placeholder={`Enter custom text ${num}`}
                className="flex-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Customizations
        </Button>
      </div>
    </div>
  );
}
