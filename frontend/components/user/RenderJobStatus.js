'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Download,
  Clock 
} from 'lucide-react';
import axios from 'axios';

export default function RenderJobStatus({ weddingId, jobId, onComplete }) {
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    
    // Poll for job status
    const pollInterval = setInterval(async () => {
      await fetchJobStatus();
    }, 2000); // Poll every 2 seconds

    fetchJobStatus();

    return () => clearInterval(pollInterval);
  }, [jobId]);

  const fetchJobStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      const response = await axios.get(
        `${backendUrl}/api/weddings/${weddingId}/render-jobs/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setJobStatus(response.data);
      setLoading(false);

      // Stop polling if job is completed or failed
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        if (response.data.status === 'completed' && onComplete) {
          onComplete(response.data);
        }
      }
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError(err.response?.data?.detail || 'Failed to fetch job status');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      const response = await axios.get(
        `${backendUrl}/api/weddings/${weddingId}/render-jobs/${jobId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      console.error('Error downloading video:', err);
      alert('Failed to download video. Please try again.');
    }
  };

  if (loading && !jobStatus) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading job status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <XCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobStatus) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Rendering Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {jobStatus.status === 'queued' && (
            <>
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-blue-600 font-medium">Queued</span>
            </>
          )}
          {jobStatus.status === 'processing' && (
            <>
              <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
              <span className="text-yellow-600 font-medium">Processing</span>
            </>
          )}
          {jobStatus.status === 'completed' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">Completed</span>
            </>
          )}
          {jobStatus.status === 'failed' && (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600 font-medium">Failed</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {(jobStatus.status === 'queued' || jobStatus.status === 'processing') && (
          <div className="space-y-2">
            <Progress value={jobStatus.progress} className="w-full" />
            <p className="text-sm text-gray-500 text-center">
              {jobStatus.progress}% complete
            </p>
          </div>
        )}

        {/* Error Message */}
        {jobStatus.status === 'failed' && jobStatus.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{jobStatus.error_message}</p>
          </div>
        )}

        {/* Download Button */}
        {jobStatus.status === 'completed' && jobStatus.rendered_video_url && (
          <div className="flex justify-center">
            <Button 
              onClick={handleDownload}
              className="flex items-center gap-2"
              data-testid="download-rendered-video-btn"
            >
              <Download className="w-4 h-4" />
              Download Video
            </Button>
          </div>
        )}

        {/* Job Details */}
        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
          <p>Job ID: {jobStatus.job_id}</p>
          <p>Created: {new Date(jobStatus.created_at).toLocaleString()}</p>
          {jobStatus.completed_at && (
            <p>Completed: {new Date(jobStatus.completed_at).toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
