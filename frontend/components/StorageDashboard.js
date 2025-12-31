'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Image as ImageIcon,
  Video,
  FileVideo,
  Plus
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function StorageDashboard() {
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      const response = await api.get('/api/storage/stats');
      setStorageData(response.data);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      toast.error('Failed to load storage information');
    } finally {
      setLoading(false);
    }
  };

  const getStorageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">Loading storage information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!storageData) return null;

  const { 
    storage_used_formatted, 
    storage_limit_formatted, 
    percentage_used, 
    is_over_limit,
    can_upload,
    breakdown,
    plan
  } = storageData;

  return (
    <div className="space-y-6">
      {/* Main Storage Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-6 h-6" />
                <span>Storage Usage</span>
              </CardTitle>
              <CardDescription>
                {plan === 'free' ? 'Free Plan - 10GB' : 'Premium Plan - 200GB'}
              </CardDescription>
            </div>
            {plan === 'free' && (
              <Badge variant="outline">Free</Badge>
            )}
            {plan === 'monthly' && (
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">Premium</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={getStorageColor(percentage_used)}>
                {storage_used_formatted} used
              </span>
              <span className="text-gray-600">
                {storage_limit_formatted} total
              </span>
            </div>
            <Progress 
              value={Math.min(percentage_used, 100)} 
              className="h-3"
              indicatorClassName={getProgressColor(percentage_used)}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{percentage_used.toFixed(1)}% used</span>
              <span>{(100 - percentage_used).toFixed(1)}% available</span>
            </div>
          </div>

          {/* Warning Messages */}
          {is_over_limit && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Storage Limit Exceeded</p>
                <p className="text-sm text-red-700 mt-1">
                  You cannot upload new files until you free up space or upgrade your plan.
                </p>
              </div>
            </div>
          )}

          {!is_over_limit && percentage_used >= 80 && (
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">Storage Running Low</p>
                <p className="text-sm text-orange-700 mt-1">
                  You're using {percentage_used.toFixed(0)}% of your storage. Consider upgrading soon.
                </p>
              </div>
            </div>
          )}

          {can_upload && percentage_used < 80 && (
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Storage Available</p>
                <p className="text-sm text-green-700 mt-1">
                  You have plenty of storage space for uploads.
                </p>
              </div>
            </div>
          )}

          {/* Upgrade CTA for Free Users */}
          {plan === 'free' && (
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade to 200GB Premium Storage
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage Breakdown</CardTitle>
          <CardDescription>How your storage is being used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Media Gallery</p>
                  <p className="text-sm text-gray-500">{breakdown.media_items} items</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Photo Booth</p>
                  <p className="text-sm text-gray-500">{breakdown.photobooth_photos} photos</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <FileVideo className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium">Recordings</p>
                  <p className="text-sm text-gray-500">{breakdown.recordings} recordings</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Add-ons (Premium only) */}
      {(plan === 'monthly' || plan === 'yearly') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Add-ons</CardTitle>
            <CardDescription>Need more space? Purchase additional storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 hover:border-pink-500 cursor-pointer transition-all">
                <div className="text-center">
                  <p className="text-2xl font-bold">+50GB</p>
                  <p className="text-sm text-gray-600 mt-1">₹500/month</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg p-4 hover:border-pink-500 cursor-pointer transition-all">
                <div className="text-center">
                  <p className="text-2xl font-bold">+100GB</p>
                  <p className="text-sm text-gray-600 mt-1">₹900/month</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
