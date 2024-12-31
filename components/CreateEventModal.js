import { useState } from 'react';

export default function CreateEventModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    minAura: '0',
    maxParticipants: '10'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gray-900/90 rounded-xl p-6 max-w-lg w-full border border-purple-500/20 shadow-xl shadow-purple-500/10 animate-slideUp">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">Create Event</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white h-24"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Min. AURA Required</label>
              <input
                type="number"
                value={formData.minAura}
                onChange={(e) => setFormData(prev => ({ ...prev, minAura: e.target.value }))}
                className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Max Participants</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 