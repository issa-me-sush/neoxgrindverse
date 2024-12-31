import dbConnect from '../../../utils/dbConnect';
import UserLocation from '../../../models/UserLocation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { walletAddress, placeId } = req.body;

    let userLocation = await UserLocation.findOne({
      walletAddress,
      placeId
    });

    // If no record exists, create a new UserLocation document
    if (!userLocation) {
      userLocation = new UserLocation({
        walletAddress,
        placeId,
        totalVisits: 0,
        totalAuraEarned: 0,
        lastClaim: null,
        lastVisit: new Date()
      });
      // Don't save yet - we'll save when they make their first claim
    }

    res.status(200).json({
      totalVisits: userLocation.totalVisits,
      totalAuraEarned: userLocation.totalAuraEarned,
      lastClaim: userLocation.lastClaim,
      lastVisit: userLocation.lastVisit
    });
  } catch (error) {
    console.error('Error in location-stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
} 