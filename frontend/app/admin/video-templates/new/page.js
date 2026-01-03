'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoTemplateUploader from '@/components/admin/VideoTemplateUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewVideoTemplate() {
  const router = useRouter();

  const handleUploadSuccess = (templateId) => {
    // Navigate to template editor after successful upload
    router.push(`/admin/video-templates/${templateId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/video-templates')}
            className="mb-4"
            data-testid="back-to-templates-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Video Template</h1>
          <p className="text-gray-600 mt-1">Upload a video and configure dynamic text overlays</p>
        </div>

        {/* Uploader Component */}
        <VideoTemplateUploader onSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
}
