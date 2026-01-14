'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Frame, 
  Sparkles, 
  Image as ImageIcon, 
  Play,
  Loader2,
  Check,
  Heart,
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * BorderStyleCustomizer Component
 * Allows selection of borders, precious moment styles, background templates, and animations
 */
export default function BorderStyleCustomizer({ weddingId, onStyleUpdate }) {
  const [borders, setBorders] = useState([]);
  const [preciousStyles, setPreciousStyles] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selected values
  const [selectedBorders, setSelectedBorders] = useState({
    bride: null,
    groom: null,
    couple: null,
    precious_moments: null,
    stream: null  // FIX 5: Add stream border
  });
  const [selectedPreciousStyle, setSelectedPreciousStyle] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedAnimation, setSelectedAnimation] = useState('none');

  const animationTypes = [
    { value: 'none', label: 'None', icon: '—' },
    { value: 'fade', label: 'Fade In', icon: '✨' },
    { value: 'zoom', label: 'Zoom', icon: '🔍' },
    { value: 'parallax', label: 'Parallax', icon: '🌊' },
    { value: 'slow_pan', label: 'Slow Pan', icon: '📹' },
    { value: 'floral_float', label: 'Floral Float', icon: '🌸' },
    { value: 'light_shimmer', label: 'Light Shimmer', icon: '✨' }
  ];

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // Load all theme assets
      const [bordersRes, stylesRes, backgroundsRes] = await Promise.all([
        api.get('/api/theme-assets/borders'),
        api.get('/api/theme-assets/precious-styles'),
        api.get('/api/theme-assets/backgrounds')
      ]);

      setBorders(bordersRes.data);
      setPreciousStyles(stylesRes.data);
      setBackgrounds(backgroundsRes.data);

      // Load current wedding settings
      const weddingRes = await api.get(`/api/weddings/${weddingId}`);
      const wedding = weddingRes.data;

      if (wedding.theme_settings) {
        setSelectedBorders(wedding.theme_settings.selected_borders || {});
        setSelectedPreciousStyle(wedding.theme_settings.precious_moment_style_id);
        setSelectedBackground(wedding.theme_settings.background_template_id);
        setSelectedAnimation(wedding.theme_settings.animation || 'none');
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load theme assets');
    } finally {
      setLoading(false);
    }
  };

  const handleBorderSelect = async (category, borderId) => {
    const newBorders = { ...selectedBorders, [category]: borderId };
    setSelectedBorders(newBorders);
    await saveStyles({ selected_borders: newBorders });
  };

  const handlePreciousStyleSelect = async (styleId) => {
    setSelectedPreciousStyle(styleId);
    await saveStyles({ precious_moment_style_id: styleId });
  };

  const handleBackgroundSelect = async (bgId) => {
    setSelectedBackground(bgId);
    await saveStyles({ background_template_id: bgId });
  };

  const handleAnimationSelect = async (animation) => {
    setSelectedAnimation(animation);
    await saveStyles({ animation });
  };

  const saveStyles = async (updates) => {
    try {
      setSaving(true);
      
      await api.put(`/api/weddings/${weddingId}/theme-assets`, updates);
      
      toast.success('Style updated successfully');
      
      if (onStyleUpdate) {
        onStyleUpdate(updates);
      }
    } catch (error) {
      console.error('Error saving styles:', error);
      toast.error('Failed to save styles');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bride': return <User className="w-4 h-4" />;
      case 'groom': return <User className="w-4 h-4" />;
      case 'couple': return <Users className="w-4 h-4" />;
      case 'precious_moments': return <Heart className="w-4 h-4" />;
      case 'stream': return <Play className="w-4 h-4" />;  // FIX 5: Stream border icon
      default: return <Frame className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category) => {
    if (category === 'stream') return 'Stream Border';  // FIX 5: Stream border label
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Customize Borders & Styles</h3>
        <p className="text-sm text-muted-foreground">
          Select borders, layouts, and animations for your wedding theme.
        </p>
      </div>

      <Tabs defaultValue="borders" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="borders">
            <Frame className="w-4 h-4 mr-2" />
            Borders
          </TabsTrigger>
          <TabsTrigger value="precious">
            <Heart className="w-4 h-4 mr-2" />
            Layouts
          </TabsTrigger>
          <TabsTrigger value="backgrounds">
            <ImageIcon className="w-4 h-4 mr-2" />
            Backgrounds
          </TabsTrigger>
          <TabsTrigger value="animations">
            <Play className="w-4 h-4 mr-2" />
            Animations
          </TabsTrigger>
        </TabsList>

        {/* Borders Tab */}
        <TabsContent value="borders" className="space-y-4 mt-4">
          {['bride', 'groom', 'couple', 'precious_moments', 'stream'].map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {getCategoryLabel(category)}
                  {category === 'stream' && (
                    <Badge variant="secondary" className="ml-2">New</Badge>
                  )}
                </CardTitle>
                {category === 'stream' && (
                  <CardDescription className="text-xs">
                    Border applied to the video player area on the streaming page
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {borders.map(border => {
                    const isSelected = selectedBorders[category] === border.id;
                    return (
                      <div
                        key={border.id}
                        onClick={() => handleBorderSelect(category, border.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-rose-500 ring-2 ring-rose-200' : 'border-muted hover:border-rose-300'
                        }`}
                      >
                        <img 
                          src={border.cdn_url} 
                          alt={border.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <Badge className="bg-rose-500">
                              <Check className="w-3 h-3" />
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                          {border.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Precious Moment Styles Tab */}
        <TabsContent value="precious" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precious Moments Layout</CardTitle>
              <CardDescription className="text-xs">
                Choose how your special moments are displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {preciousStyles.map(style => {
                  const isSelected = selectedPreciousStyle === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => handlePreciousStyleSelect(style.id)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-rose-500 ring-2 ring-rose-200' : 'border-muted hover:border-rose-300'
                      }`}
                    >
                      <img 
                        src={style.cdn_url || '/placeholder-style.png'} 
                        alt={style.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-rose-500">
                            <Check className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3">
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs opacity-90">{style.slots?.length || 0} slots</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backgrounds Tab */}
        <TabsContent value="backgrounds" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Background Template</CardTitle>
              <CardDescription className="text-xs">
                Select a background for your wedding page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {backgrounds.map(bg => {
                  const isSelected = selectedBackground === bg.id;
                  return (
                    <div
                      key={bg.id}
                      onClick={() => handleBackgroundSelect(bg.id)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-rose-500 ring-2 ring-rose-200' : 'border-muted hover:border-rose-300'
                      }`}
                    >
                      <img 
                        src={bg.cdn_url} 
                        alt={bg.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-rose-500">
                            <Check className="w-3 h-3" />
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                        {bg.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Animations Tab */}
        <TabsContent value="animations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Animation Style</CardTitle>
              <CardDescription className="text-xs">
                Add motion effects to your wedding page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {animationTypes.map(anim => {
                  const isSelected = selectedAnimation === anim.value;
                  return (
                    <button
                      key={anim.value}
                      onClick={() => handleAnimationSelect(anim.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-muted hover:border-rose-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{anim.icon}</div>
                      <div className="text-sm font-medium">{anim.label}</div>
                      {isSelected && (
                        <Badge className="mt-2 bg-rose-500">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving changes...
        </div>
      )}
    </div>
  );
}
