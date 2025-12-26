import React from 'react';
import { Calendar, Download } from 'lucide-react';
import axios from 'axios';
import CONFIG from '@/lib/config';

const API_URL = `${CONFIG.API.BASE_URL}/api`;

export function CalendarIntegration({ weddingId, title, scheduledDate }) {
  const handleGoogleCalendar = async () => {
    try {
      const response = await axios.get(`${API_URL}/features/calendar/${weddingId}/google`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Error getting Google Calendar link:', error);
      alert('Failed to open Google Calendar. Please try again.');
    }
  };

  const handleDownloadIcal = async () => {
    try {
      const response = await axios.get(`${API_URL}/features/calendar/${weddingId}/ical`);
      const blob = new Blob([response.data.content], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading iCal file:', error);
      alert('Failed to download calendar file. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-6 h-6 text-pink-500" />
        <h3 className="text-xl font-bold text-gray-800">Add to Calendar</h3>
      </div>

      <p className="text-gray-600 mb-4">
        Save the wedding date to your calendar so you don't miss it!
      </p>

      <div className="space-y-3">
        <button
          onClick={handleGoogleCalendar}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018c0-3.878 3.132-7.018 7-7.018c1.89 0 3.47.697 4.682 1.829l-1.974 1.978v-.004c-.735-.702-1.667-1.062-2.708-1.062c-2.31 0-4.187 1.956-4.187 4.273c0 2.315 1.877 4.277 4.187 4.277c2.096 0 3.522-1.202 3.816-2.852H12.14v-2.737h6.585c.088.47.135.96.135 1.474c0 4.01-2.677 6.86-6.72 6.86z"/>
          </svg>
          Add to Google Calendar
        </button>

        <button
          onClick={handleDownloadIcal}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
        >
          <Download className="w-5 h-5" />
          Download iCal File
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Compatible with Apple Calendar, Outlook, and other calendar apps
      </p>
    </div>
  );
}
