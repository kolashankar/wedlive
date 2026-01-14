"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, HardDrive, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

export default function StorageWidget({ token }) {
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStorageStats();
    }
  }, [token]);

  const fetchStorageStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/plan/storage/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStorageStats(response.data);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageStats) return null;

  const { storage_used_formatted, storage_limit_formatted, percentage_used, is_over_limit, plan } = storageStats;
  const isNearLimit = percentage_used > 80 && !is_over_limit;

  return (
    <Card className={is_over_limit ? "border-red-500" : isNearLimit ? "border-yellow-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Usage
        </CardTitle>
        <CardDescription>
          {storage_used_formatted} of {storage_limit_formatted} used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={Math.min(percentage_used, 100)} 
            className={`h-3 ${is_over_limit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-gray-100'}`}
          />
          <p className={`text-sm text-right ${is_over_limit ? 'text-red-600 font-semibold' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
            {percentage_used.toFixed(1)}% used
          </p>
        </div>

        {/* Warning Alert for Over Limit */}
        {is_over_limit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've exceeded your storage limit. Uploads are blocked until you upgrade or delete files.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Alert for Near Limit */}
        {isNearLimit && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <TrendingUp className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You're approaching your storage limit. Consider upgrading to Premium for 200GB storage.
            </AlertDescription>
          </Alert>
        )}

        {/* Breakdown */}
        {storageStats.breakdown && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Media items: {storageStats.breakdown.media_items}</p>
            <p>• Photobooth photos: {storageStats.breakdown.photobooth_photos}</p>
            <p>• Recordings: {storageStats.breakdown.recordings}</p>
          </div>
        )}

        {/* Upgrade Button for Free Plan */}
        {plan === "free" && (
          <Link href="/pricing">
            <Button className="w-full" variant={is_over_limit ? "destructive" : "default"}>
              Upgrade to Premium - 200GB Storage
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
