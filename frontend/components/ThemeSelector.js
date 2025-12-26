'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Eye, Check, Crown, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * ThemeSelector Component
 * Displays available themes with subscription filtering
 * Shows theme previews and requirements
 */
export default function ThemeSelector({ weddingId, currentThemeId, onThemeSelect, userSubscription = 'free' }) {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const isPremium = userSubscription === 'monthly' || userSubscription === 'yearly';

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/themes');
      setThemes(response.data);
    } catch (error) {
      console.error('Error loading themes:', error);
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleThemePreview = (theme) => {
    setSelectedTheme(theme);
    setPreviewOpen(true);
  };

  const handleThemeSelect = async (theme) => {
    // Check if premium theme and user doesn't have premium
    if (theme.subscription_required && !isPremium) {
      toast.error('This theme requires a premium subscription');
      return;
    }

    try {
      setApplying(true);
      // Update wedding theme
      await api.put(`/api/weddings/${weddingId}/theme-assets`, {
        theme_id: theme.id
      });
      
      toast.success(`Theme "${theme.name}" applied successfully!`);
      setPreviewOpen(false);
      
      if (onThemeSelect) {
        onThemeSelect(theme);
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Failed to apply theme');
    } finally {
      setApplying(false);
    }
  };

  const getRequiredPhotosText = (theme) => {
    const required = [];
    if (theme.required_sections?.bride) required.push('Bride');
    if (theme.required_sections?.groom) required.push('Groom');
    if (theme.required_sections?.couple) required.push('Couple');
    
    let text = required.join(', ');
    
    if (theme.precious_moments_config) {
      const { min_photos, max_photos } = theme.precious_moments_config;
      text += ` + ${min_photos}-${max_photos} Precious Moments`;
    }
    
    return text || 'No specific requirements';
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
        <h3 className="text-lg font-semibold mb-2">Select Your Wedding Theme</h3>
        <p className="text-sm text-muted-foreground">
          Choose a theme that matches your wedding style. Premium themes offer more customization options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const isLocked = theme.subscription_required && !isPremium;
          const isActive = theme.id === currentThemeId;

          return (
            <Card 
              key={theme.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isActive ? 'ring-2 ring-rose-500' : ''
              } ${isLocked ? 'opacity-75' : ''}`}
            >
              {/* Premium Badge */}
              {theme.subscription_required && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}

              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="default" className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              )}

              {/* Theme Preview Image */}
              <div className="relative h-40 bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center">
                {theme.preview_image_url ? (
                  <img 
                    src={theme.preview_image_url} 
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-8 h-8" />
                    <span className="text-xs">{theme.name}</span>
                  </div>
                )}
                
                {isLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Crown className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-base">{theme.name}</CardTitle>
                <CardDescription className="text-xs">
                  {theme?.description || 'Beautiful wedding theme'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Required Photos */}
                <div className="text-xs space-y-1">
                  <div className="font-medium text-muted-foreground">Required Photos:</div>
                  <div className="text-foreground">{getRequiredPhotosText(theme)}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleThemePreview(theme)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  
                  {!isActive && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleThemeSelect(theme)}
                      disabled={isLocked}
                    >
                      {isLocked ? (
                        <><Crown className="w-4 h-4 mr-1" />Upgrade</>
                      ) : (
                        <>Select</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Theme Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTheme?.name}
              {selectedTheme?.subscription_required && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTheme && selectedTheme.description ? selectedTheme.description : 'Beautiful wedding theme for your special day'}
            </DialogDescription>
          </DialogHeader>

          {selectedTheme && (
            <div className="space-y-4">
              {/* Preview Image */}
              <div className="relative h-64 bg-gradient-to-br from-rose-100 to-purple-100 rounded-lg overflow-hidden">
                {selectedTheme.preview_image_url ? (
                  <img 
                    src={selectedTheme.preview_image_url} 
                    alt={selectedTheme.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Sparkles className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Theme Details */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Required Photos</h4>
                  <p className="text-sm text-muted-foreground">
                    {getRequiredPhotosText(selectedTheme)}
                  </p>
                </div>

                {selectedTheme.default_borders && Object.keys(selectedTheme.default_borders).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1">Default Borders</h4>
                    <p className="text-sm text-muted-foreground">
                      This theme includes custom borders for different photo categories
                    </p>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <Button
                className="w-full"
                onClick={() => handleThemeSelect(selectedTheme)}
                disabled={applying || (selectedTheme.subscription_required && !isPremium)}
              >
                {applying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</>
                ) : selectedTheme.subscription_required && !isPremium ? (
                  <><Crown className="w-4 h-4 mr-2" />Upgrade to Premium</>
                ) : (
                  <>Apply This Theme</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
