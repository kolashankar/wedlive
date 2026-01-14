'use client';
import React, { useState, useEffect } from 'react';
import { Video, StopCircle, Download, Clock, HardDrive, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';

const QUALITY_OPTIONS = [
  { value: '360p', label: '360p', size: 'Small' },
  { value: '480p', label: '480p', size: 'Medium' },
  { value: '720p', label: '720p HD', size: 'Large' },
  { value: '1080p', label: '1080p Full HD', size: 'X-Large' },
];

export default function RecordingControls({ weddingId, isLive = false }) {
  const [loading, setLoading] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const { recordingStatus } = useSocket();

  useEffect(() => {
    loadRecordings();
  }, [weddingId]);

  useEffect(() => {
    // Update current recording status from socket
    if (recordingStatus) {
      if (recordingStatus.status === 'recording') {
        setCurrentRecording(recordingStatus);
      } else if (recordingStatus.status === 'completed') {
        setCurrentRecording(null);
        loadRecordings(); // Refresh list
        toast.success('Recording saved successfully!');
      }
    }
  }, [recordingStatus]);

  const loadRecordings = async () => {
    try {
      const response = await api.get(`/api/recording/wedding/${weddingId}`);
      setRecordings(response.data || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!isLive) {
      toast.error('Stream must be live to start recording');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/recording/start', {
        wedding_id: weddingId,
        quality: selectedQuality
      });

      if (response.data.success) {
        setCurrentRecording({
          status: 'recording',
          recording_id: response.data.data.recording_id,
          started_at: response.data.data.started_at,
          quality: selectedQuality
        });
        toast.success('Recording started!');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error(error.response?.data?.detail || 'Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/api/recording/stop/${weddingId}`);

      if (response.data.success) {
        setCurrentRecording(null);
        toast.success('Recording stopped!');
        loadRecordings();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error(error.response?.data?.detail || 'Failed to stop recording');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          DVR Recording
        </CardTitle>
        <CardDescription>
          Record your live stream for later viewing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Status */}
        {currentRecording && currentRecording.status === 'recording' ? (
          <Alert className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="font-semibold text-red-900">Recording in Progress</p>
                  <p className="text-sm text-red-700">
                    Quality: {currentRecording.quality} • Started: {formatDate(currentRecording.started_at)}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleStopRecording}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            </div>
          </Alert>
        ) : (
          <div className="space-y-4">
            {!isLive && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Stream must be live to start recording. Start your stream first.
                </AlertDescription>
              </Alert>
            )}

            {/* Quality Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recording Quality</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUALITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedQuality(option.value)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all
                      ${selectedQuality === option.value
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-rose-300 hover:bg-rose-50/50'
                      }
                    `}
                  >
                    <div className="font-semibold text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.size}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Recording Button */}
            <Button
              onClick={handleStartRecording}
              disabled={loading || !isLive}
              className="w-full"
            >
              <Video className="w-4 h-4 mr-2" />
              {loading ? 'Starting...' : 'Start Recording'}
            </Button>
          </div>
        )}

        {/* Recordings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Past Recordings</h3>
            <Badge variant="secondary">{recordings.length}</Badge>
          </div>

          {recordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recordings yet</p>
              <p className="text-xs">Start recording to save your live streams</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recordings.map((recording) => (
                <div
                  key={recording.recording_id || recording.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={recording.status === 'completed' ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {recording.status}
                      </Badge>
                      <span className="text-xs text-gray-600">{recording.quality}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(recording.started_at)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(recording.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(recording.file_size)}
                      </span>
                    </div>
                  </div>
                  {recording.recording_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(recording.recording_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
