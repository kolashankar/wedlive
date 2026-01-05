'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TemplateEditor from '@/components/admin/TemplateEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function EditVideoTemplate() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Google Fonts for overlay text rendering
  useEffect(() => {
    const fonts = [
      'Playfair+Display:wght@400;600;700',
      'Montserrat:wght@400;600;700',
      'Roboto:wght@400;700',
      'Open+Sans:wght@400;700',
      'Lato:wght@400;700',
      'Caveat:wght@400;700',
      'Bebas+Neue',
      'Rozha+One',
      'Pinyon+Script',
      'Great+Vibes',
      'Cinzel:wght@400;600;700'
    ];
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (params.id) {
      loadTemplate();
    }
  }, [params.id]);

  const loadTemplate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(
        `/api/video-templates/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplate(response.data);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive'
      });
      router.push('/admin/video-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      toast({
        title: 'Success',
        description: 'Template saved successfully'
      });
      
      // Wait a moment for any pending updates to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to templates list
      router.push('/admin/video-templates');
    } catch (error) {
      console.error('Error during save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/video-templates')}
            className="mb-2"
            data-testid="back-to-templates-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          <p className="text-gray-600 text-sm mt-1">{template.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <TemplateEditor template={template} onSave={handleSave} />
      </div>
    </div>
  );
}
