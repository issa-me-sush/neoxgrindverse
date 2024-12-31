import { useState, useEffect } from 'react';
import { useUser } from "@account-kit/react";
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../../contracts/abi';
import CreateEventModal from '../CreateEventModal';

// Events Panel
export function EventsPanel({ landmark }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useUser();

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/events?placeId=${landmark.place_id}`);
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [landmark.place_id]);

  // Check if user can register (has enough AURA)
  const checkEligibility = async (minAura) => {
    if (!user?.address) return false;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const balance = await contract.balanceOf(user.address, 0);
      console.log('Balance:', balance);
      return Number(ethers.utils.formatUnits(balance, 18)) >= minAura;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return false;
    }
  };

  // Handle event registration
  const handleRegister = async (eventId, minAura) => {
    if (!user?.address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const isEligible = await checkEligibility(minAura);
      if (!isEligible) {
        alert(`You need at least ${minAura} AURA to register for this event`);
        return;
      }

      // First check event access on-chain
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider.getSigner());
      
      // Check event access
      const hasAccess = await contract.checkEventAccess(ethers.utils.parseUnits(minAura.toString(), 18));
      if (!hasAccess) {
        alert('Insufficient AURA balance for event registration');
        return;
      }

      // Register in database
      const res = await fetch(`/api/events/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          address: user.address,
          placeId: landmark.place_id
        })
      });

      if (!res.ok) throw new Error('Failed to register');

      // Refresh events list
      const updatedEvents = await fetch(`/api/events?placeId=${landmark.place_id}`).then(r => r.json());
      setEvents(updatedEvents);

      alert('Successfully registered for event!');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register for event: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Event Button */}
      {user && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg 
            hover:from-purple-700 hover:to-blue-700 transition-all duration-200 
            shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 font-medium"
        >
          Create New Event
        </button>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-gray-400">Loading events...</div>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event._id} className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 
              backdrop-blur-sm border border-white/10 shadow-lg shadow-purple-900/20
              hover:shadow-purple-800/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {event.title}
                </h3>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-300 mb-6">{event.description}</p>

              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <span role="img" aria-label="ticket" className="text-xl">🎟️</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Entry Requirement</div>
                    <div className="text-xl font-bold text-purple-400">
                      {event.minAura} AURA minimum
                    </div>
                    {event.keyRequirement && (
                      <div className="text-sm text-gray-400 mt-1">
                        + {event.keyRequirement}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {event.participants?.length || 0} registered
                  {event.maxParticipants && ` / ${event.maxParticipants} max`}
                </div>
                <button 
                  onClick={() => handleRegister(event._id, event.minAura)}
                  disabled={!user || event.participants?.some(p => p.address === user?.address)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {!user ? 'Connect Wallet' : 
                    event.participants?.some(p => p.address === user?.address) ? 
                    'Registered' : 'Register'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No events scheduled yet
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (formData) => {
            try {
              const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...formData,
                  placeId: landmark.place_id,
                  creator: user.address
                })
              });
              
              if (!res.ok) throw new Error('Failed to create event');
              
              const newEvent = await res.json();
              setEvents([...events, newEvent]);
              setShowCreateModal(false);
            } catch (error) {
              console.error('Error creating event:', error);
              alert('Failed to create event');
            }
          }}
        />
      )}
    </div>
  );
} 