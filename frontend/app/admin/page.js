'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Video, TrendingUp, DollarSign, Eye, Trash2, Search, 
  BarChart3, Calendar, Activity, Crown, AlertCircle, Image as ImageIcon, Music 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAdminAccess();
    loadDashboardData();
  }, []);

  const checkAdminAccess = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      
      // Load all data in parallel
      const [statsRes, usersRes, weddingsRes, revenueRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/users?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/weddings?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setWeddings(weddingsRes.data);
      setRevenue(revenueRes.data);
      setAnalytics(analyticsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their weddings and media.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload data
      loadDashboardData();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteWedding = async (weddingId) => {
    if (!confirm('Are you sure you want to delete this wedding? This will also delete all associated media.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/api/admin/weddings/${weddingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload data
      loadDashboardData();
      alert('Wedding deleted successfully');
    } catch (error) {
      console.error('Failed to delete wedding:', error);
      alert('Failed to delete wedding');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredWeddings = weddings.filter(wedding =>
    wedding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wedding.bride_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wedding.groom_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-gray-700">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions - UPDATED: Combined into ONE button */}
        <div className="mb-6 flex gap-3">
          <Button
            onClick={() => router.push('/admin/borders')}
            className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Manage Borders & Masks
          </Button>
          <Button
            onClick={() => router.push('/admin/video-templates')}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            data-testid="video-templates-btn"
          >
            <Video className="w-4 h-4 mr-2" />
            Video Templates
          </Button>
          <Button
            onClick={() => router.push('/admin/music')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Music className="w-4 h-4 mr-2" />
            Music Library
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-3xl font-bold mt-2">{stats?.total_users || 0}</p>
              </div>
              <Users className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Weddings</p>
                <p className="text-3xl font-bold mt-2">{stats?.total_weddings || 0}</p>
              </div>
              <Video className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Streams</p>
                <p className="text-3xl font-bold mt-2">{stats?.active_streams || 0}</p>
              </div>
              <Activity className="w-12 h-12 opacity-80" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Monthly Revenue</p>
                <p className="text-3xl font-bold mt-2">${stats?.monthly_revenue || 0}</p>
              </div>
              <DollarSign className="w-12 h-12 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <div className="flex space-x-8">
            {['overview', 'users', 'weddings', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Revenue Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Revenue Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${revenue?.total_revenue || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Plans</p>
                  <p className="text-2xl font-bold">${revenue?.monthly_revenue || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Yearly Plans</p>
                  <p className="text-2xl font-bold">${revenue?.yearly_revenue || 0}</p>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.full_name || 'No name'}</p>
                      </div>
                      <Badge>{user.subscription_plan}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Weddings</h3>
                <div className="space-y-3">
                  {weddings.slice(0, 5).map((wedding) => (
                    <div key={wedding.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{wedding.title}</p>
                        <p className="text-sm text-gray-500">{wedding.creator_email}</p>
                      </div>
                      <Badge variant={wedding.status === 'live' ? 'default' : 'secondary'}>
                        {wedding.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weddings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.full_name || '-'}</td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge>{user.subscription_plan}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">{user.total_weddings || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {user.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Weddings Tab */}
        {activeTab === 'weddings' && (
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search weddings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Couple</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viewers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredWeddings.map((wedding) => (
                      <tr key={wedding.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{wedding.title}</td>
                        <td className="px-6 py-4 text-sm">{wedding.bride_name} & {wedding.groom_name}</td>
                        <td className="px-6 py-4 text-sm">{wedding.creator_email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={wedding.status === 'live' ? 'default' : 'secondary'}>
                            {wedding.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">{wedding.viewers_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(wedding.scheduled_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWedding(wedding.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* User Growth */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                User Growth (Last 6 Months)
              </h3>
              <div className="flex items-end space-x-2 h-48">
                {analytics.user_growth.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${(data.users / Math.max(...analytics.user_growth.map(d => d.users))) * 100}%`,
                        minHeight: '20px'
                      }}
                    />
                    <p className="text-xs mt-2 text-gray-600">{data.month}</p>
                    <p className="text-xs font-semibold">{data.users}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Wedding Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Wedding Stats by Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.wedding_stats.map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stat.count}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.status}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Revenue Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Revenue Trends (Last 6 Months)
              </h3>
              <div className="flex items-end space-x-2 h-48">
                {analytics.revenue_trends.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ 
                        height: `${(data.revenue / Math.max(...analytics.revenue_trends.map(d => d.revenue))) * 100}%`,
                        minHeight: '20px'
                      }}
                    />
                    <p className="text-xs mt-2 text-gray-600">{data.month}</p>
                    <p className="text-xs font-semibold">${data.revenue}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}