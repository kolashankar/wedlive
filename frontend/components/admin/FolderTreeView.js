'use client';
import { Button } from '@/components/ui/button';
import { Folder, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function FolderTreeView({ folders, selectedFolder, onSelectFolder, onDeleteFolder }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const rootFolders = folders.filter(f => !f.parent_folder_id);
  const getChildFolders = (parentId) => folders.filter(f => f.parent_folder_id === parentId);

  const FolderItem = ({ folder, level = 0 }) => {
    const hasChildren = getChildFolders(folder.id).length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;
    const children = getChildFolders(folder.id);

    return (
      <div>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
            isSelected ? 'bg-rose-100 text-rose-700' : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <Folder className="w-4 h-4" />
          <span
            className="flex-1 text-sm font-medium truncate"
            onClick={() => onSelectFolder(folder.id)}
          >
            {folder.name}
          </span>
          <span className="text-xs text-gray-500">{folder.file_count}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder.id);
            }}
            className="p-1 h-auto opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => (
              <FolderItem key={child.id} folder={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* All Files Option */}
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
          !selectedFolder ? 'bg-rose-100 text-rose-700' : 'hover:bg-gray-100'
        }`}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="flex-1 text-sm font-medium">All Files</span>
        <span className="text-xs text-gray-500">{folders.reduce((sum, f) => sum + f.file_count, 0)}</span>
      </div>

      {/* Folder Tree */}
      {rootFolders.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-500">
          No folders created yet
        </div>
      ) : (
        rootFolders.map(folder => (
          <div key={folder.id} className="group">
            <FolderItem folder={folder} />
          </div>
        ))
      )}
    </div>
  );
}
