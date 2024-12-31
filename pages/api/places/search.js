const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default async function handler(req, res) {
  const { query, location } = req.query;

  if (!query || !location) {
    return res.status(400).json({ error: 'Query and location are required' });
  }

  try {
    // Use Google Places Text Search API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${location}&radius=100&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.results?.length > 0) {
      const place = data.results[0];
      
      // Get additional details
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,photos,rating,user_ratings_total,types,editorial_summary&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const details = await detailsResponse.json();

      res.status(200).json({
        ...place,
        ...details.result,
        photos: details.result.photos?.map(photo => ({
          reference: photo.photo_reference,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        }))
      });
    } else {
      res.status(404).json({ error: 'Place not found' });
    }
  } catch (error) {
    console.error('Error searching place:', error);
    res.status(500).json({ error: 'Failed to search place' });
  }
} 