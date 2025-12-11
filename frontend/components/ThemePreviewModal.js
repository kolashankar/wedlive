'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Check } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';

export default function ThemePreviewModal({ isOpen, onClose, wedding, themeId, onApply }) {
  const [applying, setApplying] = useState(false);

  // CRITICAL FIX: Create a mock wedding object with complete theme_settings
  const mockWedding = {
    ...wedding,
    // Ensure required fields exist for preview
    bride_name: wedding?.bride_name || 'Bride',
    groom_name: wedding?.groom_name || 'Groom',
    scheduled_date: wedding?.scheduled_date || new Date().toISOString(),
    location: wedding?.location || '',
    theme_settings: {
      // Use existing theme_settings or create complete defaults
      theme_id: themeId,
      custom_font: wedding?.theme_settings?.custom_font || 'Great Vibes',
      primary_color: wedding?.theme_settings?.primary_color || '#f43f5e',
      secondary_color: wedding?.theme_settings?.secondary_color || '#a855f7',
      pre_wedding_video: wedding?.theme_settings?.pre_wedding_video || '',
      cover_photos: wedding?.theme_settings?.cover_photos || [],
      studio_details: wedding?.theme_settings?.studio_details || {
        studio_id: '',
        name: '',
        logo_url: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        contact: ''
      },
      custom_messages: wedding?.theme_settings?.custom_messages || {
        welcome_text: 'Welcome to our big day',
        description: ''
      }
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      await onApply(themeId);
      onClose();
    } catch (error) {
      console.error('Error applying theme:', error);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        {/* CRITICAL FIX: Add DialogTitle for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>Theme Preview</DialogTitle>
        </DialogHeader>
        
        {/* Header with actions */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={applying}
            className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
          >
            <Check className="w-4 h-4 mr-2" />
            {applying ? 'Applying...' : 'Apply Theme'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Theme Preview */}
        <div className="h-full overflow-y-auto">
          <ThemeRenderer 
            wedding={mockWedding} 
            onEnter={() => {}} // No-op for preview
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
