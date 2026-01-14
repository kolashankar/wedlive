'use client';
import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, Folder, FolderOpen, Edit2, Trash2, 
  ChevronRight, ChevronDown, Move, Image, FileVideo,
  HardDrive, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

// Format file size to human readable
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function FolderManagerNested({ weddingId, onFolderSelect }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({ name: '', description: '', parentFolderId: null });
  const [currentFolder, setCurrentFolder] = useState(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState(null);

  useEffect(() => {
    loadFolders();
  }, [weddingId]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/folders/wedding/${weddingId}`);
      setFolders(response.data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  // Build nested folder tree structure
  const buildFolderTree = (folders) => {
    const folderMap = {};
    const rootFolders = [];

    // Create a map of all folders
    folders.forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] };
    });

    // Build the tree structure
    folders.forEach(folder => {
      if (folder.parent_folder_id && folderMap[folder.parent_folder_id]) {
        folderMap[folder.parent_folder_id].children.push(folderMap[folder.id]);
      } else {
        rootFolders.push(folderMap[folder.id]);
      }
    });

    return rootFolders;
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/folders/create', {
        wedding_id: weddingId,
        name: formData.name,
        parent_folder_id: formData.parentFolderId,
        description: formData.description
      });

      toast.success('Folder created successfully!');
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', parentFolderId: null });
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/api/folders/${currentFolder.id}`, {
        name: formData.name,
        description: formData.description
      });

      toast.success('Folder updated successfully!');
      setShowEditDialog(false);
      setCurrentFolder(null);
      setFormData({ name: '', description: '', parentFolderId: null });
      loadFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to update folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    const hasContent = folder.media_count > 0 || folder.subfolder_count > 0;
    const confirmMsg = hasContent
      ? `Are you sure you want to delete "${folder.name}"? All content will be moved to ${folder.parent_folder_id ? 'its parent folder' : 'root'}.`
      : `Are you sure you want to delete "${folder.name}"?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/folders/${folder.id}`);
      toast.success('Folder deleted successfully');
      loadFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveFolder = async () => {
    if (!currentFolder) return;

    try {
      setLoading(true);
      await api.post('/api/folders/move', {
        folder_id: currentFolder.id,
        new_parent_id: moveTargetFolder
      });

      toast.success('Folder moved successfully!');
      setShowMoveDialog(false);
      setCurrentFolder(null);
      setMoveTargetFolder(null);
      loadFolders();
    } catch (error) {
      console.error('Error moving folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to move folder');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = (parentFolderId = null) => {
    setFormData({ name: '', description: '', parentFolderId });
    setShowCreateDialog(true);
  };

  const openEditDialog = (folder) => {
    setCurrentFolder(folder);
    setFormData({ 
      name: folder.name, 
      description: folder.description || '',
      parentFolderId: folder.parent_folder_id 
    });
    setShowEditDialog(true);
  };

  const openMoveDialog = (folder) => {
    setCurrentFolder(folder);
    setMoveTargetFolder(null);
    setShowMoveDialog(true);
  };

  // Render folder tree recursively
  const renderFolderTree = (folderNodes, depth = 0) => {
    return folderNodes.map((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = folder.children && folder.children.length > 0;

      return (
        <div key={folder.id}>
          <div
            className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors group ${
              selectedFolder === folder.id ? 'bg-blue-50 border-2 border-blue-300' : 'border-2 border-transparent'
            }`}
            style={{ paddingLeft: `${depth * 24 + 12}px` }}
          >
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}

              <button
                onClick={() => {
                  setSelectedFolder(folder.id);
                  onFolderSelect && onFolderSelect(folder.id);
                }}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {isExpanded ? (
                  <FolderOpen className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Folder className="w-5 h-5 text-blue-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{folder.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {folder.media_count}
                    </span>
                    {folder.subfolder_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {folder.subfolder_count}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(folder.folder_size)}
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openCreateDialog(folder.id)}
                  title="Create subfolder"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openMoveDialog(folder)}
                  title="Move folder"
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(folder)}
                  title="Edit folder"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteFolder(folder)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete folder"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {isExpanded && hasChildren && (
            <div className="mt-1">
              {renderFolderTree(folder.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Render folder options for move dialog (exclude current folder and its descendants)
  const renderMoveOptions = (folderNodes, depth = 0, excludeId = null) => {
    return folderNodes
      .filter(f => f.id !== excludeId)
      .map((folder) => {
        const isDescendant = currentFolder && isDescendantOf(folder.id, currentFolder.id);
        if (isDescendant) return null;

        return (
          <React.Fragment key={folder.id}>
            <button
              onClick={() => setMoveTargetFolder(folder.id)}
              className={`w-full text-left p-2 rounded hover:bg-gray-100 flex items-center gap-2 ${
                moveTargetFolder === folder.id ? 'bg-blue-50 border-2 border-blue-300' : ''
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <Folder className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{folder.name}</span>
            </button>
            {folder.children && folder.children.length > 0 && renderMoveOptions(folder.children, depth + 1, excludeId)}
          </React.Fragment>
        );
      });
  };

  const isDescendantOf = (folderId, ancestorId) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder || !folder.parent_folder_id) return false;
    if (folder.parent_folder_id === ancestorId) return true;
    return isDescendantOf(folder.parent_folder_id, ancestorId);
  };

  const folderTree = buildFolderTree(folders);
  const totalMedia = folders.reduce((sum, f) => sum + f.media_count, 0);
  const totalSize = folders.reduce((sum, f) => sum + f.folder_size, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Media Folders
            </CardTitle>
            <CardDescription className="mt-1">
              Organize your wedding media into nested folders
            </CardDescription>
            {folders.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <span>{folders.length} folders</span>
                <span>{totalMedia} items</span>
                <span>{formatFileSize(totalSize)} total</span>
              </div>
            )}
          </div>
          <Button
            onClick={() => openCreateDialog()}
            disabled={loading}
            size="sm"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && folders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Loading folders...</p>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No folders yet</p>
            <p className="text-xs mt-1">Create folders to organize your media</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* All Media Option */}
            <button
              onClick={() => {
                setSelectedFolder(null);
                onFolderSelect && onFolderSelect(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                selectedFolder === null 
                  ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300' 
                  : 'bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">All Media</p>
                  <p className="text-xs text-gray-600">View all photos and videos</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Folder Tree */}
            <div className="mt-2 border-t pt-2">
              {renderFolderTree(folderTree)}
            </div>
          </div>
        )}

        {/* Create Folder Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                {formData.parentFolderId 
                  ? 'Create a subfolder inside the selected folder'
                  : 'Create a new root folder to organize media'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Folder Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ceremony, Reception, Portraits"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description for this folder..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setFormData({ name: '', description: '', parentFolderId: null });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={loading}>
                {loading ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Folder Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
              <DialogDescription>
                Update folder name and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Folder Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Folder name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setCurrentFolder(null);
                  setFormData({ name: '', description: '', parentFolderId: null });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateFolder} disabled={loading}>
                {loading ? 'Updating...' : 'Update Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Move Folder Dialog */}
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Folder</DialogTitle>
              <DialogDescription>
                Select a new parent folder or choose root to move "{currentFolder?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* Root option */}
              <button
                onClick={() => setMoveTargetFolder(null)}
                className={`w-full text-left p-2 rounded hover:bg-gray-100 flex items-center gap-2 ${
                  moveTargetFolder === null ? 'bg-blue-50 border-2 border-blue-300' : ''
                }`}
              >
                <FolderOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Root (No Parent)</span>
              </button>

              {/* Folder options */}
              {renderMoveOptions(folderTree, 0, currentFolder?.id)}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveDialog(false);
                  setCurrentFolder(null);
                  setMoveTargetFolder(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleMoveFolder} disabled={loading || moveTargetFolder === currentFolder?.parent_folder_id}>
                {loading ? 'Moving...' : 'Move Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
