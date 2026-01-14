'use client';
import { useState, useEffect, Suspense } from 'react';
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
import { Heart, Plus, Video, Copy, Calendar, Clock, Users, Settings, LogOut, Crown, Loader2, CheckCircle, CreditCard, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import StorageWidget from '@/components/StorageWidget';
import PlanInfoCard from '@/components/PlanInfoCard';
import ProfileDropdown from '@/components/ProfileDropdown';

function DashboardContent() {
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
      console.log('DEBUG: Loading weddings...');
      
      // Check authentication status first
      const token = localStorage.getItem('token');
      console.log('DEBUG: Auth token exists:', !!token);
      console.log('DEBUG: User object:', user);
      
      // Test 1: Public endpoint (no auth required)
      try {
        console.log('DEBUG: Testing public endpoint...');
        const publicResponse = await api.get('/api/weddings/public-test');
        console.log('DEBUG: Public test response:', publicResponse.data);
        
        if (publicResponse.data.success) {
          toast.success(`Database OK: ${publicResponse.data.total_weddings} weddings found`);
        } else {
          toast.error(`Database error: ${publicResponse.data.error}`);
        }
      } catch (publicError) {
        console.error('DEBUG: Public endpoint failed:', publicError);
        toast.error('Database connectivity failed');
        return;
      }
      
      // Test 2: Authenticated endpoint
      try {
        console.log('DEBUG: Testing authenticated my-weddings endpoint...');
        console.log('DEBUG: Request headers:', api.defaults.headers);
        
        const response = await api.get('/api/weddings/my-weddings');
        console.log('DEBUG: Auth API response:', response.data);
        console.log('DEBUG: Response status:', response.status);
        
        if (Array.isArray(response.data)) {
          const weddings = response.data;
          console.log(`SUCCESS: Found ${weddings.length} weddings!`);
          toast.success(`Loaded ${weddings.length} weddings successfully!`);
          setWeddings(weddings);
          
          // Log each wedding for debugging
          weddings.forEach((w, i) => {
            console.log(`Wedding ${i+1}: ${w.title} (${w.id})`);
          });
        } else {
          console.error('Unexpected response format:', response.data);
          toast.error('Unexpected response format from server');
        }
      } catch (error) {
        console.error('DEBUG: Auth endpoint failed:', error);
        console.error('Error details:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        
        // Show detailed error message
        const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
        toast.error(`Auth failed: ${errorMessage}`);
        
        // Try the working endpoint as fallback
        try {
          console.log('DEBUG: Trying working endpoint as fallback...');
          const workingResponse = await api.get('/api/weddings/my-weddings-working');
          console.log('DEBUG: Working endpoint response:', workingResponse.data);
          
          if (Array.isArray(workingResponse.data)) {
            const weddings = workingResponse.data;
            toast.success(`Fallback loaded ${weddings.length} weddings!`);
            setWeddings(weddings);
          }
        } catch (fallbackError) {
          console.error('DEBUG: Fallback also failed:', fallbackError);
          toast.error('All endpoints failed - check server logs');
        }
      }
      
      // Load subscription info
      try {
        const subResponse = await api.get('/api/subscriptions/my-subscription');
        setSubscription(subResponse.data);
      } catch (subError) {
        console.error('DEBUG: Subscription endpoint failed:', subError);
      }
    } catch (error) {
      console.error('DEBUG: General error in loadWeddings:', error);
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
              <ProfileDropdown user={user} onLogout={logout} />
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
              <span className="font-semibold text-green-900">Premium Active!</span>
              <p className="text-sm text-gray-700 mt-1">
                Enjoying unlimited events and features. Plan: {subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Free Plan Wedding Limit Warning */}
        {subscription && subscription.plan === 'free' && weddings.length >= 1 && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertDescription>
              <span className="font-semibold text-yellow-900">Wedding Limit Reached</span>
              <p className="text-sm text-gray-700 mt-1">
                Free plan users can only create 1 wedding event. Upgrade to Premium to create unlimited weddings.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Storage & Plan Info Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StorageWidget token={user?.access_token || localStorage.getItem('token')} />
          <PlanInfoCard token={user?.access_token || localStorage.getItem('token')} />
        </div>

        {/* Create Wedding Button */}
        <div className="mb-6">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                disabled={subscription?.plan === 'free' && weddings.length >= 1}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Wedding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Wedding Event</DialogTitle>
                <DialogDescription>
                  Set up your wedding livestream and get RTMP credentials
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWedding} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bride_name">Bride's Name</Label>
                    <Input
                      id="bride_name"
                      value={formData.bride_name}
                      onChange={(e) => setFormData({...formData, bride_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="groom_name">Groom's Name</Label>
                    <Input
                      id="groom_name"
                      value={formData.groom_name}
                      onChange={(e) => setFormData({...formData, groom_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Wedding Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Sarah & John's Wedding"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Share details about your special day"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">Wedding Date</Label>
                    <Input
                      id="scheduled_date"
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Venue name"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Wedding'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weddings List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {console.log('DEBUG: Rendering weddings list, weddings:', weddings)}
          {console.log('DEBUG: Weddings length:', weddings.length)}
          {weddings.length > 0 ? (
            weddings.map((wedding) => (
              <Card key={wedding.id} className={wedding.is_locked ? 'opacity-75 border-yellow-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {wedding.title}
                      {wedding.is_locked && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          🔒 Locked
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {wedding.bride_name} & {wedding.groom_name}
                    </CardDescription>
                  </div>
                  <Badge className={wedding.status === 'live' ? 'bg-red-500' : 'bg-gray-500'}>
                    {wedding.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(wedding.scheduled_date).toLocaleDateString()}
                  </div>
                  {wedding.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      📍 {wedding.location}
                    </div>
                  )}
                  <div className="pt-3 border-t flex gap-2">
                    <Link href={`/weddings/manage/${wedding.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                    <Link href={`/weddings/${wedding.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  {wedding.is_locked && (
                    <div className="pt-2">
                      <Link href="/pricing">
                        <Button size="sm" className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                          Unlock with Premium
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No weddings found</h3>
              <p className="text-gray-500 mb-6">Create your first wedding event to get started</p>
            </div>
          )}
        </div>

        {weddings.length === 0 && !loading && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No weddings yet</h3>
            <p className="text-gray-500 mb-6">Create your first wedding event to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}