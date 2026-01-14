'use client';
import React from 'react';
import { Check, Layout } from 'lucide-react';
import { getAllLayouts } from '@/components/layouts';

/**
 * LayoutSelector - Dropdown for selecting wedding layout
 * 
 * Dynamically loads available layouts from the layout registry.
 * Shows layout name, description, and preview thumbnail.
 * 
 * @param {string} value - Currently selected layout ID
 * @param {function} onChange - Callback when layout is changed
 * @param {string} className - Additional CSS classes
 */
export default function LayoutSelector({ value, onChange, className = '' }) {
  const layouts = getAllLayouts();
  const selectedLayout = layouts.find(l => l.layout_id === value) || layouts[0];

  return (
    <div className={`layout-selector ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Layout className="w-4 h-4 inline-block mr-2" />
        Wedding Layout
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {layouts.map((layout) => {
          const isSelected = layout.layout_id === value;
          
          return (
            <button
              key={layout.layout_id}
              onClick={() => onChange(layout.layout_id)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Layout preview thumbnail */}
              <div className="mb-3 aspect-video bg-gray-100 rounded overflow-hidden">
                {layout.thumbnail ? (
                  <img 
                    src={layout.thumbnail} 
                    alt={layout.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layout className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              
              {/* Layout info */}
              <h3 className="font-semibold text-gray-900 mb-1">
                {layout.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {layout.description}
              </p>
              
              {/* Supported features */}
              <div className="mt-3 flex flex-wrap gap-2">
                {layout.supported_slots?.photos?.bridePhoto && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    Bride Photo
                  </span>
                )}
                {layout.supported_slots?.photos?.groomPhoto && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    Groom Photo
                  </span>
                )}
                {layout.supported_slots?.photos?.couplePhoto && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded">
                    Couple Photo
                  </span>
                )}
                {layout.supported_slots?.photos?.preciousMoments && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Gallery
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Currently selected layout details */}
      {selectedLayout && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Selected: {selectedLayout.name}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            {selectedLayout.description}
          </p>
          
          {/* Show supported slots */}
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">This layout supports:</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(selectedLayout.supported_slots?.photos || {}).map(([key, config]) => {
                if (config.type === 'array') {
                  return (
                    <li key={key}>
                      {config.description} (up to {config.max_count})
                    </li>
                  );
                }
                return (
                  <li key={key}>
                    {config.description} {config.required && '(required)'}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
