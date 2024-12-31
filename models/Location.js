import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  placeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  uniqueVisitors: [{
    walletAddress: String,
    firstVisit: { type: Date, default: Date.now },
    lastVisit: Date,
    totalAuraEarned: { type: Number, default: 0 }
  }],
  totalAura: { type: Number, default: 0 },
  tier: { type: String, enum: ['UNDISCOVERED', 'SEED', 'EMERGING', 'POPULAR', 'LEGENDARY'], default: 'UNDISCOVERED' },
  lastVisited: Date,
  discoveredAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Add a virtual for visitor count
LocationSchema.virtual('visitorCount').get(function() {
  return this.uniqueVisitors.length;
});

// Create geospatial index
LocationSchema.index({ coordinates: '2dsphere' });

export default mongoose.models.Location || mongoose.model('Location', LocationSchema); 