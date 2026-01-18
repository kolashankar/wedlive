'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Copy, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/config';

const API_URL = getApiBaseUrl();

export default function ApiKeysPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [apiDocs, setApiDocs] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserData();
    fetchApiKeys();
    fetchApiDocs();
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

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/premium/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(response.data.api_keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const fetchApiDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/premium/api-docs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiDocs(response.data);
    } catch (error) {
      console.error('Failed to fetch API docs:', error);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/premium/api-keys?name=${encodeURIComponent(newKeyName)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewKeyValue(response.data.api_key);
      toast.success('API key created successfully!');
      fetchApiKeys();
      setNewKeyName('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/premium/api-keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('API key revoked successfully');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to revoke API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
                <Key className="w-8 h-8 text-indigo-600" />
                API Keys
              </h1>
              <p className="mt-2 text-gray-600">Manage your API keys for programmatic access</p>
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
                Create API Key
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your API Keys</h2>
            <p className="mt-1 text-sm text-gray-500">You can have up to 5 active API keys</p>
          </div>

          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
              <p className="text-gray-500 mb-4">Create your first API key to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create API Key
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{key.name}</h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-mono bg-gray-100 px-3 py-1 rounded">
                          {key.key_prefix}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          key.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {key.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>Requests: {key.request_count}</span>
                        {key.last_used && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Last used: {new Date(key.last_used).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => revokeApiKey(key.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Revoke key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Documentation */}
        {apiDocs && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              API Documentation
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
                <p className="text-gray-600 mb-2">{apiDocs.authentication.description}</p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div>curl {apiDocs.base_url}/weddings \</div>
                  <div className="ml-4">-H "X-API-Key: your_api_key_here"</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Endpoints</h3>
                <div className="space-y-2">
                  {apiDocs.endpoints.map((endpoint, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm">{endpoint.path}</span>
                      </div>
                      <p className="text-sm text-gray-600">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Limits</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800">
                        <strong>{apiDocs.rate_limits.requests_per_minute}</strong> requests per minute
                      </p>
                      <p className="text-sm text-yellow-800">
                        <strong>{apiDocs.rate_limits.requests_per_day}</strong> requests per day
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {!newKeyValue ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create API Key</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API, Mobile App"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewKeyName('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createApiKey}
                      disabled={loading || !newKeyName.trim()}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">API Key Created!</h2>
                  <p className="text-sm text-gray-600">Save this key securely. You won't be able to see it again.</p>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm break-all mb-4">
                  {newKeyValue}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(newKeyValue)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyValue(null);
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
