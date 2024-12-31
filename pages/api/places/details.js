const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export default async function handler(req, res) {
  const { placeId } = req.query;
  console.log("Fetching details for place ID:", placeId); // Debug log

  if (!placeId) {
    return res.status(400).json({ error: 'Place ID is required' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,rating,user_ratings_total,editorial_summary&key=${GOOGLE_MAPS_API_KEY}`;
    console.log("Fetching from URL:", url); // Debug log

    const response = await fetch(url);
    const data = await response.json();
    console.log("Raw Google Places response:", data); // Debug log

    if (data.result) {
      const processedPhotos = data.result.photos?.map(photo => ({
        reference: photo.photo_reference,
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
      })) || [];

      console.log("Processed photos:", processedPhotos); // Debug log

      res.status(200).json({
        ...data.result,
        photos: processedPhotos
      });
    } else {
      res.status(404).json({ error: 'Place not found' });
    }
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
} 