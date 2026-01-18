'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Music, Upload, Folder, Search, Play, Pause, Trash2, Edit, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import AudioUploadModal from '@/components/admin/AudioUploadModal';
import FolderTreeView from '@/components/admin/FolderTreeView';
import AudioPreviewPlayer from '@/components/admin/AudioPreviewPlayer';

export default function AdminMusicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('background_music');
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [previewingTrack, setPreviewingTrack] = useState(null);

  useEffect(() => {
    checkAdminAccess();
    loadMusicData();
  }, [activeCategory]);

  const checkAdminAccess = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadMusicData = async () => {
    try {
      setLoading(true);
      const [musicRes, foldersRes] = await Promise.all([
        api.get(`/api/admin/music/library?category=${activeCategory}&limit=100`),
        api.get(`/api/admin/music/folders?category=${activeCategory}`)
      ]);
      setMusicLibrary(musicRes.data);
      setFolders(foldersRes.data);
    } catch (error) {
      console.error('Failed to load music data:', error);
      toast.error('Failed to load music library');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      await api.post('/api/admin/music/folders', {
        name: newFolderName,
        description: newFolderDescription,
        category: activeCategory,
        parent_folder_id: selectedFolder,
        icon: '🎵'
      });
      toast.success('Folder created successfully');
      setNewFolderName('');
      setNewFolderDescription('');
      setCreateFolderModalOpen(false);
      loadMusicData();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to create folder');
    }
  };

  const handleDeleteMusic = async (musicId) => {
    if (!confirm('Are you sure you want to delete this audio file?')) return;

    try {
      await api.delete(`/api/admin/music/library/${musicId}`);
      toast.success('Audio file deleted successfully');
      loadMusicData();
    } catch (error) {
      console.error('Failed to delete music:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete audio file');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder? It must be empty.')) return;

    try {
      await api.delete(`/api/admin/music/folders/${folderId}`);
      toast.success('Folder deleted successfully');
      loadMusicData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete folder');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      background_music: 'Background Music',
      sound_effect: 'Sound Effects',
      transition: 'Transition Sounds',
      emotion: 'Emotion Sounds'
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      background_music: '🎵',
      sound_effect: '🎭',
      transition: '⚡',
      emotion: '💖'
    };
    return icons[category] || '🎵';
  };

  const filteredMusic = musicLibrary.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.artist?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = !selectedFolder || item.folder_id === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Music Library Management</h1>
                <p className="text-sm text-gray-500">Manage audio assets for weddings</p>
              </div>
            </div>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-purple-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Audio
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="background_music" className="gap-2">
              <span>{getCategoryIcon('background_music')}</span>
              Background Music
            </TabsTrigger>
            <TabsTrigger value="sound_effect" className="gap-2">
              <span>{getCategoryIcon('sound_effect')}</span>
              Sound Effects
            </TabsTrigger>
            <TabsTrigger value="transition" className="gap-2">
              <span>{getCategoryIcon('transition')}</span>
              Transitions
            </TabsTrigger>
            <TabsTrigger value="emotion" className="gap-2">
              <span>{getCategoryIcon('emotion')}</span>
              Emotions
            </TabsTrigger>
          </TabsList>

          {/* Content for each category */}
          {['background_music', 'sound_effect', 'transition', 'emotion'].map(category => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Folders */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Folders</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCreateFolderModalOpen(true)}
                        >
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FolderTreeView
                        folders={folders}
                        selectedFolder={selectedFolder}
                        onSelectFolder={setSelectedFolder}
                        onDeleteFolder={handleDeleteFolder}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content - Music Library */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Search Bar */}
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search by title or artist..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Music Grid */}
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {getCategoryLabel(category)} Library
                        <Badge className="ml-2">{filteredMusic.length} files</Badge>
                      </CardTitle>
                      <CardDescription>
                        {selectedFolder 
                          ? `Files in ${folders.find(f => f.id === selectedFolder)?.name || 'folder'}`
                          : 'All files in this category'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500">Loading...</p>
                        </div>
                      ) : filteredMusic.length === 0 ? (
                        <div className="text-center py-12">
                          <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No audio files found</p>
                          <Button
                            onClick={() => setUploadModalOpen(true)}
                            className="mt-4"
                            variant="outline"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload First File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredMusic.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPreviewingTrack(item)}
                                  className="shrink-0"
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.title}</p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {item.artist || 'Unknown Artist'}
                                  </p>
                                  {item.folder_name && (
                                    <Badge variant="outline" className="mt-1">
                                      <Folder className="w-3 h-3 mr-1" />
                                      {item.folder_name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-medium">{formatDuration(item.duration)}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(item.file_size)}</p>
                                  <p className="text-xs text-gray-400">{item.format.toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteMusic(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modals */}
      <AudioUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        category={activeCategory}
        folders={folders}
        onUploadSuccess={() => {
          loadMusicData();
          setUploadModalOpen(false);
        }}
      />

      {/* Create Folder Modal */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Folder</CardTitle>
              <CardDescription>
                Create a folder to organize your {getCategoryLabel(activeCategory).toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Folder Name</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Wedding Classics"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="e.g., Classic wedding ceremony music"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateFolderModalOpen(false);
                    setNewFolderName('');
                    setNewFolderDescription('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>
                  Create Folder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audio Preview Player */}
      {previewingTrack && (
        <AudioPreviewPlayer
          track={previewingTrack}
          onClose={() => setPreviewingTrack(null)}
        />
      )}
    </div>
  );
}
