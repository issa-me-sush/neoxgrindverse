import dbConnect from '../../../utils/dbConnect';
import Location from '../../../models/Location';
import Event from '../../../models/Event';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { bounds } = req.body;
    console.log('Searching in bounds:', bounds);

    // Find locations within bounds using $geoWithin
    const locations = await Location.find({
      'coordinates.coordinates': {
        $geoWithin: {
          $box: [
            [bounds.west, bounds.south],
            [bounds.east, bounds.north]
          ]
        }
      }
    });

    console.log('Found locations:', locations.length);
    locations.forEach(loc => {
      console.log('Location:', {
        name: loc.name,
        placeId: loc.placeId,
        coords: loc.coordinates.coordinates
      });
    });

    // Get events for these locations
    const events = await Event.find({
      placeId: { $in: locations.map(l => l.placeId) },
      date: { $gte: new Date() }
    });

    console.log(`Found ${events.length} upcoming events`);

    res.status(200).json({ locations, events });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching locations' });
  }
} 