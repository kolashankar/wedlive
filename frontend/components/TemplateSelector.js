'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Video, Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function TemplateSelector({ weddingId, currentTemplateId, onTemplateAssigned }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplateId || '');
  const [assigning, setAssigning] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewOverlays, setPreviewOverlays] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadCurrentAssignment();
  }, [weddingId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('Loading templates from /api/video-templates');
      const response = await api.get('/api/video-templates');
      console.log('Templates loaded:', response.data);
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load video templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentAssignment = async () => {
    try {
      const response = await api.get(`/api/weddings/${weddingId}/template-assignment`);
      console.log('Current assignment:', response.data);
      if (response.data.assignment_id) {
        setCurrentAssignment(response.data);
        setSelectedTemplateId(response.data.template?.id || '');
      }
    } catch (error) {
      console.error('Failed to load current assignment:', error);
      // Don't show error toast - assignment might not exist yet
    }
  };

  const handlePreviewTemplate = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setPreviewTemplate(template);
      setPreviewOpen(true);
      
      // Load populated overlays with wedding data
      try {
        setLoadingPreview(true);
        const response = await api.post(`/api/video-templates/${templateId}/preview`, {
          wedding_id: weddingId
        });
        console.log('Preview overlays:', response.data);
        setPreviewOverlays(response.data.preview_data?.overlays || []);
      } catch (error) {
        console.error('Failed to load preview overlays:', error);
        toast.error('Failed to load overlay preview');
        setPreviewOverlays([]);
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    try {
      setAssigning(true);
      console.log('Assigning template:', {
        template_id: selectedTemplateId,
        slot: 1,
        customizations: {
          color_overrides: {},
          font_overrides: {}
        }
      });
      
      await api.post(`/api/weddings/${weddingId}/assign-template`, {
        template_id: selectedTemplateId,
        slot: 1, // Changed from 'main' to integer 1
        customizations: {
          color_overrides: {},
          font_overrides: {}
        }
      });

      toast.success('Template assigned successfully!');
      loadCurrentAssignment();
      
      if (onTemplateAssigned) {
        onTemplateAssigned();
      }
    } catch (error) {
      console.error('Failed to assign template:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to assign template');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTemplate = async () => {
    if (!confirm('Are you sure you want to remove the assigned template?')) return;

    try {
      setAssigning(true);
      await api.delete(`/api/weddings/${weddingId}/template-assignment`);
      
      toast.success('Template removed successfully');
      setCurrentAssignment(null);
      setSelectedTemplateId('');
      
      if (onTemplateAssigned) {
        onTemplateAssigned();
      }
    } catch (error) {
      console.error('Failed to remove template:', error);
      toast.error(error.response?.data?.detail || 'Failed to remove template');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Template
          </CardTitle>
          <CardDescription>
            Select a video template for your wedding layout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="template-selector-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Template
          </CardTitle>
          <CardDescription>
            Select a video template to use for your wedding layout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Assignment Display */}
          {currentAssignment && currentAssignment.template && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <p className="font-semibold text-green-900">Template Assigned</p>
                  </div>
                  <p className="text-sm text-green-800">{currentAssignment.template.name}</p>
                  <p className="text-xs text-green-600 mt-1">{currentAssignment.template.description}</p>
                  
                  {currentAssignment.template.tags && currentAssignment.template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentAssignment.template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-white">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTemplate(currentAssignment.template.id)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveTemplate}
                    disabled={assigning}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Template Selector */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Template
              </label>
              <div className="flex gap-2">
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                  data-testid="template-dropdown"
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a video template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No templates available. Create templates in Admin panel.
                      </div>
                    ) : (
                      templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{template.name}</span>
                            {template.category && (
                              <Badge variant="secondary" className="text-xs">
                                {template.category}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Preview Button */}
                {selectedTemplateId && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePreviewTemplate(selectedTemplateId)}
                    title="Preview Template"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Selected Template Preview */}
            {selectedTemplateId && (
              <div className="p-3 bg-gray-50 border rounded-lg">
                {(() => {
                  const selected = templates.find(t => t.id === selectedTemplateId);
                  return selected ? (
                    <div>
                      <p className="text-sm font-medium">{selected.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{selected.description}</p>
                      {selected.video_data && (
                        <div className="text-xs text-gray-500 mt-2 grid grid-cols-2 gap-2">
                          <p>Duration: {selected.video_data.duration_seconds}s</p>
                          <p>Resolution: {selected.video_data.width}x{selected.video_data.height}</p>
                        </div>
                      )}
                      {selected.tags && selected.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selected.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Assign Button */}
            <Button
              onClick={handleAssignTemplate}
              disabled={!selectedTemplateId || assigning || templates.length === 0}
              className="w-full"
              data-testid="assign-template-btn"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {currentAssignment ? 'Change Template' : 'Assign Template'}
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> Video templates will be used to generate personalized videos
              with your wedding information automatically populated.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              {previewTemplate?.name} - {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewTemplate && previewTemplate.video_data && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <ReactPlayer
                  url={previewTemplate.video_data.original_url}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={false}
                  light={previewTemplate.preview_thumbnail?.url || false}
                  playIcon={
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all">
                      <svg className="w-8 h-8 text-rose-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  }
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload'
                      }
                    }
                  }}
                />
                
                {/* Overlay Preview - Show dynamic overlays with wedding data */}
                {!loadingPreview && previewOverlays.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {previewOverlays.map((overlay, index) => (
                      <div
                        key={overlay.id || index}
                        className="absolute"
                        style={{
                          left: `${overlay.position?.x || 0}%`,
                          top: `${overlay.position?.y || 0}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${overlay.style?.font_size || 24}px`,
                          fontFamily: overlay.style?.font_family || 'Arial',
                          color: overlay.style?.color || '#FFFFFF',
                          fontWeight: overlay.style?.font_weight || 'normal',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          textAlign: 'center',
                          maxWidth: '80%'
                        }}
                      >
                        {overlay.text}
                      </div>
                    ))}
                  </div>
                )}
                
                {loadingPreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            )}
            
            {/* Display Overlay Information */}
            {previewOverlays.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Dynamic Overlays Preview (populated with your wedding data):
                </p>
                <div className="space-y-1">
                  {previewOverlays.map((overlay, index) => (
                    <p key={index} className="text-xs text-blue-800">
                      • {overlay.data_source}: <span className="font-semibold">{overlay.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {previewTemplate && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{previewTemplate.category || 'General'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium">{previewTemplate.video_data?.duration_seconds}s</p>
                </div>
                <div>
                  <p className="text-gray-500">Resolution</p>
                  <p className="font-medium">
                    {previewTemplate.video_data?.width}x{previewTemplate.video_data?.height}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Text Overlays</p>
                  <p className="font-medium">{previewTemplate.text_overlays?.length || 0} overlays</p>
                </div>
              </div>
            )}
            
            {previewTemplate && previewTemplate.tags && previewTemplate.tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
