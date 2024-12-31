import { searchNearbyPlaces, fetchPlaceDetails } from '../../../utils/places';
import { EVOLUTION_LEVELS, ZONE_TYPES } from '../../../utils/placeEvolution';

export default async function handler(req, res) {
  const { lat, lng } = req.query;

  try {
    // Get nearby places
    const { results } = await searchNearbyPlaces(lat, lng);
    
    // Enrich first 5 places with details
    const enrichedPlaces = await Promise.all(
      results.slice(0, 5).map(async (place) => {
        const details = await fetchPlaceDetails(place.place_id);
        
        // Get multiple photos if available
        const photos = details.result.photos?.slice(0, 5).map(photo => ({
          reference: photo.photo_reference,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`,
          attribution: photo.html_attributions?.[0]
        })) || [];
        
        // Determine zone type based on place types
        const zoneType = determineZoneType(place.types);
        
        // Calculate evolution level based on ratings and reviews
        const interactionScore = Math.floor(place.rating * place.user_ratings_total);
        const evolutionLevel = calculateEvolutionLevel(interactionScore);

        return {
          id: place.place_id,
          name: place.name,
          type: 'LANDMARK',
          coordinates: [
            place.geometry.location.lng,
            place.geometry.location.lat
          ],
          description: details.result.editorial_summary?.overview || 
            'A fascinating location waiting to be explored',
          photos,
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          isLandmark: true,
          collectible: true,
          // Evolution data
          evolution: {
            level: evolutionLevel.name,
            progress: calculateProgress(interactionScore, evolutionLevel),
            nextLevel: getNextLevel(evolutionLevel),
            auraMultiplier: evolutionLevel.auraMultiplier
          },
          // Zone data
          zone: {
            type: zoneType.name,
            icon: zoneType.icon,
            bonus: zoneType.bonusType,
            quests: zoneType.specialQuests
          },
          // Dynamic rewards based on evolution
          auraReward: Math.floor(place.rating * 20 * evolutionLevel.auraMultiplier),
          activeEvents: generateActiveEvents(evolutionLevel, zoneType),
          // Add more rich details
          openNow: details.result.opening_hours?.open_now,
          priceLevel: details.result.price_level,
          reviews: details.result.reviews?.slice(0, 3),
          types: place.types,
        };
      })
    );

    res.status(200).json(enrichedPlaces);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
}

function determineZoneType(placeTypes) {
  if (placeTypes.some(type => ['museum', 'art_gallery', 'library'].includes(type))) {
    return ZONE_TYPES.CULTURAL;
  }
  if (placeTypes.some(type => ['park', 'natural_feature'].includes(type))) {
    return ZONE_TYPES.NATURE;
  }
  if (placeTypes.some(type => ['restaurant', 'cafe', 'bar'].includes(type))) {
    return ZONE_TYPES.SOCIAL;
  }
  return ZONE_TYPES.URBAN;
}

function calculateEvolutionLevel(interactionScore) {
  const levels = Object.values(EVOLUTION_LEVELS);
  return levels.reduce((highest, level) => {
    return interactionScore >= level.minInteractions ? level : highest;
  });
}

function calculateProgress(interactionScore, evolutionLevel) {
  const progress = (interactionScore / evolutionLevel.minInteractions) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

function getNextLevel(evolutionLevel) {
  const levels = Object.values(EVOLUTION_LEVELS);
  const index = levels.indexOf(evolutionLevel);
  return levels[index + 1] || levels[0];
}

function generateActiveEvents(evolutionLevel, zoneType) {
  // Implementation of generateActiveEvents function
  // This is a placeholder and should be implemented based on your requirements
  return [];
} 