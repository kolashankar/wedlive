'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Video, Star, Clock } from 'lucide-react';
import TemplateCard from './TemplateCard';
import TemplateDetailModal from './TemplateDetailModal';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

export default function TemplateGallery({ weddingId, onTemplateSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [categoryFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = {
        featured: categoryFilter === 'featured' ? true : undefined,
        category: categoryFilter !== 'all' && categoryFilter !== 'featured' ? categoryFilter : undefined
      };

      const response = await axios.get(`${API_URL}/api/video-templates`, { params });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setShowDetailModal(true);
  };

  const handleApplyTemplate = async (templateId) => {
    if (onTemplateSelect) {
      await onTemplateSelect(templateId);
    }
    setShowDetailModal(false);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Templates</h2>
        <p className="text-gray-600">Choose a video template for your wedding invitation</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
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
          <div className="flex gap-2 flex-wrap">
            {['all', 'featured', 'invitation', 'announcement', 'save-the-date'].map(category => (
              <Button
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(category)}
                size="sm"
                data-testid={`filter-${category}-btn`}
              >
                {category === 'featured' && <Star className="w-3 h-3 mr-1" />}
                {category.replace('-', ' ').charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Featured Section */}
      {categoryFilter === 'all' && templates.filter(t => t.metadata?.is_featured).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Featured Templates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter(t => t.metadata?.is_featured)
              .slice(0, 3)
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div>
        {categoryFilter === 'all' && templates.filter(t => t.metadata?.is_featured).length > 0 && (
          <h3 className="text-lg font-semibold mb-4">All Templates</h3>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates
              .filter(t => categoryFilter === 'all' ? !t.metadata?.is_featured : true)
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          weddingId={weddingId}
          onClose={() => setShowDetailModal(false)}
          onApply={handleApplyTemplate}
        />
      )}
    </div>
  );
}
