import dbConnect from '../../../utils/dbConnect';
import Event from '../../../models/Event';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../../../contracts/abi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { eventId, address } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already registered
    if (event.participants.some(p => p.address === address)) {
      return res.status(400).json({ error: 'Already registered' });
    }

    // Check max participants
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Add participant
    event.participants.push({
      address,
      registeredAt: new Date()
    });

    await event.save();
    res.status(200).json(event);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
} 