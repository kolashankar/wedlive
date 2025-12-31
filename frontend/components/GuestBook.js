import React, { useState, useEffect } from 'react';
import { Heart, Mail, Send } from 'lucide-react';
import axios from 'axios';
import CONFIG from '@/lib/config';

const API_URL = `${CONFIG.API.BASE_URL}/api`;

export function GuestBook({ weddingId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [weddingId]);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/guestbook/${weddingId}`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching guest book entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/chat/guestbook`, {
        wedding_id: weddingId,
        guest_name: formData.guest_name,
        email: formData.email || undefined,
        message: formData.message
      });

      setEntries([response.data, ...entries]);
      setFormData({ guest_name: '', email: '', message: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting guest book entry:', error);
      alert('Failed to submit entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-gray-800">Guest Book</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
        >
          {showForm ? 'Cancel' : 'Leave a Message'}
        </button>
      </div>

      {/* Message Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message *
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your wishes and congratulations..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Message'}
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No messages yet. Be the first to leave your wishes!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-100"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {entry.guest_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{entry.guest_name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{entry.message}</p>
                  {entry.email && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Mail className="w-3 h-3" />
                      {entry.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
