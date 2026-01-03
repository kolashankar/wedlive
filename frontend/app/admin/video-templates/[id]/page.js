'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import TemplateEditor from '@/components/admin/TemplateEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function EditVideoTemplate() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const response = await axios.get(
        `${API_URL}/api/video-templates/${params.id}`,
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

  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'Template saved successfully'
    });
    loadTemplate(); // Reload to get updated data
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
