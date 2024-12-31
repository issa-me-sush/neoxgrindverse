import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    index: true
  },
  userAddress: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema); 