'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Music,
  Upload,
  Search,
  Play,
  Pause,
  Trash2,
  FolderOpen,
  Plus,
  AlertCircle,
  Loader2,
  Volume2,
  Clock,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import CreatorMusicUpload from '@/components/CreatorMusicUpload';
import AudioPlayer from '@/components/AudioPlayer';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function CreatorMusicLibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-music');
  const [myMusic, setMyMusic] = useState([]);
  const [publicLibrary, setPublicLibrary] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('background_music');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadMusicData();
      loadStorageInfo();
    }
  }, [user, authLoading, router, activeTab, selectedCategory]);

  const loadMusicData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'my-music') {
        const response = await api.get('/api/music/my-library');
        setMyMusic(response.data);
      } else {
        const response = await api.get(`/api/music/library?category=${selectedCategory}`);
        setPublicLibrary(response.data);
      }
    } catch (error) {
      console.error('Failed to load music:', error);
      toast.error('Failed to load music library');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await api.get('/api/music/storage');
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    loadMusicData();
    loadStorageInfo();
    toast.success('Music uploaded successfully!');
  };

  const handleDeleteMusic = async (musicId) => {
    if (!confirm('Are you sure you want to delete this music?')) return;

    try {
      await api.delete(`/api/music/${musicId}`);
      toast.success('Music deleted successfully');
      loadMusicData();
      loadStorageInfo();
    } catch (error) {
      console.error('Failed to delete music:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete music');
    }
  };

  const handlePlayTrack = (track) => {
    if (playingTrack?.id === track.id) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(track);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const filteredMyMusic = myMusic.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (track.artist && track.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPublicLibrary = publicLibrary.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (track.artist && track.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = [
    { value: 'background_music', label: 'Background Music', icon: '🎵' },
    { value: 'sound_effect', label: 'Sound Effects', icon: '🔊' },
    { value: 'transition', label: 'Transitions', icon: '⚡' },
    { value: 'emotion', label: 'Emotions', icon: '💖' },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading music library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Music className="w-5 h-5" />
                </Button>
                <Music className="w-8 h-8 text-rose-500" />
                <h1 className="text-2xl font-bold text-gray-900">Music Library</h1>
              </div>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Storage Info */}
          {storageInfo && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold">Storage Usage</h3>
                  </div>
                  <Badge variant={storageInfo.percentage > 80 ? "destructive" : "secondary"}>
                    {storageInfo.percentage}% Used
                  </Badge>
                </div>
                <Progress value={storageInfo.percentage} className="h-2 mb-2" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{storageInfo.storage_used_formatted} used</span>
                  <span>{storageInfo.storage_limit_formatted} total</span>
                </div>
                {storageInfo.percentage > 80 && (
                  <div className="mt-3 flex items-start space-x-2 text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Storage is almost full. Consider deleting unused files or upgrading to premium.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-music">My Music</TabsTrigger>
              <TabsTrigger value="public-library">Public Library</TabsTrigger>
            </TabsList>

            {/* My Music Tab */}
            <TabsContent value="my-music" className="space-y-6">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search your music..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => setUploadModalOpen(true)}
                  className="ml-4 bg-rose-500 hover:bg-rose-600"
                  disabled={storageInfo && storageInfo.percentage >= 100}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Music
                </Button>
              </div>

              {/* Music List */}
              <Card>
                <CardHeader>
                  <CardTitle>My Music Collection</CardTitle>
                  <CardDescription>
                    {filteredMyMusic.length} track{filteredMyMusic.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredMyMusic.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No music yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Upload your first music track to get started
                      </p>
                      <Button
                        onClick={() => setUploadModalOpen(true)}
                        className="bg-rose-500 hover:bg-rose-600"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Music
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMyMusic.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:border-rose-300 hover:bg-rose-50/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePlayTrack(track)}
                              className="flex-shrink-0"
                            >
                              {playingTrack?.id === track.id ? (
                                <Pause className="w-5 h-5 text-rose-500" />
                              ) : (
                                <Play className="w-5 h-5 text-gray-600" />
                              )}
                            </Button>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {track.title}
                              </h4>
                              {track.artist && (
                                <p className="text-sm text-gray-500 truncate">
                                  {track.artist}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(track.duration)}</span>
                            </div>
                            <span>{formatBytes(track.file_size)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMusic(track.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
            </TabsContent>

            {/* Public Library Tab */}
            <TabsContent value="public-library" className="space-y-6">
              {/* Category Filters */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={selectedCategory === cat.value ? "bg-rose-500 hover:bg-rose-600" : ""}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search public library..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Public Music List */}
              <Card>
                <CardHeader>
                  <CardTitle>Public Music Library</CardTitle>
                  <CardDescription>
                    {filteredPublicLibrary.length} track{filteredPublicLibrary.length !== 1 ? 's' : ''} available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredPublicLibrary.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No music found in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPublicLibrary.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:border-rose-300 hover:bg-rose-50/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePlayTrack(track)}
                              className="flex-shrink-0"
                            >
                              {playingTrack?.id === track.id ? (
                                <Pause className="w-5 h-5 text-rose-500" />
                              ) : (
                                <Play className="w-5 h-5 text-gray-600" />
                              )}
                            </Button>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {track.title}
                              </h4>
                              {track.artist && (
                                <p className="text-sm text-gray-500 truncate">
                                  {track.artist}
                                </p>
                              )}
                              {track.folder_name && (
                                <p className="text-xs text-gray-400">
                                  📁 {track.folder_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(track.duration)}</span>
                            </div>
                            <Badge variant="secondary">{track.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upload Modal */}
      <CreatorMusicUpload
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        storageInfo={storageInfo}
      />

      {/* Audio Player */}
      {playingTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <AudioPlayer
              track={playingTrack}
              onClose={() => setPlayingTrack(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
