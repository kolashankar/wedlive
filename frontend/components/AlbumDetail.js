'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Save, Loader2, Music, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import MediaSelector from './MediaSelector';
import SlideshowPlayer from './SlideshowPlayer';
import SlideSidebar from './SlideSidebar';
import AnimationRibbon from './AnimationRibbon';
import { imaginationTransitions } from '@/lib/slideshowAnimations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

export default function AlbumDetail({ albumId, onBack }) {
    const [album, setAlbum] = useState(null);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Editor State
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
    const [showFullPreview, setShowFullPreview] = useState(false);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    
    // Music Selection State
    const [isMusicLibraryOpen, setIsMusicLibraryOpen] = useState(false);
    const [musicLibrary, setMusicLibrary] = useState([]);

    useEffect(() => {
        if (albumId) {
            fetchAlbumDetails();
        }
    }, [albumId]);

    const fetchAlbumDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/albums/detail/${albumId}`);
            setAlbum(response.data);
            setSlides(response.data.slides || []);
        } catch (error) {
            console.error('Error fetching album details:', error);
            toast.error('Failed to load album details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/api/albums/${albumId}`, {
                slides: slides,
                music_url: album.music_url
            });
            toast.success('Album saved successfully');
        } catch (error) {
            toast.error('Failed to save album');
        } finally {
            setSaving(false);
        }
    };

    const handleAddPhotos = (selectedMedia) => {
        const newSlides = selectedMedia.map((media, index) => ({
            media_id: media.id,
            media_url: media.cdn_url || media.file_url || media.url,
            order: slides.length + index,
            duration: 5.0,
            transition: 'fade',
            transition_duration: 1.0,
            animation: 'none'
        }));
        setSlides([...slides, ...newSlides]);
        setIsMediaSelectorOpen(false);
    };

    const handleDeleteSlide = (index) => {
        const newSlides = [...slides];
        newSlides.splice(index, 1);
        setSlides(newSlides);
        if (selectedSlideIndex >= newSlides.length) {
            setSelectedSlideIndex(Math.max(0, newSlides.length - 1));
        }
    };

    const handleUpdateSlide = (field, value) => {
        if (selectedSlideIndex < 0 || selectedSlideIndex >= slides.length) return;
        
        const newSlides = [...slides];
        newSlides[selectedSlideIndex] = { 
            ...newSlides[selectedSlideIndex], 
            [field]: value 
        };
        setSlides(newSlides);
    };
    
    const handleApplyToAll = () => {
        if (selectedSlideIndex < 0) return;
        const sourceSlide = slides[selectedSlideIndex];
        
        if (!confirm('Apply current slide settings (Duration, Transition, Animation) to ALL slides?')) return;
        
        const newSlides = slides.map(slide => ({
            ...slide,
            duration: sourceSlide.duration,
            transition: sourceSlide.transition,
            transition_duration: sourceSlide.transition_duration,
            animation: sourceSlide.animation
        }));
        setSlides(newSlides);
        toast.success('Settings applied to all slides');
    };
    const handleApplyRandom = () => {
        if (!confirm('Randomize transitions for all slides? This will overwrite existing transitions.')) return;
        
        const newSlides = slides.map(slide => {
            const randomTrans = imaginationTransitions[Math.floor(Math.random() * imaginationTransitions.length)];
            return { 
                ...slide, 
                transition: randomTrans.value,
                // Optional: Randomize duration too? No, keep it simple.
            };
        });
        setSlides(newSlides);
        toast.success('Random transitions applied to all slides!');
    };
    
    
    const fetchMusicLibrary = async () => {
        try {
            const response = await api.get('/api/music/library');
            setMusicLibrary(response.data.music || []);
            setIsMusicLibraryOpen(true);
        } catch (error) {
            toast.error('Failed to load music library');
        }
    };
    
    const handleSelectMusic = (musicUrl) => {
        setAlbum({...album, music_url: musicUrl});
        setIsMusicLibraryOpen(false);
        toast.success('Music selected!');
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
    }

    if (!album) return <div>Album not found</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            {/* Full Screen Preview Overlay */}
            {showFullPreview && (
                <SlideshowPlayer 
                    album={{...album, slides: slides}} 
                    onClose={() => setShowFullPreview(false)} 
                />
            )}

            {/* Header / Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-sm font-bold">{album.title}</h2>
                        <p className="text-xs text-gray-500">{slides.length} photos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFullPreview(true)}>
                        <Play className="w-3 h-3 mr-2" />
                        Full Preview
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        <Save className="w-3 h-3 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            {/* Excel-style Animation Ribbon */}
            <div className="shrink-0">
                <AnimationRibbon 
                    selectedSlide={slides[selectedSlideIndex]}
                    onUpdateSlide={handleUpdateSlide}
                    onApplyToAll={handleApplyToAll}
                    musicUrl={album.music_url}
                    onSelectMusic={fetchMusicLibrary}
                />
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Media List */}
                <SlideSidebar 
                    slides={slides}
                    selectedIndex={selectedSlideIndex}
                    onSelect={setSelectedSlideIndex}
                    onAddPhotos={() => setIsMediaSelectorOpen(true)}
                    onDeleteSlide={handleDeleteSlide}
                />

                {/* Center Canvas - Live Preview */}
                <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    {/* Checkerboard background for transparency reference */}
                    <div className="absolute inset-0 opacity-10" 
                        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                    />
                    
                    {/* Embedded Slideshow Player */}
                    {slides.length > 0 ? (
                        <div className="w-full h-full relative">
                            <SlideshowPlayer 
                                album={{...album, slides: slides}}
                                autoPlay={false} // Editor mode is manual
                                embedded={true}
                                controlledIndex={selectedSlideIndex}
                                onIndexChange={setSelectedSlideIndex} // Allow player nav to update selection
                                showControls={true} // Show controls for manual nav inside canvas
                            />
                        </div>
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                            <p>No photos added yet</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsMediaSelectorOpen(true)}>
                                Add Photos
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <MediaSelector 
                isOpen={isMediaSelectorOpen}
                onClose={() => setIsMediaSelectorOpen(false)}
                weddingId={album.wedding_id}
                onSelect={handleAddPhotos}
                maxSelection={50}
                allowedTypes={['photo']}
            />
            
            <Dialog open={isMusicLibraryOpen} onOpenChange={setIsMusicLibraryOpen}>
                <DialogContent className="max-w-2xl max-h-[600px]">
                    <DialogHeader>
                        <DialogTitle>Select Music from Library</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto space-y-2 max-h-[500px]">
                        {musicLibrary.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No music available in library</p>
                        ) : (
                            musicLibrary.map((music) => (
                                <Card key={music.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectMusic(music.file_url)}>
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{music.title || 'Untitled'}</p>
                                            <p className="text-xs text-gray-500">
                                                {music.duration ? `${Math.floor(music.duration / 60)}:${String(Math.floor(music.duration % 60)).padStart(2, '0')}` : 'Unknown duration'}
                                            </p>
                                        </div>
                                        {album.music_url === music.file_url && (
                                            <Check className="w-5 h-5 text-green-500" />
                                        )}
                                        <Music className="w-5 h-5 text-gray-400" />
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
             </Dialog>
        </div>
    );
}
