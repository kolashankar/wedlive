import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '👏', '🎉', '😍', '🥰', '👰', '🤵', '💐'];

export function LiveChat({ weddingId, messages, reactions, onSendMessage, onSendReaction, viewerCount }) {
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load guest name from localStorage
    const savedName = localStorage.getItem('guest_name');
    if (savedName) {
      setGuestName(savedName);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const name = guestName || 'Anonymous';
    if (!localStorage.getItem('guest_name')) {
      localStorage.setItem('guest_name', name);
    }

    onSendMessage(message, name);
    setMessage('');
  };

  const handleReaction = (emoji) => {
    const name = guestName || 'Anonymous';
    if (!localStorage.getItem('guest_name')) {
      localStorage.setItem('guest_name', name);
    }
    onSendReaction(emoji, name);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Chat</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">{viewerCount} watching</span>
          </div>
        </div>
      </div>

      {/* Reactions Overlay */}
      {reactions.length > 0 && (
        <div className="absolute top-20 left-4 right-4 pointer-events-none z-10">
          {reactions.map((reaction, index) => (
            <div
              key={reaction.timestamp}
              className="text-4xl animate-bounce"
              style={{
                position: 'absolute',
                left: `${Math.random() * 80}%`,
                animation: 'float-up 3s ease-out forwards'
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Be the first to say hi! 👋</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="flex flex-col">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  {msg.guest_name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-gray-800">
                      {msg.guest_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{msg.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform duration-200"
              title="Send reaction"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {!guestName && (
          <input
            type="text"
            placeholder="Enter your name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        )}
      </form>

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px);
          }
        }
      `}</style>
    </div>
  );
}
