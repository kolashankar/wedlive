'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Save, Loader2, Music, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import MediaSelector from './MediaSelector';
import SlideshowPlayer from './SlideshowPlayer';
import TransitionSelector from './TransitionSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AlbumDetail({ albumId, onBack }) {
    const [album, setAlbum] = useState(null);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    // Global Settings State
    const [globalDuration, setGlobalDuration] = useState(5.0);
    const [globalTransition, setGlobalTransition] = useState('fade');
    const [globalAnimation, setGlobalAnimation] = useState('none');

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
            media_url: media.cdn_url || media.file_url || media.url, // Ensure URL is available for preview
            order: slides.length + index,
            duration: globalDuration,
            transition: globalTransition,
            transition_duration: 1.0,
            animation: globalAnimation
        }));
        setSlides([...slides, ...newSlides]);
        setIsMediaSelectorOpen(false);
    };

    const removeSlide = (index) => {
        const newSlides = [...slides];
        newSlides.splice(index, 1);
        setSlides(newSlides);
    };

    const updateSlide = (index, field, value) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setSlides(newSlides);
    };
    
    const applyGlobalSettings = () => {
        if (!confirm('This will apply settings to ALL slides. Continue?')) return;
        const newSlides = slides.map(slide => ({
            ...slide,
            duration: globalDuration,
            transition: globalTransition,
            animation: globalAnimation
        }));
        setSlides(newSlides);
        toast.success('Settings applied to all slides');
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
    }

    if (!album) return <div>Album not found</div>;

    return (
        <div className="space-y-6">
            {showPreview && (
                <SlideshowPlayer 
                    album={{...album, slides: slides}} // Pass current state for instant preview
                    onClose={() => setShowPreview(false)} 
                />
            )}
            <div className="flex items-center justify-between sticky top-[64px] z-10 bg-white/80 backdrop-blur py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold">{album.title}</h2>
                        <p className="text-sm text-gray-500">{slides.length} photos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => setShowPreview(true)}>
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                    <Button variant="outline" onClick={() => setIsMediaSelectorOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Photos
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Global Settings Panel */}
            <Card>
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                     <div className="space-y-2 w-32">
                        <Label>Duration (s)</Label>
                        <Input type="number" value={globalDuration} onChange={e => setGlobalDuration(parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-2 w-40">
                        <Label>Transition</Label>
                        <Select value={globalTransition} onValueChange={setGlobalTransition}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="fade">Fade</SelectItem>
                                <SelectItem value="wipe_left">Wipe Left</SelectItem>
                                <SelectItem value="wipe_right">Wipe Right</SelectItem>
                                <SelectItem value="zoom_in">Zoom In</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2 w-40">
                        <Label>Animation</Label>
                        <Select value={globalAnimation} onValueChange={setGlobalAnimation}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="ken_burns">Ken Burns</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="secondary" onClick={applyGlobalSettings}>Apply to All</Button>
                    
                    <div className="flex-1"></div>
                     <div className="space-y-2 w-64">
                        <Label>Background Music URL</Label>
                        <div className="flex gap-2">
                             <Input 
                                placeholder="https://..." 
                                value={album.music_url || ''} 
                                onChange={e => setAlbum({...album, music_url: e.target.value})} 
                             />
                             <Button size="icon" variant="ghost"><Music className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Slides Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slides.map((slide, index) => (
                    <Card key={index} className="group relative overflow-hidden">
                         <div className="aspect-square bg-gray-100 relative">
                             {slide.media_url ? (
                                <img src={slide.media_url} className="w-full h-full object-cover" alt="" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                    No Preview
                                </div>
                             )}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeSlide(index)}>
                                    &times;
                                </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-white text-[10px] flex justify-between px-2">
                                <span>{index + 1}</span>
                                <span>{slide.duration}s</span>
                            </div>
                        </div>
                        <CardContent className="p-2 space-y-2">
                             <Select value={slide.transition} onValueChange={(v) => updateSlide(index, 'transition', v)}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Transition" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="fade">Fade</SelectItem>
                                    <SelectItem value="wipe_left">Wipe L</SelectItem>
                                    <SelectItem value="wipe_right">Wipe R</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <MediaSelector 
                isOpen={isMediaSelectorOpen}
                onClose={() => setIsMediaSelectorOpen(false)}
                weddingId={album.wedding_id}
                onSelect={handleAddPhotos}
                maxSelection={50}
                allowedTypes={['photo']}
            />
        </div>
    );
}
