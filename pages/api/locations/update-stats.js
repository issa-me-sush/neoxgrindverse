import dbConnect from '../../../utils/dbConnect';
import Location from '../../../models/Location';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Connecting to DB...');
    await dbConnect();
    
    const { placeId, action, amount } = req.body;
    console.log('Update request:', { placeId, action, amount });

    // Check if location exists first
    const existingLocation = await Location.findOne({ placeId });
    console.log('Existing location:', existingLocation);

    if (!existingLocation) {
      // Create new location if it doesn't exist
      const newLocation = new Location({
        placeId,
        name: req.body.name || 'Unknown Location',
        coordinates: {
          type: 'Point',
          coordinates: req.body.coordinates || [0, 0]
        },
        totalAura: action === 'CLAIM' ? amount : 0,
        tier: 'SEED',
        lastVisited: new Date()
      });
      await newLocation.save();
      console.log('Created new location:', newLocation);
      return res.status(200).json(newLocation);
    }

    // Update existing location
    const location = await Location.findOneAndUpdate(
      { placeId },
      {
        $inc: { totalAura: action === 'CLAIM' ? amount : 0 },
        $set: { lastVisited: new Date() }
      },
      { new: true }
    );

    console.log('Updated location:', location);
    console.log('DB operation completed');

    res.status(200).json(location);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to update',
      details: error.message 
    });
  }
} 