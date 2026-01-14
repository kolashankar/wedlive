'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Link from 'next/link';

const QUALITY_OPTIONS = [
  { value: '240p', label: '240p', description: '426×240' },
  { value: '360p', label: '360p', description: '640×360' },
  { value: '480p', label: '480p', description: '854×480' },
  { value: '720p', label: '720p HD', description: '1280×720', premium: true },
  { value: '1080p', label: '1080p Full HD', description: '1920×1080', premium: true },
  { value: '1440p', label: '1440p 2K', description: '2560×1440', premium: true },
  { value: '4K', label: '4K Ultra HD', description: '3840×2160', premium: true }
];

export default function QualityControl({ weddingId, isPremium }) {
  const [loading, setLoading] = useState(false);
  const [qualitySettings, setQualitySettings] = useState(null);
  const [selectedLiveQuality, setSelectedLiveQuality] = useState('480p');
  const [selectedRecordingQuality, setSelectedRecordingQuality] = useState('480p');

  useEffect(() => {
    loadQualitySettings();
  }, [weddingId]);

  const loadQualitySettings = async () => {
    try {
      const response = await api.get(`/api/streams/quality/${weddingId}`);
      const data = response.data;
      setQualitySettings(data);
      setSelectedLiveQuality(data.live_quality);
      setSelectedRecordingQuality(data.recording_quality);
    } catch (error) {
      console.error('Error loading quality settings:', error);
    }
  };

  const handleUpdateQuality = async () => {
    try {
      setLoading(true);
      await api.post('/api/streams/quality/update', {
        wedding_id: weddingId,
        live_quality: selectedLiveQuality,
        recording_quality: selectedRecordingQuality
      });
      toast.success('Quality settings updated successfully!');
      loadQualitySettings();
    } catch (error) {
      console.error('Error updating quality:', error);
      toast.error(error.response?.data?.detail || 'Failed to update quality settings');
    } finally {
      setLoading(false);
    }
  };

  const isQualityAllowed = (quality) => {
    if (!qualitySettings) return false;
    return qualitySettings.allowed_live_qualities.includes(quality);
  };

  if (!qualitySettings) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading quality settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Stream Quality Control
        </CardTitle>
        <CardDescription>
          Configure live streaming and recording quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!qualitySettings.is_premium && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              {qualitySettings.message}
              <Link href="/pricing" className="font-semibold underline ml-1">
                Upgrade Now
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Live Quality Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Live Streaming Quality</label>
            <Badge>{selectedLiveQuality}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUALITY_OPTIONS.map((option) => {
              const allowed = isQualityAllowed(option.value);
              const isSelected = selectedLiveQuality === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => allowed && setSelectedLiveQuality(option.value)}
                  disabled={!allowed}
                  className={`
                    relative p-3 rounded-lg border-2 text-left transition-all
                    ${isSelected 
                      ? 'border-rose-500 bg-rose-50' 
                      : allowed 
                        ? 'border-gray-200 hover:border-rose-300 hover:bg-rose-50/50' 
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{option.label}</span>
                    {option.premium && !qualitySettings.is_premium && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recording Quality Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Recording Quality</label>
            <Badge variant="secondary">{selectedRecordingQuality}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUALITY_OPTIONS.map((option) => {
              const allowed = isQualityAllowed(option.value);
              const isSelected = selectedRecordingQuality === option.value;
              // Recording quality cannot exceed live quality
              const liveIndex = QUALITY_OPTIONS.findIndex(q => q.value === selectedLiveQuality);
              const optionIndex = QUALITY_OPTIONS.findIndex(q => q.value === option.value);
              const exceedsLive = optionIndex > liveIndex;
              
              return (
                <button
                  key={option.value}
                  onClick={() => allowed && !exceedsLive && setSelectedRecordingQuality(option.value)}
                  disabled={!allowed || exceedsLive}
                  className={`
                    relative p-3 rounded-lg border-2 text-left transition-all
                    ${isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : allowed && !exceedsLive
                        ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50' 
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{option.label}</span>
                    {option.premium && !qualitySettings.is_premium && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{option.description}</p>
                  {exceedsLive && allowed && (
                    <p className="text-xs text-red-500 mt-1">Exceeds live quality</p>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            Recording quality cannot exceed live streaming quality
          </p>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleUpdateQuality} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Updating...' : 'Save Quality Settings'}
        </Button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Higher quality requires more bandwidth. Test your connection before going live with 4K.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
