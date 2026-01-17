'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Image as ImageIcon, Play } from 'lucide-react';
import SlideshowPlayer from './SlideshowPlayer';

export default function AlbumManager({ weddingId }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [previewAlbum, setPreviewAlbum] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  useEffect(() => {
    if (weddingId) {
        fetchAlbums();
    }
  }, [weddingId]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/albums/${weddingId}`);
      setAlbums(response.data);
    } catch (error) {
      console.error('Error fetching albums:', error);
      toast.error('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    
    try {
      await api.post('/api/albums/', {
        wedding_id: weddingId,
        title: newAlbumTitle,
      });
      toast.success('Album created successfully');
      setNewAlbumTitle('');
      setIsCreateDialogOpen(false);
      fetchAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
      toast.error('Failed to create album');
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    
    try {
      await api.delete(`/api/albums/${albumId}`);
      toast.success('Album deleted');
      fetchAlbums();
    } catch (error) {
      toast.error('Failed to delete album');
    }
  };

  if (selectedAlbum) {
    return (
      <AlbumDetail 
        albumId={selectedAlbum.id} 
        onBack={() => {
            setSelectedAlbum(null);
            fetchAlbums();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
        {previewAlbum && (
            <SlideshowPlayer 
                album={previewAlbum} 
                onClose={() => setPreviewAlbum(null)} 
            />
        )}
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold">Photo Albums</h3>
                <p className="text-sm text-gray-500">Create albums to organize photos and create slideshows</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Album
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Album</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Album Title</Label>
                            <Input 
                                value={newAlbumTitle}
                                onChange={(e) => setNewAlbumTitle(e.target.value)}
                                placeholder="e.g., Reception Highlights"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAlbum} disabled={!newAlbumTitle.trim()}>Create Album</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        {loading ? (
            <div className="text-center py-12">Loading albums...</div>
        ) : albums.length === 0 ? (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No albums yet</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                        Create your first album to start organizing photos and building slideshows.
                    </p>
                    <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Album
                    </Button>
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                    <Card key={album.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 relative">
                            {album.cover_photo_url ? (
                                <img src={album.cover_photo_url} alt={album.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button variant="secondary" size="sm" onClick={() => setSelectedAlbum(album)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Manage Photos
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold truncate">{album.title}</h4>
                                    <p className="text-sm text-gray-500">{album.slides?.length || 0} photos</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => handleDeleteAlbum(album.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}
