import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: true,
    index: true
  },
  userAddress: {
    type: String,
    required: true
  },
  cid: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  votes: {
    type: Map,
    of: Number, // 1 for upvote, -1 for downvote
    default: new Map()
  },
  score: {
    type: Number,
    default: 0
  },
  tokenId: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema); 