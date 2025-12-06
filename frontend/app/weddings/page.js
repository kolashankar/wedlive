'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, Clock, Video, Search, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format, parseISO, isValid } from 'date-fns';

export default function WeddingsPage() {
  const router = useRouter();
  const [weddings, setWeddings] = useState([]);
  const [filteredWeddings, setFilteredWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, live, scheduled, recorded

  useEffect(() => {
    loadWeddings();
  }, []);

  useEffect(() => {
    filterWeddings();
  }, [searchQuery, filter, weddings]);

  const loadWeddings = async () => {
    try {
      const response = await api.get('/api/weddings/');
      setWeddings(response.data);
      setFilteredWeddings(response.data);
    } catch (error) {
      toast.error('Failed to load weddings');
      console.error('Error loading weddings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWeddings = () => {
    let filtered = weddings;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(w => w.status === filter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.title?.toLowerCase().includes(query) ||
        w.bride_name?.toLowerCase().includes(query) ||
        w.groom_name?.toLowerCase().includes(query) ||
        w.location?.toLowerCase().includes(query)
      );
    }

    setFilteredWeddings(filtered);
  };

  const formatWeddingDate = (dateString) => {
    try {
      if (!dateString) return 'Date not set';
      
      // Try parsing as ISO string first
      let date = parseISO(dateString);
      
      // If not valid, try creating a new Date
      if (!isValid(date)) {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (!isValid(date)) {
        return 'Invalid date';
      }
      
      return format(date, 'PPP');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date unavailable';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'live': (
        <Badge className="bg-red-500 text-white animate-pulse" data-testid="status-badge-live">
          <Video className="w-3 h-3 mr-1" />
          LIVE
        </Badge>
      ),
      'scheduled': (
        <Badge variant="secondary" data-testid="status-badge-scheduled">
          <Clock className="w-3 h-3 mr-1" />
          Upcoming
        </Badge>
      ),
      'ended': (
        <Badge variant="outline" data-testid="status-badge-recorded">
          Recording Available
        </Badge>
      ),
      'recorded': (
        <Badge variant="outline" data-testid="status-badge-recorded">
          Recording Available
        </Badge>
      )
    };
    
    return badges[status] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                WedLive
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Live Wedding Celebrations</h1>
          <p className="text-xl text-rose-100 max-w-2xl mx-auto">
            Join couples from around the world as they celebrate their special day
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search weddings by name, couple, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
              data-testid="search-input"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white' : ''}
              data-testid="filter-all"
            >
              All Weddings
            </Button>
            <Button
              onClick={() => setFilter('live')}
              variant={filter === 'live' ? 'default' : 'outline'}
              className={filter === 'live' ? 'bg-red-500 text-white' : ''}
              data-testid="filter-live"
            >
              <Video className="w-4 h-4 mr-2" />
              Live Now
            </Button>
            <Button
              onClick={() => setFilter('scheduled')}
              variant={filter === 'scheduled' ? 'default' : 'outline'}
              data-testid="filter-scheduled"
            >
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
            </Button>
            <Button
              onClick={() => setFilter('recorded')}
              variant={filter === 'recorded' ? 'default' : 'outline'}
              data-testid="filter-recorded"
            >
              Recordings
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : filteredWeddings.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                {searchQuery || filter !== 'all' ? 'No weddings found' : 'No weddings yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || filter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to host a live wedding!'
                }
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                  Create Your Wedding Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {filteredWeddings.length} {filteredWeddings.length === 1 ? 'wedding' : 'weddings'}
            </div>
            
            {/* Wedding Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWeddings.map((wedding) => (
                <Card 
                  key={wedding.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => router.push(`/weddings/${wedding.id}`)}
                  data-testid={`wedding-card-${wedding.id}`}
                >
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-br from-rose-400 to-purple-500">
                    {wedding.cover_image ? (
                      <img 
                        src={wedding.cover_image} 
                        alt={wedding.title || 'Wedding'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="w-20 h-20 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(wedding.status)}
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl">{wedding.title || 'Untitled Wedding'}</CardTitle>
                    <CardDescription className="text-base">
                      {wedding.bride_name || 'Bride'} & {wedding.groom_name || 'Groom'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {wedding.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {wedding.description}
                      </p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatWeddingDate(wedding.scheduled_date)}
                    </div>
                    
                    {wedding.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {wedding.location}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {wedding.viewers_count || 0} viewers
                    </div>

                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/weddings/${wedding.id}`);
                      }}
                      data-testid={`view-wedding-button-${wedding.id}`}
                    >
                      {wedding.status === 'live' ? (
                        <><Video className="w-4 h-4 mr-2" />Watch Live</>
                      ) : wedding.status === 'recorded' || wedding.status === 'ended' ? (
                        <>View Recording</>
                      ) : (
                        <>View Details</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-16 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Want to Host Your Own Wedding Live?</h2>
          <p className="text-xl text-rose-100 mb-8">
            Share your special day with loved ones around the world
          </p>
          <Link href="/register">
            <Button 
              size="lg" 
              className="bg-white text-rose-600 hover:bg-rose-50"
              data-testid="cta-register-button"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 WedLive. Built with ❤️ for making every wedding moment accessible.
          </p>
        </div>
      </footer>
    </div>
  );
}
