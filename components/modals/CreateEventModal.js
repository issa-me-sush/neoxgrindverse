export function CreateEventModal({ onClose, onSubmit }) {
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    minAura: 500,
    keyRequirement: '',
    maxParticipants: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(eventForm);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-purple-400 mb-4">Create New Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Event Title</label>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Date & Time</label>
            <input
              type="datetime-local"
              value={eventForm.date}
              onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Minimum AURA Required</label>
            <input
              type="number"
              value={eventForm.minAura}
              onChange={(e) => setEventForm({...eventForm, minAura: e.target.value})}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Key Requirement (Optional)</label>
            <input
              type="text"
              value={eventForm.keyRequirement}
              onChange={(e) => setEventForm({...eventForm, keyRequirement: e.target.value})}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
              placeholder="e.g., Special NFT, Discord role, etc."
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Max Participants (Optional)</label>
            <input
              type="number"
              value={eventForm.maxParticipants}
              onChange={(e) => setEventForm({...eventForm, maxParticipants: e.target.value})}
              className="w-full bg-black/30 border border-purple-500/20 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 