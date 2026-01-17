'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Phone, Mail, Building2, Globe, Upload, X, Plus, Edit, Trash2, Crown, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [studios, setStudios] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });
  const [studioDialogOpen, setStudioDialogOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState(null);
  const [studioForm, setStudioForm] = useState({
    name: '',
    logo_url: '',
    website: '',
    email: '',
    phone: '',
    address: ''
  });
  const [studioPhotoFile, setStudioPhotoFile] = useState(null);
  const [studioPhotoPreview, setStudioPhotoPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/profile/me');
      setProfile(response.data);
      setFormData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || ''
      });
      setStudios(response.data.studios || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/profile/update', formData);
      toast.success('Profile updated successfully!');
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Avatar updated successfully!');
      loadProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreateOrUpdateStudio = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let studioId = editingStudio?.id;
      
      // First, create or update the studio
      if (editingStudio) {
        await api.put(`/api/profile/studios/${editingStudio.id}`, studioForm);
        toast.success('Studio updated successfully!');
      } else {
        const response = await api.post('/api/profile/studios', studioForm);
        studioId = response.data.id;
        toast.success('Studio created successfully!');
      }
      
      // Then, if there's a photo to upload, upload it
      if (studioPhotoFile && studioId) {
        const formData = new FormData();
        formData.append('file', studioPhotoFile);
        
        try {
          await api.post(`/api/profile/studios/${studioId}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success('Studio photo uploaded!');
        } catch (uploadError) {
          console.error('Error uploading studio photo:', uploadError);
          toast.error('Studio saved but photo upload failed');
        }
      }
      
      setStudioDialogOpen(false);
      setEditingStudio(null);
      setStudioForm({ name: '', logo_url: '', website: '', email: '', phone: '', address: '' });
      setStudioPhotoFile(null);
      setStudioPhotoPreview(null);
      loadProfile();
    } catch (error) {
      console.error('Error saving studio:', error);
      if (error.response?.status === 403) {
        toast.error('Studio management is only available for Premium users');
      } else {
        toast.error('Failed to save studio');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudio = async (studioId) => {
    if (!confirm('Are you sure you want to delete this studio?')) return;

    try {
      await api.delete(`/api/profile/studios/${studioId}`);
      toast.success('Studio deleted successfully!');
      loadProfile();
    } catch (error) {
      console.error('Error deleting studio:', error);
      toast.error('Failed to delete studio');
    }
  };

  const handleUploadStudioLogo = async (studioId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/api/profile/studios/${studioId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Logo uploaded successfully!');
      loadProfile();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const openStudioDialog = (studio = null) => {
    if (studio) {
      setEditingStudio(studio);
      setStudioForm({
        name: studio.name,
        logo_url: studio.logo_url || '',
        website: studio.website || '',
        email: studio.email || '',
        phone: studio.phone || '',
        address: studio.address || ''
      });
      setStudioPhotoPreview(studio.logo_url || null);
    } else {
      setEditingStudio(null);
      setStudioForm({ name: '', logo_url: '', website: '', email: '', phone: '', address: '' });
      setStudioPhotoPreview(null);
    }
    setStudioPhotoFile(null);
    setStudioDialogOpen(true);
  };
  
  const handleStudioPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setStudioPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setStudioPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and studio details</p>
        </div>

        {/* Plan Summary Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <p className="text-2xl font-bold capitalize">
                    {profile?.subscription_plan || 'free'}
                  </p>
                </div>
              </div>
              {profile?.subscription_plan === 'free' && (
                <Link href="/pricing">
                  <Button className="bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                    Upgrade to Premium
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your profile photo and personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 ring-4 ring-offset-2 ring-rose-500/20">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-white text-2xl">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>

              <Separator />

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={profile?.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Studio/Business Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Studio Partners
                  {profile?.subscription_plan === 'free' && (
                    <Badge variant="secondary" className="ml-2">Premium</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Manage your studio branding for wedding themes
                </CardDescription>
              </div>
              <Button
                onClick={() => openStudioDialog()}
                size="sm"
                className="bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                disabled={profile?.subscription_plan === 'free'}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Studio
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No studios added yet</p>
                {profile?.subscription_plan === 'free' && (
                  <p className="text-sm mt-2">
                    Upgrade to Premium to add studio partners
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {studios.map((studio) => (
                  <Card key={studio.id} className="bg-gray-50">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {studio.logo_url ? (
                            <img
                              src={studio.logo_url}
                              alt={studio.name}
                              className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                              {studio.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{studio.name}</h3>
                            {studio.website && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Globe className="w-3 h-3" />
                                <a href={studio.website} target="_blank" rel="noopener noreferrer" className="hover:text-rose-600">
                                  {studio.website}
                                </a>
                              </div>
                            )}
                            {studio.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Mail className="w-3 h-3" />
                                <span>{studio.email}</span>
                              </div>
                            )}
                            {studio.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Phone className="w-3 h-3" />
                                <span>{studio.phone}</span>
                              </div>
                            )}
                            {studio.address && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{studio.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStudioDialog(studio)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteStudio(studio.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Studio Dialog */}
      <Dialog open={studioDialogOpen} onOpenChange={setStudioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStudio ? 'Edit Studio' : 'Add New Studio'}</DialogTitle>
            <DialogDescription>
              Add your studio branding to display on wedding themes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateStudio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studio_name">Studio Name *</Label>
              <Input
                id="studio_name"
                value={studioForm.name}
                onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value })}
                placeholder="e.g., DreamWeddings Studio"
                required
              />
            </div>
            
            {/* Studio Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="studio_photo">Studio Photo</Label>
              <div className="flex items-center gap-4">
                {studioPhotoPreview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img src={studioPhotoPreview} alt="Studio preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Label
                    htmlFor="studio_photo_upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {studioPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                  </Label>
                  <input
                    id="studio_photo_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleStudioPhotoSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studio_website">Website URL</Label>
              <Input
                id="studio_website"
                value={studioForm.website}
                onChange={(e) => setStudioForm({ ...studioForm, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studio_email">Studio Email</Label>
              <Input
                id="studio_email"
                value={studioForm.email}
                onChange={(e) => setStudioForm({ ...studioForm, email: e.target.value })}
                placeholder="studio@example.com"
                type="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studio_phone">Studio Phone</Label>
              <Input
                id="studio_phone"
                value={studioForm.phone}
                onChange={(e) => setStudioForm({ ...studioForm, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studio_address">Studio Address</Label>
              <Input
                id="studio_address"
                value={studioForm.address}
                onChange={(e) => setStudioForm({ ...studioForm, address: e.target.value })}
                placeholder="123 Main Street, City, State"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStudioDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-rose-500 to-purple-600 text-white"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  editingStudio ? 'Update Studio' : 'Create Studio'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
