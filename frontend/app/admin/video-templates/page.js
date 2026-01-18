'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Video, Edit, Trash2, Eye, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

export default function VideoTemplatesAdmin() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    checkAdminAccess();
    loadTemplates();
  }, []);

  const checkAdminAccess = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'Admin privileges required',
          variant: 'destructive'
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadTemplates = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/video-templates`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchTerm || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined
        }
      });
      // Backend returns array directly, not {templates: []}
      const templates = response.data || [];
      console.log('[VIDEO_TEMPLATES] Loaded templates:', templates.length);
      
      // Debug: Log first template thumbnail info
      if (templates.length > 0) {
        const firstTemplate = templates[0];
        console.log('[VIDEO_TEMPLATES] First template thumbnail:', {
          name: firstTemplate.name,
          has_thumbnail: !!firstTemplate.preview_thumbnail,
          thumbnail_url: firstTemplate.preview_thumbnail?.url,
          thumbnail_file_id: firstTemplate.preview_thumbnail?.telegram_file_id
        });
      }
      
      setTemplates(templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/admin/video-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const toggleFeatured = async (templateId, currentStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `${API_URL}/api/admin/video-templates/${templateId}`,
        { is_featured: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: 'Success',
        description: `Template ${!currentStatus ? 'featured' : 'unfeatured'}`
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Templates</h1>
            <p className="text-gray-600 mt-1">Manage wedding video templates with dynamic overlays</p>
          </div>
          <Button
            onClick={() => router.push('/admin/video-templates/new')}
            className="gap-2"
            data-testid="create-template-btn"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-templates-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'invitation', 'announcement', 'save-the-date', 'general'].map(category => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(category)}
                  size="sm"
                  data-testid={`filter-${category}-btn`}
                >
                  {category.replace('-', ' ').charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">Create your first video template to get started</p>
            <Button onClick={() => router.push('/admin/video-templates/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`template-card-${template.id}`}>
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                  {template.preview_thumbnail?.url ? (
                    <>
                      <img
                        src={template.preview_thumbnail.url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show placeholder
                          console.error(`[VIDEO_TEMPLATES] Failed to load thumbnail for ${template.name}:`, template.preview_thumbnail.url);
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentElement.querySelector('.thumbnail-placeholder');
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          console.log(`[VIDEO_TEMPLATES] Successfully loaded thumbnail for ${template.name}`);
                        }}
                      />
                      <div 
                        className="thumbnail-placeholder flex-col items-center justify-center h-full absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"
                        style={{ display: 'none' }}
                      >
                        <Video className="w-16 h-16 text-gray-500 mb-2" />
                        <p className="text-xs text-gray-500 text-center px-4">Thumbnail unavailable</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Video className="w-16 h-16 text-gray-500 mb-2" />
                      <p className="text-xs text-gray-500 text-center px-4">No thumbnail</p>
                    </div>
                  )}
                  {template.metadata?.is_featured && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary">
                      {template.video_data?.duration_seconds}s
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate flex-1" title={template.name}>
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description || 'No description'}
                  </p>
                  
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant="outline">
                      {template.text_overlays?.length || 0} overlays
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/admin/video-templates/${template.id}`)}
                      data-testid="edit-template-btn"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeatured(template.id, template.metadata?.is_featured)}
                      data-testid="toggle-featured-btn"
                    >
                      <Star className={`w-4 h-4 ${template.metadata?.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid="delete-template-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
