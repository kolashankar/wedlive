'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Star, Clock, Play } from 'lucide-react';

export default function TemplateCard({ template, onClick }) {
  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={onClick}
      data-testid={`template-card-${template.id}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 group">
        {template.preview_thumbnail?.url ? (
          <img
            src={template.preview_thumbnail.url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Video className="w-12 h-12 text-gray-600" />
          </div>
        )}
        
        {/* Hover Overlay - Removed disturbing play button, just show subtle overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {template.metadata?.is_featured && (
            <Badge className="bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {template.video_data?.duration_seconds}s
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate" title={template.name}>
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description || 'Beautiful wedding video template'}
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{template.category}</Badge>
          {template.text_overlays && template.text_overlays.length > 0 && (
            <Badge variant="outline">
              {template.text_overlays.length} text fields
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
