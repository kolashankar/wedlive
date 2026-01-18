'use client';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Shuffle, Repeat, Clock, Volume1
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function StreamViewMusicPlayer({ weddingId }) {
  const [loading, setLoading] = useState(true);
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [soundEffects, setSoundEffects] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [masterVolume, setMasterVolume] = useState(85);
  const [effectsVolume, setEffectsVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    loadMusicData();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (volume / 100) * (masterVolume / 100);
    }
  }, [volume, masterVolume]);

  const loadMusicData = async () => {
    try {
      setLoading(true);
      // Load all music categories
      const [backgroundRes, effectsRes, transitionsRes, emotionsRes] = await Promise.all([
        api.get('/api/admin/music/library?category=background_music&limit=100'),
        api.get('/api/admin/music/library?category=sound_effect&limit=100'),
        api.get('/api/admin/music/library?category=transition&limit=100'),
        api.get('/api/admin/music/library?category=emotion&limit=100')
      ]);

      setMusicLibrary(backgroundRes.data);
      setSoundEffects(effectsRes.data);
      setTransitions(transitionsRes.data);
      setEmotions(emotionsRes.data);

      // Load wedding playlist
      try {
        const playlistRes = await api.get(`/api/weddings/${weddingId}/music/playlist`);
        setPlaylist(playlistRes.data.music_playlist || []);
      } catch (error) {
        // Playlist might not exist yet
        console.log('No playlist found for wedding');
      }
    } catch (error) {
      console.error('Failed to load music data:', error);
      toast.error('Failed to load music library');
    } finally {
      setLoading(false);
    }
  };

  const playTrack = (track) => {
    if (audioRef.current) {
      audioRef.current.src = track.file_url;
      audioRef.current.play();
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const currentIndex = musicLibrary.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex < musicLibrary.length - 1) {
      playTrack(musicLibrary[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = musicLibrary.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(musicLibrary[currentIndex - 1]);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const playEffect = (effect) => {
    // Create a temporary audio element for effects
    const effectAudio = new Audio(effect.file_url);
    effectAudio.volume = (effectsVolume / 100) * (masterVolume / 100);
    effectAudio.play();
    toast.success(`Playing: ${effect.title}`);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Music & Audio Control
        </CardTitle>
        <CardDescription>
          Control background music and sound effects for your stream
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Controls */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Master Audio</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Volume1 className="w-4 h-4 text-gray-500" />
              <Slider
                value={[masterVolume]}
                onValueChange={(value) => setMasterVolume(value[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{masterVolume}%</span>
            </div>
          </div>
        </div>

        {/* Background Music Player */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Background Music</h3>
            <Badge variant="outline">{musicLibrary.length} tracks</Badge>
          </div>

          {currentTrack ? (
            <div className="space-y-3">
              {/* Now Playing */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{currentTrack.title}</p>
                <p className="text-sm text-gray-500">{currentTrack.artist || 'Unknown Artist'}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration || 100}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShuffle(!shuffle)}
                  className={shuffle ? 'bg-rose-100' : ''}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrevious}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={togglePlay} className="bg-rose-500 hover:bg-rose-600">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleNext}>
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRepeat(!repeat)}
                  className={repeat ? 'bg-rose-100' : ''}
                >
                  <Repeat className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{volume}%</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No track playing</p>
            </div>
          )}

          {/* Track List */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Available Tracks</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {musicLibrary.slice(0, 10).map(track => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${
                    currentTrack?.id === track.id ? 'bg-rose-50 border border-rose-200' : ''
                  }`}
                >
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-gray-500 truncate">{track.artist || 'Unknown'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Effects Panel */}
        <Tabs defaultValue="effects" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="transitions">Transitions</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
          </TabsList>

          <TabsContent value="effects" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sound Effects</span>
              <div className="flex items-center gap-2">
                <Volume1 className="w-3 h-3 text-gray-500" />
                <Slider
                  value={[effectsVolume]}
                  onValueChange={(value) => setEffectsVolume(value[0])}
                  max={100}
                  step={1}
                  className="w-24"
                />
                <span className="text-xs w-8">{effectsVolume}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {soundEffects.slice(0, 8).map(effect => (
                <Button
                  key={effect.id}
                  variant="outline"
                  size="sm"
                  onClick={() => playEffect(effect)}
                  className="justify-start"
                >
                  <Play className="w-3 h-3 mr-2" />
                  {effect.title}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transitions" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {transitions.slice(0, 8).map(effect => (
                <Button
                  key={effect.id}
                  variant="outline"
                  size="sm"
                  onClick={() => playEffect(effect)}
                  className="justify-start"
                >
                  <Play className="w-3 h-3 mr-2" />
                  {effect.title}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="emotions" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {emotions.slice(0, 8).map(effect => (
                <Button
                  key={effect.id}
                  variant="outline"
                  size="sm"
                  onClick={() => playEffect(effect)}
                  className="justify-start"
                >
                  <Play className="w-3 h-3 mr-2" />
                  {effect.title}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            if (repeat) {
              audioRef.current.play();
              setIsPlaying(true);
            } else {
              handleNext();
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
