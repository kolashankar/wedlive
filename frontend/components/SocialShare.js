import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';

export function SocialShare({ weddingId, title, description }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const weddingUrl = `${baseUrl}/weddings/${weddingId}`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(weddingUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(weddingUrl)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(weddingUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${weddingUrl}`)}`
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(weddingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Share2 className="w-6 h-6 text-pink-500" />
        <h3 className="text-xl font-bold text-gray-800">Share This Wedding</h3>
      </div>

      <p className="text-gray-600 mb-6">Invite friends and family to watch this special moment</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Facebook className="w-5 h-5" />
          Facebook
        </button>

        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
        >
          <Twitter className="w-5 h-5" />
          Twitter
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Linkedin className="w-5 h-5" />
          LinkedIn
        </button>

        <button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={weddingUrl}
          readOnly
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
        />
        <button
          onClick={handleCopyLink}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      {copied && (
        <p className="text-green-600 text-sm mt-2 text-center">Link copied to clipboard!</p>
      )}
    </div>
  );
}
