'use client';
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export default function TimelineEditor({
  overlays,
  duration,
  currentTime,
  selectedOverlay,
  onSelectOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  onReorder,
  onSeek
}) {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverlay, setDraggedOverlay] = useState(null);
  const [dragMode, setDragMode] = useState(null); // 'move', 'start', 'end'

  const handleTimelineClick = (e) => {
    if (isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = (x / rect.width) * duration;
    onSeek(clickedTime);
  };

  const handleOverlayClick = (overlay, e) => {
    e.stopPropagation();
    onSelectOverlay(overlay);
  };

  const handleDragStart = (overlay, mode, e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedOverlay(overlay);
    setDragMode(mode);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !draggedOverlay || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));

    const timing = { ...draggedOverlay.timing };

    if (dragMode === 'start') {
      timing.start_time = Math.min(newTime, timing.end_time - 0.5);
    } else if (dragMode === 'end') {
      timing.end_time = Math.max(newTime, timing.start_time + 0.5);
    } else if (dragMode === 'move') {
      const duration = timing.end_time - timing.start_time;
      timing.start_time = Math.max(0, Math.min(newTime, duration - duration));
      timing.end_time = timing.start_time + duration;
    }

    onUpdateOverlay(draggedOverlay.id, { timing });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedOverlay(null);
    setDragMode(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, draggedOverlay, dragMode]);

  const getOverlayColor = (index) => COLORS[index % COLORS.length];

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Timeline Visualization */}
      <div
        ref={timelineRef}
        className="relative bg-gray-100 rounded-lg p-4 min-h-[300px] cursor-pointer"
        onClick={handleTimelineClick}
        data-testid="timeline-canvas"
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-4 py-2">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i}>{formatTime((duration / 10) * i)}</span>
          ))}
        </div>

        {/* Current time indicator */}
        <div
          className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-20"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
        </div>

        {/* Overlay tracks */}
        <div className="mt-12 space-y-3">
          {overlays.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No overlays yet. Click "Add Overlay" to get started.
            </div>
          ) : (
            overlays.map((overlay, index) => {
              const startPercent = ((overlay.timing?.start_time || 0) / duration) * 100;
              const endPercent = ((overlay.timing?.end_time || duration) / duration) * 100;
              const widthPercent = endPercent - startPercent;
              const color = getOverlayColor(index);
              const isSelected = selectedOverlay?.id === overlay.id;

              return (
                <div
                  key={overlay.id || index}
                  className="relative h-12"
                  data-testid={`timeline-overlay-${index}`}
                >
                  {/* Track background */}
                  <div className="absolute inset-0 bg-gray-200 rounded" />

                  {/* Overlay bar */}
                  <div
                    className={`absolute h-full rounded cursor-move transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: color,
                      opacity: isSelected ? 1 : 0.8
                    }}
                    onClick={(e) => handleOverlayClick(overlay, e)}
                    onMouseDown={(e) => handleDragStart(overlay, 'move', e)}
                  >
                    {/* Left resize handle */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 bg-black bg-opacity-30 cursor-ew-resize hover:bg-opacity-50"
                      onMouseDown={(e) => handleDragStart(overlay, 'start', e)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Content */}
                    <div className="px-3 py-2 flex items-center justify-between h-full">
                      <div className="flex items-center gap-2 text-white text-sm font-medium truncate">
                        <GripVertical className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{overlay.label || overlay.endpoint_key}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white hover:bg-white hover:bg-opacity-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOverlay(overlay.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Right resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 bg-black bg-opacity-30 cursor-ew-resize hover:bg-opacity-50"
                      onMouseDown={(e) => handleDragStart(overlay, 'end', e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Time labels */}
                  <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
                    {formatTime(overlay.timing?.start_time || 0)}
                  </div>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
                    {formatTime(overlay.timing?.end_time || 0)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {overlays.map((overlay, index) => (
          <Badge
            key={overlay.id || index}
            className="cursor-pointer"
            style={{ backgroundColor: getOverlayColor(index) }}
            onClick={() => onSelectOverlay(overlay)}
            data-testid={`overlay-badge-${index}`}
          >
            {overlay.label || overlay.endpoint_key}
          </Badge>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
        <p className="font-medium mb-1">Timeline Controls:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click on timeline to seek to that position</li>
          <li>Drag overlay bars to move them</li>
          <li>Drag edges to adjust start/end times</li>
          <li>Click overlay to select and edit details</li>
        </ul>
      </div>
    </div>
  );
}
