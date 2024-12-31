import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  creator: {
    type: String, // wallet address
    required: true
  },
  minAura: {
    type: Number,
    required: true
  },
  keyRequirement: {
    type: String,
    required: false
  },
  maxParticipants: Number,
  participants: [{
    address: String,
    registeredAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema); 