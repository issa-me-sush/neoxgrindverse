const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const PLACES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place';

export async function fetchPlaceDetails(placeId) {
  const response = await fetch(
    `${PLACES_ENDPOINT}/details/json?place_id=${placeId}&fields=name,formatted_address,photos,rating,user_ratings_total,geometry,editorial_summary,types,opening_hours,price_level,reviews&key=${GOOGLE_PLACES_API_KEY}`
  );
  return response.json();
}

export async function searchNearbyPlaces(lat, lng, type = 'tourist_attraction') {
  const response = await fetch(
    `${PLACES_ENDPOINT}/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${GOOGLE_PLACES_API_KEY}`
  );
  return response.json();
}

export async function getPlacePhotos(photoReference, maxwidth = 800) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
} 