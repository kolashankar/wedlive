'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Radio, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/config';

const CameraCard = ({ camera, isActive, onSwitch, disabled = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'text-green-500';
      case 'connected': return 'text-green-500';
      case 'waiting': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const isLive = camera.status === 'live' || camera.status === 'connected';
  const thumbnailUrl = `${getApiBaseUrl()}/api/camera-thumbnail/${camera.camera_id}`;

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      isActive 
        ? 'ring-2 ring-primary border-primary shadow-lg scale-[1.02]' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Thumbnail Area */}
      <div className="aspect-video bg-black relative group">
        {isLive ? (
          <img 
            src={thumbnailUrl} 
            alt={camera.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/images/placeholder-camera.jpg'; // Fallback
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600">
            <Video className="w-12 h-12 opacity-50" />
          </div>
        )}
        
        {/* Overlay Status */}
        <div className="absolute top-2 left-2">
          <Badge variant={isLive ? "default" : "secondary"} className={`${
            isLive ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"
          }`}>
            {isLive ? 'LIVE' : 'OFFLINE'}
          </Badge>
        </div>

        {isActive && (
          <div className="absolute top-2 right-2">
             <Badge variant="destructive" className="animate-pulse">
               ON AIR
             </Badge>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate max-w-[120px]" title={camera.name}>
              {camera.name}
            </span>
          </div>
          <div className="text-xs text-gray-500">
             {isActive ? 'Broadcasting' : 'Preview'}
          </div>
        </div>
        
        <Button 
          onClick={onSwitch}
          disabled={isActive || !isLive || disabled}
          variant={isActive ? "default" : "outline"}
          className={`w-full ${isActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          {isActive ? (
            <>
              <Radio className="w-4 h-4 mr-2" /> Active
            </>
          ) : (
            <>
              Switch Camera
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default CameraCard;
