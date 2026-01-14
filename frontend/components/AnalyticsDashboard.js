import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Eye, MessageSquare, Heart, Camera, TrendingUp } from 'lucide-react';
import axios from 'axios';
import CONFIG from '@/lib/config';

const API_URL = `${CONFIG.API.BASE_URL}/api`;

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export function AnalyticsDashboard({ weddingId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [weddingId]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/analytics/dashboard/${weddingId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
        No analytics data available yet.
      </div>
    );
  }

  const stats = [
    {
      icon: Users,
      label: 'Total Viewers',
      value: analytics.viewer_stats.total_viewers,
      color: 'bg-blue-500'
    },
    {
      icon: Eye,
      label: 'Currently Watching',
      value: analytics.viewer_stats.active_viewers,
      color: 'bg-green-500'
    },
    {
      icon: MessageSquare,
      label: 'Chat Messages',
      value: analytics.engagement_metrics.total_chat_messages,
      color: 'bg-purple-500'
    },
    {
      icon: Heart,
      label: 'Reactions',
      value: analytics.engagement_metrics.total_reactions,
      color: 'bg-pink-500'
    },
    {
      icon: Camera,
      label: 'Photo Booth',
      value: analytics.engagement_metrics.total_photo_booth_photos,
      color: 'bg-orange-500'
    },
    {
      icon: TrendingUp,
      label: 'Peak Viewers',
      value: analytics.engagement_metrics.peak_viewers,
      color: 'bg-indigo-500'
    }
  ];

  // Format timeline data
  const timelineData = analytics.peak_viewership_timeline.map(point => ({
    time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    viewers: point.viewers
  }));

  // Format timezone data
  const timezoneData = Object.entries(analytics.timezone_distribution)
    .map(([timezone, count]) => ({
      name: timezone === 'Unknown' ? 'Unknown' : timezone,
      value: count
    }))
    .slice(0, 5); // Top 5 timezones

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Peak Viewership Timeline */}
      {timelineData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Peak Viewership Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="viewers" stroke="#ec4899" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timezone Distribution */}
      {timezoneData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Viewer Timezone Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={timezoneData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {timezoneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stream Quality */}
      {analytics.stream_quality && Object.keys(analytics.stream_quality).length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Stream Quality Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.stream_quality.avg_bitrate && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Avg Bitrate</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.stream_quality.avg_bitrate.toFixed(0)} kbps
                </p>
              </div>
            )}
            {analytics.stream_quality.avg_fps && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Avg FPS</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics.stream_quality.avg_fps.toFixed(1)}
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-gray-500">Buffering Events</p>
              <p className="text-2xl font-bold text-gray-800">
                {analytics.stream_quality.total_buffering_events || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg Watch Time</p>
              <p className="text-2xl font-bold text-gray-800">
                {Math.floor((analytics.viewer_stats.avg_duration || 0) / 60)}m
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Summary */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Engagement Summary</h3>
        <div className="space-y-2">
          <p className="text-gray-700">
            <strong>{analytics.engagement_metrics.total_viewers}</strong> people watched this wedding
          </p>
          <p className="text-gray-700">
            Peak viewership of <strong>{analytics.engagement_metrics.peak_viewers}</strong> viewers
            {analytics.engagement_metrics.peak_time && (
              <span> at {new Date(analytics.engagement_metrics.peak_time).toLocaleTimeString()}</span>
            )}
          </p>
          <p className="text-gray-700">
            Guests sent <strong>{analytics.engagement_metrics.total_chat_messages}</strong> messages and{' '}
            <strong>{analytics.engagement_metrics.total_reactions}</strong> reactions
          </p>
          <p className="text-gray-700">
            <strong>{analytics.engagement_metrics.total_guest_book_entries}</strong> guest book entries and{' '}
            <strong>{analytics.engagement_metrics.total_photo_booth_photos}</strong> photo booth photos
          </p>
        </div>
      </div>
    </div>
  );
}
