import mongoose from 'mongoose';

const UserLocationSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  },
  placeId: {
    type: String,
    required: true
  },
  totalVisits: {
    type: Number,
    default: 0
  },
  totalAuraEarned: {
    type: Number,
    default: 0
  },
  lastClaim: {
    type: Date,
    default: null
  },
  lastVisit: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
UserLocationSchema.index({ walletAddress: 1, placeId: 1 }, { unique: true });

export default mongoose.models.UserLocation || mongoose.model('UserLocation', UserLocationSchema); 