'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Settings, Palette, Globe, Key, Webhook, Video, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('branding');
  const [loading, setLoading] = useState(false);

  // Branding state
  const [branding, setBranding] = useState({
    brand_name: '',
    logo_url: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    hide_wedlive_branding: false
  });

  // Recording settings state
  const [recordingSettings, setRecordingSettings] = useState({
    quality: '1080p',
    auto_upload: false,
    storage_provider: '',
    enable_4k: false,
    bitrate: '6000'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserData();
    fetchBranding();
    fetchRecordingSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);

      // Check if user has premium
      if (response.data.subscription_plan === 'free') {
        toast.error('Premium subscription required');
        router.push('/pricing');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      router.push('/login');
    }
  };

  const fetchBranding = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/premium/branding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranding(response.data);
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    }
  };

  const fetchRecordingSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/premium/recording-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecordingSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch recording settings:', error);
    }
  };

  const saveBranding = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/premium/branding`, branding, {
        headers: { Authorization: `Bearer ${token}` },
        params: branding
      });
      toast.success('Branding updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update branding');
    } finally {
      setLoading(false);
    }
  };

  const saveRecordingSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/premium/recording-settings`, recordingSettings, {
        headers: { Authorization: `Bearer ${token}` },
        params: recordingSettings
      });
      toast.success('Recording settings updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    } finally {
      setLoading(false);
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
                <Settings className="w-8 h-8 text-indigo-600" />
                Premium Settings
              </h1>
              <p className="mt-2 text-gray-600">Manage your premium features and customizations</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('branding')}
              className={`${
                activeTab === 'branding'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Palette className="w-4 h-4" />
              Custom Branding
            </button>
            <button
              onClick={() => setActiveTab('recording')}
              className={`${
                activeTab === 'recording'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Video className="w-4 h-4" />
              Recording Settings
            </button>
            <button
              onClick={() => router.push('/api-keys')}
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
            <button
              onClick={() => router.push('/webhooks')}
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
            >
              <Webhook className="w-4 h-4" />
              Webhooks
            </button>
          </nav>
        </div>

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Custom Branding</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={branding.brand_name || ''}
                  onChange={(e) => setBranding({ ...branding, brand_name: e.target.value })}
                  placeholder="Your Company Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={branding.logo_url || ''}
                  onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={branding.primary_color}
                      onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={branding.secondary_color}
                      onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hide-branding"
                  checked={branding.hide_wedlive_branding}
                  onChange={(e) => setBranding({ ...branding, hide_wedlive_branding: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="hide-branding" className="text-sm font-medium text-gray-700">
                  Hide WedLive Branding (White-label)
                </label>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveBranding}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Branding'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recording Settings Tab */}
        {activeTab === 'recording' && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Recording Options</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recording Quality
                </label>
                <select
                  value={recordingSettings.quality}
                  onChange={(e) => setRecordingSettings({ ...recordingSettings, quality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitrate (kbps)
                </label>
                <input
                  type="text"
                  value={recordingSettings.bitrate}
                  onChange={(e) => setRecordingSettings({ ...recordingSettings, bitrate: e.target.value })}
                  placeholder="6000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Recommended: 4500-6000 for 1080p, 13000-34000 for 4K
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enable-4k"
                  checked={recordingSettings.enable_4k}
                  onChange={(e) => setRecordingSettings({ ...recordingSettings, enable_4k: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enable-4k" className="text-sm font-medium text-gray-700">
                  Enable 4K Streaming Support
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto-upload"
                  checked={recordingSettings.auto_upload}
                  onChange={(e) => setRecordingSettings({ ...recordingSettings, auto_upload: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="auto-upload" className="text-sm font-medium text-gray-700">
                  Auto-upload recordings to cloud storage
                </label>
              </div>

              {recordingSettings.auto_upload && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Provider
                  </label>
                  <select
                    value={recordingSettings.storage_provider || ''}
                    onChange={(e) => setRecordingSettings({ ...recordingSettings, storage_provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select provider...</option>
                    <option value="aws-s3">Amazon S3</option>
                    <option value="google-cloud">Google Cloud Storage</option>
                    <option value="azure">Azure Blob Storage</option>
                  </select>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={saveRecordingSettings}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
