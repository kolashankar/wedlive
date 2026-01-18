'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Webhook, Plus, Trash2, Play, Pause, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

const EVENT_TYPES = [
  { value: 'stream.started', label: 'Stream Started', description: 'Triggered when a stream goes live' },
  { value: 'stream.ended', label: 'Stream Ended', description: 'Triggered when a stream ends' },
  { value: 'recording.ready', label: 'Recording Ready', description: 'Triggered when recording is ready' },
  { value: 'viewer.joined', label: 'Viewer Joined', description: 'Triggered when a viewer joins' },
  { value: 'wedding.created', label: 'Wedding Created', description: 'Triggered when a wedding is created' },
  { value: 'wedding.updated', label: 'Wedding Updated', description: 'Triggered when wedding details are updated' }
];

export default function WebhooksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState([]);
  
  // New webhook form
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [],
    description: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserData();
    fetchWebhooks();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);

      if (response.data.subscription_plan === 'free') {
        toast.error('Premium subscription required');
        router.push('/pricing');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      router.push('/login');
    }
  };

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/premium/webhooks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWebhooks(response.data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.url.trim()) {
      toast.error('Please enter webhook URL');
      return;
    }
    if (newWebhook.events.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/premium/webhooks`, newWebhook, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Webhook created successfully!');
      setShowCreateModal(false);
      setNewWebhook({ url: '', events: [], description: '' });
      fetchWebhooks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhookStatus = async (webhookId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/premium/webhooks/${webhookId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Webhook ${newStatus === 'active' ? 'activated' : 'paused'}`);
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to update webhook status');
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/premium/webhooks/${webhookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Webhook deleted successfully');
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  };

  const viewLogs = async (webhook) => {
    setSelectedWebhook(webhook);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/premium/webhooks/${webhook.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWebhookLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setWebhookLogs([]);
    }
  };

  const toggleEventSelection = (eventValue) => {
    if (newWebhook.events.includes(eventValue)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter(e => e !== eventValue)
      });
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, eventValue]
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Webhook className="w-8 h-8 text-indigo-600" />
                Webhooks
              </h1>
              <p className="mt-2 text-gray-600">Receive real-time notifications about events</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Settings
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Webhooks List */}
        <div className="bg-white rounded-lg shadow">
          {webhooks.length === 0 ? (
            <div className="p-12 text-center">
              <Webhook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
              <p className="text-gray-500 mb-4">Create a webhook to receive real-time notifications</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Webhook
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {webhook.description || 'Webhook'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          webhook.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {webhook.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded inline-block mb-2">
                        {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {webhook.events.map((event) => (
                          <span key={event} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                            {event}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {webhook.success_count} successes
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          {webhook.failure_count} failures
                        </span>
                        {webhook.last_triggered && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Last: {new Date(webhook.last_triggered).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleWebhookStatus(webhook.id, webhook.status)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={webhook.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {webhook.status === 'active' ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => viewLogs(webhook)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View logs"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Webhook</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://your-api.com/webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                  placeholder="e.g., Production webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events to Subscribe *
                </label>
                <div className="space-y-2">
                  {EVENT_TYPES.map((event) => (
                    <div key={event.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={event.value}
                        checked={newWebhook.events.includes(event.value)}
                        onChange={() => toggleEventSelection(event.value)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <label htmlFor={event.value} className="text-sm font-medium text-gray-900 cursor-pointer">
                          {event.label}
                        </label>
                        <p className="text-xs text-gray-500">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWebhook({ url: '', events: [], description: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createWebhook}
                  disabled={loading || !newWebhook.url.trim() || newWebhook.events.length === 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Logs Modal */}
      {selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Webhook Logs</h2>
              <button
                onClick={() => {
                  setSelectedWebhook(null);
                  setWebhookLogs([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedWebhook.url}
            </p>
            
            {webhookLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No logs available yet
              </div>
            ) : (
              <div className="space-y-3">
                {webhookLogs.map((log, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{log.event}</span>
                        {log.status_code > 0 && (
                          <span className="text-xs text-gray-500">Status: {log.status_code}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.response && (
                      <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                        {log.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
