'use client';
import React, { useState, useEffect } from 'react';
import { FolderPlus, Folder, Edit2, Trash2, Image, Video, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function FolderManager({ weddingId, onFolderSelect }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

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

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/folders/create', {
        wedding_id: weddingId,
        name: formData.name,
        description: formData.description
      });

      if (response.data) {
        toast.success('Folder created successfully!');
        setShowCreateDialog(false);
        setFormData({ name: '', description: '' });
        loadFolders();
      }
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
      const response = await api.put(`/api/folders/${currentFolder.id}`, {
        name: formData.name,
        description: formData.description
      });

      if (response.data) {
        toast.success('Folder updated successfully!');
        setShowEditDialog(false);
        setCurrentFolder(null);
        setFormData({ name: '', description: '' });
        loadFolders();
      }
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to update folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder? Media will be moved to root.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/folders/${folderId}`);
      toast.success('Folder deleted successfully');
      loadFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (folder) => {
    setCurrentFolder(folder);
    setFormData({ name: folder.name, description: folder.description || '' });
    setShowEditDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Media Folders
            </CardTitle>
            <CardDescription>
              Organize your wedding photos and videos into albums
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
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
            <p className="text-sm">No folders yet</p>
            <p className="text-xs">Create folders to organize your media</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* All Media Option */}
            <button
              onClick={() => onFolderSelect && onFolderSelect(null)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-all border-2 border-pink-200"
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

            {/* Folder List */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <button
                  onClick={() => onFolderSelect && onFolderSelect(folder.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{folder.name}</p>
                    {folder.description && (
                      <p className="text-xs text-gray-600">{folder.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {folder.media_count || 0} items
                      </Badge>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(folder)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Folder Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Organize your wedding media into albums
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
                  setFormData({ name: '', description: '' });
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
                  setFormData({ name: '', description: '' });
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
      </CardContent>
    </Card>
  );
}
