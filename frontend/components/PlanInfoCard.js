"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Check, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

export default function PlanInfoCard({ token }) {
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchPlanInfo();
    }
  }, [token]);

  const fetchPlanInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/plan/plan/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlanInfo(response.data);
    } catch (error) {
      console.error("Error fetching plan info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!planInfo) return null;

  const isPremium = planInfo.plan === "monthly" || planInfo.plan === "yearly";
  const isFree = planInfo.plan === "free";

  return (
    <Card className={isPremium ? "border-purple-500 bg-gradient-to-br from-purple-50 to-white" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isPremium && <Crown className="w-5 h-5 text-purple-600" />}
            {planInfo.plan_name} Plan
          </CardTitle>
          <Badge variant={isPremium ? "default" : "secondary"} className={isPremium ? "bg-purple-600" : ""}>
            {isPremium ? "Premium" : "Free"}
          </Badge>
        </div>
        <CardDescription>
          {planInfo.weddings_count} wedding{planInfo.weddings_count !== 1 ? "s" : ""} created
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upgrade Banner */}
        {planInfo.upgrade_banner?.show && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {planInfo.upgrade_banner.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Features List */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Plan Features:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {planInfo.features.media_upload ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span>Media Uploads</span>
            </div>
            <div className="flex items-center gap-2">
              {planInfo.features.custom_branding ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span>Custom Branding</span>
            </div>
            <div className="flex items-center gap-2">
              {planInfo.features.white_label ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span>White Label</span>
            </div>
            <div className="flex items-center gap-2">
              {planInfo.features.analytics_dashboard ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span>Advanced Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              {planInfo.features.multi_camera ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span>Multi-Camera Support</span>
            </div>
          </div>
        </div>

        {/* Resolution Info */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Streaming Quality:</h4>
          <div className="flex flex-wrap gap-1">
            {planInfo.allowed_resolutions.map((res) => (
              <Badge key={res} variant="outline" className="text-xs">
                {res}
              </Badge>
            ))}
          </div>
          {isFree && (
            <p className="text-xs text-gray-500 mt-1">
              Upgrade to Premium for 4K streaming
            </p>
          )}
        </div>

        {/* Upgrade Button */}
        {isFree && (
          <Link href="/pricing">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
