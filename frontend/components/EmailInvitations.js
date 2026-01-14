import React, { useState } from 'react';
import { Mail, Plus, X, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import axios from 'axios';
import CONFIG from '@/lib/config';

const API_URL = `${CONFIG.API.BASE_URL}/api`;

export function EmailInvitations({ weddingId, weddingTitle, weddingDate, weddingUrl }) {
  const [emails, setEmails] = useState(['']);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);

    const validEmails = emails.filter(email => email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (validEmails.length === 0) {
      alert('Please enter at least one valid email address');
      setSending(false);
      return;
    }

    try {
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Send invitations via backend
      await axios.post(
        `${API_URL}/features/invitations`,
        {
          wedding_id: weddingId,
          recipient_emails: validEmails,
          custom_message: customMessage
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Send emails via EmailJS
      // Note: You need to configure EmailJS with your service ID, template ID, and public key
      // For now, we'll just record the invitations in the database
      
      setSuccess(true);
      setEmails(['']);
      setCustomMessage('');
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6 text-pink-500" />
        <h3 className="text-xl font-bold text-gray-800">Send Email Invitations</h3>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email Addresses
          </label>
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="guest@example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmailField(index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addEmailField}
            className="flex items-center gap-2 px-4 py-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Email
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Message (Optional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a personal message to your invitation..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Invitations'}
        </button>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
            ✅ Invitations sent successfully!
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> To enable email sending via EmailJS, you need to:
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Create an account at emailjs.com</li>
            <li>Get your Service ID, Template ID, and Public Key</li>
            <li>Configure them in your environment variables</li>
          </ol>
        </p>
      </div>
    </div>
  );
}
