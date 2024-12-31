import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  totalAura: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  discoveredLocations: [{
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    firstVisit: Date,
    totalVisits: { type: Number, default: 1 },
    auraEarned: { type: Number, default: 0 },
    lastClaim: Date
  }],
  achievements: [{
    type: { type: String },
    earnedAt: { type: Date, default: Date.now },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
  }],
  referrals: [{
    referredUser: { type: String }, // wallet address
    earnedAura: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
  }],
  referredBy: { type: String }, // wallet address of referrer
  stats: {
    totalLocationsVisited: { type: Number, default: 0 },
    totalAuraEarned: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActive: Date
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 