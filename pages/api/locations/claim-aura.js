import dbConnect from '../../../utils/dbConnect';
import UserLocation from '../../../models/UserLocation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { walletAddress, placeId } = req.body;

    let userLocation = await UserLocation.findOne({ walletAddress, placeId });
    
    if (!userLocation) {
      userLocation = new UserLocation({
        walletAddress,
        placeId,
        lastClaim: null
      });
    }

    // Check if can claim
    const now = new Date();
    const lastClaim = userLocation.lastClaim;
    console.log('Claim check:', {
      now: now.toISOString(),
      lastClaim: lastClaim?.toISOString(),
      timeSinceLastClaim: lastClaim ? now - lastClaim : 'First claim'
    });

    const canClaim = !lastClaim || 
      (now - new Date(lastClaim)) >= 24 * 60 * 60 * 1000;

    if (!canClaim) {
      const nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      console.log('Cannot claim yet:', {
        nextClaimTime: nextClaimTime.toISOString(),
        timeLeft: nextClaimTime - now
      });
      return res.status(400).json({ 
        message: 'Cannot claim yet',
        nextClaimTime: nextClaimTime.getTime() // Send as timestamp
      });
    }

    // Calculate aura reward
    const auraEarned = 100; // Base reward

    // Update user location record
    userLocation.lastClaim = now;
    userLocation.totalAuraEarned += auraEarned;
    userLocation.totalVisits += 1;
    await userLocation.save();

    const nextClaimTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    console.log('Claim successful:', {
      now: now.toISOString(),
      nextClaimTime: nextClaimTime.toISOString(),
      timeUntilNext: nextClaimTime - now
    });

    res.status(200).json({
      success: true,
      auraEarned,
      nextClaimTime: nextClaimTime.getTime(), // Send as timestamp
      totalAuraEarned: userLocation.totalAuraEarned
    });

  } catch (error) {
    console.error('Error in claim-aura:', error);
    res.status(500).json({ message: 'Server error' });
  }
} 