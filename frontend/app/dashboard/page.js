'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Plus, Video, Copy, Calendar, Clock, Users, Settings, LogOut, Crown, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bride_name: '',
    groom_name: '',
    scheduled_date: '',
    location: ''
  });
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadWeddings();
    }
  }, [user, authLoading, router]);

  const loadWeddings = async () => {
    try {
      const response = await api.get('/api/weddings/my-weddings');
      setWeddings(response.data);
      
      // Load subscription info
      const subResponse = await api.get('/api/subscriptions/my-subscription');
      setSubscription(subResponse.data);
    } catch (error) {
      toast.error('Failed to load weddings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWedding = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/weddings/', {
        ...formData,
        scheduled_date: new Date(formData.scheduled_date).toISOString()
      });
      
      toast.success('✨ Wedding event created! Your RTMP credentials are ready.');
      setWeddings([response.data, ...weddings]);
      setCreateDialogOpen(false);
      setSelectedWedding(response.data);
      setFormData({
        title: '',
        description: '',
        bride_name: '',
        groom_name: '',
        scheduled_date: '',
        location: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create wedding');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
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
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-rose-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                WedLive
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/weddings">
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4 mr-2" />
                  Browse Weddings
                </Button>
              </Link>
              {user?.subscription_plan !== 'free' && (
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Premium
                  </Button>
                </Link>
              )}
              <Link href="/pricing">
                <Badge className="bg-gradient-to-r from-rose-500 to-purple-600 text-white cursor-pointer hover:opacity-90">
                  <Crown className="w-3 h-3 mr-1" />
                  {user?.subscription_plan || 'free'}
                </Badge>
              </Link>
              <span className="text-sm text-gray-700">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Weddings</h1>
          <p className="text-gray-600">Manage your wedding streams and get RTMP credentials</p>
        </div>

        {/* Subscription Banner */}
        {subscription && subscription.plan === 'free' && (
          <Alert className="mb-6 bg-gradient-to-r from-rose-50 to-purple-50 border-rose-200">
            <Crown className="w-4 h-4 text-rose-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-900">Unlock Premium Features!</span>
                <p className="text-sm text-gray-700 mt-1">
                  Get unlimited events, unlimited viewers, and unlimited storage
                </p>
              </div>
              <Link href="/pricing">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-rose-500 to-purple-600 text-white ml-4"
                  data-testid="upgrade-banner-button"
                >
                  Upgrade Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}
        
        {subscription && subscription.plan !== 'free' && (
          <Alert className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              <span className="font-semibold text-green-900">
                Premium {subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'} Plan Active
              </span>
              <p className="text-sm text-gray-700 mt-1">
                Enjoying unlimited events, viewers, and storage
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Create Wedding Button */}
        <div className="mb-6">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-rose-500 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Wedding Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreateWedding}>
                <DialogHeader>
                  <DialogTitle>Create New Wedding Event</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create your wedding stream and get RTMP credentials
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bride_name">Bride's Name *</Label>
                      <Input
                        id="bride_name"
                        value={formData.bride_name}
                        onChange={(e) => setFormData({...formData, bride_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groom_name">Groom's Name *</Label>
                      <Input
                        id="groom_name"
                        value={formData.groom_name}
                        onChange={(e) => setFormData({...formData, groom_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Parvathi & Shiva's Wedding"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell guests about your special day..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_date">Wedding Date & Time *</Label>
                      <Input
                        id="scheduled_date"
                        type="datetime-local"
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                    ) : (
                      'Create Wedding Event'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weddings Grid */}
        {weddings.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No weddings yet</h3>
            <p className="text-gray-600 mb-4">Create your first wedding event to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-rose-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Wedding Event
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((wedding) => (
              <Card key={wedding.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWedding(wedding)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{wedding.title}</CardTitle>
                      <CardDescription>
                        {wedding.bride_name} & {wedding.groom_name}
                      </CardDescription>
                    </div>
                    <Badge variant={wedding.status === 'live' ? 'default' : 'secondary'}>
                      {wedding.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(wedding.scheduled_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(wedding.scheduled_date).toLocaleTimeString()}
                    </div>
                    {wedding.location && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {wedding.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Wedding Details Dialog */}
        {selectedWedding && (
          <Dialog open={!!selectedWedding} onOpenChange={() => setSelectedWedding(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedWedding.title}</DialogTitle>
                <DialogDescription>
                  {selectedWedding.bride_name} & {selectedWedding.groom_name}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="credentials" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="credentials">RTMP Credentials</TabsTrigger>
                  <TabsTrigger value="details">Event Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="credentials" className="space-y-4">
                  <Alert className="bg-rose-50 border-rose-200">
                    <Video className="h-4 w-4" />
                    <AlertDescription>
                      Use these credentials in OBS Studio or any RTMP-compatible streaming software
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">RTMP Server URL</Label>
                      <div className="flex mt-1">
                        <Input
                          value={selectedWedding.stream_credentials?.rtmp_url}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(selectedWedding.stream_credentials?.rtmp_url, 'RTMP URL')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Stream Key</Label>
                      <div className="flex mt-1">
                        <Input
                          value={selectedWedding.stream_credentials?.stream_key}
                          readOnly
                          className="font-mono text-sm"
                          type="password"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(selectedWedding.stream_credentials?.stream_key, 'Stream Key')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Playback URL (Share with guests)</Label>
                      <div className="flex mt-1">
                        <Input
                          value={selectedWedding.playback_url}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(selectedWedding.playback_url, 'Playback URL')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Quick Setup Guide:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Open OBS Studio (or your streaming software)</li>
                      <li>Go to Settings → Stream</li>
                      <li>Select "Custom" as service</li>
                      <li>Paste the RTMP Server URL</li>
                      <li>Paste the Stream Key</li>
                      <li>Click "Start Streaming" when ready</li>
                    </ol>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Description</Label>
                      <p className="text-gray-700 mt-1">{selectedWedding.description || 'No description provided'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Scheduled Date</Label>
                        <p className="text-gray-700 mt-1">{new Date(selectedWedding.scheduled_date).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Location</Label>
                        <p className="text-gray-700 mt-1">{selectedWedding.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <Badge className="mt-1">{selectedWedding.status}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Viewers</Label>
                        <p className="text-gray-700 mt-1">{selectedWedding.viewers_count}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
