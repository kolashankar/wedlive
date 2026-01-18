'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Music, Settings, Clock, Zap, Check, Shuffle } from 'lucide-react';
import { builtInTransitions, imaginationTransitions } from '@/lib/slideshowAnimations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AnimationRibbon({
  selectedSlide,
  onUpdateSlide,
  onApplyToAll,
  onApplyRandom,
  musicUrl,
  onSelectMusic
}) {
  const [activeTab, setActiveTab] = useState('transitions');

  const categories = [
    { id: 'entrance', label: 'Entrance', icon: Play },
    { id: 'exit', label: 'Exit', icon: Zap },
    { id: 'transitions', label: 'Transitions', icon: Settings },
    { id: 'effects', label: 'Special Effects', icon: Settings },
  ];

  // Group animations
  const basicTransitions = builtInTransitions; // Treat as Entrance/Exit for now
  const specialEffects = [
      { value: 'none', label: 'None' },
      { value: 'ken_burns', label: 'Ken Burns' },
      { value: 'random', label: 'Random' }
  ];

  const renderAnimationButton = (anim, type) => {
    const isActive = type === 'transition' 
        ? selectedSlide?.transition === anim.value 
        : selectedSlide?.animation === anim.value;

    return (
      <Button
        key={anim.value}
        variant={isActive ? "default" : "outline"}
        className="w-[140px] h-[60px] flex flex-col items-center justify-center gap-1 relative overflow-hidden shrink-0 p-0"
        onClick={() => onUpdateSlide(type, anim.value)}
        title={anim.label}
      >
        {anim.preview ? (
          <img 
            src={anim.preview} 
            alt={anim.label} 
            className="absolute inset-0 w-full h-full object-cover opacity-100" 
          />
        ) : (
          <span className="relative z-10 text-xs font-medium truncate w-full text-center px-1">
            {anim.label}
          </span>
        )}
        
        {isActive && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full z-20 shadow-sm border border-white" />
        )}
      </Button>
    );
  };

  return (
    <div className="border-b bg-white shadow-sm z-20">
      {/* Top Bar: Tabs & Quick Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r pr-4">
                <Music className="w-4 h-4 text-gray-500" />
                <Button variant="ghost" size="sm" onClick={onSelectMusic} className="text-sm truncate max-w-[150px]">
                    {musicUrl ? 'Change Music' : 'Select Background Music'}
                </Button>
                {musicUrl && (
                    <Button variant="ghost" size="icon" onClick={() => { /* Preview Logic handled by parent */ }}>
                        <Play className="w-3 h-3" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div className="w-24">
                        <Label className="text-[10px] text-gray-500 mb-1 block">Duration: {selectedSlide?.duration || 5}s</Label>
                        <Slider 
                            value={[selectedSlide?.duration || 5]} 
                            min={1} 
                            max={30} 
                            step={0.5} 
                            onValueChange={([val]) => onUpdateSlide('duration', val)} 
                        />
                    </div>
                </div>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">Settings</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-4">
                        <div className="space-y-2">
                            <Label>Transition Duration</Label>
                            <div className="flex items-center gap-2">
                                <Slider 
                                    value={[selectedSlide?.transition_duration || 1]} 
                                    min={0.1} 
                                    max={5} 
                                    step={0.1} 
                                    onValueChange={([val]) => onUpdateSlide('transition_duration', val)} 
                                />
                                <span className="text-xs w-8">{selectedSlide?.transition_duration || 1}s</span>
                            </div>
                        </div>
                         <div className="flex items-center justify-between">
                            <Label>Apply to All</Label>
                            <Button size="sm" onClick={onApplyToAll}>Apply</Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
      </div>

      {/* Ribbon Content (Excel Style Grid) */}
      <div className="h-[160px] bg-gray-50/50 p-4 flex gap-4">
        <ScrollArea className="flex-1 whitespace-nowrap">
            <div className="flex gap-2 h-full">
                {/* 
                    We need a grid layout that scrolls horizontally.
                    CSS Grid with grid-template-rows: repeat(2, 1fr) and grid-auto-flow: column
                */}
                <div 
                    className="grid grid-rows-2 grid-flow-col gap-2 min-w-max" 
                    style={{ gridTemplateRows: 'repeat(2, 60px)' }}
                >
                    {activeTab === 'entrance' || activeTab === 'exit' ? (
                        basicTransitions.map(anim => renderAnimationButton(anim, 'transition'))
                    ) : activeTab === 'transitions' ? (
                        imaginationTransitions.map(anim => renderAnimationButton(anim, 'transition'))
                    ) : activeTab === 'effects' ? (
                        specialEffects.map(anim => renderAnimationButton(anim, 'animation'))
                    ) : null}
                </div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Right Side Actions (Fixed) */}
        {activeTab === 'transitions' && (
            <div className="flex flex-col justify-center border-l pl-4 shrink-0">
                <Button 
                    variant="outline" 
                    className="h-full flex flex-col gap-2 w-24 border-dashed"
                    onClick={onApplyRandom}
                    title="Apply Random Transitions to All Slides"
                >
                    <Shuffle className="w-6 h-6 text-purple-600" />
                    <span className="text-xs font-medium text-center whitespace-normal">Apply Random</span>
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
