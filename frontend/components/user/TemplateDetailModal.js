'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2, Play, Clock, Tag, Settings, Video } from 'lucide-react';
import VideoPlayerWithOverlays from './VideoPlayerWithOverlays';
import TemplateCustomization from './TemplateCustomization';
import RenderJobStatus from './RenderJobStatus';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function TemplateDetailModal({ template, weddingId, onClose, onApply }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [renderJobId, setRenderJobId] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (template && weddingId) {
      loadPreviewData();
    }
  }, [template, weddingId]);

  const loadPreviewData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      // Load wedding data first
      const weddingResponse = await axios.get(
        `${API_URL}/api/weddings/${weddingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWeddingData(weddingResponse.data);

      // Load preview with wedding data
      const previewResponse = await axios.post(
        `${API_URL}/api/video-templates/${template.id}/preview`,
        { wedding_id: weddingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreviewData(previewResponse.data.preview_data);
    } catch (error) {
      console.error('Failed to load preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to load preview data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Error',
        description: 'Please login first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setApplying(true);
      await axios.post(
        `${API_URL}/api/weddings/${weddingId}/assign-template`,
        {
          template_id: template.id,
          slot: 1,
          customizations: customizations
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Success',
        description: 'Template applied to your wedding!'
      });

      if (onApply) {
        await onApply(template.id);
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to apply template',
        variant: 'destructive'
      });
    } finally {
      setApplying(false);
    }
  };

  const handleSaveCustomizations = (newCustomizations) => {
    setCustomizations(newCustomizations);
    toast({
      title: 'Success',
      description: 'Customizations saved!'
    });
  };

  const handleRenderVideo = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Error',
        description: 'Please login first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setRendering(true);
      const response = await axios.post(
        `${API_URL}/api/weddings/${weddingId}/render-template-video`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRenderJobId(response.data.render_job_id);
      setActiveTab('render');
      
      toast({
        title: 'Render Started',
        description: 'Your video is being rendered. This may take a few minutes.'
      });
    } catch (error) {
      console.error('Failed to start render:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to start rendering',
        variant: 'destructive'
      });
    } finally {
      setRendering(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading preview...</span>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="customize" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Customize
              </TabsTrigger>
              <TabsTrigger value="render" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Render
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[calc(90vh-250px)] mt-4">
              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                {/* Video Player */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Preview with Your Wedding Data</h3>
                  {previewData ? (
                    <VideoPlayerWithOverlays
                      videoUrl={previewData.video_url || template.video_data?.original_url}
                      overlays={previewData.overlays || []}
                      weddingData={weddingData}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Preview not available</p>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Template Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <Badge>{template.category}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{template.video_data?.duration_seconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Text Fields:</span>
                        <span className="font-medium">{template.text_overlays?.length || 0}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Populated Fields
                    </h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-2 text-sm">
                        {previewData?.overlays?.map((overlay, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-700 truncate">
                                {overlay.label || overlay.endpoint_key}
                              </p>
                              <p className="text-gray-500 truncate">{overlay.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>

              {/* Customize Tab */}
              <TabsContent value="customize" className="space-y-4">
                <TemplateCustomization
                  overlays={previewData?.overlays || []}
                  customizations={customizations}
                  onSave={handleSaveCustomizations}
                />
              </TabsContent>

              {/* Render Tab */}
              <TabsContent value="render" className="space-y-4">
                {renderJobId ? (
                  <RenderJobStatus
                    weddingId={weddingId}
                    jobId={renderJobId}
                    onComplete={() => {
                      toast({
                        title: 'Render Complete!',
                        description: 'Your video is ready to download.'
                      });
                    }}
                  />
                ) : (
                  <Card className="p-6">
                    <div className="text-center space-y-4">
                      <Video className="w-16 h-16 mx-auto text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Render Your Video</h3>
                        <p className="text-gray-600 mb-4">
                          Create a downloadable video with your wedding data burned into the overlays.
                          This process may take 2-3 minutes.
                        </p>
                      </div>
                      <Button
                        onClick={handleRenderVideo}
                        disabled={rendering}
                        className="flex items-center gap-2"
                        data-testid="start-render-btn"
                      >
                        {rendering ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Starting Render...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            Start Rendering
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={applying}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2"
                data-testid="apply-template-btn"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply Template
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
