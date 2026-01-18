'use client';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Grid3x3, List } from 'lucide-react';
import { allTransitions, builtInTransitions, imaginationTransitions } from '@/lib/slideshowAnimations';

export default function TransitionSelector({ value, onChange, className = '' }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const selectedTransition = allTransitions.find(t => t.value === value);

  const handleSelect = (transitionValue) => {
    onChange(transitionValue);
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className={`flex gap-1 ${className}`}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select transition" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {builtInTransitions.map((transition) => (
              <SelectItem key={transition.value} value={transition.value}>
                {transition.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Browse all transitions">
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Select Transition Animation</DialogTitle>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Built-in Transitions */}
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Basic Transitions</h3>
                <div className={viewMode === 'grid' ? 'grid grid-cols-5 gap-2' : 'space-y-2'}>
                  {builtInTransitions.map((transition) => (
                    <Button
                      key={transition.value}
                      variant={value === transition.value ? 'default' : 'outline'}
                      className={viewMode === 'grid' ? 'h-auto flex-col py-2' : 'w-full justify-start'}
                      onClick={() => handleSelect(transition.value)}
                    >
                      <span className="text-xs">{transition.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Imagination Transitions */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Imagination Animations ({imaginationTransitions.length} styles)</h3>
                <div className={viewMode === 'grid' ? 'grid grid-cols-6 gap-2' : 'grid grid-cols-2 gap-2'}>
                  {imaginationTransitions.map((transition) => (
                    <Button
                      key={transition.value}
                      variant={value === transition.value ? 'default' : 'outline'}
                      className={viewMode === 'grid' ? 'h-auto flex-col p-1 relative' : 'h-auto justify-start p-2'}
                      onClick={() => handleSelect(transition.value)}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="w-full aspect-square bg-gray-100 rounded mb-1 overflow-hidden">
                            <img
                              src={transition.preview}
                              alt={transition.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] font-medium">{transition.value.split('-')[1]}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={transition.preview}
                              alt={transition.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs">{transition.label}</span>
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
