'use client';
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { HardDrive, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

export default function StorageUsageWidget() {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const response = await api.get('/api/music/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="p-4 border-t bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!storageInfo) return null;

  const usedStorage = storageInfo.used_storage || 0;
  const totalStorage = storageInfo.total_storage_limit || 1073741824; // Default 1GB
  const percentage = (usedStorage / totalStorage) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <HardDrive className="w-4 h-4 text-gray-600" />
        <p className="text-sm font-medium text-gray-700">Storage Usage</p>
      </div>
      
      <Progress 
        value={Math.min(percentage, 100)} 
        className={`h-2 mb-2 ${isNearLimit ? 'bg-yellow-100' : 'bg-gray-200'}`}
      />
      
      <div className="flex items-center justify-between text-xs">
        <span className={isNearLimit ? 'text-yellow-700 font-medium' : 'text-gray-600'}>
          {percentage.toFixed(1)}%
        </span>
        <span className="text-gray-500">
          {formatBytes(usedStorage)} / {formatBytes(totalStorage)}
        </span>
      </div>

      {isNearLimit && (
        <div className="mt-2 flex items-start gap-1 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Near storage limit</span>
        </div>
      )}
    </div>
  );
}
