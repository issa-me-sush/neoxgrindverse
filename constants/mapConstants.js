export const NOTABLE_SPOTS = [
  {
    name: 'Central Park',
    coordinates: [-73.968285, 40.785091],
    placeId: 'ChIJ4zGFAZpYwokRGUGph3Mf37k',
    type: 'park'
  },
  {
    name: 'Times Square',
    coordinates: [-73.9855, 40.7580],
    placeId: 'ChIJmQJIxlVYwokRLgeuocVOGVw',
    type: 'attraction'
  },
  {
    name: 'Metropolitan Museum of Art',
    coordinates: [-73.9632, 40.7794],
    placeId: 'ChIJb8Jg9pZYwokR-qHGtvSkLzs',
    type: 'museum'
  }
];

export const BOUNDARY_BUFFER = 0.5;
export const MIN_VISITORS_THRESHOLD = 10;
export const FETCH_THRESHOLD = 0.75;

export const INITIAL_VIEW_STATE = {
  center: [-73.968285, 40.785091],
  zoom: 12,
  maxZoom: 20,
  minZoom: 3,
  pitch: 45,
  bearing: -17.6,
  antialias: true
};

export const PLACE_TIERS = {
  LEGENDARY: {
    minAura: 100000,
    minZoom: 3,
    tag: '🌟 Legendary',
    color: '#FFD700',
    animation: {
      scale: [1, 1.2, 1],
      duration: 2000,
      glow: true
    }
  },
  EPIC: {
    minAura: 50000,
    minZoom: 5,
    tag: '✨ Epic',
    color: '#9B30FF',
    animation: {
      scale: [1, 1.15, 1],
      duration: 1800
    }
  },
  RARE: {
    minAura: 10000,
    minZoom: 8,
    tag: '💫 Rare',
    color: '#4169E1',
    animation: {
      scale: [1, 1.1, 1],
      duration: 1600
    }
  },
  UNCOMMON: {
    minAura: 1000,
    minZoom: 10,
    tag: '⭐ Uncommon',
    color: '#32CD32'
  },
  COMMON: {
    minAura: 0,
    minZoom: 12,
    tag: '🔮 Common',
    color: '#808080'
  }
};

export const PLACE_ICONS = {
  LEGENDARY: {
    model: '🏰',
    scale: 1.2,
    height: 150
  },
  EPIC: {
    model: '⛪',
    scale: 1.1,
    height: 120
  },
  RARE: {
    model: '🏛️',
    scale: 1,
    height: 100
  },
  UNCOMMON: {
    model: '🏢',
    scale: 0.9,
    height: 80
  },
  COMMON: {
    model: '🏠',
    scale: 0.8,
    height: 60
  }
}; 