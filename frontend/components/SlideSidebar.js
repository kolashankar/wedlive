'use client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isImaginationTransition } from '@/lib/slideshowAnimations';

export default function SlideSidebar({ 
  slides, 
  selectedIndex, 
  onSelect, 
  onAddPhotos, 
  onDeleteSlide 
}) {
  return (
    <div className="w-64 border-r bg-white flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Slides ({slides.length})</h3>
        <Button size="sm" variant="outline" onClick={onAddPhotos}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {slides.map((slide, index) => {
            const isSelected = selectedIndex === index;
            const hasImagination = isImaginationTransition(slide.transition);
            const hasEffect = slide.animation && slide.animation !== 'none';
            
            return (
              <div 
                key={index}
                className={cn(
                  "relative group flex gap-3 p-2 rounded-lg cursor-pointer border transition-all",
                  isSelected ? "bg-blue-50 border-blue-500 shadow-sm" : "hover:bg-gray-50 border-transparent hover:border-gray-200"
                )}
                onClick={() => onSelect(index)}
              >
                {/* Index & Badges */}
                <div className="flex flex-col items-center gap-1 min-w-[20px]">
                    <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                    {hasImagination && (
                        <div title="Has Transition" className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                            <Zap className="w-2.5 h-2.5 text-purple-600" />
                        </div>
                    )}
                    {hasEffect && (
                        <div title="Has Effect" className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center">
                            <Settings className="w-2.5 h-2.5 text-orange-600" />
                        </div>
                    )}
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                    {slide.media_url ? (
                        <img 
                            src={slide.media_url} 
                            alt={`Slide ${index + 1}`} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No Img</div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-medium truncate">
                        {slide.transition === 'none' ? 'No Transition' : slide.transition}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                        {slide.duration}s • {slide.animation !== 'none' ? slide.animation : 'No Effect'}
                    </p>
                </div>

                {/* Delete Action (visible on hover) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 absolute top-1 right-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(index);
                    }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
          
          {slides.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
                No slides yet. Click "Add" to start.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
