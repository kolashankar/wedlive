'use client';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

/**
 * Phase 6 Task 6.2: Progress Indicator & Completion Checklist
 * Shows users what's required vs optional and overall completion
 */
export default function WeddingSetupProgress({ 
  layoutPhotos = {}, 
  layout = {}, 
  selectedLayoutId = 'layout_1',
  supportedPhotoSlots = {},
  className = ''
}) {
  // Calculate completion
  const calculateProgress = () => {
    const requiredSlots = Object.entries(supportedPhotoSlots).filter(([_, slot]) => slot.required);
    const optionalSlots = Object.entries(supportedPhotoSlots).filter(([_, slot]) => !slot.required);
    
    const requiredCompleted = requiredSlots.filter(([name]) => layoutPhotos[name]).length;
    const optionalCompleted = optionalSlots.filter(([name]) => layoutPhotos[name]).length;
    
    const totalRequired = requiredSlots.length;
    const totalOptional = optionalSlots.length;
    const totalSlots = totalRequired + totalOptional;
    const totalCompleted = requiredCompleted + optionalCompleted;
    
    const requiredProgress = totalRequired > 0 ? (requiredCompleted / totalRequired) * 100 : 100;
    const overallProgress = totalSlots > 0 ? (totalCompleted / totalSlots) * 100 : 0;
    
    return {
      requiredCompleted,
      totalRequired,
      optionalCompleted,
      totalOptional,
      requiredProgress,
      overallProgress,
      isRequiredComplete: requiredCompleted === totalRequired,
      requiredSlots,
      optionalSlots
    };
  };

  const progress = calculateProgress();

  // Checklist items
  const checklistItems = [
    {
      id: 'layout',
      label: 'Choose Layout',
      completed: !!selectedLayoutId,
      required: true
    },
    {
      id: 'required_photos',
      label: `Upload Required Photos (${progress.requiredCompleted}/${progress.totalRequired})`,
      completed: progress.isRequiredComplete,
      required: true
    },
    {
      id: 'font_colors',
      label: 'Customize Font & Colors',
      completed: !!(layout.custom_font || layout.primary_color),
      required: false
    },
    {
      id: 'optional_photos',
      label: `Add Gallery Photos (${progress.optionalCompleted}/${progress.totalOptional})`,
      completed: progress.optionalCompleted > 0,
      required: false
    },
    {
      id: 'message',
      label: 'Add Welcome Message',
      completed: !!(layout.custom_messages?.welcome_text && layout.custom_messages?.welcome_text !== 'Welcome to our big day'),
      required: false
    }
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Setup Progress</h3>
        <span className="text-2xl font-bold text-purple-600">
          {Math.round(completionPercentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{completedCount} of {totalCount} completed</span>
          <span>
            {progress.isRequiredComplete ? (
              <span className="text-green-600 font-medium">✓ All required done</span>
            ) : (
              <span className="text-amber-600 font-medium">{progress.totalRequired - progress.requiredCompleted} required remaining</span>
            )}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checklistItems.map(item => (
          <div 
            key={item.id} 
            className="flex items-center gap-2 text-sm"
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={item.completed ? 'text-gray-600 line-through' : 'text-gray-900'}>
              {item.label}
            </span>
            {item.required && !item.completed && (
              <span className="ml-auto text-xs text-red-500 font-semibold">Required</span>
            )}
          </div>
        ))}
      </div>

      {/* Call to Action */}
      {!progress.isRequiredComplete && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold mb-1">Action Required</p>
            <p>Complete all required photos before your wedding page goes live</p>
          </div>
        </div>
      )}
      
      {progress.isRequiredComplete && completionPercentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Looking Good!</p>
            <p>All required items done. Add optional items to make your page even better</p>
          </div>
        </div>
      )}
      
      {completionPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div className="text-sm text-green-800 font-semibold">
            🎉 Setup Complete! Your wedding page is ready
          </div>
        </div>
      )}
    </div>
  );
}
